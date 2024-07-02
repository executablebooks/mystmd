import { makeExecutable } from 'myst-cli-utils';

export async function getGithubUrl() {
  try {
    const gitUrl = await makeExecutable('git config --get remote.origin.url', null)();
    if (!gitUrl.includes('github.com')) return undefined;
    return gitUrl
      .replace('git@github.com:', 'https://github.com/')
      .trim()
      .replace(/\.git$/, '');
  } catch (error) {
    return undefined;
  }
}
