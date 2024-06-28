# myst-transforms

## 1.3.19

### Patch Changes

- myst-to-html@1.5.0

## 1.3.18

### Patch Changes

- 2a8fe63f: Combine html nodes split by whitespace in reconstructHtml transform
- Updated dependencies [1e2092dc]
  - myst-common@1.4.7
  - myst-frontmatter@1.4.7
  - myst-spec-ext@1.4.7

## 1.3.17

### Patch Changes

- 1b6ee5e2: Support HTML video tags
- Updated dependencies [4cea894]
  - myst-frontmatter@1.4.6
  - myst-common@1.4.6
  - myst-spec-ext@1.4.6

## 1.3.16

### Patch Changes

- 3d93fdb9: Footnotes that are reused should have the same number
- Updated dependencies [ad969c37]
  - myst-frontmatter@1.4.5
  - myst-common@1.4.5
  - myst-spec-ext@1.4.5
  - myst-to-html@1.4.4

## 1.3.15

### Patch Changes

- dd007024: Fix link transform for card links
- 65ade89: Consume new math structure
- Updated dependencies [65ade89]
- Updated dependencies [435c4329]
  - myst-frontmatter@1.4.4
  - myst-common@1.4.4
  - myst-spec-ext@1.4.4

## 1.3.14

### Patch Changes

- dfbcb62d: Fix broken term xrefs by no removing identifier on xref node
- e82914e2: Better error messages for empty link text
- Updated dependencies [f4d5231]
  - myst-frontmatter@1.4.3
  - myst-common@1.4.3
  - myst-spec-ext@1.4.3

## 1.3.13

### Patch Changes

- Updated dependencies [9e311c38]
  - myst-to-html@1.4.3
  - myst-common@1.4.2
  - myst-frontmatter@1.4.2
  - myst-spec-ext@1.4.2

## 1.3.12

### Patch Changes

- da9ca5b2: Add remote base URL for the external links to help with recursion!
- 9bd9ec83: Replace xref text when using angle brackets
- 61c7291: Support cite-style syntax for myst xrefs
- 7c6f45c4: Enable existing `node.data` to flow through transforms, allowing upstream user data to be preserved and available in the AST.
- 61c7291: Links with file and target resolve as cross-references
- 61c7291: Update embed transform to allow myst project cross-references
- 61c7291: Move target node selection utils to myst-common
- 1e24a9f7: Add ROR link resolvers
- Updated dependencies [61c7291]
- Updated dependencies [da9ca5b2]
- Updated dependencies [61c7291]
- Updated dependencies [1e24a9f7]
  - myst-spec-ext@1.4.1
  - myst-common@1.4.1
  - myst-frontmatter@1.4.1

## 1.3.11

### Patch Changes

- ab863c8a: Change loadIntersphinx -> loadReferences and include MyST xrefs
- ab863c8a: Split out function for getting link text from target node
- ab863c8a: Warn on duplicate identifiers across project pages
- ab863c8a: Add check for empty link text
- ab863c8a: Add link transform for myst xrefs
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [7a04910f]
  - myst-frontmatter@1.4.0
  - myst-spec-ext@1.4.0
  - myst-common@1.4.0

## 1.3.10

### Patch Changes

- 1734bffd: Included files remove frontmatter and update math/abbr
- 7efe77a0: Ensure include file frontmatter takes priority
- 9a30092f: Support details/summary in HTML

## 1.3.9

### Patch Changes

- myst-to-html@1.4.2

## 1.3.8

### Patch Changes

- myst-to-html@1.4.1

## 1.3.7

### Patch Changes

- 3b008cbb: Move from using `data.type = notebook-code` to `block.kind = notebook-code`
- a3e3aa0c: Support span and div in html parser
- Updated dependencies [3b008cbb]
- Updated dependencies [e0cd47e3]
- Updated dependencies [f656e572]
  - myst-spec-ext@1.3.0
  - myst-common@1.3.0
  - myst-frontmatter@1.3.0
  - myst-to-html@1.4.0

## 1.3.6

### Patch Changes

- 37a03c23: Allow mermaid as a valid figure child
- Updated dependencies [2c4e3057]
- Updated dependencies [9271361]
  - myst-frontmatter@1.2.0
  - myst-common@1.2.0
  - myst-spec-ext@1.2.0
  - myst-to-html@1.3.0

## 1.3.5

### Patch Changes

- d17f6806: Support tex includes directly in myst processing
- d17f6806: Handle circular includes with nice errors and no infinite loops
- d17f6806: Revive basic recursive include
- 1be2c741: Lowercase the `R` language to `r` in a transform

## 1.3.4

### Patch Changes

- Updated dependencies [be3befd]
- Updated dependencies [be3befd]
  - myst-frontmatter@1.1.35
  - myst-common@1.1.35
  - myst-spec-ext@1.1.35
  - myst-to-html@1.2.3

## 1.3.3

### Patch Changes

- ab7fa83c: add html align property to table headers and data
- Updated dependencies [5aa3ea2f]
- Updated dependencies [5aa3ea2f]
- Updated dependencies [c38cc28]
  - myst-common@1.1.34
  - myst-frontmatter@1.1.34
  - myst-spec-ext@1.1.34
  - myst-to-html@1.2.2

## 1.3.2

### Patch Changes

- 20108545: Keep math tightness when lifting from paragraphs
- Updated dependencies [bba5baf9]
- Updated dependencies [117d6008]
- Updated dependencies [ebe65816]
- Updated dependencies [20108545]
- Updated dependencies [6f0183de]
- Updated dependencies [62620a8d]
- Updated dependencies [62620a8d]
- Updated dependencies [62620a8d]
- Updated dependencies [ffb239a9]
- Updated dependencies [ffb239a9]
- Updated dependencies [bba5baf9]
- Updated dependencies [20108545]
- Updated dependencies [117d6008]
- Updated dependencies [62620a8d]
- Updated dependencies [bba5baf9]
  - myst-common@1.1.32
  - myst-spec-ext@1.1.32
  - myst-frontmatter@1.1.32
  - myst-to-html@1.2.1

## 1.3.1

### Patch Changes

- Updated dependencies [1880a465]
- Updated dependencies [22c5fff]
- Updated dependencies [1880a465]
  - myst-common@1.1.31
  - myst-frontmatter@1.1.31
  - myst-spec-ext@1.1.31
  - myst-to-html@1.2.0

## 1.3.0

### Minor Changes

- 42af3800: Add support for epigraphs and pull-quotes using a new blockquote directive.

### Patch Changes

- Updated dependencies [42af3800]
  - myst-spec-ext@1.1.30
  - myst-common@1.1.30
  - myst-frontmatter@1.1.30
  - myst-to-html@1.1.0

## 1.2.5

### Patch Changes

- a4c7a116: Do not recursively call include transform
- 5565d60: Consume expanded numbering frontmatter
- Updated dependencies [cbad68cc]
- Updated dependencies [5565d60]
  - myst-spec-ext@1.1.29
  - myst-frontmatter@1.1.29
  - myst-common@1.1.29
  - myst-to-html@1.0.24

## 1.2.4

### Patch Changes

- Updated dependencies [3c9d9962]
- Updated dependencies [cff47b14]
- Updated dependencies [cff47b14]
  - myst-common@1.1.28
  - myst-spec-ext@1.1.28
  - myst-to-html@1.0.23

## 1.2.3

### Patch Changes

- 9cdd2044: Flatten inline code by default
- Updated dependencies [9cdd2044]
  - myst-common@1.1.26
  - myst-spec-ext@1.1.26

## 1.2.2

### Patch Changes

- 4ac0833: Export more include directive content for finer-grain use
- 4ac0833: Add tex-include to allow for input of sub-tex files
- 4ac0833: Allow include directive to be recursive
  - myst-common@1.1.25
  - myst-spec-ext@1.1.25

## 1.2.1

### Patch Changes

- 1fcbbbc6: Prevent basic transforms from modifying headings by default
- d5416ff8: Allow for {subEnumerator} to be a reference target template.
- Updated dependencies [d5416ff8]
  - myst-spec-ext@1.1.24
  - myst-common@1.1.24

## 1.2.0

### Minor Changes

- d2e6e780: Sort (frontmatter) abbreviations definitions by length

### Patch Changes

- f78db0bf: Update myst-spec
- 7596172: Allow page frontmatter in export articles
- 85ae9b4a: Support cross-references to file allowing labels on lifted headers
- ffc1061f: Allow enumeration to start at a different number
- aa335d74: Gather page frontmatter on load
- 7596172: Simplify heading transform to use firstDepth and modify mdast processing correspondingly
- aa335d74: Add heading depth transform to normalize headings
- Updated dependencies [f78db0bf]
- Updated dependencies [f78db0bf]
  - myst-to-html@1.0.22
  - myst-spec-ext@1.1.22
  - myst-common@1.1.22

## 1.1.19

### Patch Changes

- 9573382a: Changes processing of jupytext/myst style notebooks to ensure that `code-cell`s have a default output node associated with them and that any nested blocks containing a `code-cell` are lifted to the top level children of the root node.

  This should ensure proper representation of the document as a notebook, and ensure that it can be treated the same as a noteobok that originated in an `ipynb` by web front ends.

  Addresses:

  - https://github.com/executablebooks/mystmd/pull/748
  - https://github.com/executablebooks/mystmd/issues/816
  - myst-common@1.1.21
  - myst-spec-ext@1.1.21
  - myst-to-html@1.0.21

## 1.1.18

### Patch Changes

- 6354420: Update versions of myst packages
- Updated dependencies [6354420]
  - myst-to-html@1.0.20

## 1.1.17

### Patch Changes

- myst-to-html@1.0.19

## 1.1.16

### Patch Changes

- 1b4ec507: Put legend for tables at end by default.
- 4846c7fa: Allow new numbering options to filter through. Add new `kind` option to figure directive
  - myst-common@1.1.18
  - myst-spec-ext@1.1.18
  - myst-to-html@1.0.18

## 1.1.15

### Patch Changes

- 97e6406b: Update HTML handlers for table content and citations
- 2403f376: Figures created by notebook code are not given subfigures
- 2403f376: Add no-figures option to figure directive
- Updated dependencies [ecc6b812]
- Updated dependencies [2403f376]
  - myst-common@1.1.17
  - myst-spec-ext@1.1.17
  - myst-to-html@1.0.17

## 1.1.14

### Patch Changes

- 2904931: Move plural function to myst-common
- Updated dependencies [2904931]
  - myst-common@1.1.16
  - myst-spec-ext@1.1.16

## 1.1.13

### Patch Changes

- 81a47ef5: Add enumerator letter to implicit subfigure label
- 81a47ef5: Add new container transform to create subfigures, captions, legends
- 81a47ef5: Update enumeration transform for subfigures
- 81a47ef5: Transform figure image paragraph nesting to support subfigure images on consecutive lines
- c8a0ea09: Add math simplifications to build, for example, `$\_2# myst-transforms will become a subscript.
- 81a47ef5: Clean up basic transforms and types for subfigures
- 81a47ef5: Add implicit target warning for unlinked citation resolution
- Updated dependencies [81a47ef5]
  - myst-spec-ext@1.1.15
  - myst-common@1.1.15
  - myst-to-html@1.0.16

## 1.1.12

### Patch Changes

- adb9121: Pass options to basicTransforms, including myst parser for caption parsing
- adb9121: Transform blocks with captions to figures
- Updated dependencies [adb9121]
- Updated dependencies [d9953976]
  - myst-common@1.1.14
  - myst-spec-ext@1.1.14
  - myst-to-html@1.0.15

## 1.1.11

### Patch Changes

- 5bc1e96d: Link text transform is run twice and should be idempotent
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
  - myst-common@1.1.13
  - myst-spec-ext@1.1.13
  - myst-to-html@1.0.14

## 1.1.10

### Patch Changes

- c41e576e: Improve parsing of difficult DOIs.
- Updated dependencies [4534f995]
  - myst-common@1.1.12
  - myst-spec-ext@1.1.12
  - myst-to-html@1.0.13

## 1.1.9

### Patch Changes

- 70748f52: Remove unicode characters by default

## 1.1.8

### Patch Changes

- myst-to-html@1.0.12

## 1.1.7

### Patch Changes

- myst-to-html@1.0.11

## 1.1.6

### Patch Changes

- a7f830af: Support for sub-equations, including adding the MathGroup node.
- Updated dependencies [417efdc9]
- Updated dependencies [a7f830af]
- Updated dependencies [1574ff8]
  - myst-spec-ext@1.1.11
  - myst-common@1.1.11

## 1.1.5

### Patch Changes

- 34d4c2bd: Include transform was async, now awaiting it
- 8bd4ee2e: Improve HTML transforms for grouping and processing
- Updated dependencies [5737951e]
  - myst-spec-ext@1.1.10
  - myst-common@1.1.10

## 1.1.4

### Patch Changes

- ddf2a189: Block nesting updates
- 912e8b54: Note that alt text is auto generated from the caption.
- fde21440: Add support for proofs in LaTeX
- 27f48dba: Improve mathML export
- 8b7b5fe6: Update dependencies
- Updated dependencies [6d0e4e3f]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-to-html@1.0.10
  - myst-spec-ext@1.1.9

## 1.1.3

### Patch Changes

- 9a9b3953: 📦 Update types for hast updates
- Updated dependencies [9a9b3953]
  - myst-to-html@1.0.9

## 1.1.2

### Patch Changes

- b74fb3c1: Add ruleId to file warnings in redux store
- 392ba779: Move includeDirective transform to myst-transforms and make it generic for use in JupyterLab
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- 757f1fe4: Search for unmatched citations and use them as cross references or warn.
- 60cf9a53: Add filename to codeblock and include directives
- Updated dependencies [d35e02bc]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [4183c05c]
- Updated dependencies [392ba779]
- Updated dependencies [757f1fe4]
- Updated dependencies [239ae762]
- Updated dependencies [b74fb3c1]
- Updated dependencies [86c78957]
- Updated dependencies [60cf9a53]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [99659250]
  - myst-common@1.1.7
  - myst-spec-ext@1.1.7
  - myst-to-html@1.0.8

## 1.1.1

### Patch Changes

- 7752cb70: Bump dependency versions
- 7752cb70: Add html transform that combines related html nodes
- Updated dependencies [7752cb70]
- Updated dependencies [7752cb70]
  - myst-to-html@1.0.7
  - myst-common@1.1.5
  - myst-spec-ext@1.1.5

## 1.1.0

### Minor Changes

- 30da1dab: Add `firstTimeLong` option to the abbreviations transform to expand the abbreviation the first time it is encountered.

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types
- fee1eea5: Translate mermaid and math code blocks by default.
- 2960da05: Transform code blocks with `math` language to be math blocks. This is GitHub markdown.
- Updated dependencies [24c0aae7]
  - myst-common@1.1.2
  - myst-spec-ext@1.1.2

## 1.0.6

### Patch Changes

- 5dd77afe: Expand to allow for new github admonitions [!NOTE] in a blockquote

## 1.0.5

### Patch Changes

- Updates to internal dependencies
- 50fddc70: Add error message to YAML failure
- Updated dependencies [44ff6917]
- Updated dependencies
  - myst-common@1.1.0
  - myst-spec-ext@1.1.0

## 1.0.4

### Patch Changes

- 1a191c89: Log errors instead of throwing on page frontmatter yaml load
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
- Updated dependencies [f44ee18d]
  - myst-spec-ext@1.0.3
  - myst-common@1.0.4

## 1.0.3

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - myst-spec-ext@1.0.2
  - myst-common@1.0.2

## 1.0.2

### Patch Changes

- 714b594f: Propogate identifiers from mystRoles and mystDirectives to their children when lifting

## 1.0.1

### Patch Changes

- 92fd39df: Allow intersphinx to connect without a target
- 3b32538b: Track url source when enumerating nodes

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - myst-spec-ext@1.0.0

## 0.0.32

### Patch Changes

- de66ba19: Include html_id in the enumerator transform for local and remote links
- f97d4d50: Add abbreviation frontmatter option to add abbreviations automatically to documents.
- de66ba19: Add glossary and term directives

## 0.0.31

### Patch Changes

- a7584e27: Add transform for gated directives
- e98f86a6: Unnest links from cross references
- 71e91665: Initial support for sphinx-exercise
- bb019ae9: Add `unist-util-remove` to package dependencies.

## 0.0.30

### Patch Changes

- 034ce741: Add pull requests and issues to known github links
- ce8932e0: Pick up frontmatter title that has a label/target node in front of it.

## 0.0.29

### Patch Changes

- 78b7232e: Add support for sphinx proofs
- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12

## 0.0.28

### Patch Changes

- 96018fec: Link/xref url respects index url, dataUrl is also provided for accessing mdast

## 0.0.27

### Patch Changes

- 09a34b20: Ensure that Figure cross-references have no-break-spaces
- 3da85094: Add `enumerator` to footnote spec and transform (same as deprecated `number`)
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [3da85094]
  - myst-spec-ext@0.0.11

## 0.0.26

### Patch Changes

- 3a42cd9e: Transform wikipedia links properly, including removing `_` and properly removing `wiki:` in all cases.

## 0.0.25

### Patch Changes

- Updated dependencies [d28b5e9d]
  - myst-common@0.0.16

## 0.0.24

### Patch Changes

- c832b38e: FootnoteDefinitions remain on the mdast tree during processing
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15

## 0.0.23

### Patch Changes

- 5fc02589: Stop hoisting deep headings into frontmatter title
- Updated dependencies [45ecdf86]
  - myst-spec-ext@0.0.9

## 0.0.22

### Patch Changes

- 78b30547: Replace &=& with &= when replacing tex eqnarray with align\*
- 794fbc80: Works with undefined yaml block
- Updated dependencies [833be5a9]
  - myst-spec-ext@0.0.8

## 0.0.21

### Patch Changes

- efe55199: Turn on code enumeration by default
- Updated dependencies [9fcf25a9]
  - myst-spec-ext@0.0.7

## 0.0.20

### Patch Changes

- f227a9e2: Add rehype-remark
- f227a9e2: Add rehype-parse
- f227a9e2: Add unist-util-find-after
- f227a9e2: Add mdast-util-find-and-replace

## 0.0.19

### Patch Changes

- Updated dependencies [9105d991]
  - myst-common@0.0.14

## 0.0.18

### Patch Changes

- 78bb237e: Support github-style admonitions, add the `simple` class
- a9f5bf70: Add comment to default html-to-mdast handlers
- Updated dependencies [e443ad2a]
  - myst-spec-ext@0.0.6

## 0.0.17

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13

## 0.0.16

### Patch Changes

- ea89d8b2: Update admonition title to always be the argument.
- a2a7044b: Deprecate codeBlockPlugin for the caption parsing, which now happens in myst-parser and myst-directives
- Updated dependencies [987c1053]
  - myst-spec-ext@0.0.5

## 0.0.15

### Patch Changes

- 6da5544f: Embed block content (including notebook cells) based on block or code cell label in metadata

## 0.0.14

### Patch Changes

- 160e954f: Target propagration should happen after `mystDirectives` have been lifted fixed to work for directives.

  Deprecated the `mystCleanup` in favour of a more descriptive name (`liftMystDirectivesAndRoles`) for both the plugin and transform.

- Updated dependencies [f0d2da60]
- Updated dependencies [160e954f]
  - myst-spec-ext@0.0.4

## 0.0.13

### Patch Changes

- 27388448: Update packages to unstarred versions
- Updated dependencies [27388448]
  - myst-common@0.0.12
  - myst-spec-ext@0.0.3

## 0.0.12

### Patch Changes

- e7330dbb: Add more percise position information for math errors
- a5daa0d6: formatLinkText so that long URLs are formatted better in html, including breaking on long lines
- Updated dependencies [e7330dbb]
  - myst-common@0.0.11
  - intersphinx@0.0.7

## 0.0.11

### Patch Changes

- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common
- Updated dependencies [4e27734b]
  - myst-common@0.0.9

## 0.0.10

### Patch Changes

- adb6e7fa: Create a `unnestTransform` that generically unnests children elements in a parent. Used for typosgraphy and math nested in a paragraph.
- 11ff02b4: Update doi-utils to 1.0.9
- Updated dependencies [11ff02b4]
  - myst-common@0.0.8
  - intersphinx@0.0.6

## 0.0.9

### Patch Changes

- fced5986: Migrate to myst-spec-ext types to centralize additions to the spec.
- 0170a2cc: Lift equations out of paragraphs.

  Generally displayed math is **not** inside of a paragraph, the exception is inside bullet lists and tables, or dollar-math that is created without new lines around it. Because these nodes are a div, they are rendered inside of a paragraph, which is not correct HTML. This throws exceptions in React, it works, but causes a client-side re-render, which flickers.

- 3baa63eb: Ensure github url parse is safe without http or https
- Updated dependencies [73db6da8]
  - myst-common@0.0.6

## 0.0.8

### Patch Changes

- 17daf15e: Introduce GithubTransformer for file links.
- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- Updated dependencies [184ad9f9]
- Updated dependencies [3fba7cb7]
  - intersphinx@0.0.4
  - myst-common@0.0.5

## 0.0.7

### Patch Changes

- 7808157: Allow linkTransform to have a selector to look up the links

## 0.0.6

### Patch Changes

- a8e68ec: Enumerate only update the template if new
- b96c7a4: Create number references for footnotes that skip reserved numbers, still look up on identifier
- Updated dependencies [9b1fa05]
- Updated dependencies [9b1fa05]
  - intersphinx@0.0.2

## 0.0.5

### Patch Changes

- The package myst-utils was renamed to myst-common, we missed registering this by 7 hours. Super annoying, but it needs a bump across all packages.
- Updated dependencies
  - intersphinx@0.0.2
  - myst-common@0.0.3

## 0.0.4

### Patch Changes

- 327c19c: Introduce new link transforms for internal and external protocols including dois, rrids, wiki, and myst.
- 6b4c188: Introduce blockMetadataTransform that puts the metadata for a block on the data field.
- f6ad6c9: Improve wiki links to use language and links from the url if supplied.
- 2f6e43a: Add blockquote attribution to add sources for quotes
- f6ad6c9: Improve error mesasges for numbering references. Including numbering equations by their {name} == id, rather than by "Equation".
- f6ad6c9: Imporve error messages for unlinked references that start with `#`
- 631ee7c: Create intersphinx package
- 5460169: Add intersphinx interoperability (read) as well as markdown links syntax for referencing.
- Updated dependencies [2b85858]
  - myst-common@0.0.2

## 0.0.3

### Patch Changes

- b63638b: Allow admonition headers to be optionally set by bold text or a heading
- b63638b: Handle equation environment duplicates
- b63638b: Pull out frontmatter AST parsing into myst-transforms
- b63638b: Improve math parsing and split out label and equation parsing into different transform

## 0.0.2

### Patch Changes

- 619328f: Improve cross-referencing of content in a book
- 619328f: Bring transforms into the frontend to allow for improved demo component
- 619328f: Change error reporting to use vfile
