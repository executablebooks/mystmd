import type { Affiliation } from '../affiliations/types.js';
import type { Contributor } from '../contributors/types.js';
import type { Funding } from '../funding/types.js';
import type { Venue } from '../venues/types.js';

export type SiteFrontmatter = {
  title?: string;
  description?: string;
  subtitle?: string;
  short_title?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  authors?: Contributor[];

  /**
   * Reviewers and editors are author/contributor ids.
   * If an object is provided for these fields, it will be moved to contributors
   * and replaced with id reference.
   */
  reviewers?: string[];
  editors?: string[];
  affiliations?: Affiliation[];
  venue?: Venue;
  github?: string;
  keywords?: string[];
  funding?: Funding[];
  copyright?: string;
  contributors?: Contributor[];
  options?: Record<string, any>;
};
