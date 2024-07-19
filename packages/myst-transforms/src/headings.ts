import type { Plugin } from 'unified';
import { fileWarn, type GenericParent } from 'myst-common';
import type { Heading } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

type HeadingDepthOptions = { firstDepth?: number };

/**
 * Normalize heading depths based on specified first heading depth
 *
 * Heading levels will be modified so they are all sequential and begin
 * at firstDepth. If heading depths are non-sequential, a warning will be
 * raised and they will be normalized to sequential. If max heading depth
 * is greater than 6, a warning is also raised, and all values greater than
 * 6 will be left at 6.
 *
 * If firstDepth is undefined, the default, this transform will do nothing.
 *
 * If, for example, the title is defined in the frontmatter but should be
 * depth 1, the first heading of the content should be depth 2 and
 * you must specify firstDepth = 2. This transform does not take
 * into account frontmatter title or content_includes_title flag;
 * These must be considered when specifying firstDepth.
 * First depth cannot be < 1.
 */
export async function headingDepthTransform(
  tree: GenericParent,
  vfile: VFile,
  opts?: HeadingDepthOptions,
) {
  if (opts?.firstDepth == null) return;
  const firstDepth = opts.firstDepth > 0 ? opts.firstDepth : 1;
  const headings = selectAll('heading', tree) as Heading[];
  if (headings.length === 0) return;
  const currentDepths = [
    ...new Set(headings.map((heading) => heading.depth).filter((depth) => !!depth)),
  ].sort();
  for (let i = currentDepths[0] + 1; i < currentDepths[currentDepths.length - 1]; i++) {
    if (!currentDepths.includes(i)) {
      fileWarn(vfile, `missing heading depth ${i}`);
    }
  }
  if (currentDepths.length + firstDepth > 7) {
    fileWarn(vfile, `max number of heading depth levels exceeded; must be ≤ ${7 - firstDepth}`);
  }
  headings.forEach((heading) => {
    const depthIndex = currentDepths.indexOf(heading.depth);
    if (depthIndex < 0) return;
    const newDepth = depthIndex + firstDepth;
    heading.depthSource = heading.depth;
    heading.depth = newDepth < 7 ? newDepth : 6;
  });
}

export const headingDepthPlugin: Plugin<[HeadingDepthOptions], GenericParent, GenericParent> =
  (opts) => (tree, vfile) => {
    headingDepthTransform(tree, vfile, opts);
  };
