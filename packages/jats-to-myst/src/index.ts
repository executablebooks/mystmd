import type { Root } from 'myst-spec';
import { unified } from 'unified';
import { doi } from 'doi-utils';
import type { Plugin } from 'unified';
import { VFile } from 'vfile';
import type { MessageInfo, GenericNode, GenericParent } from 'myst-common';
import { toText, copyNode, fileError, RuleId } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { u } from 'unist-builder';
import { RefType } from 'jats-tags';
import { Jats } from 'jats-xml';
import { keysTransform } from 'myst-transforms';
import { MathMLToLaTeX } from 'mathml-to-latex';
import { js2xml } from 'xml-js';
import type { Handler, IJatsParser, JatsResult, Options, StateData } from './types.js';
import { basicTransformations } from './transforms/index.js';

function refTypeToReferenceKind(kind?: RefType): string | undefined {
  switch (kind) {
    case RefType.sec:
      return 'heading';
    case RefType.fig:
      return 'figure';
    case RefType.dispFormula:
      return 'equation';
    case RefType.table:
      return 'table';
    case RefType.custom:
      return undefined;
  }
}

function texMathFromNode(node: GenericNode) {
  const texMath = select('tex-math', node) as GenericNode;
  if (texMath && texMath.children?.[0].cdata) {
    return texMath.children?.[0].cdata;
  }
  selectAll('*', node).forEach((n: any) => {
    if (n.type.startsWith('mml:')) {
      n.type = n.type.substring(4);
    }
  });
  const math = select('math', node) as GenericNode;
  if (!math) return;
  [math, ...selectAll('math *', node)].forEach((n: any) => {
    const { type, value, children, ...attributes } = n;
    if (type === 'text') {
      n.type = 'text';
      n.text = value;
      delete n.value;
    } else {
      n.type = 'element';
      n.name = type;
      n.elements = children;
      n.attributes = attributes;
      delete n.children;
      Object.keys(attributes).forEach((k) => {
        delete n[k];
      });
    }
  });
  return MathMLToLaTeX.convert(js2xml({ type: 'element', name: 'root', elements: [math] }));
}

type Attributes = Record<string, any>;

const handlers: Record<string, Handler> = {
  body(node, state) {
    state.renderChildren(node);
  },
  text(node, state) {
    state.text(node.value);
  },
  p(node, state) {
    state.renderInline(node, 'paragraph');
  },
  heading(node, state) {
    state.renderInline(node, 'heading', {
      enumerated: true,
      label: node.id,
      identifier: node.id,
      depth: node.depth,
    });
  },
  block(node, state) {
    state.renderInline(node, 'block', { data: { part: node.part ?? node['sec-type'] } });
  },
  ['disp-quote'](node, state) {
    state.renderInline(node, 'blockquote', { kind: node['content-type'] });
  },
  // definitionList(node, state) {
  //   state.renderInline(node, 'def-list');
  // },
  // definitionItem(node, state) {
  //   state.renderInline(node, 'def-item');
  // },
  // definitionTerm(node, state) {
  //   state.renderInline(node, 'term');
  // },
  // definitionDescription(node, state) {
  //   state.renderInline(node, 'def');
  // },
  // code(node, state) {
  //   const { lang } = node as Code;
  //   state.renderInline(node, 'code', { language: lang });
  // },
  list(node, state) {
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/list.html
    state.renderInline(node, 'list', {
      ordered: node['list-type'] === 'ordered',
    });
  },
  ['list-item'](node, state) {
    state.renderInline(node, 'listItem');
  },
  // thematicBreak() {
  //   // The use of thematic breaks should be restricted to use inside table cells.
  //   // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/hr.html
  // },
  ['inline-formula'](node, state) {
    const texMath = texMathFromNode(node);
    if (texMath) {
      state.addLeaf('inlineMath', {
        value: texMath,
        label: node.id,
        identifier: node.id,
      });
    } else {
      state.renderChildren(node);
    }
  },
  ['disp-formula'](node, state) {
    const texMath = texMathFromNode(node);
    if (texMath) {
      state.addLeaf('math', {
        value: texMath,
        label: node.id,
        identifier: node.id,
      });
    } else {
      state.renderChildren(node);
    }
  },
  // mystRole(node, state) {
  //   state.renderChildren(node);
  // },
  // mystDirective(node, state) {
  //   state.renderChildren(node);
  // },
  // comment() {
  //   // Do not archive comments
  // },
  bold(node, state) {
    state.renderInline(node, 'strong');
  },
  italic(node, state) {
    state.renderInline(node, 'emphasis');
  },
  underline(node, state) {
    state.renderInline(node, 'underline');
  },
  monospace(node, state) {
    state.renderInline(node, 'inlineCode');
  },
  sub(node, state) {
    state.renderInline(node, 'subscript');
  },
  sup(node, state) {
    state.renderInline(node, 'superscript');
  },
  strike(node, state) {
    state.renderInline(node, 'delete');
  },
  sc(node, state) {
    state.renderInline(node, 'smallcaps');
  },
  // break(node, state) {
  //   // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html
  //   state.addLeaf('break');
  // },
  // // abbreviation(node, state) {
  // //   // TODO: \newacronym{gcd}{GCD}{Greatest Common Divisor}
  // //   // https://www.overleaf.com/learn/latex/glossaries
  // //   state.renderChildren(node, true);
  // // },
  ['ext-link'](node, state) {
    state.renderInline(node, 'link', { url: node['xlink:href'] });
  },
  ['boxed-text'](node, state) {
    state.renderInline(node, 'admonition', { kind: 'info' });
  },
  admonitionTitle(node, state) {
    // This is created in a transform!
    state.renderInline(node, 'admonitionTitle');
  },
  // attrib(node, state) {
  //   // This is used inside of disp-quotes
  //   state.renderInline(node, 'attrib');
  // },
  // image(node, state) {
  //   if (node.url?.startsWith('http')) {
  //     state.warn(`Image URL is remote (${node.url})`, node, 'image');
  //   }
  //   if (state.data.isInContainer && node.alt) {
  //     state.openNode('alt-text');
  //     state.text(node.alt);
  //     state.closeNode();
  //   }
  //   // TOOD: identifier?
  //   state.addLeaf('graphic', { 'xlink:href': node.url });
  // },
  ['fig-group'](node, state) {
    state.openNode('tabSet');
    node.children?.forEach((n) => {
      state.openNode('tabItem', {
        title: toText(select('label', n)),
        sync: toText(select('label', n)),
      });
      state.renderChildren({ children: [n] });
      state.closeNode();
    });
    state.closeNode();
  },
  fig(node, state) {
    const caption = select('caption', node) as GenericNode;
    const graphic = select('graphic', node) as GenericNode;
    const title = select('title', node) as GenericNode;
    state.openNode('container', { label: node.id, identifier: node.id, kind: 'figure' });
    const link = graphic?.['xlink:href'];
    if (link) {
      state.addLeaf('image', { url: link });
    }
    state.openNode('caption');
    if (title) {
      state.openNode('strong');
      state.renderChildren(title);
      state.closeNode();
    }
    // caption number?
    state.renderChildren(caption);
    state.closeNode();
    state.closeNode();
  },
  ['table-wrap'](node, state) {
    const caption = (select('caption', node) ?? select('lable', node)) as GenericNode;
    state.openNode('container', { label: node.id, identifier: node.id, kind: 'table' });
    if (caption) {
      state.openNode('caption');
      state.renderChildren(caption);
      state.closeNode();
    }
    state.renderChildren(node);
    state.closeNode();
  },
  table(node, state) {
    state.openNode('table');
    state.renderChildren(node);
    state.closeNode();
  },
  thead(node, state) {
    state.renderChildren(node);
  },
  tbody(node, state) {
    state.renderChildren(node);
  },
  tfoot(node, state) {
    state.renderChildren(node);
  },
  tr(node, state) {
    state.openNode('tableRow');
    state.renderChildren(node);
    state.closeNode();
  },
  th(node, state) {
    const { align, colspan, rowspan } = node;
    state.openNode('tableCell', { header: true, align, colspan, rowspan });
    state.renderChildren(node);
    state.closeNode();
  },
  td(node, state) {
    const { align, colspan, rowspan } = node;
    state.openNode('tableCell', { align, colspan, rowspan });
    state.renderChildren(node);
    state.closeNode();
  },
  break(node, state) {
    state.addLeaf('break');
  },
  ['named-content'](node, state) {
    // TODO: Not just ignore things marked as named-content
    state.renderChildren(node);
  },
  // container(node, state) {
  //   state.data.isInContainer = true;
  //   switch (node.kind) {
  //     case 'figure': {
  //       state.renderInline(node, 'fig');
  //       break;
  //     }
  //     case 'table': {
  //       state.renderInline(node, 'table-wrap');
  //       break;
  //     }
  //     case 'quote': {
  //       // This is transformed in containers.ts
  //       state.renderChildren(node);
  //       break;
  //     }
  //     case 'code': {
  //       // This is transformed in containers.ts
  //       state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
  //       break;
  //     }
  //     default: {
  //       state.error(`Unhandled container kind of ${node.kind}`, node, 'container');
  //       state.renderChildren(node);
  //     }
  //   }
  //   delete state.data.isInContainer;
  // },
  // caption(node, state) {
  //   state.renderInline(node, 'caption');
  // },
  // captionNumber(node, state) {
  //   state.renderInline(node, 'label');
  // },
  // crossReference(node, state) {
  //   // Look up reference and add the text
  //   const { identifier, kind } = node as CrossReference;
  //   const attrs: Attributes = { 'ref-type': referenceKindToRefType(kind), rid: identifier };
  //   if (attrs['ref-type'] === RefType.custom && kind) {
  //     attrs['custom-type'] = kind;
  //   }
  //   state.renderInline(node, 'xref', attrs);
  // },
  // citeGroup(node, state) {
  //   if (state.options.citestyle === 'numerical-only') {
  //     state.write('\\cite{');
  //   } else if (state.options.bibliography === 'biblatex') {
  //     const command = node.kind === 'narrative' ? 'textcite' : 'parencite';
  //     state.write(`\\${command}{`);
  //   } else {
  //     const tp = node.kind === 'narrative' ? 't' : 'p';
  //     state.write(`\\cite${tp}{`);
  //   }
  //   state.renderChildren(node, true, ', ');
  //   state.write('}');
  // },
  // cite(node, state, parent) {
  //   if (!state.options.bibliography) {
  //     state.usePackages('natbib');
  //     // Don't include biblatex in the package list
  //   }
  //   if (parent.type === 'citeGroup') {
  //     state.write(node.label);
  //   } else if (state.options.bibliography === 'biblatex') {
  //     state.write(`\\textcite{${node.label}}`);
  //   } else {
  //     state.write(`\\cite{${node.label}}`);
  //   }
  // },
  xref(node, state) {
    const refType: RefType = node['ref-type'];
    switch (refType) {
      case RefType.bibr:
        state.renderInline(node, 'cite', {
          label: node.rid,
          identifier: node.rid,
          kind: 'narrative',
        });
        return;
      case RefType.sec:
      case RefType.fig:
      case RefType.dispFormula:
      case RefType.table: {
        const kind = refTypeToReferenceKind(refType);
        state.renderInline(node, 'crossReference', { label: node.rid, identifier: node.rid, kind });
        return;
      }
      default: {
        state.renderInline(node, 'crossReference', { identifier: node.rid });
        state.warn(`Unknown ref-type of ${refType}`, node);
        return;
      }
    }
  },
};

const DEFAULT_HANDLERS = { ...handlers };

export class JatsParser implements IJatsParser {
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  stack: GenericNode[] = [];
  jats: Jats;

  unhandled: string[] = [];

  constructor(file: VFile, jats: Jats, opts?: Options) {
    this.file = file;
    this.jats = jats;
    this.options = opts ?? {};
    this.data = {};
    this.stack = [{ type: 'root', children: [] }];
    this.handlers = opts?.handlers ?? DEFAULT_HANDLERS;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `jats-to-myst:${source}` : 'jats-to-myst',
      ruleId: RuleId.jatsParses,
    });
  }

  error(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `jats-to-myst:${source}` : 'jats-to-myst',
      ruleId: RuleId.jatsParses,
    });
  }

  pushNode(el?: GenericNode) {
    const top = this.top();
    if (this.stack.length && el && 'children' in top) top.children?.push(el);
    return el;
  }

  text(text?: string) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (last?.type === 'text') {
      // The last node is also text, merge it
      last.value += `${value}`;
      return last;
    }
    const node = u('text', value);
    top.children?.push(node);
    return node;
  }

  renderChildren(node: GenericNode) {
    node.children?.forEach((child) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, node);
      } else {
        this.unhandled.push(child.type);
        fileError(this.file, `Unhandled JATS conversion for node of "${child.type}"`, {
          source: 'myst-to-jats',
          ruleId: RuleId.jatsParses,
        });
      }
    });
  }

  renderInline(node: GenericNode, name: string, attributes?: Attributes) {
    this.openNode(name, { ...attributes });
    if ('children' in node) {
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.text(node.value);
    }
    this.closeNode();
  }

  addLeaf(name: string, attributes?: Attributes) {
    this.openNode(name, attributes, true);
    this.closeNode();
  }

  openNode(name: string, attributes?: Attributes, isLeaf = false) {
    const node: GenericNode = { type: name, ...attributes };
    if (!isLeaf) node.children = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.pushNode(node);
  }
}

export const jatsToMystPlugin: Plugin<[Jats, Options?], Root, Root> = function (jats, opts) {
  this.Compiler = (node: GenericParent, file: VFile) => {
    const tree = jats.abstract
      ? {
          type: 'root',
          children: [
            u('block', { part: 'abstract' }, copyNode(jats.abstract).children),
            ...copyNode(node).children,
          ],
        }
      : copyNode(node);
    // Can do better than this in the future, but for now, just put them at the end!
    const floatsGroup = selectAll('floats-group', jats.tree) as GenericParent[];
    if (floatsGroup.length > 0) {
      floatsGroup.forEach((g) => {
        tree.children.push(...g.children);
      });
    }
    basicTransformations(tree, file);
    const state = new JatsParser(file, jats, opts ?? { handlers });
    state.renderChildren(tree);
    while (state.stack.length > 1) state.closeNode();
    console.log([...new Set(state.unhandled)].join(', '));
    const referenceData = Object.fromEntries(
      jats.references.map((bibr) => {
        const id = bibr.id;
        const names = selectAll('name,string-name', bibr)
          .map((n) => `${toText(select('surname', n))}, ${toText(select('given-names', n))}`)
          .join(', ');
        const year = toText(select('year', bibr));
        const title = toText(select('article-title', bibr));
        const source = toText(select('source', bibr));
        const volume = toText(select('volume', bibr));
        const fpage = toText(select('fpage', bibr));
        const lpage = toText(select('lpage', bibr));
        const doiElement = selectAll('ext-link,[pub-id-type=doi]', bibr).find((e) =>
          doi.validate(toText(e)),
        );
        const doiString = doiElement ? toText(doiElement) : undefined;
        const doiLink = doiString ? ` <a href=${doi.buildUrl(doiString)}>${doiString}</a>` : '';
        return [
          id,
          {
            html: `${names}. (${year}). ${title}. <i>${source}</i>, <i>${volume}</i>, ${fpage}-${lpage}.${doiLink}`,
            doi: doiString,
          },
        ];
      }),
    );

    const referenceOrder: string[] = [];
    const xrefs = selectAll('xref[ref-type=bibr]', jats.body) as GenericNode[];
    xrefs.forEach((xref) => {
      const rid = xref.rid;
      // should do a set or something to speed this up
      if (!referenceOrder.includes(rid)) {
        referenceOrder.push(rid);
      }
    });
    const treeFinal = state.stack[0] as Root;
    keysTransform(treeFinal);
    const result: JatsResult = {
      references: { order: referenceOrder, data: referenceData },
      tree: treeFinal,
    };
    file.result = result;
    return file;
  };

  return (node: Root) => {
    return node;
  };
};

export function jatsToMystTransform(
  data: string | Jats,
  opts?: Options,
): { tree: Root; jats: Jats; file: VFile; references: any } {
  const jats = typeof data === 'string' ? new Jats(data) : data;
  const file = new VFile();
  const pipe = unified().use(jatsToMystPlugin, jats, opts);
  const vfile = pipe.stringify(jats.body as any, file);
  const references = (vfile as any).result.references;
  const tree = (vfile as any).result.tree as Root;
  return { tree, jats, file, references };
}
