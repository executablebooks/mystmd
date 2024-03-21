import fs from 'node:fs';
import { join, parse, extname } from 'node:path';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import type {
  ArticleSubtree,
  BookSubtree,
  BookOuterSubtree,
  BasicSubtree,
  BasicEntry,
  TOC,
} from 'sphinx-external-toc';
import { parseTOC, asBasicTOC } from 'sphinx-external-toc';
import { VALID_FILE_EXTENSIONS, resolveExtension } from '../utils/resolveExtension.js';
import { fileInfo } from '../utils/fileInfo.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { nextLevel } from '../utils/nextLevel.js';
import type {
  PageLevels,
  LocalProjectFolder,
  LocalProjectPage,
  LocalProject,
  PageSlugs,
} from './types.js';

export const tocFile = (filename: string): string => {
  if (extname(filename) === '.yml') return filename;
  return join(filename, '_toc.yml');
};

export function validateTOC(session: ISession, path: string): boolean {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) return false;
  const contents = fs.readFileSync(filename).toString();
  try {
    const { toc, didUpgrade } = parseTOC(contents);

    if (didUpgrade) {
      addWarningForFile(
        session,
        filename,
        `${filename} is out of date: see https://executablebooks.org/en/latest/blog/2021-06-18-update-toc`,
        'warn',
        { ruleId: RuleId.validTocStructure },
      );
    }

    return true;
  } catch (error) {
    const { message } = error as unknown as Error;
    addWarningForFile(
      session,
      filename,
      `Table of Contents (ToC) file did not pass validation:\n - ${message}\n - An implicit ToC will be used instead\n`,
      'error',
      { ruleId: RuleId.validTocStructure },
    );
    return false;
  }
}


function pagesFromSubtree(
  session: ISession,
  path: string,
  subtree: BasicSubtree,
  pages: (LocalProjectFolder | LocalProjectPage)[] = [],
  level: PageLevels = 1,
  pageSlugs: PageSlugs,
): (LocalProjectFolder | LocalProjectPage)[] {
  const filename = tocFile(path);
  const { dir } = parse(filename);

  // Does this subtree have a title? If so, make a folder
  if ('title' in subtree) {
    pages.push({ level, title: subtree.title as string });
  }

  // Now handle subtree contents
  subtree.entries.forEach((entry) => {
    // File entry
    if ('file' in entry) {
      const file = resolveExtension(join(dir, entry.file as string));
      if (file) {
        const { slug } = fileInfo(file, pageSlugs);
        pages.push({ file, level, slug });
      } else {
        addWarningForFile(
          session,
          tocFile(path),
          `Referenced file not found: ${entry.file}`,
          'error',
          { ruleId: RuleId.tocContentsExist },
        );
      }
    }

    // Default subtree
    if ('entries' in entry) { 
      const subtree = { ...entry, ...entry.options } as BasicSubtree;
      pagesFromSubtree(
        session,
        path,
        subtree,
        pages,
        nextLevel(level),
        pageSlugs,
      );
    }
    // Multiple subtrees
    else if ('subtrees' in entry) {
      entry.subtrees.forEach((entry) =>
        pagesFromSubtree(session, path, entry, pages, nextLevel(level), pageSlugs),
      );
    }
  });

  return pages;
}

/**
 * Build project structure from jupyterbook '_toc.yml' file on a path
 *
 * Starting level may be provided; by default this is 1. Numbers up to
 * 6 may be provided for pages to start at a lower level. Level may
 * also be -1 or 0. In these cases, the first "part" level will be -1
 * and the first "chapter" level will be 0; However, "sections"
 * will never be level < 1.
 */
export function projectFromToc(
  session: ISession,
  path: string,
  level: PageLevels = 1,
): Omit<LocalProject, 'bibliography'> {
  const filename = tocFile(path);
  if (!fs.existsSync(filename)) {
    throw new Error(`Could not find TOC "${filename}". Please create a '_toc.yml'.`);
  }
  const { dir } = parse(filename);
  const contents = fs.readFileSync(filename).toString();
  const parseResult = parseTOC(contents);
  const toc = asBasicTOC(parseResult.toc);

  const pageSlugs: PageSlugs = {};
  const indexFile = resolveExtension(join(dir, toc.root));
  if (!indexFile) {
    throw Error(
      `The table of contents defined in "${tocFile(path)}" could not find file "${
        toc.root
      }" defined as the "root:" page. Please ensure that one of these files is defined:\n- ${VALID_FILE_EXTENSIONS.map(
        (ext) => join(dir, `${toc.root}${ext}`),
      ).join('\n- ')}\n`,
    );
  }
  const { slug } = fileInfo(indexFile, pageSlugs);
  const pages: (LocalProjectFolder | LocalProjectPage)[] = [];
  if ('subtrees' in toc) {
    toc.subtrees.forEach((subtree) =>
      pagesFromSubtree(session, path, subtree, pages, level, pageSlugs),
    );
  } else if ('entries' in toc) {
    const subtree = { ...toc, ...toc.options } as BasicSubtree;
    pagesFromSubtree(session, path, subtree, pages, level, pageSlugs);
  }
  /**
  if (toc.entries) {
    // Do not allow sections to have level < 1
    if (level < 1) level = 1;
      } else if (toc.subtrees) {
    // Do not allow chapters to have level < 0
    if (level < 0) level = 0;
    pagesFromChapters(session, path, toc.chapters, pages, level, pageSlugs);
  } else if (toc.parts) {
    // Do not allow parts to have level < -1
    if (level < -1) level = -1;
    toc.parts.forEach((part, index) => {
      if (part.caption) {
        pages.push({ title: part.caption || `Part ${index + 1}`, level });
      }
      if (part.chapters) {
        pagesFromChapters(session, path, part.chapters, pages, nextLevel(level), pageSlugs);
      }
    });
  }
  */
  return { path: dir || '.', file: indexFile, index: slug, pages };
}

/**
 * Return only project pages/folders from a '_toc.yml' file
 *
 * The root file is converted into just another top-level page.
 */
export function pagesFromToc(
  session: ISession,
  path: string,
  level: PageLevels,
): (LocalProjectFolder | LocalProjectPage)[] {
  const { file, index, pages } = projectFromToc(session, path, nextLevel(level));
  pages.unshift({ file, slug: index, level });
  return pages;
}
