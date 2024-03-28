import type { CreditRole } from 'credit-roles';
import type { Affiliation } from '../affiliations/types.js';

export type ContributorRole = CreditRole | string;

export type Name = {
  literal?: string;
  given?: string;
  family?: string;
  dropping_particle?: string;
  non_dropping_particle?: string;
  suffix?: string;
};

interface Person {
  id?: string;
  name?: string; // may be set to Name object
  userId?: string;
  orcid?: string;
  corresponding?: boolean;
  equal_contributor?: boolean;
  deceased?: boolean;
  email?: string;
  roles?: ContributorRole[];
  affiliations?: string[];
  twitter?: string;
  github?: string;
  url?: string;
  note?: string;
  phone?: string;
  fax?: string;
  // Computed property; only 'name' should be set in frontmatter as string or Name object
  nameParsed?: Name;
}

/**
 * Person or Collaboration contributor type
 *
 * After validation, objects of this type are better represented by:
 *
 * `Person | (Affiliation & { collaboration: true })`
 *
 * However, as all the fields are optional and the code must handle cases
 * where everything may be undefined anyway, it's simpler to have a more
 * permissive type.
 */
export type Contributor = Person & Affiliation;
