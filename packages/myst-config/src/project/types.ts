import type { ProjectFrontmatter } from 'myst-frontmatter';
import type { ErrorRule } from '../errorRules/types.js';

export const VERSION = 1;

export enum PluginTypes {
  javascript = 'javascript',
  executable = 'executable',
}

export type PluginInfo = {
  type: PluginTypes;
  path: string;
};

export type ProjectConfig = ProjectFrontmatter & {
  remote?: string;
  index?: string;
  exclude?: string[];
  plugins?: PluginInfo[];
  error_rules?: ErrorRule[];
};
