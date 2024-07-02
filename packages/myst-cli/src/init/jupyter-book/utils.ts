import { parse, join } from 'node:path';

export function makeBackupName(path: string): string {
  const { dir, base } = parse(path);
  const newName = join(dir, `.${base}.myst.bak`);
  return newName;
}
