import type { Plugin } from 'unified';
import type { Heading } from 'myst-spec';
import type { GenericNode, GenericParent } from 'myst-common';
import { liftChildren } from 'myst-common';
import { blockNestingTransform } from 'myst-transforms';
import { select } from 'unist-util-select';

export type Section = Omit<Heading, 'type'> & { type: 'section' };

function recurseSections(tree: GenericNode, depth = 1): void {
  const sections = tree.children?.filter((n) => n.type === 'sec');
  if (!sections || sections.length === 0) return;
  sections.forEach((sec) => {
    if (sec.children?.[0]?.type !== 'title') return;
    sec.children[0].type = 'heading';
    sec.children[0].id = sec.id;
    sec.children[0].depth = depth;
    recurseSections(sec, depth + 1);
  });
}

/**
 * Clean up nested sections
 *
 * - Identify sections with titles
 * - Convert those titles to headings
 * - Give headings depth value based on nesting
 * - Flatten the sections
 */
export function sectionTransform(tree: GenericParent) {
  recurseSections(tree);
  const topSections = tree.children?.filter((n) => n.type === 'sec');
  topSections.forEach((sec) => {
    sec.type = 'block';
  });
  while (select('sec', tree)) liftChildren(tree as any, 'sec');
  blockNestingTransform(tree as any);
}

export const sectionPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  sectionTransform(tree);
};
