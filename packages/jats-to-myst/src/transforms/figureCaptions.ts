import type { Plugin } from 'unified';
import type { Heading } from 'myst-spec';
import type { GenericParent } from 'myst-common';
import { copyNode } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import { Tags } from 'jats-tags';

export type Section = Omit<Heading, 'type'> & { type: 'section' };

/**
 * Move figure > caption > titles up to the figure
 */
export function figCaptionTitleTransform(tree: GenericParent) {
  const figures = selectAll(Tags.fig, tree) as GenericParent[];
  figures.forEach((figure) => {
    const captionTitle = select('caption > title', figure);
    if (!captionTitle) return;
    figure.children = [copyNode(captionTitle), ...figure.children];
    captionTitle.type = '__delete__';
  });
  remove(tree, '__delete__');
}

export const figCaptionTitlePlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  figCaptionTitleTransform(tree);
};
