import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateEmail,
  validateNumber,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationWarning,
} from 'simple-validators';
import { stashPlaceholder } from '../utils/referenceStash.js';
import { validateDoi } from '../utils/validators.js';
import type { Affiliation } from './types.js';

const AFFILIATION_KEYS = [
  'id',
  'address',
  'city',
  'state',
  'postal_code',
  'country',
  'name',
  'department',
  'collaboration',
  'isni',
  'ringgold',
  'ror',
  'doi',
  'url',
  'email',
  'phone',
  'fax',
];

const AFFILIATION_ALIASES = {
  ref: 'id', // Used in QMD to reference an affiliation
  region: 'state',
  province: 'state',
  zipcode: 'postal_code',
  zip_code: 'postal_code',
  website: 'url',
  institution: 'name',
};

/**
 * Validate Affiliation object against the schema
 */
export function validateAffiliation(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = stashPlaceholder(input);
  }
  const value = validateObjectKeys(
    input,
    { optional: AFFILIATION_KEYS, alias: AFFILIATION_ALIASES },
    opts,
  );
  if (value === undefined) return undefined;
  // If affiliation only has an id, give it a matching name; this is equivalent to the case
  // where a simple string is provided as an affiliation.
  if (Object.keys(value).length === 1 && value.id) {
    value.name = value.id;
  }
  const output: Affiliation = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.name)) {
    output.name = validateString(value.name, incrementOptions('name', opts));
  } else {
    validationWarning('affiliation should include name/institution', opts);
  }
  if (defined(value.department)) {
    output.department = validateString(value.department, incrementOptions('department', opts));
  }
  if (defined(value.address)) {
    output.address = validateString(value.address, incrementOptions('address', opts));
  }
  if (defined(value.city)) {
    output.city = validateString(value.city, incrementOptions('city', opts));
  }
  if (defined(value.state)) {
    output.state = validateString(value.state, incrementOptions('state', opts));
  }
  if (defined(value.postal_code)) {
    output.postal_code = validateString(value.postal_code, {
      coerceNumber: true,
      ...incrementOptions('postal_code', opts),
    });
  }
  if (defined(value.country)) {
    output.country = validateString(value.country, incrementOptions('country', opts));
  }
  // Both ISNI and ROR validation should occur similar to orcid (maybe in that same lib?)
  if (defined(value.isni)) {
    output.isni = validateString(value.isni, incrementOptions('isni', opts));
  }
  if (defined(value.ror)) {
    output.ror = validateString(value.ror, incrementOptions('ror', opts));
  }
  if (defined(value.ringgold)) {
    output.ringgold = validateNumber(value.ringgold, {
      min: 1000,
      max: 999999,
      ...incrementOptions('ringgold', opts),
    });
  }
  if (defined(value.doi)) {
    output.doi = validateDoi(value.doi, incrementOptions('doi', opts));
  }
  if (defined(value.collaboration)) {
    output.collaboration = validateBoolean(
      value.collaboration,
      incrementOptions('collaboration', opts),
    );
  }
  if (defined(value.email)) {
    output.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.url)) {
    output.url = validateUrl(value.url, incrementOptions('url', opts));
  }
  if (defined(value.phone)) {
    output.phone = validateString(value.phone, incrementOptions('phone', opts));
  }
  if (defined(value.fax)) {
    output.fax = validateString(value.fax, incrementOptions('fax', opts));
  }
  return output;
}
