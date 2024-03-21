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
import { projectFromPath } from './fromPath.js';
import { projectFromToc, validateTOC } from './fromToc.js';
import { writeTocFromProject } from './toToc.js';
import type { LocalProject, LocalProjectPage } from './types.js';

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
  opts?: { index?: string; writeToc?: boolean; warnOnNoConfig?: boolean; reloadProject?: boolean },
): Promise<LocalProject> {
  path = path || resolve('.');
  if (!opts?.reloadProject) {
    const cachedProject = selectors.selectLocalProject(session.store.getState(), path);
    if (cachedProject) return cachedProject;
  }
  const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  const file = join(path, session.configFiles[0]);
  if (!projectConfig && opts?.warnOnNoConfig) {
    addWarningForFile(
      session,
      file,
      `Loading project from path with no config file: ${path}\nConsider running "myst init --project" in that directory`,
      'warn',
      { ruleId: RuleId.projectConfigExists },
    );
  }
  let newProject: Omit<LocalProject, 'bibliography'> | undefined;
  let { index, writeToc } = opts || {};
  const projectConfigFile = selectors.selectLocalConfigFile(session.store.getState(), path);
  if (validateTOC(session, path)) {
    newProject = projectFromToc(session, path);
    if (writeToc) session.log.warn('Not writing the table of contents, it already exists!');
    writeToc = false;
  } else {
    const project = selectors.selectLocalProject(session.store.getState(), path);
    if (!index && !project?.implicitIndex && project?.file) {
      // If there is no new index, keep the original unless it was implicit previously
      index = project.file;
    }
    newProject = await projectFromPath(session, path, index);
  }
  if (!newProject) {
    throw new Error(`Could not load project from ${path}`);
  }
  if (writeToc) {
    try {
      session.log.info(
        `📓 Writing '_toc.yml' file to ${path === '.' ? 'the current directory' : path}`,
      );
      writeTocFromProject(newProject, path);
      // Re-load from TOC just in case there are subtle differences with resulting project
      newProject = projectFromToc(session, path);
    } catch {
      addWarningForFile(
        session,
        projectConfigFile,
        `Error writing '_toc.yml' file to ${path}`,
        'error',
        { ruleId: RuleId.tocWritten },
      );
    }
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
