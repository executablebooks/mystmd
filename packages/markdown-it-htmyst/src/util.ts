import type Token from 'markdown-it/lib/token';

export const ARG_OPEN = 'directive_arg_open';
export const ARG_CLOSE = 'directive_arg_close';
export const BODY_OPEN = 'directive_body_open';
export const BODY_CLOSE = 'directive_body_close';

/**
 * Find open/close pairs in a token array.
 */
export function* findTokenPair(
  tokens: Token[],
  pair: [string, string],
  from: number = 0
): Generator<number> {

  let pos = from - 1;
  let depth = 0;

  while (++pos < tokens.length) {
    depth += tokens[pos].nesting;
    if (depth == 1 && tokens[pos].type == pair[0]) {
      yield pos;
      break;
    }
  }

  while (++pos < tokens.length) {
    depth += tokens[pos].nesting;
    if (depth == 0 && tokens[pos].type == pair[1]) {
      yield pos;
      break;
    }
  }
}

