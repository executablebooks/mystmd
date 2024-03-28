import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateList,
  validateObjectKeys,
  validateString,
  validateObject,
  validationError,
  validateBoolean,
} from 'simple-validators';
import { validateProjectAndPageFrontmatterKeys } from '../project/validators.js';
import { PAGE_FRONTMATTER_KEYS, PAGE_KNOWN_PARTS, type PageFrontmatter } from './types.js';
import { validateKernelSpec } from '../kernelspec/validators.js';
import { validateJupytext } from '../jupytext/validators.js';
import { FRONTMATTER_ALIASES } from '../site/validators.js';

export const USE_PROJECT_FALLBACK = [
  'authors',
  'reviewers',
  'editors',
  'date',
  'doi',
  'arxiv',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'biblio',
  'numbering',
  'keywords',
  'funding',
  'copyright',
  'affiliations',
];

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
  }
  if (defined(value.tags)) {
    output.tags = validateList(
      value.tags,
      incrementOptions('tags', opts),
      (file, index: number) => {
        return validateString(file, incrementOptions(`tags.${index}`, opts));
      },
    );
  }
  const partsOptions = incrementOptions('parts', opts);
  let parts: Record<string, any> | undefined;
  if (defined(value.parts)) {
    parts = validateObject(value.parts, partsOptions);
  }
  PAGE_KNOWN_PARTS.forEach((partKey) => {
    if (defined(value[partKey])) {
      parts ??= {};
      if (parts[partKey]) {
        validationError(`duplicate value for part ${partKey}`, partsOptions);
      } else {
        parts[partKey] = value[partKey];
      }
    }
  });
  if (parts) {
    const partsEntries = Object.entries(parts)
      .map(([k, v]) => {
        return [
          k,
          validateList(v, { coerce: true, ...incrementOptions(k, partsOptions) }, (item, index) => {
            return validateString(item, incrementOptions(`${k}.${index}`, partsOptions));
          }),
        ];
      })
      .filter((entry): entry is [string, string[]] => !!entry[1]?.length);
    if (partsEntries.length > 0) {
      output.parts = Object.fromEntries(partsEntries);
    }
  }
  if (defined(value.content_includes_title)) {
    output.content_includes_title = validateBoolean(
      value.content_includes_title,
      incrementOptions('content_includes_title', opts),
    );
  }
  return output;
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PAGE_FRONTMATTER_KEYS, alias: FRONTMATTER_ALIASES },
      opts,
    ) || {};
  return validatePageFrontmatterKeys(value, opts);
}
