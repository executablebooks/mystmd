import fs from 'node:fs';
import { parse } from 'node:path';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import {
  RuleId,
  plural,
  type MystPlugin,
  type DirectiveSpec,
  type RoleSpec,
  type TransformSpec,
} from 'myst-common';
import { addWarningForFile } from './utils/addWarningForFile.js';
import { loadPyodide } from 'pyodide';

function moveToJS(result: any): any {
  const value = result.toJs({ create_pyproxies: false, dict_converter: Object.fromEntries });
  result.destroy();
  return value;
}

function maybeMoveToJS(result: any) : any {
   return "toJs" in result ? moveToJS(result) : result;
}

function wrapPythonDirective(directive: any): DirectiveSpec {
  return {
    ...directive.toJs(),
    validate:
      directive.get('validate') &&
      ((data: any, vfile: any) => directive.get('validate').callRelaxed(data, vfile).toJs()),
    run: (data: any, vfile: any, ctx: any) =>
      moveToJS(directive.get('run').callRelaxed(data, vfile, ctx)),
  } as any as DirectiveSpec;
}
function wrapPythonRole(role: any): RoleSpec {
  return {
    ...role.toJs(),
    validate:
      role.get('validate') &&
      ((data: any, vfile: any) => role.get('validate').callRelaxed(data, vfile).toJs()),
    run: (data: any, vfile: any) => moveToJS(role.get('run').callRelaxed(data, vfile)),
  } as any as RoleSpec;
}
function wrapPythonTransform(transform: any): TransformSpec {
  return {
    ...transform.toJs(),
    plugin: (opts: any, utils: any) => {
      const closure = transform.get('plugin').callRelaxed(opts, utils);

      return (node: any) => {
        const result = maybeMoveToJS(closure.callRelaxed(node));
        closure.destroy();
        return result;
      };
    },
  } as any as TransformSpec;
}

function proxyPythonModule(pyodide: any): { plugin: MystPlugin } | undefined {
  const plugin = pyodide.globals.get('plugin');
  if (!plugin) {
    return undefined;
  }
  return {
    plugin: {
      name: plugin.get('name'),
      author: plugin.get('author'),
      license: plugin.get('license'),
      directives: (plugin.get('directives') || []).map(wrapPythonDirective),
      roles: (plugin.get('roles') || []).map(wrapPythonRole),
      transforms: (plugin.get('transforms') || []).map(wrapPythonTransform),
    },
  };
}

/**
 * Load user-defined plugin modules declared in the project frontmatter
 *
 * @param session session with logging
 */
export async function loadPlugins(session: ISession): Promise<MystPlugin> {
  let configPlugins: string[] = [];
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
  configPlugins = [...new Set(configPlugins)];
  const plugins: MystPlugin = {
    directives: [],
    roles: [],
    transforms: [],
  };
  if (configPlugins.length === 0) {
    return plugins;
  }
  session.log.debug(`Loading plugins: "${configPlugins.join('", "')}"`);
  const modules = await Promise.all(
    configPlugins.map(async (filename) => {
      const { ext } = parse(filename);
      if (!fs.statSync(filename).isFile || !(ext === '.mjs' || ext === '.py')) {
        addWarningForFile(
          session,
          filename,
          `Unknown plugin "${filename}", it must be a .mjs or .py file`,
          'error',
          {
            ruleId: RuleId.pluginLoads,
          },
        );
        return null;
      }
      let module: any;
      switch (ext) {
        case '.mjs':
          try {
            module = await import(filename);
          } catch (error) {
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
            addWarningForFile(session, filename, `Error reading plugin: ${error}`, 'error', {
              ruleId: RuleId.pluginLoads,
            });
            return null;
          }
          return { filename, module };
        case '.py':
          const pyodide = await loadPyodide({
            stdout: (msg) => session.log.debug(`stdout from Python plugin: ${msg}`),
            stderr: (msg) => session.log.error(`stderr from Python plugin: ${msg}`),
          });
          const scriptBody = await fs.promises.readFile(filename, { encoding: 'utf-8' });
          await pyodide.runPythonAsync(scriptBody);
          return { filename, module: proxyPythonModule(pyodide), pyodide };
        default:
          throw new Error('unexpected code path');
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
      `🔌 ${plugin?.name ?? 'Unnamed Plugin'} (${pluginLoader.filename}) loaded: ${plural(
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
