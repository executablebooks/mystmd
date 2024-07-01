import fs from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import yaml from 'js-yaml';
import { writeFileToFolder, isUrl, computeHash } from 'myst-cli-utils';
import { fileError, fileWarn, RuleId } from 'myst-common';
import type { Config, ProjectConfig, SiteConfig, SiteProject } from 'myst-config';
import { validateProjectConfig, validateSiteConfig } from 'myst-config';
import { fillProjectFrontmatter, fillSiteFrontmatter } from 'myst-frontmatter';
import type { ValidationOptions } from 'simple-validators';
import {
  incrementOptions,
  validateObjectKeys,
  validationError,
  validateList,
  validateString,
} from 'simple-validators';
import { VFile } from 'vfile';
import { prepareToWrite } from './frontmatter.js';
import { cachePath, loadFromCache, writeToCache } from './session/cache.js';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import { config } from './store/reducers.js';
import { logMessagesFromVFile } from './utils/logging.js';
import { addWarningForFile } from './utils/addWarningForFile.js';

const VERSION = 1;

function emptyConfig(): Config {
  return {
    version: VERSION,
  };
}

export function defaultConfigFile(session: ISession, path: string) {
  return join(path, session.configFiles[0]);
}

export function configFromPath(session: ISession, path: string) {
  const configs = session.configFiles
    .map((file) => {
      return join(path, file);
    })
    .filter((file) => {
      return fs.existsSync(file);
    });
  if (configs.length > 1) throw Error(`Multiple config files in ${path}`);
  if (configs.length === 0) return undefined;
  return configs[0];
}

/**
 * Load config yaml file and throw error if it fails
 */
function loadConfigYaml(file: string) {
  if (!fs.existsSync(file)) throw Error(`Cannot find config file: ${file}`);
  let rawConf: Record<string, any>;
  try {
    rawConf = yaml.load(fs.readFileSync(file, 'utf-8')) as Record<string, any>;
  } catch (err) {
    const suffix = (err as Error).message ? `\n\n${(err as Error).message}` : '';
    throw Error(`Unable to read config file ${file} as YAML${suffix}`);
  }
  return rawConf;
}

/**
 * Helper function to generate basic validation options
 */
function configValidationOpts(vfile: VFile, property: string, ruleId: RuleId): ValidationOptions {
  return {
    file: vfile.path,
    property,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId });
    },
  };
}

/**
 * Function to add filler keys to base if the keys are not defined in base
 */
function fillSiteConfig(base: SiteConfig, filler: SiteConfig, opts: ValidationOptions) {
  return fillSiteFrontmatter(base, filler, opts, Object.keys(filler));
}

/**
 * Load and validate a file as yaml config file
 *
 * Returns validated site and project configs.
 *
 * Throws errors config file is malformed or invalid.
 */
async function getValidatedConfigsFromFile(
  session: ISession,
  file: string,
  vfile?: VFile,
  stack?: string[],
) {
  if (!vfile) {
    vfile = new VFile();
    vfile.path = file;
  }
  const opts = configValidationOpts(vfile, 'config', RuleId.validConfigStructure);
  const conf = validateObjectKeys(
    loadConfigYaml(file),
    {
      required: ['version'],
      optional: ['site', 'project', 'extend'],
      alias: { extends: 'extend' },
    },
    opts,
  );
  if (conf && conf.version !== VERSION) {
    validationError(
      `"${conf.version}" does not match ${VERSION}`,
      incrementOptions('version', opts),
    );
  }
  logMessagesFromVFile(session, vfile);
  if (!conf || opts.messages.errors) {
    throw Error(`Please address invalid config file ${file}`);
  }
  // Keep original config object with extra keys, etc.
  if (conf.site?.frontmatter) {
    fileWarn(
      vfile,
      `Frontmatter fields should be defined directly on site, not nested under "${file}#site.frontmatter"`,
      { ruleId: RuleId.configHasNoDeprecatedFields },
    );
    const { frontmatter, ...rest } = conf.site;
    conf.site = { ...frontmatter, ...rest };
  }
  if (conf.project?.frontmatter) {
    fileWarn(
      vfile,
      `Frontmatter fields should be defined directly on project, not nested under "${file}#project.frontmatter"`,
      { ruleId: RuleId.configHasNoDeprecatedFields },
    );
    const { frontmatter, ...rest } = conf.project;
    conf.project = { ...frontmatter, ...rest };
  }
  if (conf.site?.logoText) {
    fileWarn(vfile, `logoText is deprecated, please use logo_text in "${file}#site"`, {
      ruleId: RuleId.configHasNoDeprecatedFields,
    });
    const { logoText, ...rest } = conf.site;
    conf.site = { logo_text: logoText, ...rest };
  }
  let site: SiteConfig | undefined;
  let project: ProjectConfig | undefined;
  const projectOpts = configValidationOpts(vfile, 'config.project', RuleId.validProjectConfig);
  let extend: string[] | undefined;
  if (conf.extend) {
    extend = await Promise.all(
      (
        validateList(
          conf.extend,
          { coerce: true, ...incrementOptions('extend', opts) },
          (item, index) => {
            return validateString(item, incrementOptions(`extend.${index}`, opts));
          },
        ) ?? []
      ).map(async (extendFile) => {
        const resolvedFile = await resolveToAbsolute(session, dirname(file), extendFile, {
          allowRemote: true,
        });
        return resolvedFile;
      }),
    );
    stack = [...(stack ?? []), file];
    await Promise.all(
      (extend ?? []).map(async (extFile) => {
        if (stack?.includes(extFile)) {
          fileError(vfile, 'Circular dependency encountered during "config.extend" resolution', {
            ruleId: RuleId.validConfigStructure,
            note: [...stack, extFile].map((f) => resolveToRelative(session, '.', f)).join(' > '),
          });
          return;
        }
        const { site: extSite, project: extProject } = await getValidatedConfigsFromFile(
          session,
          extFile,
          vfile,
          stack,
        );
        session.store.dispatch(config.actions.receiveConfigExtension({ file: extFile }));
        if (extSite) {
          site = site ? fillSiteConfig(extSite, site, incrementOptions('extend', opts)) : extSite;
        }
        if (extProject) {
          project = project ? fillProjectFrontmatter(extProject, project, projectOpts) : extProject;
        }
      }),
    );
  }
  const { site: rawSite, project: rawProject } = conf ?? {};
  const path = dirname(file);
  if (rawSite) {
    site = fillSiteConfig(
      await validateSiteConfigAndThrow(session, path, vfile, rawSite),
      site ?? {},
      incrementOptions('extend', opts),
    );
  }
  if (site) {
    session.log.debug(`Loaded site config from ${file}`);
  } else {
    session.log.debug(`No site config in ${file}`);
  }
  if (rawProject) {
    project = fillProjectFrontmatter(
      await validateProjectConfigAndThrow(session, path, vfile, rawProject),
      project ?? {},
      projectOpts,
    );
  }
  if (project) {
    session.log.debug(`Loaded project config from ${file}`);
  } else {
    session.log.debug(`No project config defined in ${file}`);
  }
  logMessagesFromVFile(session, vfile);
  return { site, project, extend };
}

/**
 * Load site/project config from local path to redux store
 *
 * Errors if config file does not exist or if config file exists but is invalid.
 */
export async function loadConfig(
  session: ISession,
  path: string,
  opts?: { reloadProject?: boolean },
) {
  const file = configFromPath(session, path);
  if (!file) {
    session.log.debug(`No config loaded from path: ${path}`);
    return;
  }
  const rawConf = loadConfigYaml(file);
  if (!opts?.reloadProject) {
    const existingConf = selectors.selectLocalRawConfig(session.store.getState(), path);
    if (existingConf && JSON.stringify(rawConf) === JSON.stringify(existingConf.raw)) {
      return existingConf.validated;
    }
  }
  const { site, project, extend } = await getValidatedConfigsFromFile(session, file);
  const validated = { ...rawConf, site, project, extend };
  session.store.dispatch(
    config.actions.receiveRawConfig({
      path,
      file,
      raw: rawConf,
      validated,
    }),
  );
  if (site) saveSiteConfig(session, path, site);
  if (project) saveProjectConfig(session, path, project);
  return validated;
}

export async function resolveToAbsolute(
  session: ISession,
  basePath: string,
  relativePath: string,
  opts?: {
    allowNotExist?: boolean;
    allowRemote?: boolean;
  },
) {
  let message: string | undefined;
  if (opts?.allowRemote && isUrl(relativePath)) {
    const cacheFilename = `config-item-${computeHash(relativePath)}${extname(new URL(relativePath).pathname)}`;
    if (!loadFromCache(session, cacheFilename, { maxAge: 30 })) {
      try {
        const resp = await session.fetch(relativePath);
        if (resp.ok) {
          writeToCache(session, cacheFilename, Buffer.from(await resp.arrayBuffer()));
        } else {
          message = `Bad response from config URL: ${relativePath}`;
        }
      } catch {
        message = `Error fetching config URL: ${relativePath}`;
      }
    }
    relativePath = cachePath(session, cacheFilename);
  }
  try {
    const absPath = resolve(basePath, relativePath);
    if (opts?.allowNotExist || fs.existsSync(absPath)) {
      return absPath;
    }
    message = message ?? `Does not exist as local path: ${absPath}`;
  } catch {
    message = message ?? `Unable to resolve as local path: ${relativePath}`;
  }
  session.log.debug(message);
  return relativePath;
}

function resolveToRelative(
  session: ISession,
  basePath: string,
  absPath: string,
  opts?: {
    allowNotExist?: boolean;
  },
) {
  let message: string;
  try {
    if (opts?.allowNotExist || fs.existsSync(absPath)) {
      // If it is the same path, use a '.'
      return relative(basePath, absPath) || '.';
    }
    message = `Does not exist as local path: ${absPath}`;
  } catch {
    message = `Unable to resolve as relative path: ${absPath}`;
  }
  session.log.debug(message);
  return absPath;
}

async function resolveSiteConfigPaths(
  session: ISession,
  path: string,
  siteConfig: SiteConfig,
  resolutionFn: (
    session: ISession,
    basePath: string,
    path: string,
    opts?: {
      allowNotExist?: boolean;
      allowRemote?: boolean;
    },
  ) => string | Promise<string>,
) {
  const resolvedFields: SiteConfig = {};
  if (siteConfig.projects) {
    resolvedFields.projects = await Promise.all(
      siteConfig.projects.map(async (proj) => {
        if (proj.path) {
          return { ...proj, path: await resolutionFn(session, path, proj.path) };
        }
        return proj;
      }),
    );
  }
  if (siteConfig.favicon) {
    resolvedFields.favicon = await resolutionFn(session, path, siteConfig.favicon);
  }
  return { ...siteConfig, ...resolvedFields };
}

async function resolveProjectConfigPaths(
  session: ISession,
  path: string,
  projectConfig: ProjectConfig,
  resolutionFn: (
    session: ISession,
    basePath: string,
    path: string,
    opts?: {
      allowNotExist?: boolean;
      allowRemote?: boolean;
    },
  ) => string | Promise<string>,
) {
  const resolvedFields: ProjectConfig = {};
  if (projectConfig.bibliography) {
    resolvedFields.bibliography = await Promise.all(
      projectConfig.bibliography.map(async (file) => {
        const resolved = await resolutionFn(session, path, file);
        return resolved;
      }),
    );
  }
  if (projectConfig.index) {
    resolvedFields.index = await resolutionFn(session, path, projectConfig.index);
  }
  if (projectConfig.plugins) {
    resolvedFields.plugins = await Promise.all(
      projectConfig.plugins.map(async (info) => {
        const resolved = await resolutionFn(session, path, info.path, {
          allowRemote: info.type !== 'executable',
        });
        if (fs.existsSync(resolved)) {
          return { ...info, path: resolved };
        } else {
          return info;
        }
      }),
    );
  }
  return { ...projectConfig, ...resolvedFields };
}

async function validateSiteConfigAndThrow(
  session: ISession,
  path: string,
  vfile: VFile,
  rawSite: Record<string, any>,
): Promise<SiteConfig> {
  const site = validateSiteConfig(
    rawSite,
    configValidationOpts(vfile, 'config.site', RuleId.validSiteConfig),
  );
  logMessagesFromVFile(session, vfile);
  if (!site) {
    const errorSuffix = vfile.path ? ` in ${vfile.path}` : '';
    throw Error(`Please address invalid site config${errorSuffix}`);
  }
  return resolveSiteConfigPaths(session, path, site, resolveToAbsolute);
}

function saveSiteConfig(session: ISession, path: string, site: SiteConfig) {
  session.store.dispatch(config.actions.receiveSiteConfig({ path, ...site }));
}

async function validateProjectConfigAndThrow(
  session: ISession,
  path: string,
  vfile: VFile,
  rawProject: Record<string, any>,
): Promise<ProjectConfig> {
  const project = validateProjectConfig(
    rawProject,
    configValidationOpts(vfile, 'config.project', RuleId.validProjectConfig),
  );
  logMessagesFromVFile(session, vfile);
  if (!project) {
    const errorSuffix = vfile.path ? ` in ${vfile.path}` : '';
    throw Error(`Please address invalid project config${errorSuffix}`);
  }
  return resolveProjectConfigPaths(session, path, project, resolveToAbsolute);
}

function saveProjectConfig(session: ISession, path: string, project: ProjectConfig) {
  session.store.dispatch(config.actions.receiveProjectConfig({ path, ...project }));
}

/**
 * Write site config and config to path, if available
 *
 * If newConfigs are provided, the redux store will be updated with these
 * configs before writing.
 *
 * If a config file exists on the path, this will override the
 * site portion of the config and leave the rest.
 */
export async function writeConfigs(
  session: ISession,
  path: string,
  newConfigs?: {
    siteConfig?: Record<string, any>;
    projectConfig?: Record<string, any>;
  },
) {
  // TODO: siteConfig -> rawSiteConfig before writing, don't lose extra keys in raw.
  //       also shouldn't need to re-readConfig...
  let { siteConfig, projectConfig } = newConfigs || {};
  const file = configFromPath(session, path) || defaultConfigFile(session, path);
  // Get site config to save
  const vfile = new VFile();
  vfile.path = file;
  if (siteConfig) {
    saveSiteConfig(
      session,
      path,
      await validateSiteConfigAndThrow(session, path, vfile, siteConfig),
    );
  }
  siteConfig = selectors.selectLocalSiteConfig(session.store.getState(), path);
  if (siteConfig) {
    siteConfig = await resolveSiteConfigPaths(session, path, siteConfig, resolveToRelative);
  }
  // Get project config to save
  if (projectConfig) {
    saveProjectConfig(
      session,
      path,
      await validateProjectConfigAndThrow(session, path, vfile, projectConfig),
    );
  }
  projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  if (projectConfig) {
    projectConfig = prepareToWrite(projectConfig);
    projectConfig = await resolveProjectConfigPaths(
      session,
      path,
      projectConfig,
      resolveToRelative,
    );
  }
  // Return early if nothing new to save
  if (!siteConfig && !projectConfig) {
    session.log.debug(`No new config to write to ${file}`);
    return;
  }
  // Get raw config to override
  const validatedRawConfig = (await loadConfig(session, path)) ?? emptyConfig();
  let logContent: string;
  if (siteConfig && projectConfig) {
    logContent = 'site and project configs';
  } else if (siteConfig) {
    logContent = 'site config';
  } else {
    logContent = 'project config';
  }
  session.log.debug(`Writing ${logContent} to ${file}`);
  // Combine site/project configs with
  const newConfig = { ...validatedRawConfig };
  if (siteConfig) newConfig.site = { ...validatedRawConfig.site, ...siteConfig };
  if (projectConfig) newConfig.project = { ...validatedRawConfig.project, ...projectConfig };
  writeFileToFolder(file, yaml.dump(newConfig), 'utf-8');
}

export async function findCurrentProjectAndLoad(session: ISession, path: string) {
  path = resolve(path);
  if (configFromPath(session, path)) {
    await loadConfig(session, path);
    const project = selectors.selectLocalProjectConfig(session.store.getState(), path);
    if (project) {
      session.store.dispatch(config.actions.receiveCurrentProjectPath({ path: path }));
      return path;
    }
  }
  if (dirname(path) === path) {
    return undefined;
  }
  return findCurrentProjectAndLoad(session, dirname(path));
}

export async function findCurrentSiteAndLoad(session: ISession, path: string) {
  path = resolve(path);
  if (configFromPath(session, path)) {
    await loadConfig(session, path);
    const site = selectors.selectLocalSiteConfig(session.store.getState(), path);
    if (site) {
      session.store.dispatch(config.actions.receiveCurrentSitePath({ path: path }));
      return path;
    }
  }
  if (dirname(path) === path) {
    return undefined;
  }
  return findCurrentSiteAndLoad(session, dirname(path));
}

export async function reloadAllConfigsForCurrentSite(session: ISession) {
  const state = session.store.getState();
  const sitePath = selectors.selectCurrentSitePath(state);
  const file =
    selectors.selectCurrentProjectFile(state) ?? defaultConfigFile(session, resolve('.'));
  if (!sitePath) {
    const message =
      'Cannot (re)load site config. No configuration file found with "site" property.';
    addWarningForFile(session, file, message, 'error', { ruleId: RuleId.siteConfigExists });
    throw Error(message);
  }
  await loadConfig(session, sitePath);
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig?.projects) return;
  await Promise.all(
    siteConfig.projects
      .filter((project): project is SiteProject & { path: string } => {
        return Boolean(project.path);
      })
      .map(async (project) => {
        try {
          await loadConfig(session, project.path);
        } catch (error) {
          // TODO: what error?
          session.log.debug(`Failed to find or load project config from "${project.path}"`);
        }
      }),
  );
}
