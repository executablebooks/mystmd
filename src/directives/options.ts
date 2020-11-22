import Token from 'markdown-it/lib/token';
import { RuleCore } from 'markdown-it/lib/parser_core';
import { Directive, Directives } from './types';

const QUICK_PARAMETERS = /^:([a-zA-Z0-9\-_]+):(.*)$/;

function stripParams(content: string) {
  const data = {} as { [key: string]: string };
  let stopParams = false;
  const modified = content.split('\n').reduce((lines, line) => {
    const match = line.match(QUICK_PARAMETERS);
    if (stopParams || !match) {
      stopParams = true;
      return [...lines, line];
    }
    const [, key, value] = match;
    if (data[key] !== undefined) {
      console.warn(`There are multiple keys defined for ${key}: ${data[key]} and ${value.trim()}`);
    }
    data[key] = value.trim();
    return lines;
  }, [] as string[]);
  return { data, modified: modified.join('\n') };
}

function stripYaml(content: string) {
  const data = {};
  return { data, modified: content };
}

function addDirectiveOptions(
  directive: Directive, parent: Token, tokens: Token[], index: number,
) {
  const [open, token, close] = tokens.slice(index - 1, index + 2);
  const { content } = token;
  const firstLine = content.split('\n')[0].trim();
  const isYaml = firstLine === '---';
  const isQuickParams = QUICK_PARAMETERS.test(firstLine);
  if (!isYaml && !isQuickParams) return;
  const strip = isYaml ? stripYaml : stripParams;
  const { data, modified } = strip(token.content);
  const opts = directive.getOptions(data);
  // eslint-disable-next-line no-param-reassign
  parent.meta = { ...parent.meta, opts };
  token.content = modified;
  // Here we will stop the tags from rendering if there is no content that is not metadata
  // This stops empty paragraph tags from rendering.
  const noContent = modified.length === 0;
  if (open && noContent) open.hidden = true;
  token.hidden = noContent;
  if (close && noContent) close.hidden = true;
}

const parseOptions = (directives: Directives): RuleCore => (state) => {
  const { tokens } = state;
  let parent: Token | false = false;
  let directive: Directive | false = false;
  let gotOptions = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'container_directives_open') {
      directive = directives[token.attrGet('kind') ?? ''];
      parent = token;
      gotOptions = false;
    }
    if (token.type === 'container_directives_close') {
      if (parent) {
        // Ensure there is metadata always defined for containers
        parent.meta = { opts: {}, ...parent.meta };
      }
      parent = false;
    }
    if (parent && !gotOptions && token.type === 'inline') {
      addDirectiveOptions(directive as Directive, parent, tokens, index);
      gotOptions = true;
    }
  }
  return true;
};

export default parseOptions;
