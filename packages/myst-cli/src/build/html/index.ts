import fs from 'fs-extra';
import path from 'node:path';
import { writeFileToFolder } from 'myst-cli-utils';
import type { ISession } from '../../session/types.js';
import { getSiteManifest } from '../site/manifest.js';
import { getMystTemplate } from '../site/template.js';
import { startServer } from '../site/start.js';

export async function currentSiteRoutes(
  session: ISession,
  host: string,
  baseurl: string | undefined,
  opts?: { defaultTemplate?: string },
) {
  const manifest = await getSiteManifest(session, opts);
  return (manifest.projects ?? [])
    ?.map((proj) => {
      const projSlug = proj.slug ? `/${proj.slug}` : '';
      // We need to get the index from a slug page to make remix happy
      // If this gets from the index, then the site will trigger the wrong render path
      // And then hydration does not match
      const siteIndex = baseurl ? `/${proj.index}` : '';
      return [
        { url: `${host}${projSlug}${siteIndex}`, path: path.join(proj.slug ?? '', 'index.html') },
        ...proj.pages.map((page) => {
          return {
            url: `${host}${projSlug}/${page.slug}`,
            path: path.join(proj.slug ?? '', `${page.slug}.html`),
          };
        }),
        // Download all of the configured JSON
        {
          url: `${host}${projSlug}/${proj.index}.json`,
          path: path.join(proj.slug ?? '', `${proj.index}.json`),
        },
        ...proj.pages.map((page) => {
          return {
            url: `${host}${projSlug}/${page.slug}.json`,
            path: path.join(proj.slug ?? '', `${page.slug}.json`),
          };
        }),
        // Download other assets
        ...['robots.txt', 'sitemap.xml', 'sitemap_style.xsl'].map((asset) => ({
          url: `${host}/${asset}`,
          path: asset,
        })),
      ];
    })
    .flat();
}

// This is defined in the remix `publicPath` and allows us to overwrite it here.
const ASSETS_FOLDER = 'myst_assets_folder';

/**
 * Rewrite URLs in HTML/JS/JSON files pointing to the default assets folder in
 * terms of the provided base URL
 *
 * @param directory directory of files to recursively rewrite
 * @param baseurl base URL of the built site
 */
function rewriteAssetsFolder(directory: string, baseurl?: string): void {
  fs.readdirSync(directory).forEach((filename) => {
    const file = path.join(directory, filename);
    if (fs.statSync(file).isDirectory()) {
      rewriteAssetsFolder(file, baseurl);
      return;
    }
    if (path.extname(file) === '.map') {
      fs.rmSync(file);
      return;
    }
    if (!['.html', '.js', '.json'].includes(path.extname(file))) return;
    const data = fs.readFileSync(file).toString();
    const modified = data.replace(
      new RegExp(`\\/${ASSETS_FOLDER}\\/`, 'g'),
      `${baseurl || ''}/build/`,
    );
    fs.writeFileSync(file, modified);
  });
}

/**
 * Build a MyST project as a static HTML deployment
 *
 * @param session session with logging
 * @param opts configuration options
 */
export async function buildHtml(session: ISession, opts: any) {
  const template = await getMystTemplate(session, opts);
  // The BASE_URL env variable allows for mounting the site in a folder, e.g., github pages
  const baseurl = process.env.BASE_URL;
  if (baseurl) {
    session.log.info(`Building the site with a baseurl of "${baseurl}"`);
  } else {
    session.log.info(
      'Building the base site.\nTo set a baseurl (e.g. GitHub pages) use "BASE_URL" environment variable.',
    );
  }
  // Note, this process is really only for Remix templates
  // We could add a flag in the future for other templates
  const htmlDir = path.join(session.buildPath(), 'html');
  fs.rmSync(htmlDir, { recursive: true, force: true });
  fs.mkdirSync(htmlDir, { recursive: true });
  const appServer = await startServer(session, { ...opts, buildStatic: true, baseurl });
  if (!appServer) return;

  const host = process.env.HOST;
  if (processEnvHost) {
    session.log.info(`Building the site with a host of "${processEnvHost}"`);
  } else {
    session.log.info(
      'Building the base site.\nTo set a host use "HOST" environment variable.',
    );
  }
  const host = `http://${processEnvHost}:${appServer.port}`;

  const routes = await currentSiteRoutes(session, host, baseurl, opts);

  // Fetch all HTML pages and assets by the template
  await Promise.all(
    routes.map(async (page) => {
      const resp = await session.fetch(page.url);
      const content = await resp.text();
      writeFileToFolder(path.join(htmlDir, page.path), content);
    }),
  );
  appServer.stop();

  // Copy the files for the template used
  const templateBuildDir = path.join(template.templatePath, 'public');
  fs.copySync(templateBuildDir, htmlDir);

  // Copy all of the static assets
  fs.copySync(session.publicPath(), path.join(htmlDir, 'build'));
  fs.copySync(path.join(session.sitePath(), 'objects.inv'), path.join(htmlDir, 'objects.inv'));
  fs.copySync(path.join(session.sitePath(), 'config.json'), path.join(htmlDir, 'config.json'));

  // We need to go through and change all links to the right folder
  rewriteAssetsFolder(htmlDir, baseurl);

  // Explicitly close the process as the web server doesn't always stop?
  process.exit(0);
}
