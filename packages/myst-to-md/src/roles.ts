import type { Handle, Info, State } from 'mdast-util-to-markdown';
import type { Parent } from 'mdast';
import { defaultHandlers } from 'mdast-util-to-markdown';

type NestedState = State & {
  roleLevel?: number;
  maxRoleLevel?: number;
};

function incrementNestedLevel(state: NestedState, value?: number) {
  const inc = value ?? 1;
  if (!state.roleLevel) state.roleLevel = 0;
  if (!state.maxRoleLevel) state.maxRoleLevel = 0;
  state.roleLevel += inc;
  if (state.roleLevel > state.maxRoleLevel) state.maxRoleLevel = state.roleLevel;
}

function popNestedLevel(state: NestedState, value?: number) {
  const dec = value ?? 1;
  if (!state.roleLevel) state.roleLevel = 0;
  if (!state.maxRoleLevel) state.maxRoleLevel = 0;
  const nesting = state.maxRoleLevel - state.roleLevel;
  state.roleLevel = state.roleLevel - dec;
  if (state.roleLevel < 0) state.roleLevel = 0;
  if (!state.roleLevel) delete state.maxRoleLevel;
  return nesting;
}

/**
 * Handler for any role with children nodes
 *
 * This adds multiple backticks in cases where roles are nested
 */
function writePhrasingRole(name: string) {
  return (node: any, _: Parent | undefined, state: NestedState, info: Info): string => {
    incrementNestedLevel(state);
    const tracker = state.createTracker(info);
    let content = state.containerPhrasing(node, {
      before: '`',
      after: '`',
      ...tracker.current(),
    });
    if (content.startsWith('`')) content = ' ' + content;
    if (content.endsWith('`')) content += ' ';
    const nesting = popNestedLevel(state);
    const marker = '`'.repeat(nesting + 1);
    return tracker.move(`{${name}}${marker}${content}${marker}`);
  };
}

/**
 * Inline code handler
 *
 * This extends the default inlineCode handler by incrementing the max role nesting
 * level.
 */
function inlineCode(node: any, _: Parent | undefined, state: NestedState): string {
  const value = defaultHandlers.inlineCode(node, undefined, state);
  const increment = value.startsWith('``') && value.endsWith('``') ? 2 : 1;
  incrementNestedLevel(state, increment);
  popNestedLevel(state, increment);
  return value;
}

/**
 * Handler for any role with a static value, not children
 */
function writeStaticRole(name: string) {
  return (node: any, _: Parent | undefined, state: NestedState): string => {
    return `{${name}}${inlineCode(node, undefined, state)}`;
  };
}

/**
 * Generic MyST role handler
 *
 * This uses the role name/value and ignores any children nodes
 */
function mystRole(node: any, parent: Parent | undefined, state: NestedState): string {
  return writeStaticRole(node.name)(node, parent, state);
}

/**
 * Abbreviation role handler
 *
 * This is almost identical to 'writePhrasingRole' except it appends the title
 * before closing the backticks.
 */
function abbreviation(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  incrementNestedLevel(state);
  const tracker = state.createTracker(info);
  let content = state.containerPhrasing(node, {
    before: '`',
    after: '`',
    ...tracker.current(),
  });
  if (node.title) content += ` (${node.title})`;
  if (content.startsWith('`')) content = ' ' + content;
  if (content.endsWith('`')) content += ' ';
  const nesting = popNestedLevel(state);
  const marker = '`'.repeat(nesting + 1);
  return tracker.move(`{abbr}${marker}${content}${marker}`);
}

/**
 * Cite role handler
 */
function cite(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  incrementNestedLevel(state);
  popNestedLevel(state);
  const tracker = state.createTracker(info);
  return tracker.move(`{cite}\`${node.label}\``);
}

/**
 * Cite group role handler
 */
function citeGroup(node: any, _: Parent | undefined, state: NestedState, info: Info): string {
  incrementNestedLevel(state);
  popNestedLevel(state);
  const tracker = state.createTracker(info);
  const name = `cite${node.kind === 'narrative' ? ':t' : ':p'}`;
  const labels = ((node.children ?? []) as { type: string; label: string }[])
    .filter((n) => n.type === 'cite')
    .map((n) => n.label)
    .join(',');
  return tracker.move(`{${name}}\`${labels}\``);
}

export const roleHandlers: Record<string, Handle> = {
  subscript: writePhrasingRole('sub'),
  superscript: writePhrasingRole('sup'),
  delete: writePhrasingRole('del'),
  underline: writePhrasingRole('u'),
  smallcaps: writePhrasingRole('sc'),
  abbreviation,
  inlineMath: writeStaticRole('math'),
  inlineCode,
  cite,
  citeGroup,
  mystRole,
};
