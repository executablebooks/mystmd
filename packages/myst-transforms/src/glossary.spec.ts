import { describe, expect, test, beforeEach } from 'vitest';
import { glossaryTransform } from './glossary';
import { VFile } from 'vfile';

let vfile: VFile;

beforeEach(() => {
  vfile = new VFile();
});

describe('Test glossary upgrade', () => {
  test('tree with legacy glossary can upgrade', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'glossary',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'term\ndefinition',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'inlineMath',
                  value: 'x = y + 2',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'other-term\nother-definition',
                },
              ],
            },
          ],
        },
      ],
    };
    glossaryTransform(mdast, vfile, { upgradeLegacySyntax: true });
    expect(mdast).toEqual({
      type: 'root',
      children: [
        {
          type: 'glossary',
          children: [
            {
              type: 'definitionList',
              children: [
                {
                  type: 'definitionTerm',
                  children: [
                    {
                      type: 'text',
                      value: 'term',
                    },
                  ],
                  label: 'term',
                  identifier: 'term-term',
                  html_id: 'term-term',
                },
                {
                  type: 'definitionDescription',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'definition',
                        },
                      ],
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'inlineMath',
                          value: 'x = y + 2',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'definitionTerm',
                  children: [
                    {
                      type: 'text',
                      value: 'other-term',
                    },
                  ],
                  label: 'other-term',
                  identifier: 'term-other-term',
                  html_id: 'term-other-term',
                },
                {
                  type: 'definitionDescription',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'other-definition',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
