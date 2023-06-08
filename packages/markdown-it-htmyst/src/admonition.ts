import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import {
  findTokenPair,
  ARG_OPEN,
  ARG_CLOSE,
  BODY_OPEN,
  BODY_CLOSE,
} from './util';

const ADMONITIONS = [
  'admonition',
  'attention',
  'caution',
  'danger',
  'error',
  'hint',
  'important',
  'note',
  'seealso',
  'tip',
  'warning',
];

/**
 * Enrich admonition directives with markup tags.
 *
 * @return true if new tokens are inserted into the array
 */
export function admonitionDecorator(state: StateCore, tokens: Token[]): boolean {

  let kind = tokens[0].info;

  if (!ADMONITIONS.includes(kind)) return false;

  let ins = false;
  let [...arg] = findTokenPair(tokens, [ARG_OPEN, ARG_CLOSE], 1);

  if (arg[1] === undefined) {
    const title = new state.Token('inline', '', 0);
    title.content = kind.replace(/^./, char => char.toUpperCase());
    title.children = [];
    tokens.splice(1, 0, new state.Token(ARG_OPEN, 'p', 1),
                  title, new state.Token(ARG_CLOSE, 'p', -1));
    arg = [1, 3];
    ins = true;
  }

  let [...body] = findTokenPair(tokens, [BODY_OPEN, BODY_CLOSE], 1);

  tokens.at(0).attrSet('class', `admonition ${kind}`);
  tokens.at(arg[0]).attrSet('class', 'admonition-title');

  [0, -1].map(tokens.at, tokens).forEach(token => {
    token.hidden = false;
    token.block = true;
    token.tag = 'aside';
  });

  arg.map(tokens.at, tokens).forEach(token => {
    token.hidden = false;
    token.block = true;
    token.tag = 'p';
  });

  body.map(tokens.at, tokens).forEach(token => {
    token.hidden = false;
    token.block = true;
    token.tag = 'div';
  });

  return ins;
}

