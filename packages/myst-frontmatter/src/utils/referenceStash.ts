import type { ValidationOptions } from 'simple-validators';
import { validationWarning } from 'simple-validators';
import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import { normalizeJsonToString } from './normalizeString.js';

type WithId<T> = T & { id: string };
type Options<T> = {
  id: string;
  opts: ValidationOptions;
  validateFn: (v: any, o: ValidationOptions) => T | undefined;
};

/**
 * Object to hold items referenced in multiple parts of frontmatter
 *
 * These will be normalized to the top level and replaced with ids elsewhere
 */
export type ReferenceStash = {
  affiliations?: WithId<Affiliation>[];
  contributors?: WithId<Contributor>[];
  affiliationsOpts?: Record<string, Options<Affiliation>>;
  contributorsOpts?: Record<string, Options<Contributor>>;
  // Used to on resolution differentiate authors from other contributors
  authorIds?: string[];
};

export function pseudoUniqueId(kind: string, index: number, file?: string) {
  let suffix = '';
  if (file) {
    const fileParts = file.replace('\\', '/').split('/');
    const nameParts = fileParts[fileParts.length - 1].split('.');
    if (nameParts.length === 1) {
      suffix = `-${nameParts[0]}`;
    } else {
      suffix = `-${nameParts.slice(0, nameParts.length - 1).join('-')}`;
    }
  }
  return `${kind}${suffix}-generated-uid-${index}`;
}

export function stashPlaceholder(value: string) {
  return { id: value, name: value };
}

/**
 * Return true if object:
 *   - has 2 keys and only 2 keys: id and name
 *   - the values for id and name are the same
 *
 * Also allows nameParsed on object if it matches the parsed object from id/name.
 */
export function isStashPlaceholder(object: {
  id?: string;
  name?: string;
  nameParsed?: { literal?: string };
}) {
  if (!object.name || !object.id || object.name !== object.id) return false;
  const nKeys = Object.keys(object).length;
  if (nKeys === 2) return true;
  return nKeys === 3 && object.nameParsed?.literal === object.id;
}

/**
 * Update stash of authors/affiliations based on input value
 *
 * Input may be:
 *   - string name
 *   - string id
 *   - object without id
 *   - object with id
 *
 * This function will normalize all of the above to an id and if a corresponding
 * object does not yet exist in the stash, it will be added. The id is returned.
 *
 * This function will warn if two objects are explicitly defined with the same id.
 */
export function validateAndStashObject<T extends { id?: string; name?: string }>(
  input: any,
  stash: ReferenceStash,
  kind: 'affiliations' | 'contributors',
  validateFn: (v: any, o: ValidationOptions) => T | undefined,
  opts: ValidationOptions,
) {
  const lookup: Record<string, WithId<T>> = {};
  const lookupNorm2Id: Record<string, string> = {};
  stash[kind]?.forEach((item) => {
    if (item.id) {
      lookup[item.id] = item as WithId<T>;
      lookupNorm2Id[normalizeJsonToString({ ...item, id: undefined })] = item.id;
    }
  });
  stash[`${kind}Opts`] ??= {};
  const optsLookup = stash[`${kind}Opts`] as Record<string, Options<T>>;
  if (typeof input === 'string' && Object.keys(lookup).includes(input)) {
    // Handle case where input is id and object already exists
    return input;
  }
  // Suppress warnings that may occur if input is an id - these may be raised again later
  const value = validateFn(input, { ...opts, suppressWarnings: typeof input === 'string' });
  if (!value) return;
  // Only warn on duplicate if the new object is not a placeholder
  let warnOnDuplicate = !isStashPlaceholder(value);
  if (!value.id) {
    if (lookupNorm2Id[normalizeJsonToString(value)]) {
      // If object is defined without an id but already exists in the stash, use the existing id
      value.id = lookupNorm2Id[normalizeJsonToString(value)];
      // Do not warn on duplicates for these; any duplicates here are identical
      warnOnDuplicate = false;
    } else {
      // If object is defined without an id and does not exist in the stash, generate a new id
      value.id = pseudoUniqueId(kind, stash[kind]?.length ?? 0, opts.file);
    }
  }
  if (!Object.keys(lookup).includes(value.id)) {
    // Handle case of new id - add stash value
    lookup[value.id] = value as WithId<T>;
    optsLookup[value.id] = { id: value.id, opts, validateFn };
  } else if (isStashPlaceholder(lookup[value.id])) {
    // Handle case of existing placeholder { id: value, name: value } - replace stash value
    lookup[value.id] = value as WithId<T>;
    optsLookup[value.id] = { id: value.id, opts, validateFn };
  } else if (warnOnDuplicate) {
    // Warn on duplicate id - lose new object
    validationWarning(`duplicate id for ${kind} found in frontmatter: ${value.id}`, opts);
  }
  stash[kind] = Object.values(lookup);
  return value.id;
}

/**
 * Finalize and simplify stash content
 *
 * This also raises any warnings that were suppressed during
 * validateAndStashObject. These may occur when a stashed placeholder
 * is not replaced by another object.
 */
export function finalizeStash(stash: ReferenceStash): {
  affiliations?: (Affiliation & { id: string })[];
  contributors?: (Contributor & { id: string })[];
  authorIds?: string[];
} {
  return {
    affiliations: stash.affiliations?.map((aff) => {
      if (isStashPlaceholder(aff)) {
        const { opts, validateFn } = stash.affiliationsOpts?.[aff.id] ?? {};
        if (opts && validateFn) validateFn(aff, { ...opts, suppressErrors: true });
      }
      return aff;
    }),
    contributors: stash.contributors?.map((contrib) => {
      if (isStashPlaceholder(contrib)) {
        const { opts, validateFn } = stash.contributorsOpts?.[contrib.id] ?? {};
        if (opts && validateFn) validateFn(contrib, { ...opts, suppressErrors: true });
      }
      return contrib;
    }),
    authorIds: stash.authorIds,
  };
}
