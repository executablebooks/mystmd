import path from 'node:path';
import chalk from 'chalk';
import { EXT_TO_FORMAT, ExportFormats } from 'myst-frontmatter';
import { findCurrentProjectAndLoad } from '../config.js';
import { filterPages, loadProjectFromDisk } from '../project/load.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { writeJsonLogs } from '../utils/logging.js';
import { uniqueArray } from '../utils/uniqueArray.js';
import { buildSite } from './site/prepare.js';
import type { StartOptions } from './site/start.js';
import type { ExportWithFormat, ExportWithInputOutput } from './types.js';
import type { RunExportOptions } from './utils/localArticleExport.js';
import { localArticleExport } from './utils/localArticleExport.js';
import type { CollectionOptions } from './utils/collectExportOptions.js';
import { collectExportOptions, resolveExportListArticles } from './utils/collectExportOptions.js';
import { buildHtml } from './html/index.js';
import { binaryName, readableName } from '../utils/whiteLabelling.js';

type FormatBuildOpts = {
  /** Options to decide what to build */
  site?: boolean;
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  typst?: boolean;
  xml?: boolean;
  md?: boolean;
  meca?: boolean;
  html?: boolean;
  all?: boolean;
  force?: boolean;
  output?: string;
};

export type BuildOpts = FormatBuildOpts & CollectionOptions & RunExportOptions & StartOptions;

export function hasAnyExplicitExportFormat(opts: BuildOpts): boolean {
  const { docx, pdf, tex, typst, xml, md, meca } = opts;
  return docx || pdf || tex || typst || xml || md || meca || false;
}

/**
 * Determine all allowed export formats based on CLI options and arguments
 *
 * @param opts.docx docx export explicitly requested with --docx option
 * @param opts.pdf pdf export explicitly requested with --pdf option
 * @param opts.tex (all formats follow as above)
 * @param opts.typst
 * @param opts.xml
 * @param opts.md
 * @param opts.meca
 * @param opts.all all exports requested with --all option
 * @param opts.explicit explicit input file was provided
 */
export function getAllowedExportFormats(opts: FormatBuildOpts & { explicit?: boolean }) {
  const { docx, pdf, tex, typst, xml, md, meca, all, explicit } = opts;
  const formats = [];
  const any = hasAnyExplicitExportFormat(opts);
  const override = all || (!any && explicit);
  if (docx || override) formats.push(ExportFormats.docx);
  if (pdf || override) {
    formats.push(ExportFormats.pdf, ExportFormats.pdftex, ExportFormats.typst);
  }
  if (tex || override) {
    formats.push(ExportFormats.tex, ExportFormats.pdftex);
  }
  if (typst || override) formats.push(ExportFormats.typst);
  if (xml || override) formats.push(ExportFormats.xml);
  if (md || override) formats.push(ExportFormats.md);
  if (meca || override) formats.push(ExportFormats.meca);
  return [...new Set(formats)];
}

/**
 * Return requested formats from CLI options
 */
export function getRequestedExportFormats(opts: FormatBuildOpts) {
  const { docx, pdf, tex, typst, xml, md, meca } = opts;
  const formats = [];
  if (docx) formats.push(ExportFormats.docx);
  if (pdf) formats.push(ExportFormats.pdf);
  if (tex) formats.push(ExportFormats.tex);
  if (typst) formats.push(ExportFormats.typst);
  if (xml) formats.push(ExportFormats.xml);
  if (md) formats.push(ExportFormats.md);
  if (meca) formats.push(ExportFormats.meca);
  return formats;
}

export function exportSite(session: ISession, opts: FormatBuildOpts) {
  const { force, site, html, all } = opts;
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  return site || html || all || (siteConfig && !force && !hasAnyExplicitExportFormat(opts));
}

export function getProjectPaths(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  const projectPaths: string[] = [
    selectors.selectCurrentProjectPath(session.store.getState()) ?? path.resolve('.'),
    ...(siteConfig?.projects
      ?.map((proj) => proj.path)
      .filter((projectPath): projectPath is string => !!projectPath) ?? []),
  ];
  return uniqueArray(projectPaths);
}

/**
 * Gather a list of export objects with resolved format/input/output values
 *
 * @param files list of files to export; if empty, current project will be loaded
 *     and all project files (including the config file) will be searched for exports
 * @param opts user-provided options, including desired export formats and output filename
 */
export async function collectAllBuildExportOptions(
  session: ISession,
  files: string[],
  opts: BuildOpts,
) {
  const { output } = opts;
  files = files.map((file) => path.resolve(file));
  if (output && files.length !== 1) {
    throw new Error('When specifying a named output for export, you must list exactly one file.');
  }
  const requestedFormats = getRequestedExportFormats(opts);
  if (output && requestedFormats.length > 1) {
    throw new Error(`When specifying output, you can only request one format`);
  }
  let exportOptionsList: ExportWithInputOutput[];
  const projectPath = await findCurrentProjectAndLoad(
    session,
    files[0] ? path.dirname(files[0]) : '.',
  );
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  if (output) {
    session.log.debug(`Exporting formats: "${requestedFormats.join('", "')}"`);
    const format = requestedFormats[0] ?? EXT_TO_FORMAT[path.extname(output)];
    if (!format) {
      throw new Error(
        `Cannot specify format from output "${output}" - please specify format option, e.g. --pdf`,
      );
    }
    exportOptionsList = resolveExportListArticles(
      session,
      files[0],
      [{ format, output: path.join(path.resolve('.'), output) }],
      projectPath,
      opts,
    ).map((exp) => {
      return { ...exp, $file: files[0], $project: projectPath };
    });
  } else if (files.length) {
    const allowedFormats = getAllowedExportFormats({
      ...opts,
      explicit: true,
    });
    session.log.debug(`Exporting formats: "${allowedFormats.join('", "')}"`);
    exportOptionsList = (
      await Promise.all(
        files.map(async (file) => {
          const fileExportOptionsList = await collectExportOptions(
            session,
            [file],
            allowedFormats,
            opts,
          );
          // If requested exports were defined in file frontmatter, return those.
          if (fileExportOptionsList.length > 0) {
            return fileExportOptionsList;
          }
          // If no requested exports were found, force them to build.
          return resolveExportListArticles(
            session,
            file,
            requestedFormats.map((format) => {
              return { format } as ExportWithFormat;
            }),
            projectPath,
            opts,
          ).map((exp) => {
            return { ...exp, $file: files[0], $project: projectPath };
          });
        }),
      )
    ).flat();
  } else {
    const allowedFormats = getAllowedExportFormats(opts);
    session.log.debug(`Exporting formats: "${allowedFormats.join('", "')}"`);
    const projectPaths = getProjectPaths(session);
    exportOptionsList = (
      await Promise.all(
        projectPaths.map(async (projPath) => {
          try {
            const project = await loadProjectFromDisk(session, projPath);
            files = filterPages(project).map((page) => page.file);
          } catch (err) {
            session.log.debug(`Unable to load any content from project at: ${projPath}\n${err}`);
            return [];
          }
          const exportOptions = await collectExportOptions(session, files, allowedFormats, {
            ...opts,
            projectPath: projPath,
          });
          return exportOptions;
        }),
      )
    ).flat();
  }
  return exportOptionsList;
}

function extToKind(ext: string): string {
  // We promote `jats` in the docs, even though extension is `.xml`
  if (ext === 'xml') return 'jats';
  return ext;
}

export async function build(session: ISession, files: string[], opts: BuildOpts) {
  const { site, all, watch, writeDOIBib } = opts;
  const performSiteBuild = all || (files.length === 0 && exportSite(session, opts)) || writeDOIBib;
  const exportOptionsList = await collectAllBuildExportOptions(session, files, opts);
  // TODO: generalize and pull this out!
  const buildLog: Record<string, any> = {
    input: {
      files: files,
      opts: opts,
      performSiteBuild,
    },
    exports: exportOptionsList,
  };
  const exportLogList = exportOptionsList.map((exportOptions) => {
    return `${path.relative('.', exportOptions.$file)} -> ${exportOptions.output}`;
  });
  if (exportLogList.length === 0) {
    if (!(site || performSiteBuild)) {
      // Print out the kinds that are filtered
      const kinds = Object.entries(opts)
        .filter(([k, v]) => ['docx', 'pdf', 'tex', 'typst', 'xml', 'md', 'meca'].includes(k) && v)
        .map(([k]) => k);
      session.log.info(
        `📭 No file exports${
          kinds.length > 0 ? ` with kind "${kinds.map(extToKind).join('", "')}"` : ''
        } found.`,
      );
      if (kinds.length) {
        session.log.info(
          chalk.dim(
            `You may need to add an 'exports' field to the frontmatter of the file(s) you wish to export:\n\n---\nexports:\n  - format: ${extToKind(
              kinds[0],
            )}\n---`,
          ),
        );
      } else {
        session.log.info(
          chalk.dim(
            `You may need to specify either:\n  - an export format, e.g. \`${binaryName()} build --pdf\`\n  - a file to export, e.g. \`${binaryName()} build my-file.md\``,
          ),
        );
      }
    }
  } else {
    session.log.info(`📬 Performing exports:\n   ${exportLogList.join('\n   ')}`);
    await localArticleExport(session, exportOptionsList, opts);
  }
  if (performSiteBuild) {
    const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
    if (!siteConfig) {
      session.log.info('🌎 No site configuration found.');
      session.log.debug(`To build a site, first run '${binaryName()} init --site'`);
    } else {
      session.log.info(`🌎 Building ${readableName()} site`);
      if (watch) {
        session.log.warn(
          `Site content will not be watched and updated; use '${binaryName()} start' instead`,
        );
      }
      if (opts.html) {
        buildLog.buildHtml = true;
        await buildHtml(session, opts);
      } else {
        buildLog.buildSite = true;
        await buildSite(session, opts);
      }
    }
  }
  writeJsonLogs(session, 'myst.build.json', buildLog);
  session.dispose();
}
