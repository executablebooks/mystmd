///////// Common types ////////

/**
 * Sphinx toctree options
 **/
export type ToctreeOptions = {
  caption?: string;
  hidden?: boolean;
  maxdepth?: number;
  numbered?: boolean;
  reversed?: boolean;
  titlesonly?: boolean;
};

/**
 * Entry with a path to a single document with or without the file extension
 */
export type FileEntry = {
  file: string;
  title?: string;
};

/**
 * Entry with a URL to an external URL
 */
export type URLEntry = {
  url: string;
  title?: string;
};

/**
 * Entry with a glob for one or more document files via Unix shell-styloe wildcards
 * Similar to fnmatch, but single stars do not match slashes.
 */
export type GlobEntry = {
  glob: string;
};

///// Basic format /////

/**
 * Single TOC entry
 */
export type BasicEntry = (BasicHasSubtrees | BasicShorthandSubtree | Record<string, never>) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Object containing explicit toctrees
 */
export type BasicHasSubtrees = {
  subtrees: BasicSubtree[];
};

/**
 * Explicit toctree
 */
export type BasicSubtree = ToctreeOptions & {
  entries: BasicEntry[];
};

/**
 * Shorthand for a single (inline) subtree
 */
export type BasicShorthandSubtree = {
  entries: BasicEntry[];
  options?: ToctreeOptions;
};

/**
 * Basic (no format) table of contents
 */
export type BasicTOC = {
  root: string;
  defaults?: ToctreeOptions;
} & (BasicHasSubtrees | BasicShorthandSubtree | Record<string, never>);

/////// Article format ///////

/**
 * Object which has child subtrees
 */
export type ArticleHasSubtrees = {
  subtrees: ArticleSubtree[];
};

/**
 * Single TOC entry
 */
export type ArticleEntry = (ArticleHasSubtrees | ArticleShorthandSubtree | Record<string, never>) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Single toctree
 */
export type ArticleSubtree = ToctreeOptions & {
  sections: ArticleEntry[];
};

/**
 * Shorthand for a single (inline) subtree
 */
export type ArticleShorthandSubtree = {
  sections: ArticleEntry[];
  options?: ToctreeOptions;
};

/**
 * Article (jb-article) table of contents
 */
export type ArticleTOC = {
  format: 'jb-article';
  root: string;
  defaults?: ToctreeOptions;
} & (ArticleHasSubtrees | ArticleShorthandSubtree | Record<string, never>);

////// Book format //////

/**
 * Object which has child (outer) subtrees
 */
export type BookOuterHasSubtrees = {
  parts: BookOuterSubtree[];
};

/**
 * Object which has child (inner) subtrees
 */
export type BookHasSubtrees = {
  subtrees: BookSubtree[];
};

/**
 * Single TOC entry
 */
export type BookEntry = (BookHasSubtrees | BookShorthandSubtree | Record<string, never>) &
  (FileEntry | URLEntry | GlobEntry);

/**
 * Single top-level toctree
 */
export type BookOuterSubtree = ToctreeOptions & {
  chapters: BookEntry[];
};

/**
 * Shorthand for a single outer (inline) subtree
 */
export type BookOuterShorthandSubtree = {
  chapters: BookEntry[];
  options?: ToctreeOptions;
};

/**
 * Single toctree
 */
export type BookSubtree = ToctreeOptions & {
  sections: BookEntry[];
};

/**
 * Shorthand for a single inner (inline) subtree
 */
export type BookShorthandSubtree = {
  sections: BookEntry[];
  options?: ToctreeOptions;
};

/**
 * Book (jb-book) table of contents
 */
export type BookTOC = {
  format: 'jb-book';
  root: string;
  defaults?: ToctreeOptions;
} & (BookOuterHasSubtrees | BookOuterShorthandSubtree | Record<string, never>);

export type TOC = BasicTOC | ArticleTOC | BookTOC;
