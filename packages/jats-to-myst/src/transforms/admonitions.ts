import type { Plugin } from 'unified';
import type { Heading } from 'myst-spec';
import type { GenericParent } from 'myst-common';
import { RuleId, fileWarn } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import { Tags } from 'jats-tags';
import type { VFile } from 'vfile';

export type Section = Omit<Heading, 'type'> & { type: 'section' };

/**
 * Convert boxed-text caption to admonitionTitle (with content from caption > title)
 *
 * If boxed-text caption does not have a title, warn.
 *
 * After converting, delete any remaining boxed-text captions.
 */
export function admonitionTransform(tree: GenericParent, file: VFile) {
  const captions = selectAll(`${Tags.boxedText} > ${Tags.caption}`, tree) as GenericParent[];
  captions.forEach((caption) => {
    const title = select(Tags.title, caption) as GenericParent;
    if (!title) {
      fileWarn(file, '', { node: caption, ruleId: RuleId.jatsParses });
      return;
    }
    caption.type = 'admonitionTitle';
    caption.children = title.children;
  });
  const noCaptions = selectAll(`${Tags.boxedText} > ${Tags.caption}`, tree) as GenericParent[];
  noCaptions.forEach((caption) => {
    caption.type = '__delete__';
  });
  remove(tree, '__delete__');
}

export const admonitionPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  admonitionTransform(tree, file);
};
