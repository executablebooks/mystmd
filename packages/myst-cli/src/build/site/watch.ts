import chokidar from 'chokidar';
import { join, extname, basename } from 'node:path';
import type { SiteProject } from 'myst-config';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types.js';
import { changeFile, fastProcessFile, processSite } from '../../process/site.js';
import type { TransformFn } from '../../process/mdast.js';
import { selectors, watch } from '../../store/index.js';
import { KNOWN_FAST_BUILDS } from '../../utils/resolveExtension.js';
import chalk from 'chalk';

// TODO: allow this to work from other paths

type TransformOptions = {
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  defaultTemplate?: string;
  reloadProject?: boolean;
  execute?: boolean;
  maxSizeWebp?: number;
};

function watchConfigAndPublic(session: ISession, serverReload: () => void, opts: TransformOptions) {
  const watchFiles = ['public'];
  const siteConfigFile = selectors.selectCurrentSiteFile(session.store.getState());
  if (siteConfigFile) watchFiles.push(siteConfigFile);
  return chokidar
    .watch(watchFiles, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    .on('all', watchProcessor(session, null, serverReload, opts));
}

function triggerProjectReload(
  session: ISession,
  file: string,
  eventType: string,
  projectPath?: string,
) {
  // Reload project if project config or toc changes
  const state = session.store.getState();
  const projectConfigFile = projectPath
    ? selectors.selectLocalConfigFile(state, projectPath)
    : selectors.selectCurrentProjectFile(state);
  if (file === projectConfigFile || basename(file) === '_toc.yml') return true;
  // Reload project if file is added or remvoed
  if (['add', 'unlink'].includes(eventType)) return true;
  // Otherwise do not reload project
  return false;
}

async function processorFn(
  session: ISession,
  file: string | null,
  eventType: string,
  siteProject: SiteProject | null,
  serverReload: () => void,
  opts: TransformOptions,
) {
  if (file) {
    changeFile(session, file, eventType);
    if (KNOWN_FAST_BUILDS.has(extname(file)) && eventType === 'unlink') {
      session.log.info(`🚮 File ${file} deleted...`);
    }
  }
  if (
    !siteProject ||
    !file ||
    !KNOWN_FAST_BUILDS.has(extname(file)) ||
    ['add', 'unlink'].includes(eventType)
  ) {
    let reloadProject = false;
    if (file && triggerProjectReload(session, file, eventType, siteProject?.path)) {
      session.log.info('💥 Triggered full project load and site rebuild');
      reloadProject = true;
    } else {
      session.log.info('💥 Triggered full site rebuild');
    }
    await processSite(session, { reloadProject, ...opts });
    serverReload();
    return;
  }
  if (!siteProject.path) {
    session.log.warn(`⚠️ No local project path for file: ${file}`);
    return;
  }
  const projectPath = siteProject.path;
  const pageSlug = selectors.selectPageSlug(session.store.getState(), siteProject.path, file);
  const dependencies = selectors.selectDependentFiles(session.store.getState(), file);
  if (!pageSlug && dependencies.length === 0) {
    session.log.warn(`⚠️ File is not in project: ${file}`);
    return;
  }
  if (pageSlug) {
    await fastProcessFile(session, {
      file,
      projectPath,
      projectSlug: siteProject.slug,
      pageSlug,
      ...opts,
    });
  }
  if (dependencies.length) {
    session.log.info(
      `🔄 Updating dependent pages for ${file} ${chalk.dim(`[${dependencies.join(', ')}]`)}`,
    );
    await Promise.all([
      dependencies.map((dep) => {
        const depSlug = selectors.selectPageSlug(session.store.getState(), projectPath, dep);
        if (!depSlug) return undefined;
        return fastProcessFile(session, {
          file: dep,
          projectPath,
          projectSlug: siteProject.slug,
          pageSlug: depSlug,
          ...opts,
        });
      }),
    ]);
  }
  serverReload();
  // TODO: process full site silently and update if there are any
  // await processSite(session, true);
}

function watchProcessor(
  session: ISession,
  siteProject: SiteProject | null,
  serverReload: () => void,
  opts: TransformOptions,
) {
  return async (eventType: string, file: string) => {
    if (file.startsWith('_build') || file.startsWith('.') || file.includes('.ipynb_checkpoints')) {
      session.log.debug(`Ignoring build trigger for ${file} with eventType of "${eventType}"`);
      return;
    }
    const { reloading } = selectors.selectReloadingState(session.store.getState());
    if (reloading) {
      session.store.dispatch(watch.actions.markReloadRequested(true));
      return;
    }
    session.store.dispatch(watch.actions.markReloading(true));
    session.log.debug(`File modified: "${file}" (${eventType})`);
    await processorFn(session, file, eventType, siteProject, serverReload, opts);
    while (selectors.selectReloadingState(session.store.getState()).reloadRequested) {
      // If reload(s) were requested during previous build, just reload everything once.
      session.store.dispatch(watch.actions.markReloadRequested(false));
      await processorFn(session, null, eventType, null, serverReload, {
        reloadProject: true,
        ...opts,
      });
    }
    session.store.dispatch(watch.actions.markReloading(false));
  };
}

export function watchContent(session: ISession, serverReload: () => void, opts: TransformOptions) {
  const state = session.store.getState();
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  if (!siteConfig?.projects) return;

  const siteConfigFile = selectors.selectCurrentSiteFile(state);
  const localProjects = siteConfig.projects.filter(
    (proj): proj is { slug: string; path: string } => {
      return Boolean(proj.path);
    },
  );
  // For each project watch the full content folder
  localProjects.forEach((proj) => {
    const ignored =
      proj.path === '.'
        ? localProjects.filter(({ path }) => path !== '.').map(({ path }) => join(path, '*'))
        : [];
    if (siteConfigFile) ignored.push(siteConfigFile);
    const projectConfig = selectors.selectLocalProjectConfig(state, proj.path);
    if (projectConfig?.exclude) ignored.push(...projectConfig.exclude);
    const dependencies = new Set(selectors.selectAllDependencies(state, proj.path));
    chokidar
      .watch([proj.path, ...dependencies], {
        ignoreInitial: true,
        ignored: ['public', '**/_build/**', '**/.git/**', ...ignored],
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      })
      .on('all', watchProcessor(session, proj, serverReload, opts));
  });
  // Watch the myst.yml
  watchConfigAndPublic(session, serverReload, opts);
}
