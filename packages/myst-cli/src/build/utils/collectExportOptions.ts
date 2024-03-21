import fs from 'node:fs';
import path from 'node:path';
import { RuleId, fileError } from 'myst-common';
import type { Export, ExportArticle } from 'myst-frontmatter';
import {
  ExportFormats,
  MULTI_ARTICLE_EXPORT_FORMATS,
  singleArticleWithFile,
} from 'myst-frontmatter';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { projectFromToc, validateTOC } from '../../project/fromToc.js';
import { loadProjectFromDisk } from '../../project/load.js';
import type { LocalProject } from '../../project/types.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import type { ExportWithOutput, ExportOptions, ExportWithInputOutput } from '../types.js';
import { getExportListFromRawFrontmatter, getRawFrontmatterFromFile } from '../../frontmatter.js';
import { getDefaultExportFilename, getDefaultExportFolder } from './defaultNames.js';

export const SOURCE_EXTENSIONS = ['.ipynb', '.md', '.tex'];

function assignArticlesFromProject(
  exp: Export,
  proj: Omit<LocalProject, 'bibliography'>,
  vfile: VFile,
) {
  const { file, pages } = proj;
  const fileAsPage = { file, level: 1 };
  const articles = pages?.length ? pages : [fileAsPage];
  if (MULTI_ARTICLE_EXPORT_FORMATS.includes(exp.format)) {
    exp.articles = articles;
  } else if (exp.format === ExportFormats.xml) {
    exp.articles = [fileAsPage];
    exp.sub_articles = pages
      .map((page) => (page as any).file)
      .filter((pageFile): pageFile is string => !!pageFile);
  } else {
    fileError(vfile, "multiple articles are only supported for 'tex', 'typst', and 'pdf' exports", {
      ruleId: RuleId.validFrontmatterExportList,
    });
    exp.articles = [singleArticleWithFile(articles) ?? fileAsPage];
  }
}

function assignArticlesFromTOC(session: ISession, exp: Export, tocPath: string, vfile: VFile) {
  const allowLevelLessThanOne = [
    ExportFormats.tex,
    ExportFormats.pdf,
    ExportFormats.pdftex,
  ].includes(exp.format);
  const proj = projectFromToc(session, tocPath, allowLevelLessThanOne ? -1 : 1);
  assignArticlesFromProject(exp, proj, vfile);
}

async function prepareExportOptions(
  session: ISession,
  sourceFile: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const { disableTemplate, filename, template } = opts;
  const vfile = new VFile();
  vfile.path = sourceFile;
  let rawFrontmatter: Record<string, any> | undefined;
  const state = session.store.getState();
  if (
    projectPath &&
    path.resolve(sourceFile) === selectors.selectLocalConfigFile(state, projectPath)
  ) {
    rawFrontmatter = selectors.selectLocalProjectConfig(state, projectPath);
  } else {
    rawFrontmatter = await getRawFrontmatterFromFile(session, sourceFile, projectPath);
  }
  let exportOptions = getExportListFromRawFrontmatter(session, formats, rawFrontmatter, sourceFile);
  // If no export options are provided in frontmatter, instantiate default options
  if (exportOptions.length === 0 && formats.length && opts.force) {
    exportOptions = [{ format: formats[0] }];
  }
  // If any arguments are provided on the CLI, only do a single export using the first available frontmatter tex options
  if (filename || disableTemplate || template) {
    exportOptions = exportOptions.slice(0, 1);
  }
  exportOptions.forEach((exp) => {
    // First, respect explicit toc. If articles/sub_articles are already defined, toc is ignored.
    if (exp.toc && !exp.articles?.length && !exp.sub_articles?.length) {
      const resolvedToc = path.resolve(path.dirname(sourceFile), exp.toc);
      if (validateTOC(session, resolvedToc)) {
        assignArticlesFromTOC(session, exp, resolvedToc, vfile);
      }
    }
    // If no articles are specified, use the sourceFile for article
    if (!exp.articles?.length && SOURCE_EXTENSIONS.includes(path.extname(sourceFile))) {
      exp.articles = [{ file: path.resolve(sourceFile) }];
    }
    // If there is only one article with no explicit level, it should be 0, making the first section depth 1.
    if (exp.articles?.length === 1 && exp.articles[0].level == null) {
      exp.articles[0].level = 0;
    }
    // If still no articles, try to use explicit or implicit project toc
    if (!exp.articles?.length && !exp.sub_articles?.length) {
      if (validateTOC(session, projectPath ?? '.')) {
        assignArticlesFromTOC(session, exp, projectPath ?? '.', vfile);
      } else {
        const cachedProject = selectors.selectLocalProject(
          session.store.getState(),
          projectPath ?? '.',
        );
        if (cachedProject) {
          assignArticlesFromProject(exp, cachedProject, vfile);
        }
      }
    }

    // Convert articles and sub_articles to relative path and ensure existence
    exp.articles = exp.articles
      ?.map((article) => {
        if (!article.file) return article;
        const resolvedFile = path.resolve(path.dirname(sourceFile), article.file);
        if (!fs.existsSync(resolvedFile)) {
          fileError(vfile, `Invalid export article '${article.file}' in source: ${sourceFile}`, {
            ruleId: RuleId.exportArticleExists,
          });
          return undefined;
        }
        return { ...article, file: resolvedFile };
      })
      .filter((article): article is ExportArticle => !!article);

    exp.sub_articles = exp.sub_articles
      ?.map((file: string) => {
        const resolvedFile = path.resolve(path.dirname(sourceFile), file);
        if (!fs.existsSync(resolvedFile)) {
          fileError(vfile, `Invalid export sub_article '${file}' in source: ${sourceFile}`, {
            ruleId: RuleId.exportArticleExists,
          });
          return undefined;
        } else {
          return resolvedFile;
        }
      })
      .filter((resolvedFile: string | undefined): resolvedFile is string => !!resolvedFile);
  });
  // Remove exports with invalid article values
  const filteredExportOptions = exportOptions
    .map((exp) => {
      if (exp.articles?.length) return exp;
      // MECA exports don't necessarily need to specify an article.
      // But it does help locate those other exports if you want!
      if (exp.format === ExportFormats.meca) return exp;
      if (!opts.force) {
        // You cannot "--force" project exports with no article. This is expected
        // and needs no error message.
        fileError(vfile, `Invalid export - unable to resolve 'articles' to export: ${sourceFile}`, {
          ruleId: RuleId.exportArticleExists,
        });
      }
      return undefined;
    })
    .filter((exp) => !!exp);
  logMessagesFromVFile(session, vfile);
  return filteredExportOptions as (Export & { articles: string[] })[];
}

function filterAndMakeUnique<T extends ExportWithOutput>(exports: (T | undefined)[]): T[] {
  return exports
    .filter((exp): exp is T => Boolean(exp))
    .map((exp, ind, arr) => {
      // Make identical export output values unique
      const nMatch = (a: ExportWithOutput[]) => a.filter((e) => e.output === exp.output).length;
      if (nMatch(arr) === 1) return { ...exp };
      const { dir, name, ext } = path.parse(exp.output);
      return {
        ...exp,
        output: path.join(dir, `${name}_${nMatch(arr.slice(0, ind))}${ext}`),
      };
    });
}

function getOutput(
  session: ISession,
  sourceFile: string,
  exp: Export,
  filename: string | undefined,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
) {
  let output: string;
  if (filename) {
    output = filename;
  } else if (exp.output) {
    // output path from file frontmatter needs resolution relative to working directory
    output = path.resolve(path.dirname(sourceFile), exp.output);
  } else {
    output = getDefaultExportFolder(
      session,
      sourceFile,
      projectPath,
      formats.includes(ExportFormats.tex)
        ? 'tex'
        : formats.includes(ExportFormats.typst)
          ? 'typ'
          : undefined,
    );
  }
  if (!path.extname(output)) {
    const basename = getDefaultExportFilename(
      session,
      singleArticleWithFile(exp.articles)?.file ?? sourceFile,
      projectPath,
    );
    output = path.join(output, `${basename}.${extension}`);
  }
  if (!output.endsWith(`.${extension}`)) {
    addWarningForFile(
      session,
      sourceFile,
      `The filename must end with '.${extension}': "${output}"`,
      'error',
      { ruleId: RuleId.exportExtensionCorrect },
    );
    return undefined;
  }
  return output;
}

export async function collectTexExportOptions(
  session: ISession,
  sourceFile: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const exportOptions = await prepareExportOptions(session, sourceFile, formats, projectPath, opts);
  const { disableTemplate, filename, template, zip } = opts;
  if (disableTemplate && template) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template was provided',
    );
  }
  const resolvedExportOptions: ExportWithOutput[] = filterAndMakeUnique(
    exportOptions.map((exp): ExportWithOutput | undefined => {
      const rawOutput = filename || exp.output || '';
      const useZip =
        (extension === 'tex' || extension === 'typ') && (zip || path.extname(rawOutput) === '.zip');
      const usePdf = extension === 'typ' && path.extname(rawOutput) === '.pdf';
      const expExtension = useZip ? 'zip' : usePdf ? 'pdf' : extension;
      const output = getOutput(
        session,
        sourceFile,
        exp,
        filename,
        expExtension,
        formats,
        projectPath,
      );
      if (!output) return undefined;
      const resolvedOptions: { output: string; template?: string | null } = { output };
      if (disableTemplate) {
        resolvedOptions.template = null;
      } else if (template) {
        resolvedOptions.template = template;
      } else if (exp.template) {
        // template path from file frontmatter needs resolution relative to working directory
        const resolvedTemplatePath = path.resolve(path.dirname(sourceFile), exp.template);
        if (fs.existsSync(resolvedTemplatePath)) {
          resolvedOptions.template = resolvedTemplatePath;
        } else {
          resolvedOptions.template = exp.template;
        }
      }
      return { ...exp, ...resolvedOptions };
    }),
  );
  return resolvedExportOptions;
}

export async function collectBasicExportOptions(
  session: ISession,
  sourceFile: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const exportOptions = await prepareExportOptions(session, sourceFile, formats, projectPath, opts);
  const { filename } = opts;
  const resolvedExportOptions: ExportWithOutput[] = filterAndMakeUnique(
    exportOptions.map((exp): ExportWithOutput | undefined => {
      const output = getOutput(session, sourceFile, exp, filename, extension, formats, projectPath);
      if (!output) return undefined;
      return { ...exp, output };
    }),
  );
  return resolvedExportOptions;
}

export async function collectWordExportOptions(
  session: ISession,
  sourceFile: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const exportOptions = await prepareExportOptions(session, sourceFile, formats, projectPath, opts);
  const { template, filename, renderer } = opts;
  const resolvedExportOptions: ExportWithOutput[] = filterAndMakeUnique(
    exportOptions.map((exp): ExportWithOutput | undefined => {
      const output = getOutput(session, sourceFile, exp, filename, extension, formats, projectPath);
      if (!output) return undefined;
      const resolvedOptions: {
        output: string;
        renderer?: ExportOptions['renderer'];
        template?: string | null;
      } = { output };
      if (renderer) {
        resolvedOptions.renderer = renderer;
      }
      if (template) {
        resolvedOptions.template = template;
      } else if (exp.template) {
        // template path from file frontmatter needs resolution relative to working directory
        const resolvedTemplatePath = path.resolve(path.dirname(sourceFile), exp.template);
        if (fs.existsSync(resolvedTemplatePath)) {
          resolvedOptions.template = resolvedTemplatePath;
        } else {
          resolvedOptions.template = exp.template;
        }
      }
      return { ...exp, ...resolvedOptions };
    }),
  );
  return resolvedExportOptions;
}

export async function collectExportOptions(
  session: ISession,
  files: string[],
  formats: ExportFormats[],
  opts: ExportOptions,
) {
  const { projectPath } = opts;
  const sourceFiles = [...files];
  if (projectPath) {
    await loadProjectFromDisk(session, projectPath);
    const configFile = selectors.selectLocalConfigFile(session.store.getState(), projectPath);
    if (configFile) sourceFiles.push(configFile);
  }
  const exportOptionsList: ExportWithInputOutput[] = [];
  await Promise.all(
    sourceFiles.map(async (file) => {
      let fileProjectPath: string | undefined;
      if (!projectPath) {
        fileProjectPath = findCurrentProjectAndLoad(session, path.dirname(file));
        if (fileProjectPath) await loadProjectFromDisk(session, fileProjectPath);
      } else {
        fileProjectPath = projectPath;
      }
      const fileExportOptionsList: ExportWithOutput[] = [];
      if (formats.includes(ExportFormats.docx)) {
        fileExportOptionsList.push(
          ...(await collectWordExportOptions(
            session,
            file,
            'docx',
            [ExportFormats.docx],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.pdf) || formats.includes(ExportFormats.pdftex)) {
        fileExportOptionsList.push(
          ...(await collectTexExportOptions(
            session,
            file,
            'pdf',
            [ExportFormats.pdf, ExportFormats.pdftex],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.tex)) {
        fileExportOptionsList.push(
          ...(await collectTexExportOptions(
            session,
            file,
            'tex',
            [ExportFormats.tex],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.typst)) {
        fileExportOptionsList.push(
          ...(await collectTexExportOptions(
            session,
            file,
            'typ',
            [ExportFormats.typst],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.xml)) {
        fileExportOptionsList.push(
          ...(await collectBasicExportOptions(
            session,
            file,
            'xml',
            [ExportFormats.xml],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.md)) {
        fileExportOptionsList.push(
          ...(await collectBasicExportOptions(
            session,
            file,
            'md',
            [ExportFormats.md],
            fileProjectPath,
            opts,
          )),
        );
      }
      if (formats.includes(ExportFormats.meca)) {
        fileExportOptionsList.push(
          ...(await collectBasicExportOptions(
            session,
            file,
            'zip',
            [ExportFormats.meca],
            fileProjectPath,
            opts,
          )),
        );
      }
      exportOptionsList.push(
        ...fileExportOptionsList.map((exportOptions) => {
          return { ...exportOptions, $file: file, $project: fileProjectPath };
        }),
      );
    }),
  );
  return filterAndMakeUnique(exportOptionsList);
}
