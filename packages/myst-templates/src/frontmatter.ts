import type { Affiliation, Contributor, PageFrontmatter } from 'myst-frontmatter';
import type { RendererAuthor, RendererDoc, ValueAndIndex } from './types.js';

const ALPHA = 'ABCDEFGHIJKLMNOPQURSUVWXYZ';

function indexAndLetter(index: number) {
  const value = ALPHA[index % ALPHA.length];
  const multiplier = Math.ceil((index + 1) / ALPHA.length);
  return { index: index + 1, letter: value.repeat(multiplier) };
}
function undefinedIfEmpty<T>(array?: T[]): T[] | undefined {
  // Explicitly return undefined
  if (!array || array.length === 0) return undefined;
  return array;
}

function addIndicesToAuthors(
  authors: Contributor[],
  affiliationList: RendererDoc['affiliations'],
  collaborationList: RendererDoc['collaborations'],
): RendererAuthor[] {
  const affiliationLookup: Record<string, ValueAndIndex> = {};
  affiliationList.forEach((affil) => {
    affiliationLookup[affil.value.id] = affil;
  });
  const collaborationLookup: Record<string, ValueAndIndex> = {};
  collaborationList.forEach((col) => {
    collaborationLookup[col.value.id] = col;
  });
  let correspondingIndex = 0;
  return authors.map((auth, index) => {
    let corresponding: ValueAndIndex | undefined;
    if (auth.corresponding) {
      corresponding = {
        value: auth.corresponding,
        ...indexAndLetter(correspondingIndex),
      };
      correspondingIndex += 1;
    }
    let affiliations = auth.affiliations
      ?.filter((value) => Object.keys(affiliationLookup).includes(value))
      .map((value) => {
        return { ...affiliationLookup[value] };
      });
    if (!affiliations || affiliations.length === 0) {
      // Affiliations are explicitly undefined if length === 0
      affiliations = undefined;
    }
    let collaborations = auth.affiliations
      ?.filter((value) => Object.keys(collaborationLookup).includes(value))
      .map((value) => {
        return { ...collaborationLookup[value] };
      });
    if (!collaborations || collaborations.length === 0) {
      // Affiliations are explicitly undefined if length === 0
      collaborations = undefined;
    }
    const [givenName, ...surnameParts] = auth.name?.split(' ') || ['', ''];
    const surname = surnameParts.join(' ');
    return {
      ...auth,
      ...indexAndLetter(index),
      corresponding,
      affiliations,
      collaborations,
      given_name: givenName,
      surname,
    };
  });
}

export function extendFrontmatter(frontmatter: PageFrontmatter): RendererDoc {
  const datetime = frontmatter.date ? new Date(frontmatter.date) : new Date();
  // Only add affiliations from authors, not contributors
  const affIds = [
    ...new Set(frontmatter.authors?.map((auth) => auth.affiliations ?? []).flat() ?? []),
  ];
  const affiliations = affIds
    .map((id) => frontmatter.affiliations?.find((aff) => aff.id === id))
    .filter((aff): aff is Affiliation => !!aff?.id && !aff.collaboration)
    .map((aff, index) => {
      return { ...aff, value: aff, ...indexAndLetter(index) };
    });
  const collaborations = affIds
    .map((id) => frontmatter.affiliations?.find((aff) => aff.id === id))
    .filter((aff): aff is Affiliation => !!aff?.id && !!aff.collaboration)
    .map((aff, index) => {
      return { ...aff, value: aff, ...indexAndLetter(index) };
    });
  const bibtex =
    frontmatter.bibliography?.length === 1 && frontmatter.bibliography[0].endsWith('.bib')
      ? frontmatter.bibliography[0]
      : undefined;
  const doc: RendererDoc = {
    ...frontmatter,
    date: {
      day: String(datetime.getDate()),
      month: String(datetime.getMonth() + 1),
      year: String(datetime.getFullYear()),
    },
    authors: addIndicesToAuthors(frontmatter.authors || [], affiliations, collaborations),
    affiliations,
    collaborations,
    bibliography: undefinedIfEmpty(frontmatter.bibliography),
    bibtex,
  };
  return doc;
}
