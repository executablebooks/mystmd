export enum ExportFormats {
  pdf = 'pdf',
  tex = 'tex',
  pdftex = 'pdf+tex',
  typst = 'typst',
  docx = 'docx',
  xml = 'xml',
  md = 'md',
  meca = 'meca',
}

export type ExportArticle = {
  file?: string;
  level?: number;
  title?: string;
  // Page frontmatter defined here will override file frontmatter
} & Record<string, any>;

export type Export = {
  id?: string;
  format?: ExportFormats;
  template?: string | null;
  output?: string;
  zip?: boolean;
  toc?: string;
  articles?: ExportArticle[];
  imports?: string[];
  /** sub_articles are only for jats xml export */
  sub_articles?: string[];
  /** MECA: to, from later */
} & Record<string, any>;
