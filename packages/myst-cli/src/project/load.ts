import fs from 'node:fs';

import { join, resolve } from 'node:path';
import { isDirectory, isUrl } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import { loadConfig } from '../config.js';
import { combineProjectCitationRenderers } from '../process/citations.js';
import { loadFile } from '../process/file.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { projects } from '../store/reducers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { getAllBibTexFilesOnPath } from '../utils/getAllBibtexFiles.js';
import { tocFile, validateSphinxTOC } from '../utils/toc.js';
import { projectFromPath } from './fromPath.js';
import { projectFromTOC, projectFromSphinxTOC } from './fromTOC.js';
import type { LocalProject, LocalProjectPage } from './types.js';
import { writeTOCToConfigFile } from './toTOC.js';
/**
 * Load project structure from disk
 *
 * @param session session with logging
 * @param path root directory of project, relative to current directory
 * @param opts `index`, including path relative to current directory; default is 'index.md'
 *     or 'readme.md' in 'path' directory
 *
 * If JupyterBook '_toc.yml' exists in path, project structure will be derived from that.
 * In this case, index will be ignored in favor of root from '_toc.yml'
 * If '_toc.yml' does not exist, project structure will be built from the local file/folder structure.
 */
export async function loadProjectFromDisk(
  session: ISession,
  path?: string,
  opts?: { index?: string; writeTOC?: boolean; warnOnNoConfig?: boolean; reloadProject?: boolean },
): Promise<LocalProject> {
  path = path || resolve('.');
  if (!opts?.reloadProject) {
    const cachedProject = selectors.selectLocalProject(session.store.getState(), path);
    if (cachedProject) return cachedProject;
  }
  loadConfig(session, path, opts);
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, path);
  const projectConfigFile =
    selectors.selectLocalConfigFile(state, path) ?? join(path, session.configFiles[0]);
  if (!projectConfig && opts?.warnOnNoConfig) {
    addWarningForFile(
      session,
      projectConfigFile,
      `Loading project from path with no config file: ${path}\nConsider running "myst init --project" in that directory`,
      'warn',
      { ruleId: RuleId.projectConfigExists },
    );
  }
  let newProject: Omit<LocalProject, 'bibliography'> | undefined;
  let { index, writeTOC } = opts || {};
  let legacyToc = false;
  if (projectConfig?.toc !== undefined) {
    newProject = projectFromTOC(session, path, projectConfig.toc);
    if (writeTOC) session.log.warn('Not writing the table of contents, it already exists!');
    writeTOC = false;
  } else if (validateSphinxTOC(session, path)) {
    // Legacy validator
    legacyToc = true;
    if (!writeTOC) {
      // Do not warn if user is explicitly upgrading toc
      const filename = tocFile(path);
      addWarningForFile(
        session,
        filename,
        `Encountered legacy jupyterbook TOC: ${filename}`,
        'warn',
        {
          ruleId: RuleId.encounteredLegacyTOC,
          note: 'To upgrade to a MyST TOC, try running `myst init --write-toc`',
        },
      );
    }
    newProject = projectFromSphinxTOC(session, path);
  } else {
    const project = selectors.selectLocalProject(state, path);
    if (!index && !project?.implicitIndex && project?.file) {
      // If there is no new index, keep the original unless it was implicit previously
      index = project.file;
    }
    newProject = await projectFromPath(session, path, index);
  }
  if (!newProject) {
    throw new Error(`Could not load project from ${path}`);
  }
  if (writeTOC) {
    if (legacyToc) {
      session.log.info(`⬆️ Upgrading legacy jupyterbook TOC to MyST: ${tocFile(path)}`);
    }
    session.log.info(`💾 Writing new TOC to: ${projectConfigFile}`);
    writeTOCToConfigFile(newProject, projectConfigFile, projectConfigFile);
  }
  const allBibFiles = getAllBibTexFilesOnPath(session, path);
  let bibliography: string[];
  if (projectConfig?.bibliography) {
    const bibConfigPath = `${projectConfigFile}#bibliography`;
    bibliography = projectConfig.bibliography.filter((bib) => {
      if (allBibFiles.includes(bib)) return true;
      if (isUrl(bib)) return true;
      if (fs.existsSync(bib)) {
        allBibFiles.push(bib);
        return true;
      }
      addWarningForFile(session, projectConfigFile, `Bibliography file ${bib} not found`, 'warn', {
        ruleId: RuleId.bibFileExists,
      });
      return false;
    });
    allBibFiles.forEach((bib) => {
      if (bibliography.includes(bib)) return;
      session.log.debug(`🔍 ${bib} exists, but the file is not referenced in ${bibConfigPath}`);
    });
  } else {
    bibliography = allBibFiles;
  }
  await Promise.all(bibliography.map((p: string) => loadFile(session, p, path, '.bib')));
  const project: LocalProject = { ...newProject, bibliography };
  session.store.dispatch(projects.actions.receive(project));
  combineProjectCitationRenderers(session, path);
  return project;
}

export function findProjectsOnPath(session: ISession, path: string) {
  let projectPaths: string[] = [];
  const content = fs.readdirSync(path);
  if (session.configFiles.filter((file) => content.includes(file)).length) {
    loadConfig(session, path);
    if (selectors.selectLocalProjectConfig(session.store.getState(), path)) {
      projectPaths.push(path);
    }
  }
  content
    .map((dir) => join(path, dir))
    .filter((file) => isDirectory(file))
    .forEach((dir) => {
      projectPaths = projectPaths.concat(findProjectsOnPath(session, dir));
    });
  return projectPaths;
}

export function filterPages(project: LocalProject) {
  const pages: LocalProjectPage[] = [
    { file: project.file, slug: project.index, level: 1 },
    ...project.pages.filter((page): page is LocalProjectPage => 'file' in page),
  ];
  return pages;
}
