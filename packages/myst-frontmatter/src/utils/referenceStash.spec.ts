import { describe, expect, it, beforeEach } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import { validateContributor } from '../contributors/validators';
import { isStashPlaceholder, validateAndStashObject } from './referenceStash';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('validateAndStashObject', () => {
  it('string creates object and returns itself', async () => {
    const stash = {};
    const out = validateAndStashObject(
      'Just A. Name',
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('Just A. Name');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'Just A. Name',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('string returns itself when in stash', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      'auth1',
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('no id creates hashed id', async () => {
    const stash = {};
    const out = validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder/test.file.yml' },
    );
    expect(out).toEqual('contributors-test-file-generated-uid-0');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'contributors-test-file-generated-uid-0',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('no id does not warn on duplicate', async () => {
    const stash = {};
    validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder\\my_file' },
    );
    const out = validateAndStashObject(
      { name: 'Just A. Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      { ...opts, file: 'folder\\my_file' },
    );
    expect(out).toEqual('contributors-my_file-generated-uid-0');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'contributors-my_file-generated-uid-0',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id added to stash', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      { id: 'auth2', name: 'A. Nother Name' },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth2');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
        {
          id: 'auth2',
          name: 'A. Nother Name',
          nameParsed: { literal: 'A. Nother Name', given: 'A. Nother', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id replaces simple object', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'auth1',
        },
      ],
    };
    const out = validateAndStashObject(
      {
        id: 'auth1',
        name: 'Just A. Name',
      },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('object with id warns on duplicate', async () => {
    const stash = {
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    };
    const out = validateAndStashObject(
      {
        id: 'auth1',
        name: 'A. Nother Name',
      },
      stash,
      'contributors',
      (v: any, o: ValidationOptions) => validateContributor(v, stash, o),
      opts,
    );
    expect(out).toEqual('auth1');
    expect(stash).toEqual({
      contributors: [
        {
          id: 'auth1',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});

describe('isStashPlaceholder', () => {
  it.each([
    [{}, false],
    [{ name: 'name' }, false],
    [{ id: 'name' }, false],
    [{ name: 'name', id: 'name' }, true],
    [{ name: 'name', id: 'id' }, false],
    [{ name: 'name', id: 'name', extra: 'name' }, false],
    [{ name: 'name', nameParsed: { literal: 'name', family: 'name' } }, false],
    [{ id: 'name', nameParsed: { literal: 'name', family: 'name' } }, false],
    [{ name: 'name', id: 'name', nameParsed: { literal: 'name' } }, true],
    [{ name: 'name', id: 'name', nameParsed: { literal: 'name', family: 'name' } }, true],
    [{ name: 'name', id: 'name', nameParsed: { family: 'name' } }, false],
    [
      { name: 'name', id: 'name', nameParsed: { literal: 'name', family: 'name' }, extra: 'name' },
      false,
    ],
  ])(`%s - %s`, async (input, result) => {
    expect(isStashPlaceholder(input as any)).toBe(result);
  });
});
