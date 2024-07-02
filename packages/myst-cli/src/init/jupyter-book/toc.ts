import { z } from 'zod';
import { resolveExtension } from '../../utils/resolveExtension.js';
import { join, relative } from 'node:path';
import { cwd } from 'node:process';
import type { Entry as MySTEntry, ParentEntry as MySTParentEntry } from 'myst-toc';

const TOCTreeOptions = z
  .object({
    caption: z.string(),
    hidden: z.boolean(),
    maxdepth: z.number(),
    numberted: z.boolean(),
    reversed: z.boolean(),
    titlesonly: z.boolean(),
  })
  .partial();

type FileEntry = z.infer<typeof FileEntry>;
const FileEntry = z.object({
  file: z.string(),
  title: z.string().optional(),
});

type URLEntry = z.infer<typeof URLEntry>;
const URLEntry = z.object({
  url: z.string(),
  title: z.string().optional(),
});

type GlobEntry = z.infer<typeof GlobEntry>;
const GlobEntry = z.object({
  glob: z.string(),
});

/** Basic TOC Trees **/
type NoFormatSubtreeType = z.infer<typeof TOCTreeOptions> & {
  entries: z.infer<typeof NoFormatEntry>[];
};
const NoFormatSubtree: z.ZodType<NoFormatSubtreeType> = TOCTreeOptions.extend({
  entries: z.lazy(() => NoFormatEntry.array()),
});

type NoFormatShorthandSubtreeType = {
  entries: z.infer<typeof NoFormatEntry>[];
  options?: z.infer<typeof TOCTreeOptions>;
};
const NoFormatShorthandSubtree: z.ZodType<NoFormatShorthandSubtreeType> = z.object({
  entries: z.lazy(() => NoFormatEntry.array()),
  options: TOCTreeOptions.optional(),
});

const NoFormatHasSubtrees = z.object({
  subtrees: NoFormatSubtree.array(),
});

const NoFormatEntry = z.union([
  FileEntry.and(NoFormatShorthandSubtree),
  FileEntry.merge(NoFormatHasSubtrees),
  FileEntry,
  URLEntry,
  GlobEntry,
]);

const NoFormatTOCBase = z.object({
  root: z.string(),
  defaults: TOCTreeOptions.optional(),
});

const NoFormatTOC = z.union([
  NoFormatTOCBase.and(NoFormatShorthandSubtree),
  NoFormatTOCBase.merge(NoFormatHasSubtrees).strict(),
  NoFormatTOCBase.strict(),
]);

/** Article format **/
type ArticleSubtreeType = z.infer<typeof TOCTreeOptions> & {
  sections: z.infer<typeof ArticleEntry>[];
};
const ArticleSubtree: z.ZodType<ArticleSubtreeType> = TOCTreeOptions.extend({
  sections: z.lazy(() => ArticleEntry.array()),
});

type ArticleShorthandSubtreeType = {
  sections: z.infer<typeof ArticleEntry>[];
  options?: z.infer<typeof TOCTreeOptions>;
};
const ArticleShorthandSubtree: z.ZodType<ArticleShorthandSubtreeType> = z.object({
  sections: z.lazy(() => ArticleEntry.array()),
  options: TOCTreeOptions.optional(),
});

const ArticleHasSubtrees = z.object({
  subtrees: ArticleSubtree.array(),
});

const ArticleEntry = z.union([
  FileEntry.and(ArticleShorthandSubtree),
  FileEntry.merge(ArticleHasSubtrees),
  FileEntry,
  URLEntry,
  GlobEntry,
]);

const ArticleTOCBase = z.object({
  root: z.string(),
  format: z.literal('jb-article'),
  defaults: TOCTreeOptions.optional(),
});

const ArticleTOC = z.union([
  ArticleTOCBase.and(ArticleShorthandSubtree),
  ArticleTOCBase.merge(ArticleHasSubtrees).strict(),
  ArticleTOCBase.strict(),
]);

/** Book format **/
type BookOuterSubtreeType = z.infer<typeof TOCTreeOptions> & {
  chapters: z.infer<typeof BookEntry>[];
};
const BookOuterSubtree: z.ZodType<BookOuterSubtreeType> = TOCTreeOptions.extend({
  chapters: z.lazy(() => BookEntry.array()),
});

type BookInnerSubtreeType = z.infer<typeof TOCTreeOptions> & {
  sections: z.infer<typeof BookEntry>[];
};
const BookInnerSubtree: z.ZodType<BookInnerSubtreeType> = TOCTreeOptions.extend({
  sections: z.lazy(() => BookEntry.array()),
});

type BookShorthandOuterSubtreeType = {
  chapters: z.infer<typeof BookEntry>[];
  options?: z.infer<typeof TOCTreeOptions>;
};
const BookShorthandOuterSubtree: z.ZodType<BookShorthandOuterSubtreeType> = z.object({
  chapters: z.lazy(() => BookEntry.array()),
  options: TOCTreeOptions.optional(),
});

type BookShorthandInnerSubtreeType = {
  sections: z.infer<typeof BookEntry>[];
  options?: z.infer<typeof TOCTreeOptions>;
};
const BookShorthandInnerSubtree: z.ZodType<BookShorthandInnerSubtreeType> = z.object({
  sections: z.lazy(() => BookEntry.array()),
  options: TOCTreeOptions.optional(),
});

const BookHasOuterSubtrees = z.object({
  parts: BookOuterSubtree.array(),
});

const BookHasInnerSubtrees = z.object({
  subtrees: BookInnerSubtree.array(),
});

const BookEntry = z.union([
  FileEntry.and(BookShorthandInnerSubtree),
  FileEntry.merge(BookHasInnerSubtrees),
  FileEntry,
  URLEntry,
  GlobEntry,
]);

const BookTOCBase = z.object({
  root: z.string(),
  format: z.literal('jb-book'),
  defaults: TOCTreeOptions.optional(),
});

const BookTOC = z.union([
  BookTOCBase.and(BookShorthandOuterSubtree),
  BookTOCBase.merge(BookHasOuterSubtrees).strict(),
  BookTOCBase.strict(),
]);

/** TOC **/
const SphinxExternalTOC = z.union([ArticleTOC, BookTOC, NoFormatTOC]);

export type SphinxExternalTOC = z.infer<typeof SphinxExternalTOC>;
export function validateSphinxExternalTOC(toc: unknown): SphinxExternalTOC | undefined {
  const result = SphinxExternalTOC.safeParse(toc);
  if (!result.success) {
    console.error(result.error);
    return undefined;
  } else {
    return result.data;
  }
}

/**
 * Helper function throwing a compile error if the branch is reachable
 */
function assertNever(): never {
  throw new Error('unreachable code');
}

/**
 * Convert a no-format TOC to a MyST TOC
 *
 * @param dir - directory in which the _toc.yml lives
 * @param data - validated TOC
 */
function convertNoFormat(dir: string, data: z.infer<typeof NoFormatTOC>) {
  const rootEntry = { file: relative(dir, resolveExtension(join(dir, data.root))!) };

  const convertEntry = (item: z.infer<typeof NoFormatEntry>): MySTEntry => {
    let entry: MySTEntry;
    if ('file' in item) {
      const resolved = resolveExtension(join(dir, item.file as string));
      // TODO: check this is valid!
      entry = {
        file: relative(dir, resolved as string),
        title: item.title,
      };
    } else if ('url' in item) {
      entry = {
        url: item.url,
        title: item.title,
      };
    } else if ('glob' in item) {
      entry = {
        pattern: item.glob,
      };
    } else {
      assertNever();
    }

    if ('subtrees' in item || 'entries' in item) {
      const children = convertHasOrIsSubtree(item);
      entry = { ...entry, children: children };
    }

    return entry;
  };

  const convertSubtree = (
    item: z.infer<typeof NoFormatShorthandSubtree> | z.infer<typeof NoFormatSubtree>,
    options: z.infer<typeof TOCTreeOptions> | undefined,
    index: number,
  ): MySTParentEntry => {
    return {
      title: options?.caption ?? `Subtree ${index}`,
      children: item.entries.map(convertEntry),
    };
  };

  const convertHasOrIsSubtree = (
    item: z.infer<typeof NoFormatShorthandSubtree> | z.infer<typeof NoFormatHasSubtrees>,
  ): MySTEntry[] => {
    if ('subtrees' in item) {
      return item.subtrees.map((subtree, i) => convertSubtree(subtree, subtree, i));
    } else {
      // Convert the subtree
      const subtree = convertSubtree(item, item.options, 0);
      // Lift the children (erasing the shorthand subtree)
      return subtree.children;
    }
  };
  const entries: MySTEntry[] = [rootEntry];
  if ('subtrees' in data || 'entries' in data) {
    entries.push(...convertHasOrIsSubtree(data));
  }
  return entries;
}

/**
 * Convert a Book TOC into a no-format TOC
 *
 * @param data - validated TOC
 */
function convertBookToNoFormat(data: z.infer<typeof BookTOC>): z.infer<typeof NoFormatTOC> {
  const convertEntry = (item: z.infer<typeof BookEntry>): z.infer<typeof NoFormatEntry> => {
    // Drop subtrees and sections
    // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
    let { sections, subtrees, ...result } = item as z.infer<typeof BookEntry> & {
      sections: any;
      subtrees: any;
    };

    if ('sections' in item || 'subtrees' in item) {
      result = { ...result, ...convertHasOrIsInnerSubtree(item) };
    }

    return result;
  };
  const convertInnerSubtree = (item: z.infer<typeof BookInnerSubtree>) => {
    const { sections, ...result } = item;
    return { ...result, entries: sections.map(convertEntry) };
  };

  const convertHasOrIsInnerSubtree = (
    item: z.infer<typeof BookShorthandInnerSubtree> | z.infer<typeof BookHasInnerSubtrees>,
  ): z.infer<typeof NoFormatShorthandSubtree> | z.infer<typeof NoFormatHasSubtrees> => {
    if ('subtrees' in item) {
      const { subtrees, ...rest } = item;
      return { ...rest, subtrees: subtrees.map(convertInnerSubtree) };
    } else {
      const { options, ...rest } = item;
      return { options, ...convertInnerSubtree(rest) };
    }
  };

  const convertOuterSubtree = (
    item: z.infer<typeof BookOuterSubtree>,
  ): z.infer<typeof NoFormatSubtree> => {
    const { chapters, ...rest } = item;
    return { ...rest, entries: chapters.map(convertEntry) };
  };

  const convertHasOrIsOuterSubtree = (
    item: z.infer<typeof BookShorthandOuterSubtree> | z.infer<typeof BookHasOuterSubtrees>,
  ): z.infer<typeof NoFormatShorthandSubtree> | z.infer<typeof NoFormatHasSubtrees> => {
    if ('parts' in item) {
      const { parts, ...rest } = item;
      return { ...rest, subtrees: parts.map(convertOuterSubtree) };
    } else {
      const { options, ...rest } = item;
      return { options, ...convertOuterSubtree(rest) };
    }
  };

  const { root, defaults, format: _, ...rest } = data;
  let result = {
    root,
    defaults,
  };
  if ('chapters' in rest || 'parts' in rest) {
    result = { ...result, ...convertHasOrIsOuterSubtree(rest) };
  }

  return result;
}

/**
 * Convert a Article TOC into a no-format TOC
 *
 * @param data - validated TOC
 */
function convertArticleToNoFormat(data: z.infer<typeof ArticleTOC>): z.infer<typeof NoFormatTOC> {
  const convertEntry = (item: z.infer<typeof ArticleEntry>): z.infer<typeof NoFormatEntry> => {
    // Drop subtrees and sections
    // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
    let { sections, subtrees, ...result } = item as z.infer<typeof ArticleEntry> & {
      sections: any;
      subtrees: any;
    };

    if ('sections' in item || 'subtrees' in item) {
      result = { ...result, ...convertHasOrIsSubtree(item) };
    }

    return result;
  };
  const convertSubtree = (item: z.infer<typeof ArticleSubtree>) => {
    const { sections, ...result } = item;
    return { ...result, entries: sections.map(convertEntry) };
  };

  const convertHasOrIsSubtree = (
    item: z.infer<typeof ArticleShorthandSubtree> | z.infer<typeof ArticleHasSubtrees>,
  ): z.infer<typeof NoFormatShorthandSubtree> | z.infer<typeof NoFormatHasSubtrees> => {
    if ('subtrees' in item) {
      const { subtrees, ...rest } = item;
      return { ...rest, subtrees: subtrees.map(convertSubtree) };
    } else {
      const { options, ...rest } = item;
      return { options, ...convertSubtree(rest) };
    }
  };
  const { root, defaults, format: _, ...rest } = data;
  let result = {
    root,
    defaults,
  };
  if ('sections' in rest || 'subtrees' in rest) {
    result = { ...result, ...convertHasOrIsSubtree(rest) };
  }

  return result;
}

/**
 * Upgrade a sphinx-external-toc TOC into a MyST TOC
 */
export function upgradeTOC(data: SphinxExternalTOC): MySTEntry[] {
  const dir = cwd();
  let dataNoFormat: z.infer<typeof NoFormatTOC>;
  if ('format' in data) {
    switch (data.format) {
      case 'jb-book':
        {
          dataNoFormat = convertBookToNoFormat(data);
        }
        break;
      case 'jb-article':
        {
          dataNoFormat = convertArticleToNoFormat(data);
        }
        break;
    }
  } else {
    dataNoFormat = data;
  }
  return convertNoFormat(dir, dataNoFormat);
}
