
import type { GenericParent } from 'myst-common';
import { csvTableDirectiveTransform } from 'myst-transforms';
import type { VFile } from 'vfile';
import { parseMyst } from '../process/myst.js';
import type { ISession } from '../session/types.js';


export async function csvTableTransform(
  session: ISession,
  tree: GenericParent,
  vfile: VFile,
) {
  const parseContent = (filename: string, content: string) => {
    return parseMyst(session, content, filename).children;
  };  await csvTableDirectiveTransform(tree, vfile, { parseContent });
}
