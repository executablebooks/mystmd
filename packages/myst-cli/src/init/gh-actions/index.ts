import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ISession } from 'myst-cli-utils';
import { writeFileToFolder } from 'myst-cli-utils';
import { getGithubUrl } from '../../utils/github.js';
import { checkFolderIsGit, checkAtGitRoot } from '../../utils/git.js';

function createGithubPagesAction({
  defaultBranch = 'main',
  username = 'username',
  isGithubIO,
}: {
  username?: string;
  defaultBranch?: string;
  isGithubIO?: boolean;
}) {
  return `# This file was created automatically with \`myst init --gh-pages\` 🪄 💚

name: MyST GitHub Pages Deploy
on:
  push:
    # Runs on pushes targeting the default branch
    branches: [${defaultBranch}]
env:
  # \`BASE_URL\` determines the website is served from, including CSS & JS assets
  # You may need to change this to \`${
    isGithubIO ? 'BASE_URL: /${{ github.event.repository.name }}' : "BASE_URL: ''"
  }\`
  ${
    isGithubIO
      ? `BASE_URL: '' # Not required for '${username}.github.io' domain. Other repos will need to set this!`
      : 'BASE_URL: /${{ github.event.repository.name }}'
  }

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write
# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: 'pages'
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 18.x
      - name: Install MyST Markdown
        run: npm install -g mystmd
      - name: Build HTML Assets
        run: myst build --html
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './_build/html'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
`;
}

function createGithubCurvenoteAction({ defaultBranch = 'main' }: { defaultBranch?: string }) {
  return `# This file was created automatically with \`myst init --gh-curvenote\` 🪄 💚

name: Curvenote Deploy
on:
  push:
    # Runs on pushes targeting the default branch
    branches: [${defaultBranch}]
permissions:
  # Sets permissions of the GITHUB_TOKEN to allow read of private repos
  contents: read
# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: 'pages'
  cancel-in-progress: false
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy 🚀
        uses: curvenote/action-myst-publish@v1
        env:
          CURVENOTE_TOKEN: \${{ secrets.CURVENOTE_TOKEN }}
`;
}

async function prelimGitChecks(session: ISession): Promise<string | undefined> {
  const inGitRepo = await checkFolderIsGit();
  if (!inGitRepo) {
    session.log.info(
      `${chalk.redBright(
        'Not a git repository',
      )}\n\nTo create a GitHub action you must be inside of a git repository.`,
    );
    process.exit(1);
  }
  const inRoot = await checkAtGitRoot();
  if (!inRoot) {
    session.log.info(
      `${chalk.redBright(
        'Please Run From Root',
      )}\n\nPlease run this command from the root of the git repository.`,
    );
    process.exit(1);
  }
  const githubUrl = await getGithubUrl();
  if (!githubUrl) {
    session.log.warn(`Could not read the GitHub URL from your git repository.`);
  }
  return githubUrl;
}

type Prompt = { branch: string; name: string };

const workflowQuestions = [
  {
    name: 'branch',
    message: `What branch would you like to deploy from?`,
    default: 'main',
  },
  {
    name: 'name',
    message: `What would you like to call the action?`,
    default: 'deploy.yml',
    validate(input: string) {
      if (!input.endsWith('.yml')) return 'The GitHub Action name must end in `.yml`';
      const exists = fs.existsSync(path.join('.github', 'workflows', input));
      if (exists) return 'The workflow file already exists, please choose another name.';
      return true;
    },
  },
];

export async function githubPagesAction(session: ISession) {
  const githubUrl = await prelimGitChecks(session);
  session.log.info(`📝 Creating a GitHub Action to deploy your MyST Site\n`);
  const prompt = await inquirer.prompt<Prompt>(workflowQuestions);
  const [repo, org] = githubUrl ? githubUrl.split('/').reverse() : [];
  const action = createGithubPagesAction({
    isGithubIO: githubUrl?.endsWith('.github.io'),
    username: org,
    defaultBranch: prompt.branch,
  });
  const filename = path.join('.github', 'workflows', prompt.name);
  writeFileToFolder(filename, action);
  const githubPagesUrl = githubUrl ? `https://${org}.github.io/${repo}` : undefined;
  session.log.info(
    `
🎉 GitHub Action is configured:

${filename}

✅ ${chalk.bold.green('Next Steps')}

1. Navigate to your GitHub Pages settings${githubUrl ? `\n\n    ${githubUrl}/settings/pages\n` : ''}
2. ${chalk.blue.bold('Enable GitHub Pages')}
3. Use ${chalk.blue.bold('GitHub Actions')} as the source
4. Push these changes (and/or merge to ${prompt.branch})
5. Look for a new action to start${githubUrl ? `\n\n    ${githubUrl}/actions\n` : ''}
6. Once the action completes, your site should be deployed ${
      githubPagesUrl
        ? `at:\n\n    ${githubPagesUrl}\n`
        : 'on your https://{{ organization }}.github.io/{{ repo }} domain'
    }
7. 🎉 Celebrate and tell us about your site on Twitter or Mastodon! 🐦 🐘
`,
  );
}

export async function githubCurvenoteAction(session: ISession) {
  const githubUrl = await prelimGitChecks(session);
  session.log.info(`📝 Creating a GitHub Action to deploy your site to Curvenote\n`);
  const prompt = await inquirer.prompt<Prompt>(workflowQuestions);
  const action = createGithubCurvenoteAction({ defaultBranch: prompt.branch });
  const filename = path.join('.github', 'workflows', prompt.name);
  writeFileToFolder(filename, action);
  session.log.info(
    `
🎉 GitHub Action is configured:

${filename}

✅ ${chalk.bold.green('Next Steps')}

1. Ensure you have a domain set in your site configuration

    site:
      domains:
        - username.curve.space

2. Create a new Curvenote API token

    https://curvenote.com/profile?settings=true&tab=profile-api

3. Navigate to your GitHub settings for action secrets${
      githubUrl ? `\n\n    ${githubUrl}/settings/secrets/actions\n` : ''
    }
4. Add a new repository secret

    Name: ${chalk.blue.bold('CURVENOTE_TOKEN')}
    Secret: Your Curvenote API Token

5. Push these changes (and/or merge to ${prompt.branch})
6. Look for a new action to start${githubUrl ? `\n\n    ${githubUrl}/actions\n` : ''}
7. Once the action completes, your site should be deployed
8. 🎉 Celebrate and tell us about your site on Twitter or Mastodon! 🐦 🐘
`,
  );
}
