import {
  FRONTMATTER_ALIASES,
  PROJECT_FRONTMATTER_KEYS,
  validateProjectFrontmatterKeys,
} from 'myst-frontmatter';
import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateList,
  validateEnum,
} from 'simple-validators';
import { validateErrorRuleList } from '../errorRules/validators.js';
import { type ProjectConfig, type PluginInfo, PluginTypes } from './types.js';

const PROJECT_CONFIG_KEYS = {
  optional: ['remote', 'index', 'exclude', 'plugins', 'error_rules', ...PROJECT_FRONTMATTER_KEYS],
  alias: FRONTMATTER_ALIASES,
};

export function validatePluginInfo(input: any, opts: ValidationOptions): PluginInfo | undefined {
  if (typeof input === 'string') {
    input = { type: PluginTypes.javascript, path: input };
  }
  const value = validateObjectKeys(input, { required: ['type', 'path'] }, opts);
  if (value === undefined) {
    return undefined;
  }
  const path = validateString(value.path, incrementOptions('path', opts));
  if (path === undefined) {
    return undefined;
  }
  const type = validateEnum<PluginTypes>(value.type, {
    ...incrementOptions('type', opts),
    enum: PluginTypes,
  });
  if (type === undefined) {
    return undefined;
  }

  return { type, path };
}

function validateProjectConfigKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: ProjectConfig = validateProjectFrontmatterKeys(value, opts);
  if (defined(value.remote)) {
    output.remote = validateString(value.remote, incrementOptions('remote', opts));
  }
  if (defined(value.index)) {
    // TODO: Warn if these files don't exist
    output.index = validateString(value.index, incrementOptions('index', opts));
  }
  if (defined(value.exclude)) {
    output.exclude = validateList(
      value.exclude,
      { coerce: true, ...incrementOptions('exclude', opts) },
      (value, index: number) => {
        return validateString(value, incrementOptions(`exclude.${index}`, opts));
      },
    );
  }
  if (defined(value.plugins)) {
    output.plugins = validateList(
      value.plugins,
      incrementOptions('plugins', opts),
      (file, index: number) => {
        return validatePluginInfo(file, incrementOptions(`plugins.${index}`, opts));
      },
    );
  }

  if (defined(value.error_rules)) {
    const error_rules = validateErrorRuleList(value.error_rules, opts);
    if (error_rules) output.error_rules = error_rules;
  }
  return output;
}

/**
 * Validate ProjectConfig object against the schema
 */
export function validateProjectConfig(input: any, opts: ValidationOptions): ProjectConfig {
  const value = validateObjectKeys(input, PROJECT_CONFIG_KEYS, opts) || {};
  return validateProjectConfigKeys(value, opts);
}
