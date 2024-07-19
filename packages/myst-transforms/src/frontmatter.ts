import yaml from 'js-yaml';
import { remove } from 'unist-util-remove';
import { select } from 'unist-util-select';
import type { Block, Code, Heading } from 'myst-spec';
import type { GenericParent } from 'myst-common';
import { RuleId, fileError, toText, fileWarn, normalizeLabel } from 'myst-common';
import type { VFile } from 'vfile';
import { mystTargetsTransform } from './targets.js';

type Options = {
  /**
   * In many existing JupyterBooks, the first node is a label `(heading)=`
   * The `propagateTargets` option merges the target with the heading
   * so the title can be picked up by the frontmatter.
   */
  propagateTargets?: boolean;
  /**
   * `preFrontmatter` overrides frontmatter from the file. It must be taken
   * into account this early so tile is not removed if preFrontmatter.title
   * is defined.
   */
  preFrontmatter?: Record<string, any>;
  /**
   * By default, if the page starts with an H1 heading and has no title in the
   * frontmatter, the heading will become the title and be removed.
   * If `keepTitleNode` is true, the heading will still become the title
   * but the node will not be removed.
   */
  keepTitleNode?: boolean;
};

export function getFrontmatter(
  file: VFile,
  tree: GenericParent,
  opts: Options = { propagateTargets: true },
): { tree: GenericParent; frontmatter: Record<string, any>; identifiers: string[] } {
  if (opts.propagateTargets) mystTargetsTransform(tree);
  const firstParent =
    (tree.children[0]?.type as any) === 'block' ? (tree.children[0] as any as Block) : tree;
  const firstNode = firstParent.children?.[0] as Code;
  const nextNonCommentNode = firstParent.children
    ?.slice(1)
    ?.find((child) => child.type !== 'comment');
  let secondNode: Heading | undefined;
  if (nextNonCommentNode?.type === 'block') {
    secondNode = nextNonCommentNode?.children?.find((child) => child.type !== 'comment') as
      | Heading
      | undefined;
  } else {
    secondNode = nextNonCommentNode as Heading | undefined;
  }
  let frontmatter: Record<string, any> = {};
  const identifiers: string[] = [];
  const firstIsYaml = firstNode?.type === 'code' && firstNode?.lang === 'yaml';
  if (firstIsYaml) {
    try {
      frontmatter = (yaml.load(firstNode.value) as Record<string, any>) || {};
      (firstNode as any).type = '__delete__';
    } catch (err) {
      fileError(file, 'Invalid YAML frontmatter', {
        note: (err as Error).message,
        ruleId: RuleId.frontmatterIsYaml,
      });
    }
  }
  if (opts.preFrontmatter) {
    frontmatter = { ...frontmatter, ...opts.preFrontmatter };
  }
  if (frontmatter.content_includes_title != null) {
    fileWarn(file, `'frontmatter' cannot explicitly set: content_includes_title`, {
      ruleId: RuleId.validPageFrontmatter,
    });
    delete frontmatter.content_includes_title;
  }
  const titleNull = frontmatter.title === null;
  if (titleNull) delete frontmatter.title;
  const firstHeadingNode = select('heading', tree) as Heading;
  // If title is not defined, copy first header to title
  if (!frontmatter.title && firstHeadingNode) {
    const title = toText(firstHeadingNode.children);
    frontmatter.title = title;
    frontmatter.content_includes_title = true;
  }
  const firstIsComment = (firstNode as any)?.type === 'comment';
  const nextNode = firstIsYaml || firstIsComment ? secondNode : (firstNode as unknown as Heading);
  const nextNodeIsH1 = nextNode?.type === 'heading' && nextNode.depth === 1;
  // Explicitly handle the case of an H1 directly after the frontmatter
  if (nextNodeIsH1 && !titleNull) {
    const title = toText(nextNode.children);
    // Only remove the title if it is the same
    if (frontmatter.title && frontmatter.title === title && !opts.keepTitleNode) {
      (nextNode as any).type = '__delete__';
      frontmatter.content_includes_title = false;
      frontmatter.titleDepth = nextNode.depth;
      // If this has a label add it to the page identifiers for reference resolution
      if (nextNode.label) {
        const { identifier } = normalizeLabel(nextNode.label) ?? {};
        if (identifier) identifiers.push(identifier);
      }
    }
  }
  // Handles deleting the block if it is the only element in the block
  const possibleNull = remove(tree, '__delete__');
  if (possibleNull === null) {
    // null is returned if tree itself didn’t pass the test or is cascaded away
    remove(tree, { cascade: false }, '__delete__');
  }
  return { tree, frontmatter, identifiers };
}
