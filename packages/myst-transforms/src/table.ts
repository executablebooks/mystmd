import type { GenericNode, GenericParent } from 'myst-common';
import { fileError, liftChildren } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import assert from 'node:assert';

export type Options = {
  parseContent: (filename: string, content: string) => Promise<GenericNode[]> | GenericNode[];
};

type CSVTable = {
  type: 'csv-table';
  records: string[][];
  headerCount: number;
  identifier: string;
  label?: string;
  class?: string;
  align?: string;
  children: GenericNode[];
};

/**
 * This is the {csv-table} directive.
 *
 * RST documentation:
 *  - https://docutils.sourceforge.io/docs/ref/rst/directives.html#csv-table-1
 */
export async function csvTableDirectiveTransform(tree: GenericParent, vfile: VFile, opts: Options) {
  const csvNodes = selectAll('csv-table', tree) as CSVTable[];
  if (csvNodes.length === 0) return;
  await Promise.all(
    csvNodes.map(async (node) => {
      const rawTable = await Promise.all(
        node.records.map((record, recordIndex) =>
          Promise.all(
            record.map((cell, cellIndex) =>
              opts.parseContent(`${node.identifier}-${recordIndex}-${cellIndex}`, cell),
            ),
          ),
        ),
      );
      const children = rawTable.map((rawCells) => {
          // Parsing produes multiple nodes
          const row = {
            type: 'tableRow',
            children: rawCells.map((rawCell) => {
	      assert((rawCell.length === 1 && rawCell[0].type === 'paragraph'));
	      const cell = {
                type: 'tableCell',
                header: headerCount > 0 ? true : undefined,
                children: rawCell[0].children,
              };
              return cell;
            }),
          };
          headerCount -= 1;
          return row;
        });

      let headerCount = node.headerCount;
      const table = {
        type: 'table',
        align: node.align,
        children: children
      };
      const container = {
        type: 'container',
        kind: 'table',
        identifier: node.identifier,
        label: node.label,
        class: node.class,
        children: [...node.children, table],
      };
      (node as GenericNode).type = '__lift__';
      (node as GenericNode).children = [container];
    }),
  );
  liftChildren(tree, '__lift__');
}

export const csvTableDirectivePlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await csvTableDirectiveTransform(tree as GenericParent, file, opts);
  };
