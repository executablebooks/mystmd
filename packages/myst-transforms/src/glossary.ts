import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import type { VFile } from 'vfile';
import { selectAll, select } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { normalizeLabel, toText, fileError, fileWarn, RuleId } from 'myst-common';
import type { DefinitionTerm, DefinitionDescription, DefinitionList } from 'myst-spec-ext';

export type Options = {
  upgradeLegacySyntax?: boolean;
};

/**
 * Lift out definitionTerms from top-level `TERM\nDEFINITION` text nodes
 */
function maybeLiftLegacyDefinitionTerm(node: GenericParent): GenericParent | undefined {
  if (node.type !== 'paragraph') {
    return undefined;
  }
  const firstChild = node.children[0];
  if (firstChild?.type !== 'text') {
    return undefined;
  }
  const value = firstChild.value as string;
  const index = value.indexOf('\n');
  if (index === -1) {
    return undefined;
  }
  const term = value.slice(0, index);
  const remainder = value.slice(index + 1, value.length);
  firstChild.value = remainder;
  return {
    type: 'definitionTerm',
    children: [{ type: 'text', value: term }],
  };
}

export function glossaryTransform<T extends Node | GenericParent>(
  mdast: T,
  file: VFile,
  opts: Options,
) {
  const glossaries = selectAll('glossary', mdast) as GenericParent[];
  glossaries.forEach((glossary) => {
    // Do we have a ReST-like glossary? If so, pull it out.
    if (opts.upgradeLegacySyntax && !select('definitionList', glossary)) {
      fileWarn(
        file,
        `Unexpected node as a child of a glossary, expected only \`definitionList\` children
  Treating glossary as a legacy-format glossary and attempting to upgrade.`,
        {
          node: glossary,
          ruleId: RuleId.glossaryUsesDefinitionList,
        },
      );

      const definitionList = {
        type: 'definitionList',
        children: [],
      } as DefinitionList;

      let termChildren: DefinitionDescription['children'] = [];

      // Build up definitionList as alternating term-definition
      for (const child of glossary.children) {
        let definitionTerm: GenericParent | undefined;
        if ((definitionTerm = maybeLiftLegacyDefinitionTerm(child as unknown as GenericParent))) {
          // Assign new children for this term
          termChildren = [];
          // Push the term
          definitionList.children.push(definitionTerm as DefinitionTerm);
          // Push the yet-unfilled description
          definitionList.children.push({
            type: 'definitionDescription',
            children: termChildren,
          });
        }
        // Populate the current definition's children
        termChildren.push(child);
      }
      // Overwrite the glossary!
      glossary.children = [definitionList];
    }
    glossary.children.forEach((list) => {
      if (list.type !== 'definitionList') {
        fileError(
          file,
          'Unexpected node as a child of a glossary, expected only `definitionList` children',
          {
            node: list,
            ruleId: RuleId.glossaryUsesDefinitionList,
          },
        );
        return;
      }
      list.children?.forEach((child) => {
        if (child.type === 'definitionTerm') {
          const { label, identifier, html_id } = normalizeLabel(toText(child)) ?? {};
          child.label = label;
          child.identifier = `term-${identifier}`;
          child.html_id = `term-${html_id}`;
        }
      });
    });
  });
}

export const glossaryPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    glossaryTransform(tree, file, opts);
  };
