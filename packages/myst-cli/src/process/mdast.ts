import path from 'node:path';
import { tic } from 'myst-cli-utils';
import type { GenericParent, IExpressionResult, PluginUtils, References } from 'myst-common';
import { fileError, fileWarn, RuleId } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import type { LinkTransformer } from 'myst-transforms';
import {
  basicTransformationsPlugin,
  htmlPlugin,
  footnotesPlugin,
  ReferenceState,
  MultiPageReferenceResolver,
  resolveReferencesTransform,
  mathPlugin,
  codePlugin,
  enumerateTargetsPlugin,
  keysTransform,
  linksTransform,
  MystTransformer,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  DOITransformer,
  joinGatesPlugin,
  glossaryPlugin,
  abbreviationPlugin,
  reconstructHtmlPlugin,
  inlineMathSimplificationPlugin,
} from 'myst-transforms';
import { unified } from 'unified';
import { select, selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { processPageFrontmatter, updateFileInfoFromFrontmatter } from '../frontmatter.js';
import { selectors } from '../store/index.js';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import type { RendererData } from '../transforms/types.js';

import {
  checkLinksTransform,
  embedTransform,
  importMdastFromJson,
  includeFilesTransform,
  liftCodeMetadataToBlock,
  transformCitations,
  transformImageFormats,
  transformLinkedDOIs,
  transformOutputsToCache,
  transformRenderInlineExpressions,
  transformThumbnail,
  StaticFileTransformer,
  propagateBlockDataToCode,
  transformBanner,
  reduceOutputs,
  transformPlaceholderImages,
  transformDeleteBase64UrlSource,
  transformWebp,
  transformOutputsToFile,
  transformImagesToEmbed,
  transformImagesWithoutExt,
  transformImagesToDisk,
  transformFilterOutputStreams,
  transformLiftCodeBlocksInJupytext,
} from '../transforms/index.js';
import type { ImageExtensions } from '../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { combineCitationRenderers } from './citations.js';
import { bibFilesInDir, selectFile } from './file.js';
import { loadIntersphinx } from './intersphinx.js';
import { frontmatterPartsTransform } from '../transforms/parts.js';
import { parseMyst } from './myst.js';
import { kernelExecutionTransform, LocalDiskCache } from 'myst-execute';
import type { IOutput } from '@jupyterlab/nbformat';
import { rawDirectiveTransform } from '../transforms/raw.js';

const LINKS_SELECTOR = 'link,card,linkBlock';

const pluginUtils: PluginUtils = { select, selectAll };

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in web
    // TODO: Remove once this is landed in myst-parser
    const result = h(node, 'comment');
    (result as any).value = node.value;
    return result;
  },
};

export type TransformFn = (
  session: ISession,
  opts: Parameters<typeof transformMdast>[1],
) => Promise<void>;

export async function transformMdast(
  session: ISession,
  opts: {
    file: string;
    projectPath?: string;
    projectSlug?: string;
    pageSlug?: string;
    imageExtensions?: ImageExtensions[];
    watchMode?: boolean;
    execute?: boolean;
    extraTransforms?: TransformFn[];
    minifyMaxCharacters?: number;
    index?: string;
    titleDepth?: number;
  },
) {
  const {
    file,
    projectPath,
    pageSlug,
    projectSlug,
    imageExtensions,
    extraTransforms,
    watchMode = false,
    minifyMaxCharacters,
    index,
    titleDepth,
    execute,
  } = opts;
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$getMdast(file)) return;
  const {
    mdast: mdastPre,
    kind,
    frontmatter: preFrontmatter,
    location,
    identifiers,
  } = cache.$getMdast(file)?.pre ?? {};
  if (!mdastPre || !kind || !location) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  // Use structuredClone in future (available in node 17)
  const mdast = JSON.parse(JSON.stringify(mdastPre)) as GenericParent;
  const frontmatter = processPageFrontmatter(
    session,
    preFrontmatter ?? {},
    {
      property: 'frontmatter',
      file,
      messages: {},
      errorLogFn: (message: string) => {
        fileError(vfile, message, { ruleId: RuleId.validPageFrontmatter });
      },
      warningLogFn: (message: string) => {
        fileWarn(vfile, message, { ruleId: RuleId.validPageFrontmatter });
      },
    },
    projectPath,
  );
  const references: References = {
    cite: { order: [], data: {} },
  };
  const state = new ReferenceState(file, { numbering: frontmatter.numbering, identifiers, vfile });
  cache.$internalReferences[file] = state;
  // Import additional content from mdast or other files
  frontmatterPartsTransform(session, file, mdast, frontmatter);
  importMdastFromJson(session, file, mdast);
  await includeFilesTransform(session, file, mdast, vfile);
  rawDirectiveTransform(mdast, vfile);
  // This needs to come before basic transformations since it may add labels to blocks
  liftCodeMetadataToBlock(session, vfile, mdast);

  const pipe = unified()
    .use(reconstructHtmlPlugin) // We need to group and link the HTML first
    .use(htmlPlugin, { htmlHandlers }) // Some of the HTML plugins need to operate on the transformed html, e.g. figure caption transforms
    .use(basicTransformationsPlugin, {
      parser: (content: string) => parseMyst(session, content, file),
      firstDepth: (titleDepth ?? 1) + (frontmatter.content_includes_title ? 0 : 1),
    })
    .use(inlineMathSimplificationPlugin)
    .use(mathPlugin, { macros: frontmatter.math })
    .use(glossaryPlugin, {}) // This should be before the enumerate plugins
    .use(abbreviationPlugin, { abbreviations: frontmatter.abbreviations })
    .use(enumerateTargetsPlugin, { state }) // This should be after math/container transforms
    .use(joinGatesPlugin);
  // Load custom transform plugins
  session.plugins?.transforms.forEach((t) => {
    if (t.stage !== 'document') return;
    pipe.use(t.plugin, undefined, pluginUtils);
  });
  await pipe.run(mdast, vfile);

  // This needs to come after basic transformations since meta tags are added there
  propagateBlockDataToCode(session, vfile, mdast);

  // Run the link transformations that can be done without knowledge of other files
  const intersphinx = projectPath ? await loadIntersphinx(session, { projectPath }) : [];
  const transformers = [
    new WikiTransformer(),
    new GithubTransformer(),
    new RRIDTransformer(),
    new DOITransformer(), // This also is picked up in the next transform
    new MystTransformer(intersphinx),
  ];
  linksTransform(mdast, vfile, { transformers, selector: LINKS_SELECTOR });

  // Initialize citation renderers for this (non-bib) file
  cache.$citationRenderers[file] = await transformLinkedDOIs(
    session,
    vfile,
    mdast,
    cache.$doiRenderers,
    file,
  );
  const rendererFiles = [file];
  if (projectPath) {
    rendererFiles.unshift(projectPath);
  } else {
    const localFiles = (await bibFilesInDir(session, path.dirname(file))) || [];
    rendererFiles.push(...localFiles);
  }
  // Combine file-specific citation renderers with project renderers from bib files
  const fileCitationRenderer = combineCitationRenderers(cache, ...rendererFiles);

  if (execute) {
    const cachePath = path.join(session.buildPath(), 'execute');
    await kernelExecutionTransform(mdast, vfile, {
      cache: new LocalDiskCache<(IExpressionResult | IOutput[])[]>(cachePath),
      sessionFactory: () => session.jupyterSessionManager(),
      frontmatter: frontmatter,
      ignoreCache: false,
      errorIsFatal: false,
      log: session.log,
    });
  }
  transformRenderInlineExpressions(mdast, vfile);
  await transformOutputsToCache(session, mdast, kind, { minifyMaxCharacters });
  transformFilterOutputStreams(mdast, vfile, frontmatter.settings);
  transformCitations(session, file, mdast, fileCitationRenderer, references);
  await unified()
    .use(codePlugin, { lang: frontmatter?.kernelspec?.language })
    .use(footnotesPlugin) // Needs to happen near the end
    .run(mdast, vfile);
  transformImagesToEmbed(mdast);
  transformImagesWithoutExt(session, mdast, file, { imageExtensions });
  const isJupytext = frontmatter.kernelspec || frontmatter.jupytext;
  if (isJupytext) transformLiftCodeBlocksInJupytext(mdast);
  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
  const useSlug = pageSlug !== index;
  const url = projectSlug
    ? `/${projectSlug}/${useSlug ? pageSlug : ''}`
    : `/${useSlug ? pageSlug : ''}`;
  const dataUrl = projectSlug ? `/${projectSlug}/${pageSlug}.json` : `/${pageSlug}.json`;
  updateFileInfoFromFrontmatter(session, file, frontmatter, url, dataUrl);
  const data: RendererData = {
    kind: isJupytext ? SourceFileKind.Notebook : kind,
    file,
    location,
    sha256,
    slug: pageSlug,
    dependencies: [],
    frontmatter,
    mdast,
    references,
  };
  const cachedMdast = cache.$getMdast(file);
  if (cachedMdast) cachedMdast.post = data;
  if (extraTransforms) {
    await Promise.all(
      extraTransforms.map(async (transform) => {
        await transform(session, opts);
      }),
    );
  }
  logMessagesFromVFile(session, vfile);
  if (!watchMode) log.info(toc(`📖 Built ${file} in %s.`));
}

export async function postProcessMdast(
  session: ISession,
  {
    file,
    checkLinks,
    pageReferenceStates,
    extraLinkTransformers,
  }: {
    file: string;
    checkLinks?: boolean;
    pageReferenceStates?: ReferenceState[];
    extraLinkTransformers?: LinkTransformer[];
  },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = selectFile(session, file);
  if (!mdastPost) return;
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const { mdast, dependencies } = mdastPost;
  const fileState = cache.$internalReferences[file];
  const state = pageReferenceStates
    ? new MultiPageReferenceResolver(pageReferenceStates, file, vfile)
    : fileState;
  // NOTE: This is doing things in place, we should potentially make this a different state?
  const transformers = [
    ...(extraLinkTransformers || []),
    new StaticFileTransformer(session, file), // Links static files and internally linked files
  ];
  linksTransform(mdast, state.vfile as VFile, {
    transformers,
    selector: LINKS_SELECTOR,
  });
  resolveReferencesTransform(mdast, state.vfile as VFile, { state });
  embedTransform(session, mdast, file, dependencies, state);
  const pipe = unified();
  session.plugins?.transforms.forEach((t) => {
    if (t.stage !== 'project') return;
    pipe.use(t.plugin, undefined, pluginUtils);
  });
  await pipe.run(mdast, vfile);

  // Ensure there are keys on every node after post processing
  keysTransform(mdast);
  logMessagesFromVFile(session, fileState.vfile);
  logMessagesFromVFile(session, vfile);
  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));
  if (checkLinks) await checkLinksTransform(session, file, mdastPost.mdast);
}

export async function finalizeMdast(
  session: ISession,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
  file: string,
  {
    imageWriteFolder,
    useExistingImages,
    imageAltOutputFolder,
    imageExtensions,
    optimizeWebp,
    simplifyFigures,
    processThumbnail,
    maxSizeWebp,
  }: {
    imageWriteFolder: string;
    useExistingImages?: boolean;
    imageAltOutputFolder?: string;
    imageExtensions?: ImageExtensions[];
    optimizeWebp?: boolean;
    simplifyFigures?: boolean;
    processThumbnail?: boolean;
    maxSizeWebp?: number;
  },
) {
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  if (simplifyFigures) {
    // Transform output nodes to images / text
    reduceOutputs(session, mdast, file, imageWriteFolder, {
      altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
    });
  }
  transformOutputsToFile(session, mdast, imageWriteFolder, {
    altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
    vfile,
  });
  if (!useExistingImages) {
    await transformImagesToDisk(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    // Must happen after transformImages
    await transformImageFormats(session, mdast, file, imageWriteFolder, {
      altOutputFolder: imageAltOutputFolder,
      imageExtensions,
    });
    if (optimizeWebp) {
      await transformWebp(session, { file, imageWriteFolder, maxSizeWebp });
    }
    if (processThumbnail) {
      // Note, the thumbnail transform must be **after** images, as it may read the images
      await transformThumbnail(session, mdast, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      });
      await transformBanner(session, file, frontmatter, imageWriteFolder, {
        altOutputFolder: imageAltOutputFolder,
        webp: optimizeWebp,
        maxSizeWebp,
      });
    }
  }
  await transformDeleteBase64UrlSource(mdast);
  if (simplifyFigures) {
    // This must happen after embedded content is resolved so all children are present on figures
    transformPlaceholderImages(mdast, { imageExtensions });
  }
  const cache = castSession(session);
  const postData = cache.$getMdast(file)?.post;
  if (postData) {
    postData.frontmatter = frontmatter;
    postData.mdast = mdast;
    updateFileInfoFromFrontmatter(session, file, frontmatter);
  }
  logMessagesFromVFile(session, vfile);
}
