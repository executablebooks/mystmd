import { credit } from 'credit-roles';
import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateBoolean,
  validateEmail,
  validateList,
  validateObjectKeys,
  validateString,
  validateUrl,
  validationError,
  validationWarning,
} from 'simple-validators';
import { orcid } from 'orcid';
import { validateAffiliation } from '../affiliations/validators.js';
import type { ReferenceStash } from '../utils/referenceStash.js';
import {
  isStashPlaceholder,
  stashPlaceholder,
  validateAndStashObject,
} from '../utils/referenceStash.js';
import type { Contributor, Name } from './types.js';
import { formatName, parseName } from '../utils/parseName.js';

const CONTRIBUTOR_KEYS = [
  'id',
  'userId',
  'name',
  'nameParsed',
  'orcid',
  'corresponding',
  'equal_contributor',
  'deceased',
  'email',
  'roles',
  'affiliations',
  'collaborations',
  'twitter',
  'github',
  'url',
  'note',
  'phone',
  'fax',
];
const CONTRIBUTOR_ALIASES = {
  ref: 'id', // Used in QMD to reference a contributor
  role: 'roles',
  'equal-contributor': 'equal_contributor',
  affiliation: 'affiliations',
  website: 'url',
};

const NAME_KEYS = [
  'literal',
  'given',
  'family',
  'suffix',
  'non_dropping_particle',
  'dropping_particle',
];
const NAME_ALIASES = {
  surname: 'family',
  last: 'family',
  forename: 'given',
  first: 'given',
  particle: 'non_dropping_particle',
  'non-dropping-particle': 'non_dropping_particle',
  'dropping-particle': 'dropping_particle',
};

/**
 * Validate Name object against the schema
 */
export function validateName(input: any, opts: ValidationOptions) {
  let output: Name;
  if (typeof input === 'string') {
    output = parseName(input);
  } else {
    const value = validateObjectKeys(input, { optional: NAME_KEYS, alias: NAME_ALIASES }, opts);
    if (value === undefined) return undefined;
    output = {};
    if (defined(value.literal)) {
      output.literal = validateString(value.literal, incrementOptions('literal', opts));
    }
    if (defined(value.given)) {
      output.given = validateString(value.given, incrementOptions('given', opts));
    }
    if (defined(value.non_dropping_particle)) {
      output.non_dropping_particle = validateString(
        value.non_dropping_particle,
        incrementOptions('non_dropping_particle', opts),
      );
    }
    if (defined(value.dropping_particle)) {
      output.dropping_particle = validateString(
        value.dropping_particle,
        incrementOptions('dropping_particle', opts),
      );
    }
    if (defined(value.family)) {
      output.family = validateString(value.family, incrementOptions('family', opts));
    }
    if (defined(value.suffix)) {
      output.suffix = validateString(value.suffix, incrementOptions('suffix', opts));
    }
    if (Object.keys(output).length === 1 && output.literal) {
      output = { ...output, ...parseName(output.literal) };
    } else if (!output.literal) {
      output.literal = formatName(output);
    }
  }
  const warnOnComma = (part: string | undefined, o: ValidationOptions) => {
    if (part && part.includes(',')) {
      validationWarning(`unexpected comma in name part: ${part}`, o);
    }
  };
  warnOnComma(output.given, incrementOptions('given', opts));
  warnOnComma(output.family, incrementOptions('family', opts));
  warnOnComma(output.non_dropping_particle, incrementOptions('non_dropping_particle', opts));
  warnOnComma(output.dropping_particle, incrementOptions('dropping_particle', opts));
  warnOnComma(output.suffix, incrementOptions('suffix', opts));
  if (!output.family) {
    validationWarning(`No family name for name '${output.literal}'`, opts);
  }
  return output;
}

/**
 * Validate Contributor object against the schema
 */
export function validateContributor(input: any, stash: ReferenceStash, opts: ValidationOptions) {
  if (typeof input === 'string') {
    input = stashPlaceholder(input);
  }
  const value = validateObjectKeys(
    input,
    { optional: CONTRIBUTOR_KEYS, alias: CONTRIBUTOR_ALIASES },
    opts,
  );
  if (value === undefined) return undefined;
  // If contributor only has an id, give it a matching name; this is equivalent to the case
  // where a simple string is provided as a contributor.
  if (Object.keys(value).length === 1 && value.id) {
    value.name = value.id;
  }
  const output: Contributor = {};
  if (defined(value.id)) {
    output.id = validateString(value.id, incrementOptions('id', opts));
  }
  if (defined(value.userId)) {
    // TODO: Better userId validation - length? regex?
    output.userId = validateString(value.userId, incrementOptions('userId', opts));
  }
  if (defined(value.nameParsed)) {
    // In general, nameParsed should not be included in frontmatter;
    // authors should provide string or parsed for "name"
    output.nameParsed = validateName(value.nameParsed, incrementOptions('nameParsed', opts));
    output.name = value.name
      ? validateString(value.name, incrementOptions('name', opts))
      : output.nameParsed?.literal;
    if (output.name !== output.nameParsed?.literal) {
      validationWarning(`"name" and "parsedName.literal" should match`, opts);
    }
  } else if (defined(value.name)) {
    output.nameParsed = validateName(value.name, incrementOptions('name', opts));
    output.name = output.nameParsed?.literal;
  } else {
    validationWarning('contributor should include name', opts);
  }
  if (defined(value.orcid)) {
    const orcidOpts = incrementOptions('orcid', opts);
    const id = orcid.normalize(value.orcid);
    if (id) {
      output.orcid = id;
    } else {
      validationError(
        `ORCID "${value.orcid}" is not valid, try an ID of the form "0000-0000-0000-0000"`,
        orcidOpts,
      );
    }
  }
  if (defined(value.corresponding)) {
    const correspondingOpts = incrementOptions('corresponding', opts);
    output.corresponding = validateBoolean(value.corresponding, correspondingOpts);
    if (value.corresponding && !defined(value.email)) {
      validationError(`must include email for corresponding author`, correspondingOpts);
      output.corresponding = false;
    }
  }
  if (defined(value.equal_contributor)) {
    output.equal_contributor = validateBoolean(
      value.equal_contributor,
      incrementOptions('equal_contributor', opts),
    );
  }
  if (defined(value.deceased)) {
    output.deceased = validateBoolean(value.deceased, incrementOptions('deceased', opts));
  }
  if (defined(value.email)) {
    output.email = validateEmail(value.email, incrementOptions('email', opts));
  }
  if (defined(value.roles)) {
    const rolesOpts = incrementOptions('roles', opts);
    let roles = value.roles;
    if (typeof roles === 'string') {
      roles = roles.split(/[,;]/);
    }
    output.roles = validateList(roles, rolesOpts, (r) => {
      const roleString = validateString(r, rolesOpts);
      if (roleString === undefined) return undefined;
      const role = credit.normalize(roleString);
      if (!role) {
        validationWarning(
          `unknown value "${roleString}" - should be a CRediT role - see https://credit.niso.org/`,
          rolesOpts,
        );
        return roleString.trim();
      }
      return role;
    });
  }
  if (defined(value.collaborations)) {
    validationError(
      'collaborations must be defined in frontmatter as affiliations with "collaboration: true"',
      incrementOptions('collaborations', opts),
    );
  }
  if (defined(value.affiliations)) {
    const affiliationsOpts = incrementOptions('affiliations', opts);
    let affiliations = value.affiliations;
    if (typeof affiliations === 'string') {
      affiliations = affiliations.split(';').map((aff) => aff.trim());
    }
    if (!Array.isArray(affiliations)) {
      affiliations = [affiliations];
    }
    output.affiliations = validateList(affiliations, affiliationsOpts, (aff) => {
      return validateAndStashObject(
        aff,
        stash,
        'affiliations',
        validateAffiliation,
        affiliationsOpts,
      );
    });
  }
  if (defined(value.twitter)) {
    output.twitter = validateString(value.twitter, incrementOptions('twitter', opts));
  }
  if (defined(value.github)) {
    output.github = validateString(value.github, incrementOptions('github', opts));
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
  if (defined(value.note)) {
    output.note = validateString(value.note, incrementOptions('note', opts));
  }
  if (!isStashPlaceholder(output) && output.nameParsed && !output.nameParsed?.given) {
    validationWarning(`No given name for name '${output.nameParsed.literal}'`, opts);
  }
  return output;
}
