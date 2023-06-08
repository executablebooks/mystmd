import type MarkdownIt from 'markdown-it/lib';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import { admonitionDecorator } from './admonition';
import { proofDecorator } from './proof';

type Decorator = (state: StateCore, tokens: Token[]) => boolean | void;

const DEFAULT_DECORATORS = [
  admonitionDecorator,
  proofDecorator,
];

/**
 * Factory to implement the following rule:
 *
 * - Run through the parsed token array.
 * - Find all slices from `parsed_directive_open` to `parsed_directive_close`.
 * - Pass the slices through the decorators.
 */
function rule(decorators: Decorator[] = DEFAULT_DECORATORS) {

  return (state: StateCore) => {
    const tokens = state.tokens;
    const stack = [];
    for (let j = 0; j < tokens.length; ++j) {
      if (tokens[j].type === 'parsed_directive_open') {
        stack.push(j);
      } else if (tokens[j].type === 'parsed_directive_close') {
        let i = stack.pop()!;
        // in principle we'd like a view of the array from i to j;
        // hopefully all modern JS engines like V8 will optimize slice() as COW
        const slice = tokens.slice(i, j + 1);
        let subst = false;
        for (let fn of decorators) {
          subst = fn(state, slice) || subst;
        }
        if (subst) {
          tokens.splice(i, j - i + 1, ...slice);
          j = i + slice.length - 1;
        }
      }
    }
  };
}

/**
 * A markdown-it plugin for adding markup to parsed myst directives.
 */
export function htmystPlugin(md: MarkdownIt, ...decorators: Decorator[]) {
  md.core.ruler.after('run_directives', 'decorate_directives',
                      decorators.length ? rule(decorators) : rule());
}

export default htmystPlugin;

