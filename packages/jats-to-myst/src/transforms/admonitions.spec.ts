import { VFile } from 'vfile';
import { describe, expect, test } from 'vitest';
import { admonitionTransform } from './admonitions';

describe('admonitionTransform', () => {
  test('caption title is moved to admonition title', () => {
    const vfile = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'boxed-text',
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
          type: 'boxed-text',
          children: [
            {
              type: 'admonitionTitle',
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
    admonitionTransform(tree, vfile);
    expect(tree).toEqual(result);
  });
  test('caption with no title is lost', () => {
    const vfile = new VFile();
    const tree = {
      type: 'root',
      children: [
        {
          type: 'boxed-text',
          children: [
            {
              type: 'caption',
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
          type: 'boxed-text',
          children: [
            {
              type: 'text',
              value: 'My content',
            },
          ],
        },
      ],
    };
    admonitionTransform(tree, vfile);
    expect(tree).toEqual(result);
  });
});
