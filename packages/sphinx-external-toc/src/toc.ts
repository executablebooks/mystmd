import yaml from 'js-yaml';
import type { TOC, ArticleTOC, BookTOC, BasicTOC } from './types.js';
import schema from './schema.json';
import _Ajv from 'ajv';

// Adjust types for ES module
// @ts-ignore
const Ajv = _Ajv as unknown as typeof _Ajv.default;

// See https://executablebooks.org/en/latest/blog/2021-06-18-update-toc/
// Implementation transpiled from https://github.com/executablebooks/sphinx-external-toc/blob/v1.0.1/sphinx_external_toc/tools.py#L277
function upgradeOldJupyterBookTOC(oldTOC: any[]) {
  const tocUpdated = oldTOC[0] as Record<string, unknown>;

  let firstItems: Record<string, unknown>[] = [];
  let topItemsKey = 'sections';

  if ('sections' in tocUpdated && 'chapters' in tocUpdated) {
    throw new Error("First list item contains both 'chapters' and 'sections' keys");
  }

  // Identify whether we have "sections" or "chapters" in our first key
  // And pull them into "firstItems" if so
  for (const key of ['sections', 'chapters']) {
    if (key in tocUpdated) {
      topItemsKey = key;
      const items = tocUpdated[key] as Record<string, unknown>[];
      delete tocUpdated[key];

      if (!Array.isArray(items)) {
        throw new Error(`'${key}' in toc must be an array`);
      }

      firstItems = [...firstItems, ...items];
      break;
    }
  }
  // Fuse first key's items, and remaining TOC entries
  firstItems = [...firstItems, ...oldTOC.slice(1)];

  const containsPart = firstItems.some((item) => 'part' in item || 'chapter' in item);
  const containsFile = firstItems.some((item) => 'file' in item);

  // Ensure we don't mix key types
  if (containsPart && containsFile) {
    throw new Error("top-level contains mixed 'part' and 'file' keys");
  }

  // Respect top-level "parts", "sections", or "chapters".
  // Only group under "parts" if any array-items have a "part" key
  tocUpdated[containsPart ? 'parts' : topItemsKey] = firstItems;

  // Write root
  const { file: root, ...toc } = tocUpdated;
  if (root === undefined) {
    throw new Error("no top-level 'file' key found");
  }
  toc['root'] = root;

  // Ensure we don't mix top-level key types
  const topLevelKeys = ['parts', 'chapters', 'sections'].filter((item) => item in toc);
  if (topLevelKeys.length > 1) {
    throw new Error(`There is more than one top-level key: ${topLevelKeys}`);
  }

  // Deduce the TOC format
  if (topLevelKeys.length) {
    const fileFormat = {
      parts: 'jb-book',
      chapters: 'jb-book',
      sections: 'jb-article',
    }[topLevelKeys[0]];
    toc['format'] = fileFormat;
  }

  // Do we have a singular "default" subtree (indicated by "entries" key)
  const hasDefaultSubtree = 'entries' in toc || 'sections' in toc || 'chapters' in toc;

  // Lower numbering
  const numbered = toc['numbered'];
  delete toc['numbered'];
  if (numbered !== undefined) {
    // Default subtree
    if (hasDefaultSubtree) {
      toc['options'] = { numbered: numbered };
    }
    // Child subtrees
    else {
      const subtrees = (toc['subtrees'] ?? toc['parts'] ?? []) as Record<string, unknown>[];
      for (const subtree of subtrees) {
        subtree['numbered'] = numbered;
      }
    }
  }

  // Lower title
  const title = toc['title'];
  delete toc['title'];
  if (title !== undefined) {
    // Only set title for single default subtree
    if (hasDefaultSubtree) {
      const options = (toc['options'] ?? (toc['options'] = {})) as Record<string, unknown>;
      options['caption'] = title;
    }
  }

  // Rename "part" to "caption"
  const adjustConfig = (obj: Record<string, unknown>) => {
    if ('chapters' in obj && 'sections' in obj) {
      throw new Error(`both 'chapters' and 'sections' in same table: ${obj}`);
    }
    const caption = obj['part'] ?? obj['chapter'];
    delete obj['part'];
    delete obj['chapter'];

    if (caption !== undefined) {
      obj['caption'] = caption;
    }
    for (const key of ['parts', 'chapters', 'sections', 'entries']) {
      if (key in obj) {
        const children = obj[key] as Record<string, unknown>[];
        children.forEach(adjustConfig);
      }
    }
  };

  adjustConfig(toc);
  return toc;
}

/**
 * Parse a sphinx-external-toc table of contents
 *
 * @param contents: raw TOC yaml
 */
export function parseTOC(contents: string): { toc: TOC; didUpgrade: boolean } {
  let toc: any;
  try {
    toc = yaml.load(contents) as any;
  } catch (err) {
    throw new Error(`Unable to parse TOC yaml`);
  }
  let didUpgrade = false;

  if (Array.isArray(toc)) {
    toc = upgradeOldJupyterBookTOC(toc);
    console.log('upgraded', JSON.stringify(toc));
    didUpgrade = true;
  }

  const ajv = new Ajv.default();
  const validate = ajv.compile(schema);
  if (!validate(toc)) {
    throw new Error(
      `The given contents do not form a valid TOC. Please see: https://sphinx-external-toc.readthedocs.io/en/latest/user_guide/sphinx.html#basic-structure for information about valid ToC contents`,
    );
  }

  return { toc: toc as TOC, didUpgrade };
}

export function isBasicTOC(toc: TOC): toc is BasicTOC {
  return !('format' in (toc as any));
}

export function isBookTOC(toc: TOC): toc is BookTOC {
  return (toc as any).format === 'jb-book';
}

export function isArticleTOC(toc: TOC): toc is ArticleTOC {
  return (toc as any).format === 'jb-article';
}
