import yaml from 'js-yaml';
import { basename, extname, join } from 'node:path';
import chalk from 'chalk';
import { Inventory, Domains } from 'intersphinx';
import { writeFileToFolder, tic, hashAndCopyStaticFile } from 'myst-cli-utils';
import { RuleId, toText, plural } from 'myst-common';
import type { SiteConfig, SiteProject } from 'myst-config';
import type { Node } from 'myst-spec';
import type { Heading } from 'myst-spec-ext';
import { enumerateTargetsTransform, ReferenceState } from 'myst-transforms';
import type { TargetCounts, LinkTransformer, MystXRefs } from 'myst-transforms';
import { select, selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { reloadAllConfigsForCurrentSite } from '../config.js';
import type { SiteManifestOptions } from '../build/site/manifest.js';
import {
  getSiteManifest,
  resolvePageDownloads,
  resolvePageExports,
} from '../build/site/manifest.js';
import { writeRemoteDOIBibtex } from '../build/utils/bibtex.js';
import { MYST_DOI_BIB_FILE } from '../cli/options.js';
import { filterPages, loadProjectFromDisk } from '../project/load.js';
import type { LocalProject } from '../project/types.js';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { watch } from '../store/reducers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { ImageExtensions } from '../utils/resolveExtension.js';
import version from '../version.js';
import { combineProjectCitationRenderers } from './citations.js';
import { loadFile, selectFile } from './file.js';
import { loadReferences } from './loadReferences.js';
import type { TransformFn } from './mdast.js';
import { finalizeMdast, postProcessMdast, transformMdast } from './mdast.js';

const WEB_IMAGE_EXTENSIONS = [
  ImageExtensions.mp4,
  ImageExtensions.webp,
  ImageExtensions.svg,
  ImageExtensions.gif,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export type ProcessFileOptions = {
  imageExtensions?: ImageExtensions[];
  imageWriteFolder?: string;
  imageAltOutputFolder?: string;
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  /** Execute flag for notebooks */
  execute?: boolean;
  maxSizeWebp?: number;
};

export type ProcessProjectOptions = ProcessFileOptions & {
  watchMode?: boolean;
  writeTOC?: boolean;
  writeDOIBib?: boolean;
  writeFiles?: boolean;
  reloadProject?: boolean;
  checkLinks?: boolean;
  strict?: boolean;
};

export type ProcessSiteOptions = ProcessProjectOptions & SiteManifestOptions;

/**
 * Trigger a file-changed notification, and clear the file from the cache
 *
 * @param session session with logging
 * @param path path to the changed file
 * @param eventType event corresponding to the change
 */
export function changeFile(session: ISession, path: string, eventType: string) {
  session.log.debug(`File modified: "${path}" (${eventType})`);
  const cache = castSession(session);
  session.store.dispatch(watch.actions.markFileChanged({ path }));
  delete cache.$mdast[path];
  delete cache.$citationRenderers[path];
}

export async function writeSiteManifest(session: ISession, opts?: SiteManifestOptions) {
  const configPath = join(session.sitePath(), 'config.json');
  session.log.debug('Writing site config.json');
  const siteManifest = await getSiteManifest(session, opts);
  writeFileToFolder(configPath, JSON.stringify(siteManifest));
}

/**
 * Return the heading title or the caption as text
 *
 * @param targetNode reference target of interest
 */
function getReferenceTitleAsText(targetNode: Node): string | undefined {
  if (targetNode.type === 'heading') {
    return toText(targetNode);
  }
  const caption = select('caption > paragraph', targetNode);
  if (caption) return toText(caption);
}

/**
 * Write myst.xref.json file from collected page reference states
 *
 * @param session session with logging
 * @param states page reference states
 */
export async function writeMystXRefJson(session: ISession, states: ReferenceState[]) {
  const mystXRefs: MystXRefs = {
    version: '1',
    myst: version,
    references: states
      .filter((state): state is ReferenceState & { url: string; dataUrl: string } => {
        return !!state.url && !!state.dataUrl;
      })
      .map((state) => {
        const { url, dataUrl } = state;
        const data = `/content${dataUrl}`;
        const pageRef = { kind: 'page', data, url };
        const pageIdRefs = state.identifiers.map((identifier) => {
          return { identifier, kind: 'page', data, url };
        });
        const targetRefs = Object.values(state.targets).map((target) => {
          const { identifier, html_id } = target.node ?? {};
          return {
            identifier,
            html_id: html_id !== identifier ? html_id : undefined,
            kind: target.kind,
            data,
            url,
            implicit: (target.node as any).implicit,
          };
        });
        return [pageRef, ...pageIdRefs, ...targetRefs];
      })
      .flat(),
  };
  const filename = join(session.sitePath(), 'myst.xref.json');
  session.log.debug(`Writing myst.xref.json file: ${filename}`);
  writeFileToFolder(filename, JSON.stringify(mystXRefs));
}

/**
 * Write objects.inv file from collected page reference states
 *
 * @param session session with logging
 * @param states page reference states
 * @param siteConfig site configuration to pull project metadata
 */
export async function writeObjectsInv(
  session: ISession,
  states: ReferenceState[],
  siteConfig: SiteConfig,
) {
  const inv = new Inventory({
    project: siteConfig?.title,
    // TODO: allow a version on the project?!
    version: String((siteConfig as any)?.version),
  });
  states.forEach((state) => {
    inv.setEntry({
      type: Domains.stdDoc,
      name: (state.url as string).replace(/^\//, ''),
      location: state.url as string,
      display: state.title ?? '',
    });
    Object.entries(state.targets).forEach(([name, target]) => {
      if ((target.node as any).implicit) {
        // Don't include implicit references
        return;
      }
      inv.setEntry({
        type: Domains.stdLabel,
        name,
        location: `${state.url}#${(target.node as any).html_id ?? target.node.identifier}`,
        display: getReferenceTitleAsText(target.node),
      });
    });
  });
  const filename = join(session.sitePath(), 'objects.inv');
  session.log.debug(`Writing objects.inv file: ${filename}`);
  inv.write(filename);
}

export async function loadProject(
  session: ISession,
  projectPath: string,
  opts?: { writeTOC?: boolean; reloadProject?: boolean },
) {
  const project = await loadProjectFromDisk(session, projectPath, {
    warnOnNoConfig: true,
    ...opts,
  });
  // Load the citations first, or else they are loaded in each call below
  const pages = filterPages(project);
  return { project, pages };
}

/**
 * Warn for duplicate identifiers across pages in a project
 *
 * Ignores implicit references.
 */
function warnOnDuplicateIdentifiers(session: ISession, states: ReferenceState[]) {
  const collisions: Record<string, string[]> = {};
  states.forEach((state) => {
    state.getIdentifiers().forEach((identifier) => {
      const target = state.getTarget(identifier);
      if ((target?.node as any)?.implicit) return;
      collisions[identifier] ??= [];
      collisions[identifier].push(state.filePath);
    });
  });
  Object.entries(collisions).forEach(([identifier, files]) => {
    if (files.length <= 1) return;
    addWarningForFile(
      session,
      files[0],
      `Duplicate identifier in project "${identifier}"`,
      'warn',
      {
        note: `In files: ${files.join(', ')}`,
        ruleId: RuleId.identifierIsUnique,
      },
    );
  });
}

/**
 * Return list of ReferenceStates corresponding to list of pages
 *
 * Unless `opts.suppressWarnings` is true, this will log a warning when
 * multiple identifiers are encountered across pages.
 */
export function selectPageReferenceStates(
  session: ISession,
  pages: { file: string }[],
  opts?: { suppressWarnings?: boolean },
) {
  const cache = castSession(session);
  const headingDepths = new Set(
    pages
      .map(({ file }) => {
        const { mdast } = cache.$getMdast(file)?.post ?? {};
        const headingNodes = selectAll('heading', mdast).filter(
          (node) => (node as Heading).enumerated !== false,
        );
        return headingNodes.map((node) => (node as Heading).depthSource ?? (node as Heading).depth);
      })
      .flat(),
  );
  let previousCounts: TargetCounts | undefined;
  const pageReferenceStates: ReferenceState[] = pages
    .map(({ file }) => {
      const { frontmatter, identifiers, mdast } = cache.$getMdast(file)?.post ?? {};
      const vfile = new VFile();
      vfile.path = file;
      const state = new ReferenceState(file, {
        frontmatter,
        identifiers,
        headingDepths,
        previousCounts,
        vfile,
      });
      if (frontmatter && !frontmatter.enumerator) {
        frontmatter.enumerator = state.enumerator;
      }
      if (frontmatter && frontmatter.enumerator) {
        // It would be better to handle enumerator at the theme / template level rather than baking into title
        frontmatter.title = `${frontmatter.enumerator}${frontmatter.title ? ` ${frontmatter.title}` : ''}`;
      }
      if (mdast) enumerateTargetsTransform(mdast, { state });
      previousCounts = state.targetCounts;
      logMessagesFromVFile(session, vfile);
      if (state) {
        const selectedFile = selectors.selectFileInfo(session.store.getState(), file);
        if (selectedFile?.url) state.url = selectedFile.url;
        if (selectedFile?.title) state.title = selectedFile.title;
        if (selectedFile?.dataUrl) state.dataUrl = selectedFile.dataUrl;
        return state;
      }
      return undefined;
    })
    .filter((state): state is ReferenceState => !!state);
  if (!opts?.suppressWarnings) warnOnDuplicateIdentifiers(session, pageReferenceStates);
  return pageReferenceStates;
}

async function resolvePageSource(session: ISession, file: string) {
  const fileHash = hashAndCopyStaticFile(session, file, session.publicPath(), (m: string) => {
    addWarningForFile(session, file, m, 'error', {
      ruleId: RuleId.sourceFileCopied,
    });
  });
  return { format: extname(file).substring(1), filename: basename(file), url: `/${fileHash}` };
}

export async function writeFile(
  session: ISession,
  {
    file,
    pageSlug,
    projectSlug,
    projectPath,
  }: { file: string; pageSlug: string; projectSlug?: string; projectPath?: string },
) {
  const toc = tic();
  const selectedFile = selectFile(session, file);
  if (!selectedFile) return;
  const { frontmatter, mdast, kind, sha256, slug, references, dependencies, location } =
    selectedFile;
  const exports = await Promise.all([
    resolvePageSource(session, file),
    ...(await resolvePageExports(session, file)),
  ]);
  const downloads = await resolvePageDownloads(session, file, projectPath);
  const frontmatterWithExports = { ...frontmatter, exports, downloads };
  const jsonFilenameParts = [session.contentPath()];
  if (projectSlug) jsonFilenameParts.push(projectSlug);
  jsonFilenameParts.push(`${pageSlug}.json`);
  writeFileToFolder(
    join(...jsonFilenameParts),
    JSON.stringify({
      kind,
      sha256,
      slug,
      location,
      dependencies,
      frontmatter: frontmatterWithExports,
      mdast,
      references,
    }),
  );
  session.log.debug(toc(`Wrote "${file}" in %s`));
}

export async function fastProcessFile(
  session: ISession,
  {
    file,
    pageSlug,
    projectPath,
    projectSlug,
    imageExtensions,
    imageWriteFolder,
    imageAltOutputFolder,
    extraLinkTransformers,
    extraTransforms,
    defaultTemplate,
    execute,
    maxSizeWebp,
  }: {
    file: string;
    pageSlug: string;
    projectPath: string;
    projectSlug?: string;
  } & ProcessFileOptions &
    SiteManifestOptions,
) {
  const toc = tic();
  await loadFile(session, file, projectPath);
  const { project, pages } = await loadProject(session, projectPath);
  await transformMdast(session, {
    file,
    imageExtensions: imageExtensions ?? WEB_IMAGE_EXTENSIONS,
    projectPath,
    projectSlug,
    pageSlug,
    watchMode: true,
    extraTransforms,
    index: project.index,
    execute,
  });
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  await Promise.all(
    pages.map(async (page) => {
      return postProcessMdast(session, {
        file: page.file,
        pageReferenceStates,
        extraLinkTransformers,
      });
    }),
  );
  const { mdast, frontmatter } = castSession(session).$getMdast(file)?.post ?? {};
  if (mdast && frontmatter) {
    await finalizeMdast(session, mdast, frontmatter, file, {
      imageWriteFolder: imageWriteFolder ?? session.publicPath(),
      imageAltOutputFolder: imageAltOutputFolder ?? '/',
      imageExtensions: imageExtensions ?? WEB_IMAGE_EXTENSIONS,
      optimizeWebp: true,
      processThumbnail: true,
      maxSizeWebp,
    });
  }
  await Promise.all(
    pages.map(async (page) => {
      return writeFile(session, {
        file: page.file,
        projectSlug,
        projectPath,
        pageSlug: page.slug,
      });
    }),
  );
  session.log.info(toc(`📖 Built ${file} in %s.`));
  await writeSiteManifest(session, { defaultTemplate });
}

export async function processProject(
  session: ISession,
  siteProject: Partial<SiteProject>,
  opts?: ProcessProjectOptions,
): Promise<LocalProject> {
  const toc = tic();
  const { log } = session;
  const {
    imageWriteFolder,
    imageAltOutputFolder,
    imageExtensions,
    extraLinkTransformers,
    extraTransforms,
    watchMode,
    writeTOC,
    writeDOIBib,
    writeFiles = true,
    reloadProject,
    execute,
    maxSizeWebp,
    checkLinks,
    strict,
  } = opts || {};
  if (!siteProject.path) {
    const slugSuffix = siteProject.slug ? `: ${siteProject.slug}` : '';
    log.error(`No local path for site project${slugSuffix}`);
    if (siteProject.remote) log.error(`Remote path not supported${slugSuffix}`);
    throw Error('Unable to process project');
  }
  const { project, pages } = await loadProject(session, siteProject.path, {
    writeTOC: writeFiles && writeTOC,
    reloadProject,
  });
  if (!watchMode) {
    await Promise.all([
      // Load all citations (.bib)
      ...project.bibliography.map((path) => loadFile(session, path, siteProject.path, '.bib')),
      // Load all content (.md and .ipynb)
      ...pages.map((page) => loadFile(session, page.file, siteProject.path, undefined)),
      // Load up all the intersphinx references
      loadReferences(session, { projectPath: siteProject.path }),
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);

  const usedImageExtensions = imageExtensions ?? WEB_IMAGE_EXTENSIONS;
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, {
        file: page.file,
        projectPath: project.path,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
        imageExtensions: usedImageExtensions,
        watchMode,
        execute,
        extraTransforms,
        index: project.index,
      }),
    ),
  );
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  // Handle all cross references
  await Promise.all(
    pages.map((page) =>
      postProcessMdast(session, {
        file: page.file,
        checkLinks: checkLinks || strict,
        pageReferenceStates,
        extraLinkTransformers,
      }),
    ),
  );
  // Write all pages
  if (writeFiles) {
    await Promise.all(
      pages.map(async (page) => {
        const { mdast, frontmatter } = castSession(session).$getMdast(page.file)?.post ?? {};
        if (mdast && frontmatter) {
          await finalizeMdast(session, mdast, frontmatter, page.file, {
            imageWriteFolder: imageWriteFolder ?? session.publicPath(),
            imageAltOutputFolder,
            imageExtensions: usedImageExtensions,
            optimizeWebp: true,
            processThumbnail: true,
            maxSizeWebp,
          });
        }
        return writeFile(session, {
          file: page.file,
          projectSlug: siteProject.slug as string,
          projectPath: siteProject.path,
          pageSlug: page.slug,
        });
      }),
    );
  }
  log.info(
    toc(`📚 Built ${plural('%s page(s)', pages)} for ${siteProject.slug ?? 'project'} in %s.`),
  );
  if (writeDOIBib) {
    const doiBibFile = join(siteProject.path, MYST_DOI_BIB_FILE);
    log.info(`🎓 Writing remote DOI citations to ${doiBibFile}`);
    writeRemoteDOIBibtex(session, doiBibFile);
  }
  return project;
}

export async function processSite(session: ISession, opts?: ProcessSiteOptions): Promise<boolean> {
  try {
    await reloadAllConfigsForCurrentSite(session);
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    const prefix = (error as Error)?.message
      ? (error as Error).message
      : 'Error finding or reading configuration files.';
    session.log.error(`${prefix}\nDo you need to run ${chalk.bold('myst init')}?`);
    process.exit(1);
  }
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);
  if (!siteConfig?.projects?.length) return false;
  const projects = await Promise.all(
    siteConfig.projects.map((siteProject) =>
      processProject(session, siteProject, {
        ...opts,
        imageWriteFolder: session.publicPath(),
        imageAltOutputFolder: '/',
      }),
    ),
  );
  if (opts?.strict) {
    const hasWarnings = projects
      .map((project) => {
        return project.pages
          .map((page) => {
            if (!('slug' in page)) return [0, 0];
            const buildWarnings = selectors.selectFileWarnings(session.store.getState(), page.file);
            if (!buildWarnings || buildWarnings.length === 0) return [0, 0];
            const resp = buildWarnings
              .map(({ message, kind }) => chalk[kind === 'error' ? 'red' : 'yellow'](message))
              .join('\n  - ');
            session.log.info(`\n${page.file}\n  - ${resp}\n`);
            return [
              buildWarnings.filter(({ kind }) => kind === 'error').length,
              buildWarnings.filter(({ kind }) => kind === 'warn').length,
            ];
          })
          .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      })
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
    if (hasWarnings[0] > 0) {
      const pluralE = hasWarnings[0] > 1 ? 's' : '';
      const pluralW = hasWarnings[1] > 1 ? 's' : '';
      session.log.error(
        `Site has ${hasWarnings[0]} error${pluralE} and ${hasWarnings[1]} warning${pluralW}, stopping build.`,
      );
      process.exit(1);
    }
  }
  if (opts?.writeFiles ?? true) {
    await writeSiteManifest(session, opts);
    const states: ReferenceState[] = [];
    await Promise.all(
      siteConfig.projects.map(async (project) => {
        if (!project.path) return;
        const { pages } = await loadProject(session, project.path);
        states.push(
          ...selectPageReferenceStates(session, pages, {
            suppressWarnings: true,
          }),
        );
      }),
    );
    await writeObjectsInv(session, states, siteConfig);
    await writeMystXRefJson(session, states);
  }
  return true;
}
