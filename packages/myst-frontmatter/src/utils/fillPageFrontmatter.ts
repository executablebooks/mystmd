import type { ValidationOptions } from 'simple-validators';
import { fillMissingKeys, incrementOptions, validationWarning } from 'simple-validators';
import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import { fillNumbering } from '../numbering/validators.js';
import { USE_PROJECT_FALLBACK } from '../page/validators.js';
import type { PageFrontmatter } from '../page/types.js';
import type { ProjectFrontmatter } from '../project/types.js';
import { normalizeJsonToString } from './normalizeString.js';
import { isStashPlaceholder, stashPlaceholder } from './referenceStash.js';

/**
 * Fill missing values from page frontmatter object with values from project frontmatter
 *
 * This only applies to frontmatter values where overriding is the correct behavior.
 * For example, if page has no 'title' the project 'title' is not filled in.
 */
export function fillPageFrontmatter(
  pageFrontmatter: PageFrontmatter,
  projectFrontmatter: ProjectFrontmatter,
  opts: ValidationOptions,
) {
  const frontmatter = fillMissingKeys(pageFrontmatter, projectFrontmatter, USE_PROJECT_FALLBACK);

  if (pageFrontmatter.numbering || projectFrontmatter.numbering) {
    frontmatter.numbering = fillNumbering(pageFrontmatter.numbering, projectFrontmatter.numbering);
  }

  // Combine all math macros defined on page and project
  if (projectFrontmatter.math || pageFrontmatter.math) {
    frontmatter.math = { ...(projectFrontmatter.math ?? {}), ...(pageFrontmatter.math ?? {}) };
  }

  // Combine all abbreviation defined on page and project
  if (projectFrontmatter.abbreviations || pageFrontmatter.abbreviations) {
    frontmatter.abbreviations = {
      ...(projectFrontmatter.abbreviations ?? {}),
      ...(pageFrontmatter.abbreviations ?? {}),
    };
  }

  // Combine all options defined on page and project
  if (projectFrontmatter.options || pageFrontmatter.options) {
    frontmatter.options = {
      ...(projectFrontmatter.options ?? {}),
      ...(pageFrontmatter.options ?? {}),
    };
  }

  // Combine all settings defined on page and project
  if (projectFrontmatter.settings || pageFrontmatter.settings) {
    frontmatter.settings = {
      ...(projectFrontmatter.settings ?? {}),
      ...(pageFrontmatter.settings ?? {}),
    };
  }

  // Gather all contributor and affiliation ids from funding sources
  const contributorIds: Set<string> = new Set();
  const affiliationIds: Set<string> = new Set();
  frontmatter.funding?.forEach((fund) => {
    fund.awards?.forEach((award) => {
      award.investigators?.forEach((inv) => {
        contributorIds.add(inv);
      });
      award.recipients?.forEach((rec) => {
        contributorIds.add(rec);
      });
      award.sources?.forEach((aff) => {
        affiliationIds.add(aff);
      });
    });
  });

  // Gather all contributor ids from reviewers and editors
  frontmatter.reviewers?.forEach((reviewer) => {
    contributorIds.add(reviewer);
  });
  frontmatter.editors?.forEach((editor) => {
    contributorIds.add(editor);
  });

  if (frontmatter.authors?.length || contributorIds.size) {
    // Gather all people from page/project authors/contributors
    const people = [
      ...(pageFrontmatter.authors ?? []),
      ...(projectFrontmatter.authors ?? []),
      ...(pageFrontmatter.contributors ?? []),
      ...(projectFrontmatter.contributors ?? []),
    ];
    const peopleLookup: Record<string, Contributor> = {};
    people.forEach((auth) => {
      if (!auth.id || isStashPlaceholder(auth)) return;
      if (!peopleLookup[auth.id]) {
        peopleLookup[auth.id] = auth;
      } else if (normalizeJsonToString(auth) !== normalizeJsonToString(peopleLookup[auth.id])) {
        validationWarning(
          `Duplicate contributor id within project: ${auth.id}`,
          incrementOptions('authors', opts),
        );
      }
    });
    if (frontmatter.authors?.length) {
      frontmatter.authors = frontmatter.authors.map((auth) => {
        if (!auth.id) return auth;
        // If contributors are in final author list, do not add to contributor list
        contributorIds.delete(auth.id);
        return peopleLookup[auth.id] ?? stashPlaceholder(auth.id);
      });
    }
    if (contributorIds.size) {
      frontmatter.contributors = [...contributorIds].map((id) => {
        return peopleLookup[id] ?? stashPlaceholder(id);
      });
    }
  }

  // Add affiliations from reconstructed author/contributor lists and explicit page affiliations
  [...(frontmatter.authors ?? []), ...(frontmatter.contributors ?? [])].forEach((auth) => {
    auth.affiliations?.forEach((aff) => {
      affiliationIds.add(aff);
    });
  });
  frontmatter.affiliations?.forEach((aff) => {
    if (aff.id) affiliationIds.add(aff.id);
  });

  if (affiliationIds.size) {
    const affiliations = [
      ...(pageFrontmatter.affiliations ?? []),
      ...(projectFrontmatter.affiliations ?? []),
    ];
    const affiliationLookup: Record<string, Affiliation> = {};
    affiliations.forEach((aff) => {
      if (!aff.id || isStashPlaceholder(aff)) return;
      if (!affiliationLookup[aff.id]) {
        affiliationLookup[aff.id] = aff;
      } else if (normalizeJsonToString(aff) !== normalizeJsonToString(affiliationLookup[aff.id])) {
        validationWarning(
          `Duplicate affiliation id within project: ${aff.id}`,
          incrementOptions('affiliations', opts),
        );
      }
    });
    frontmatter.affiliations = [...affiliationIds].map((id) => {
      return affiliationLookup[id] ?? stashPlaceholder(id);
    });
  }

  return frontmatter;
}
