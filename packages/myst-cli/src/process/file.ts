import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { tic } from 'myst-cli-utils';
import { TexParser } from 'tex-to-myst';
import { VFile } from 'vfile';
import { doi } from 'doi-utils';
import type { GenericParent } from 'myst-common';
import { RuleId, toText, fileError, fileWarn } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { validatePageFrontmatter, fillProjectFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import { frontmatterValidationOpts, getPageFrontmatter } from '../frontmatter.js';
import type { ISession, ISessionWithCache } from '../session/types.js';
import { castSession } from '../session/cache.js';
import { warnings, watch } from '../store/reducers.js';
import type { PreRendererData, RendererData } from '../transforms/types.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { loadBibTeXCitationRenderers } from './citations.js';
import { parseMyst } from './myst.js';
import { processNotebookFull } from './notebook.js';
import { selectors } from '../store/index.js';
import { defined, incrementOptions, validateObjectKeys, validateEnum } from 'simple-validators';
import type { ValidationOptions } from 'simple-validators';

type LoadFileOptions = { preFrontmatter?: Record<string, any>; keepTitleNode?: boolean };

export type LoadFileResult = {
  kind: SourceFileKind;
  mdast: GenericParent;
  frontmatter?: PageFrontmatter;
  identifiers?: string[];
  widgets?: Record<string, any>;
};

function checkCache(cache: ISessionWithCache, content: string, file: string) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  cache.store.dispatch(watch.actions.markFileChanged({ path: file, sha256 }));
  const mdast = cache.$getMdast(file);
  const useCache = mdast?.pre && mdast.sha256 === sha256;
  return { useCache, sha256 };
}

export function loadMdFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): LoadFileResult {
  const vfile = new VFile();
  vfile.path = file;
  const mdast = parseMyst(session, content, file);
  const { frontmatter, identifiers } = getPageFrontmatter(
    session,
    mdast,
    vfile,
    opts?.preFrontmatter,
    opts?.keepTitleNode,
  );
  return { kind: SourceFileKind.Article, mdast, frontmatter, identifiers };
}

export async function loadNotebookFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): Promise<LoadFileResult> {
  const vfile = new VFile();
  vfile.path = file;
  const {
    mdast,
    frontmatter: nbFrontmatter,
    widgets,
  } = await processNotebookFull(session, file, content);
  const { frontmatter: cellFrontmatter, identifiers } = getPageFrontmatter(
    session,
    mdast,
    vfile,
    opts?.preFrontmatter,
    opts?.keepTitleNode,
  );
  const frontmatter = fillProjectFrontmatter(
    cellFrontmatter,
    nbFrontmatter,
    frontmatterValidationOpts(vfile),
  );
  return { kind: SourceFileKind.Notebook, mdast, frontmatter, identifiers, widgets };
}

export function loadTexFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): LoadFileResult {
  const vfile = new VFile();
  vfile.path = file;
  const tex = new TexParser(content, vfile);
  const frontmatter = validatePageFrontmatter(
    {
      title: toText(tex.data.frontmatter.title as any),
      short_title: toText(tex.data.frontmatter.short_title as any),
      authors: tex.data.frontmatter.authors,
      // TODO: affiliations: tex.data.frontmatter.affiliations,
      keywords: tex.data.frontmatter.keywords,
      math: tex.data.macros,
      bibliography: tex.data.bibliography,
      ...(opts?.preFrontmatter ?? {}),
    },
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  return { kind: SourceFileKind.Article, mdast: tex.ast as GenericParent, frontmatter };
}

export function mystJSONValidationOpts(
  vfile: VFile,
  opts?: { property?: string; ruleId?: RuleId },
): ValidationOptions {
  return {
    property: opts?.property ?? 'file',
    file: vfile.path,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: opts?.ruleId ?? RuleId.mystJsonValid });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: opts?.ruleId ?? RuleId.mystJsonValid });
    },
  };
}

function validateMySTJSON(
  input: any,
  opts: ValidationOptions,
): { mdast: GenericParent; kind: SourceFileKind; frontmatter: PageFrontmatter } | undefined {
  const value = validateObjectKeys(
    input,
    { required: ['mdast'], optional: ['kind', 'frontmatter'] },
    opts,
  );
  if (value === undefined) {
    return undefined;
  }

  const { mdast } = value;

  let kind: undefined | SourceFileKind;
  if (defined(value.kind)) {
    kind = validateEnum<SourceFileKind>(value.kind, {
      ...incrementOptions('kind', opts),
      enum: SourceFileKind,
    });
  }
  let frontmatter: undefined | PageFrontmatter;
  if (defined(value.frontmatter)) {
    frontmatter = validatePageFrontmatter(value.frontmatter, incrementOptions('frontmatter', opts));
  }

  return {
    mdast,
    kind: kind ?? SourceFileKind.Article,
    frontmatter: frontmatter ?? {},
  };
}

export function loadMySTJSON(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
) {
  const vfile = new VFile();
  vfile.path = file;

  const rawData = JSON.parse(content);
  const result = validateMySTJSON(rawData, mystJSONValidationOpts(vfile));
  if (result === undefined) {
    logMessagesFromVFile(session, vfile);
    throw new Error('Unable to load JSON file: error during validation');
  } else {
    const { mdast, kind, frontmatter: pageFrontmatter } = result;
    const { frontmatter, identifiers } = getPageFrontmatter(
      session,
      mdast,
      vfile,
      { ...pageFrontmatter, ...opts?.preFrontmatter },
      opts?.keepTitleNode,
    );
    logMessagesFromVFile(session, vfile);
    return { mdast, kind, frontmatter, identifiers };
  }
}

/**
 * Attempt to load a file into the current session. Unsupported files with
 * issue a warning
 *
 * @param session session with logging
 * @param file path to file to load
 * @param projectPath path to project directory
 * @param extension pre-computed file extension
 * @param opts loading options
 *
 * @param opts.preFrontmatter raw page frontmatter, prioritized over frontmatter
 *     read from the file. Fields defined here will override fields defined
 *     in the file. Unlike project and page frontmatter which are carefully
 *     combined to maintain affiliations, keep all math macros, etc, this
 *     override simply replaces fields prior to any further processing or
 *     validation.
 */
export async function loadFile(
  session: ISession,
  file: string,
  projectPath?: string,
  extension?: '.md' | '.ipynb' | '.tex' | '.bib' | '.myst.json',
  opts?: LoadFileOptions,
): Promise<PreRendererData | undefined> {
  await session.loadPlugins();
  const toc = tic();
  session.store.dispatch(warnings.actions.clearWarnings({ file }));
  const cache = castSession(session);
  let success = true;

  let location = file;
  if (projectPath) {
    location = `/${path.relative(projectPath, file)}`;
  }
  // ensure forward slashes and not windows backslashes
  location = location.replaceAll('\\', '/');

  try {
    const content = fs.readFileSync(file).toString();
    const { sha256, useCache } = checkCache(cache, content, file);
    if (useCache) {
      session.log.debug(toc(`loadFile: ${file} already loaded.`));
      return cache.$getMdast(file)?.pre;
    }
    const ext = extension || path.extname(file).toLowerCase();
    let loadResult: LoadFileResult | undefined;
    switch (ext) {
      case '.md': {
        loadResult = loadMdFile(session, content, file, opts);
        break;
      }
      case '.ipynb': {
        loadResult = await loadNotebookFile(session, content, file, opts);
        break;
      }
      case '.tex': {
        loadResult = loadTexFile(session, content, file, opts);
        break;
      }
      case '.bib': {
        const renderers = await loadBibTeXCitationRenderers(session, file);
        cache.$citationRenderers[file] = renderers;
        Object.entries(renderers).forEach(([id, renderer]) => {
          const normalizedDOI = doi.normalize(renderer.getDOI())?.toLowerCase();
          if (!normalizedDOI || cache.$doiRenderers[normalizedDOI]) return;
          cache.$doiRenderers[normalizedDOI] = { id, render: renderer };
        });
        break;
      }
      case '.json': {
        if (file.endsWith('.myst.json')) {
          loadResult = loadMySTJSON(session, content, file);
          break;
        }
        // This MUST be the final case before `default`, as
        // we rely on falling through to the `default` case if
        // a non-MyST JSON file is encountered here
        //
        // falls through
      }
      default:
        addWarningForFile(session, file, 'Unrecognized extension', 'error', {
          ruleId: RuleId.mystFileLoads,
        });
        session.log.info(
          `"${file}": Please rerun the build with "-c" to ensure the built files are cleared.`,
        );
        success = false;
    }
    if (loadResult) {
      cache.$setMdast(file, {
        sha256,
        pre: { file, location, ...loadResult },
      });
    }
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    addWarningForFile(session, file, `Error reading file: ${error}`, 'error', {
      ruleId: RuleId.mystFileLoads,
    });
    success = false;
  }
  if (success) session.log.debug(toc(`loadFile: loaded ${file} in %s.`));
  return cache.$getMdast(file)?.pre;
}

/**
 * Find bibliography files in the given directory, loading them if required
 *
 * @param session session with logging
 * @param dir directory to search
 * @param load load bib files in addition to locating them
 */
export async function bibFilesInDir(session: ISession, dir: string, load = true) {
  const bibFiles = await Promise.all(
    fs.readdirSync(dir).map(async (f) => {
      if (path.extname(f).toLowerCase() === '.bib') {
        const bibFile = path.join(dir, f);
        if (load) await loadFile(session, bibFile);
        return bibFile;
      }
    }),
  );
  return bibFiles.filter((f): f is string => Boolean(f));
}

/**
 * Return the cached post-processed MDAST for the given file, or return undefined
 *
 * @param session session with logging
 * @param file path to file
 */
export function selectFile(session: ISession, file: string): RendererData | undefined {
  const cache = castSession(session);
  if (!cache.$getMdast(file)) {
    addWarningForFile(session, file, `Expected mdast to be processed`, 'error', {
      ruleId: RuleId.selectedFileIsProcessed,
    });
    return undefined;
  }
  const mdastPost = cache.$getMdast(file)?.post;
  if (!mdastPost) {
    addWarningForFile(session, file, `Expected mdast to be processed and transformed`, 'error', {
      ruleId: RuleId.selectedFileIsProcessed,
    });
    return undefined;
  }
  return mdastPost;
}

export async function getRawFrontmatterFromFile(
  session: ISession,
  file: string,
  projectPath?: string,
) {
  const state = session.store.getState();
  if (projectPath && path.resolve(file) === selectors.selectLocalConfigFile(state, projectPath)) {
    return selectors.selectLocalProjectConfig(state, projectPath);
  }
  const cache = castSession(session);
  if (!cache.$getMdast(file)) await loadFile(session, file, projectPath);
  const result = cache.$getMdast(file);
  if (!result || !result.pre) return undefined;
  return result.pre.frontmatter;
}
