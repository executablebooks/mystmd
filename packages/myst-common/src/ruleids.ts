export enum RuleId {
  // Frontmatter rules
  validConfigStructure = 'valid-config-structure',
  siteConfigExists = 'site-config-exists',
  projectConfigExists = 'project-config-exists',
  validSiteConfig = 'valid-site-config',
  validProjectConfig = 'valid-project-config',
  configHasNoDeprecatedFields = 'config-has-no-deprecated-fields',
  frontmatterIsYaml = 'frontmatter-is-yaml',
  validPageFrontmatter = 'valid-page-frontmatter',
  validFrontmatterExportList = 'valid-frontmatter-export-list',
  // Export rules
  docxRenders = 'docx-renders',
  jatsRenders = 'jats-renders',
  mdRenders = 'md-renders',
  mecaIncludesJats = 'meca-includes-jats',
  mecaExportsBuilt = 'meca-exports-built',
  mecaFilesCopied = 'meca-files-copied',
  pdfBuildCommandsAvailable = 'pdf-build-commands-available',
  pdfBuildsWithoutErrors = 'pdf-builds-without-errors',
  pdfBuilds = 'pdf-builds',
  texRenders = 'tex-renders',
  exportExtensionCorrect = 'export-extension-correct',
  exportArticleExists = 'export-article-exists',
  // Parse rules
  texParses = 'tex-parses',
  jatsParses = 'jats-parses',
  mystFileLoads = 'myst-file-loads',
  selectedFileIsProcessed = 'selected-file-is-processed',
  // Directive and role rules
  directiveRegistered = 'directive-registered',
  directiveKnown = 'directive-known',
  directiveArgumentCorrect = 'directive-argument-correct',
  directiveOptionsCorrect = 'directive-options-correct',
  directiveBodyCorrect = 'directive-body-correct',
  roleRegistered = 'role-registered',
  roleKnown = 'role-known',
  roleBodyCorrect = 'role-body-correct',
  // Project structure rules
  tocContentsExist = 'toc-contents-exist',
  encounteredLegacyTOC = 'encountered-legacy-toc',
  validTOCStructure = 'valid-toc-structure',
  validTOC = 'valid-toc',
  tocWritten = 'toc-written',
  // Image rules
  imageDownloads = 'image-downloads',
  imageExists = 'image-exists',
  imageFormatConverts = 'image-format-converts',
  imageCopied = 'image-copied',
  imageFormatOptimizes = 'image-format-optimizes',
  // Math rules
  mathLabelLifted = 'math-label-lifted',
  mathEquationEnvRemoved = 'math-equation-env-removed',
  mathEqnarrayReplaced = 'math-eqnarray-replaced',
  mathAlignmentAdjusted = 'math-alignment-adjusted',
  mathRenders = 'math-renders',
  // Reference rules
  referenceTemplateFills = 'reference-template-fills',
  identifierIsUnique = 'identifier-is-unique',
  referenceTargetResolves = 'reference-target-resolves',
  referenceSyntaxValid = 'reference-syntax-valid',
  referenceTargetExplicit = 'reference-target-explicit',
  footnoteReferencesDefinition = 'footnote-references-definition',
  intersphinxReferencesResolve = 'intersphinx-references-resolve',
  // Link rules
  mystLinkValid = 'myst-link-valid',
  sphinxLinkValid = 'sphinx-link-valid',
  rridLinkValid = 'rrid-link-valid',
  rorLinkValid = 'ror-link-valid',
  wikipediaLinkValid = 'wikipedia-link-valid',
  doiLinkValid = 'doi-link-valid',
  linkResolves = 'link-resolves',
  linkTextExists = 'link-text-exists',
  // Notebook rules
  notebookAttachmentsResolve = 'notebook-attachments-resolve',
  notebookOutputCopied = 'notebook-output-copied',
  // Content rules
  mdastSnippetImports = 'mdast-snippet-imports',
  includeContentFilters = 'include-content-filters',
  includeContentLoads = 'include-content-loads',
  gatedNodesJoin = 'gated-nodes-join',
  glossaryUsesDefinitionList = 'glossary-uses-definition-list',
  blockMetadataLoads = 'block-metadata-loads',
  // Citation rules
  citationIsUnique = 'citation-is-unique',
  bibFileExists = 'bib-file-exists',
  citationRenders = 'citation-renders',
  // Code rules
  codeMetadataLifted = 'code-metadata-lifted',
  codeMetatagsValid = 'code-metatags-valid',
  codeLangDefined = 'code-lang-defined',
  codeMetadataLoads = 'code-metadata-loads',
  inlineCodeMalformed = 'inline-code-malformed',
  inlineExpressionRenders = 'inline-expression-renders',
  // Static file rules
  staticFileCopied = 'static-file-copied',
  exportFileCopied = 'export-file-copied',
  sourceFileCopied = 'source-file-copied',
  templateFileCopied = 'template-file-copied',
  staticActionFileCopied = 'static-action-file-copied',
  // Plugins
  pluginLoads = 'plugin-loads',
  pluginExecutionFailed = 'plugin-execution-failed',
  // Container rules
  containerChildrenValid = 'container-children-valid',
  // File rules
  mystJsonValid = 'myst-json-valid',
}
