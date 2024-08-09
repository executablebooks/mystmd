import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.js';
import { u } from 'unist-builder';
import type { DirectiveSpec, GenericNode, GenericParent, RoleSpec } from 'myst-common';
import type { Text } from 'myst-spec';
import type { VFile } from 'vfile';
import type { MathExtensionOptions } from './math.js';

const UNHIDDEN_TOKENS = new Set([
  'parsed_directive_open',
  'parsed_directive_close',
  'directive_arg_open',
  'directive_arg_close',
  'directive_option_open',
  'directive_option_close',
  'directive_body_open',
  'directive_body_close',
  'parsed_role_open',
  'parsed_role_close',
  'role_body_open',
  'role_body_close',
]);

export type MdastOptions = {
  handlers?: Record<string, TokenHandlerSpec>;
  hoistSingleImagesOutofParagraphs?: boolean;
  nestBlocks?: boolean;
};

export type TokenHandlerSpec = {
  type: string;
  getAttrs?: (
    token: Token,
    tokens: Token[],
    index: number,
    state: MarkdownParseState,
  ) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

export type AllOptions = {
  vfile: VFile;
  markdownit: MarkdownIt.Options;
  extensions: {
    smartquotes?: boolean;
    colonFences?: boolean;
    frontmatter?: boolean;
    math?: boolean | MathExtensionOptions;
    footnotes?: boolean;
    citations?: boolean;
    deflist?: boolean;
    tasklist?: boolean;
    tables?: boolean;
    blocks?: boolean;
    strikethrough?: boolean;
  };
  mdast: MdastOptions;
  directives: DirectiveSpec[];
  roles: RoleSpec[];
};

export function withoutTrailingNewline(str: string) {
  return str[str.length - 1] == '\n' ? str.slice(0, str.length - 1) : str;
}

/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosely based on prosemirror-markdown
 */
export class MarkdownParseState {
  src: string;
  stack: GenericNode[];
  handlers: Record<string, TokenHandler>;
  constructor(src: string, handlers: Record<string, TokenHandlerSpec>) {
    this.src = src;
    this.stack = [u('root', [] as GenericParent[])];
    this.handlers = getTokenHandlers(handlers);
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  addNode(node?: GenericNode) {
    const top = this.top();
    if (this.stack.length && node && 'children' in top) top.children?.push(node);
    return node;
  }

  addText(text: string, token: Token, type = 'text', attrs?: Record<string, any>) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !type || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (type === 'text' && last?.type === type) {
      // The last node is also text, merge it with a space
      last.value += `${value}`;
      return last;
    }
    const node: Text = { type: type as 'text', ...attrs, value };
    top.children?.push(node);
    this.addPositionsToNode(node, token);
    return node;
  }

  openNode(type: string, token: Token, attrs: Record<string, any>, isLeaf = false) {
    const node: GenericNode = { type, ...attrs };
    this.addPositionsToNode(node, token);
    if (!isLeaf) (node as GenericParent).children = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.addNode(node);
  }

  parseTokens(tokens?: Token[] | null) {
    tokens?.forEach((token, index) => {
      if (token.hidden && !UNHIDDEN_TOKENS.has(token.type)) return;
      const handler = this.handlers[token.type];
      if (!handler) {
        throw new Error(`Token type ${token.type} not supported by tokensToMyst parser`);
      }
      handler(this, token, tokens, index);
    });
  }

  _lastPosition: GenericNode['position'];

  addPositionsToNode(node: GenericNode, token: Token) {
    const col = (token as any).col ?? [0, 0];
    if (token.map) {
      node.position = {
        start: { line: token.map[0] + 1, column: col[0] + 1 },
        end: { line: token.map[1], column: col[1] + 1 },
      };
    } else if (this._lastPosition) {
      node.position = {
        start: { line: this._lastPosition.start.line, column: col[0] + 1 },
        end: { line: this._lastPosition.start.line, column: col[1] + 1 },
      };
    }
    if (node.position) {
      this._lastPosition = node.position;
    }
  }
}

type TokenHandler = (
  state: MarkdownParseState,
  token: Token,
  tokens: Token[],
  index: number,
) => void;

function getAttrs(
  state: MarkdownParseState,
  spec: TokenHandlerSpec,
  token: Token,
  tokens: Token[],
  index: number,
) {
  const attrs = spec.getAttrs?.(token, tokens, index, state) || spec.attrs || {};
  if ('type' in attrs) throw new Error('You can not have "type" as attrs.');
  if ('children' in attrs) throw new Error('You can not have "children" as attrs.');
  return attrs;
}

function noCloseToken(spec: TokenHandlerSpec, type: string) {
  return spec.noCloseToken || type == 'code_inline' || type == 'code_block' || type == 'fence';
}

function getTokenHandlers(specHandlers: Record<string, TokenHandlerSpec>) {
  const handlers: Record<string, TokenHandler> = {};

  Object.entries(specHandlers).forEach(([type, spec]) => {
    const nodeType = spec.type;
    if (noCloseToken(spec, type)) {
      handlers[type] = (state, tok, tokens, i) => {
        if (spec.isText) {
          state.addText(
            withoutTrailingNewline(tok.content),
            tok,
            spec.type,
            getAttrs(state, spec, tok, tokens, i),
          );
          return;
        }
        state.openNode(nodeType, tok, getAttrs(state, spec, tok, tokens, i), spec.isLeaf);
        state.addText(withoutTrailingNewline(tok.content), tok);
        state.closeNode();
      };
    } else {
      handlers[type + '_open'] = (state, tok, tokens, i) =>
        state.openNode(nodeType, tok, getAttrs(state, spec, tok, tokens, i));
      handlers[type + '_close'] = (state) => state.closeNode();
    }
  });

  handlers.text = (state, tok) => state.addText(tok.content, tok);
  handlers.inline = (state, tok) => state.parseTokens(tok.children);
  handlers.softbreak = handlers.softbreak || ((state, tok) => state.addText('\n', tok));
  return handlers;
}
