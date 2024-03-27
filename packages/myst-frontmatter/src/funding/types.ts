export type Award = {
  id?: string;
  name?: string;
  description?: string;
  /**
   * Sources are affiliation ids.
   * If an object is provided for this field, it will be moved to affiliations
   * and replaced with id reference.
   */
  sources?: string[]; // These are affiliation ids
  /**
   * Recipients and investigators are author/contributor ids.
   * If an object is provided for these fields, it will be moved to contributors
   * and replaced with id reference.
   */
  recipients?: string[];
  investigators?: string[];
};

export type Funding = {
  statement?: string;
  /** Open access statement */
  open_access?: string;
  awards?: Award[];
};
