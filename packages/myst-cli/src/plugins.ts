import fs from 'node:fs';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import { RuleId, plural, type MystPlugin } from 'myst-common';
import type { PluginInfo } from 'myst-config';
import { addWarningForFile } from './utils/addWarningForFile.js';
import { loadExecutablePlugin } from './executablePlugin.js';

/**
 * Load user-defined plugin modules declared in the project frontmatter
 *
 * @param session session with logging
 */
export async function loadPlugins(session: ISession): Promise<MystPlugin> {
  let configPlugins: PluginInfo[] = [];
  const state = session.store.getState();
  const projConfig = selectors.selectCurrentProjectConfig(state);
  if (projConfig?.plugins) configPlugins.push(...projConfig.plugins);
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  if (siteConfig?.projects) {
    siteConfig.projects
      .filter((project): project is { path: string } => !!project.path)
      .forEach((project) => {
        const siteProjConfig = selectors.selectLocalProjectConfig(state, project.path);
        if (siteProjConfig?.plugins) configPlugins.push(...siteProjConfig.plugins);
      });
  }

  // Deduplicate by path
  configPlugins = [...new Map(configPlugins.map((info) => [info.path, info])).values()];

  const plugins: MystPlugin = {
    directives: [],
    roles: [],
    transforms: [],
  };
  if (configPlugins.length === 0) {
    return plugins;
  }
  session.log.debug(
    `Loading plugins: "${configPlugins.map((info) => `${info.path} (${info.type})`).join('", "')}"`,
  );
  const modules = await Promise.all(
    configPlugins.map(async (info) => {
      const { type, path } = info;
      switch (type) {
        case 'executable': {
          // Ensure the plugin is a file
          if (!fs.statSync(path).isFile) {
            addWarningForFile(
              session,
              path,
              `Unknown plugin "${path}", it must be an executable file`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );
            return null;
          }
          // Ensure the plugin is executable
          try {
            fs.accessSync(path, fs.constants.X_OK);
          } catch (err) {
            addWarningForFile(session, path, `Plugin "${path}" is not executable`, 'error', {
              ruleId: RuleId.pluginLoads,
            });
            return null;
          }
          const plugin = await loadExecutablePlugin(session, info.path);
          if (plugin === undefined) {
            addWarningForFile(
              session,
              path,
              `Non-zero exit code after querying executable "${path}" for plugin specification`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );

            return null;
          }
          return { path, module: { plugin } };
        }
        case 'javascript': {
          if (!fs.statSync(path).isFile || !path.endsWith('.mjs')) {
            addWarningForFile(
              session,
              path,
              `Unknown plugin "${path}", it must be an mjs file`,
              'error',
              {
                ruleId: RuleId.pluginLoads,
              },
            );
            return null;
          }
          let module: any;
          try {
            module = await import(path);
          } catch (error) {
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
            addWarningForFile(session, path, `Error reading plugin: ${error}`, 'error', {
              ruleId: RuleId.pluginLoads,
            });
            return null;
          }
          return { path, module };
        }
      }
    }),
  );
  modules.forEach((pluginLoader) => {
    if (!pluginLoader) return;
    const plugin: MystPlugin = pluginLoader.module.default || pluginLoader.module.plugin;
    const directives = plugin.directives || pluginLoader.module.directives;
    const roles = plugin.roles || pluginLoader.module.roles;
    const transforms = plugin.transforms || pluginLoader.module.transforms;
    session.log.info(
      `🔌 ${plugin?.name ?? 'Unnamed Plugin'} (${pluginLoader.path}) loaded: ${plural(
        '%s directive(s)',
        directives,
      )}, ${plural('%s role(s)', roles)}, ${plural('%s transform(s)', transforms)}`,
    );
    if (directives) {
      // TODO: validate each directive
      plugins.directives.push(...directives);
    }
    if (roles) {
      // TODO: validate each role
      plugins.roles.push(...roles);
    }
    if (transforms) {
      // TODO: validate each transform
      plugins.transforms.push(...transforms);
    }
  });
  session.log.debug('Plugins loaded');
  return plugins;
}
