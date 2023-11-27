import { describe, expect, test } from 'vitest';
import { sectionTransform } from './sections';

describe('sectionTransform', () => {
  test('section title becomes heading with depth', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'sec',
          children: [
            {
              type: 'title',
              children: [
                {
                  type: 'text',
                  value: 'My Title',
                },
              ],
            },
            {
              type: 'text',
              value: 'My content',
            },
          ],
        },
      ],
    };
    const result = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'My Title',
                },
              ],
            },
            {
              type: 'text',
              value: 'My content',
            },
          ],
        },
      ],
    };
    sectionTransform(tree);
    expect(tree).toEqual(result);
  });
  test('section without title remains', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'sec',
          children: [
            {
              type: 'text',
              value: 'My content',
            },
          ],
        },
      ],
    };
    const result = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'text',
              value: 'My content',
            },
          ],
        },
      ],
    };
    sectionTransform(tree);
    expect(tree).toEqual(result);
  });
  test('nested sections flatten', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'sec',
          children: [
            {
              type: 'title',
              children: [
                {
                  type: 'text',
                  value: 'My Title',
                },
              ],
            },
            {
              type: 'text',
              value: 'My content',
            },
            {
              type: 'sec',
              children: [
                {
                  type: 'title',
                  children: [
                    {
                      type: 'text',
                      value: 'My Subitle',
                    },
                  ],
                },
                {
                  type: 'sec',
                  children: [
                    {
                      type: 'title',
                      children: [
                        {
                          type: 'text',
                          value: 'Another title',
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
    };
    const result = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'My Title',
                },
              ],
            },
            {
              type: 'text',
              value: 'My content',
            },

            {
              type: 'heading',
              depth: 2,
              children: [
                {
                  type: 'text',
                  value: 'My Subitle',
                },
              ],
            },
            {
              type: 'heading',
              depth: 3,
              children: [
                {
                  type: 'text',
                  value: 'Another title',
                },
              ],
            },
          ],
        },
      ],
    };
    sectionTransform(tree);
    expect(tree).toEqual(result);
  });
});
