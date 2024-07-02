import fs from 'node:fs/promises';

/**
 * Asynchronous version of fs.existsSync
 *
 * @param path - path to test for existence
 */
export async function fsExists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
