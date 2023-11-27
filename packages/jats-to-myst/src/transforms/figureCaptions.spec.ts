import { describe, expect, test } from 'vitest';
import { figCaptionTitleTransform } from './figureCaptions';

describe('figCaptionTitleTransform', () => {
  test('figure caption title is moved up', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'fig',
          children: [
            {
              type: 'caption',
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
        },
      ],
    };
    const result = {
      type: 'root',
      children: [
        {
          type: 'fig',
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
              type: 'caption',
              children: [
                {
                  type: 'text',
                  value: 'My content',
                },
              ],
            },
          ],
        },
      ],
    };
    figCaptionTitleTransform(tree);
    expect(tree).toEqual(result);
  });
});
