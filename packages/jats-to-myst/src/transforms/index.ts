import type { GenericParent } from 'myst-common';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

import { sectionTransform } from './sections.js';
import { typographyTransform } from './typography.js';
import { admonitionTransform } from './admonitions.js';
import { figCaptionTitleTransform } from './figureCaptions.js';

export { sectionTransform, sectionPlugin } from './sections.js';
export { typographyTransform, typographyPlugin } from './typography.js';
export { admonitionTransform, admonitionPlugin } from './admonitions.js';
export { figCaptionTitleTransform, figCaptionTitlePlugin } from './figureCaptions.js';

export function basicTransformations(tree: GenericParent, file: VFile) {
  sectionTransform(tree);
  typographyTransform(tree);
  admonitionTransform(tree, file);
  figCaptionTitleTransform(tree);
}

export const basicTransformationsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    basicTransformations(tree, file);
  };
