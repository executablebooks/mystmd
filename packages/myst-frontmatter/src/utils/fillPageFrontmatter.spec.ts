import { describe, expect, it, beforeEach } from 'vitest';
import type { ValidationOptions } from 'simple-validators';
import { fillPageFrontmatter } from './fillPageFrontmatter';
import type { PageFrontmatter } from '../page/types';
import type { ProjectFrontmatter } from '../project/types';

const TEST_PAGE_FRONTMATTER: PageFrontmatter = {
  title: 'frontmatter',
  description: 'page frontmatter',
  venue: { title: 'test' },
  authors: [
    {
      id: 'jd',
      name: 'Jane Doe',
      nameParsed: { literal: 'Jane Doe', given: 'Jane', family: 'Doe' },
      affiliations: ['univb'],
    },
  ],
  affiliations: [{ id: 'univb', name: 'University B' }],
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  math: { a: 'b' },
  subtitle: 'sub',
  short_title: 'short',
  date: '14 Dec 2021',
  kernelspec: {},
  jupytext: {},
  keywords: ['example', 'test'],
  exports: [{ format: 'pdf' as any, template: 'default', output: 'out.tex', a: 1 }],
};

const TEST_PROJECT_FRONTMATTER: ProjectFrontmatter = {
  title: 'frontmatter',
  description: 'project frontmatter',
  venue: { title: 'test' },
  authors: [
    {
      id: 'jd',
      name: 'John Doe',
      nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
      affiliations: ['univa'],
    },
  ],
  affiliations: [{ id: 'univa', name: 'University A' }],
  date: '14 Dec 2021',
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  math: { a: 'b' },
  keywords: ['example', 'test'],
  exports: [
    {
      format: 'pdf' as any,
      template: 'default',
      output: 'out.tex',
      a: 1,
      article: 'my-file.md',
    },
    {
      format: 'xml' as any,
      article: 'my-file.md',
      sub_articles: ['my-notebook.ipynb'],
    },
  ],
  requirements: ['requirements.txt'],
  resources: ['my-script.sh'],
};

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

describe('fillPageFrontmatter', () => {
  it('empty frontmatters return empty', async () => {
    expect(fillPageFrontmatter({}, {}, opts)).toEqual({});
  });
  it('page frontmatter returns self', async () => {
    expect(fillPageFrontmatter(TEST_PAGE_FRONTMATTER, {}, opts)).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('project frontmatter returns self without title/description/name/etc', async () => {
    const result = { ...TEST_PROJECT_FRONTMATTER };
    delete result.title;
    delete result.description;
    delete result.name;
    delete result.oxa;
    delete result.exports;
    delete result.requirements;
    delete result.resources;
    expect(fillPageFrontmatter({}, TEST_PROJECT_FRONTMATTER, opts)).toEqual(result);
  });
  it('page and project math are combined', async () => {
    expect(
      fillPageFrontmatter({ math: { a: 'macro a' } }, { math: { b: 'macro b' } }, opts),
    ).toEqual({
      math: { a: 'macro a', b: 'macro b' },
    });
  });
  it('page and project numbering are combined', async () => {
    expect(
      fillPageFrontmatter(
        {
          numbering: {
            enumerator: { template: '#' },
            heading_5: { enabled: true },
            heading_6: { enabled: true },
          },
        },
        {
          numbering: {
            enumerator: { template: '$' },
            heading_1: { enabled: true },
            heading_6: { enabled: false },
          },
        },
        opts,
      ),
    ).toEqual({
      numbering: {
        enumerator: { template: '#' },
        heading_1: { enabled: true },
        heading_5: { enabled: true },
        heading_6: { enabled: true },
      },
    });
  });
  it('extra project affiliations are not included', async () => {
    expect(
      fillPageFrontmatter(
        { authors: [], affiliations: [{ name: 'University A', id: 'univa' }] },
        { authors: [], affiliations: [{ name: 'University B', id: 'univb' }] },
        opts,
      ),
    ).toEqual({
      authors: [],
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('extra page affiliations are not included', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        { authors: [], affiliations: [{ name: 'University B', id: 'univb' }] },
        opts,
      ),
    ).toEqual({
      authors: [],
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('page and project duplicate affiliation ids warn', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        { affiliations: [{ name: 'University B', id: 'univa' }] },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('placeholder ids replace correctly from page', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'univa', id: 'univa' }] },
        {
          affiliations: [
            { name: 'University A', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('placeholder ids replace correctly from project', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        {
          affiliations: [
            { name: 'univa', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('duplicate affiliations do not warn if identical', async () => {
    expect(
      fillPageFrontmatter(
        { affiliations: [{ name: 'University A', id: 'univa' }] },
        {
          affiliations: [
            { name: 'University A', id: 'univa' },
            { name: 'University B', id: 'univb' },
          ],
        },
        opts,
      ),
    ).toEqual({
      affiliations: [{ name: 'University A', id: 'univa' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('authors from page take precedent over project', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('project authors are used if no page authors', async () => {
    expect(
      fillPageFrontmatter(
        {},
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors from project are persisted', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors and contributors from project are persisted in place', async () => {
    expect(
      fillPageFrontmatter(
        {},
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
            },
          ],
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
            },
          ],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn', 'jd'],
                },
              ],
            },
          ],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
        },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn', 'jd'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors from project are persisted when referenced in page', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('irrelevant contributors from project are dropped', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
        },
        {
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      affiliations: [{ id: 'univa', name: 'University A' }],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant contributors from project are persisted when referenced in page funding', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          funding: [
            {
              awards: [
                {
                  investigators: ['jn'],
                },
              ],
            },
          ],
        },
        {
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
      funding: [
        {
          awards: [
            {
              investigators: ['jn'],
            },
          ],
        },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant contributors from project are persisted when referenced in page reviewers', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          reviewers: ['jn'],
        },
        {
          contributors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      reviewers: ['jn'],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('relevant authors from project are persisted when referenced in page editors', async () => {
    expect(
      fillPageFrontmatter(
        {
          authors: [
            {
              id: 'jd',
              name: 'John Doe',
              nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
              affiliations: ['univa'],
            },
          ],
          affiliations: [{ id: 'univa', name: 'University A' }],
          editors: ['jn'],
        },
        {
          authors: [
            {
              id: 'jn',
              name: 'Just A. Name',
              nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
              affiliations: ['univb'],
            },
          ],
          affiliations: [{ id: 'univb', name: 'University B' }],
        },
        opts,
      ),
    ).toEqual({
      authors: [
        {
          id: 'jd',
          name: 'John Doe',
          nameParsed: { literal: 'John Doe', given: 'John', family: 'Doe' },
          affiliations: ['univa'],
        },
      ],
      editors: ['jn'],
      contributors: [
        {
          id: 'jn',
          name: 'Just A. Name',
          nameParsed: { literal: 'Just A. Name', given: 'Just A.', family: 'Name' },
          affiliations: ['univb'],
        },
      ],
      affiliations: [
        { id: 'univa', name: 'University A' },
        { id: 'univb', name: 'University B' },
      ],
    });
    expect(opts.messages.warnings?.length).toBeFalsy();
  });
  it('project options fill page', async () => {
    expect(fillPageFrontmatter({}, { options: { a: 'b' } }, opts)).toEqual({ options: { a: 'b' } });
  });
  it('page options persist', async () => {
    expect(fillPageFrontmatter({ options: { a: 'b' } }, {}, opts)).toEqual({ options: { a: 'b' } });
  });
  it('project and page options combine', async () => {
    expect(fillPageFrontmatter({ options: { a: 'b' } }, { options: { c: 'd' } }, opts)).toEqual({
      options: { a: 'b', c: 'd' },
    });
  });
  it('page options override project options', async () => {
    expect(fillPageFrontmatter({ options: { a: 'b' } }, { options: { a: 'z' } }, opts)).toEqual({
      options: { a: 'b' },
    });
  });
});
