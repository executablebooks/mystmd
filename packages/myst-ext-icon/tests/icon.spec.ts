import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { iconRole } from '../src';
import { selectAll } from 'unist-util-select';

function deletePositions(tree: any) {
  selectAll('*', tree).forEach((n) => {
    delete n.position;
  });
  return tree;
}

describe('icon role', () => {
  it('icon role parses', async () => {
    const content = '{fab}`github`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'mystRole',
              name: 'fab',
              value: 'github',
              children: [
                {
                  type: 'icon',
                  kind: 'fab',
                  name: 'github',
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      roles: [iconRole],
    });
    expect(deletePositions(output)).toEqual(expected);
  });
});
