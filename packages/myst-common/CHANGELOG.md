# myst-common

## 1.1.32

### Patch Changes

- 117d6008: Allow parts mapping to be case insensitive.
- ebe65816: Remove quotes from label identifiers
- 20108545: Add block tightness to the directive data
- 117d6008: Case insensitivity in parts, and allow spaces when picking up JATS titles.
- Updated dependencies [6f0183d]
  - myst-frontmatter@1.1.32

## 1.1.31

### Patch Changes

- 1880a465: Update extractParts to pull implicit parts from sections based on heading
- 22c5fff: Add `doc` to the myst-role spec.
- Updated dependencies [1880a465]
  - myst-frontmatter@1.1.31

## 1.1.30

### Patch Changes

- myst-frontmatter@1.1.30

## 1.1.29

### Patch Changes

- Updated dependencies [5565d60]
  - myst-frontmatter@1.1.29

## 1.1.28

### Patch Changes

- 3c9d9962: Log missing citations in the correct place
- cff47b14: Add enumerator to citations and cite nodes
- cff47b14: Add cli warnings for invalid citation labels
  - myst-frontmatter@1.1.28

## 1.1.27

### Patch Changes

- Updated dependencies [f1ee6f7]
  - myst-frontmatter@1.1.27

## 1.1.26

### Patch Changes

- 9cdd2044: Add inline code rule for errors
  - myst-frontmatter@1.1.26

## 1.1.25

### Patch Changes

- Updated dependencies [03db3a35]
  - myst-frontmatter@1.1.25

## 1.1.24

### Patch Changes

- myst-frontmatter@1.1.24

## 1.1.23

### Patch Changes

- 01322e48: Move IExpressionResult types to myst-common
- Updated dependencies [50416784]
  - myst-frontmatter@1.1.23

## 1.1.22

### Patch Changes

- f78db0bf: Update myst-spec
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [9178a214]
- Updated dependencies [7596172]
- Updated dependencies [ffc1061f]
- Updated dependencies [aa335d74]
  - myst-frontmatter@1.1.22

## 1.1.21

### Patch Changes

- Updated dependencies [134c26ab]
  - myst-frontmatter@1.1.21

## 1.1.20

### Patch Changes

- a0044da: Add typst export to CLI
- Updated dependencies [a0044da]
  - myst-frontmatter@1.1.20

## 1.1.19

### Patch Changes

- Updated dependencies [a58eddf2]
  - myst-frontmatter@1.1.19

## 1.1.18

### Patch Changes

- Updated dependencies [4846c7fa]
- Updated dependencies [d83e4b6f]
  - myst-frontmatter@1.1.18

## 1.1.17

### Patch Changes

- ecc6b812: Add myst-spec-ext as dev dependency
- Updated dependencies [7bc50110]
- Updated dependencies [959c0a0]
  - myst-frontmatter@1.1.17

## 1.1.16

### Patch Changes

- 2904931: Move plural function to myst-common
  - myst-frontmatter@1.1.16

## 1.1.15

### Patch Changes

- 81a47ef5: Clean up basic transforms and types for subfigures
- Updated dependencies [6693972b]
- Updated dependencies [2dfde615]
  - myst-frontmatter@1.1.15

## 1.1.14

### Patch Changes

- adb9121: Refactor (and test) liftChildren util
- d9953976: Add an enum for known cell tags
- Updated dependencies [d9953976]
- Updated dependencies [d9953976]
- Updated dependencies [d9953976]
  - myst-frontmatter@1.1.14

## 1.1.13

### Patch Changes

- b127d5e7: Consume frontmatter parts alongside tagged parts
- b127d5e7: Transform frontmatter parts into blocks in the mdast
- b127d5e7: Ensure the block is visible by default in extractParts
- Updated dependencies [9410e8d]
- Updated dependencies [dd8249c5]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
  - myst-frontmatter@1.1.13

## 1.1.12

### Patch Changes

- 4534f995: Add directive/role nodes to the DirectiveData and RoleData.

## 1.1.11

### Patch Changes

- a7f830af: Support for sub-equations, including adding the MathGroup node.
- 1574ff8: Add number to template options

## 1.1.10

## 1.1.9

### Patch Changes

- 6d0e4e3f: Add option to remove part data when extracting parts from a document.
- 6d0e4e3f: Allow for multiple parts to be specified in extraction
- 8b7b5fe6: Update dependencies

## 1.1.8

### Patch Changes

- e846cf4: Add support for abbreviations in LaTeX (acronyms)

## 1.1.7

### Patch Changes

- d35e02bc: Export `BodyDefinition` and `OptionDefinition`.
- b74fb3c1: Add ruleId to file warnings in redux store
- ed7b430f: Allow alias field for directive options.
- 239ae762: Add `pluginLoads` ruleId
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- 86c78957: Add MySTPlugin to common exported types
- d35e02bc: Only allow `alias` to be a string list, which simplifies the downstream implementations
- d35e02bc: Allow for `ParseTypesEnum` to also be a `Number`, `String` or `Boolean` object or `"myst"` for parsed content.
- 99659250: Added support for glossaries and TEX/PDF export. Now it is possible to render glossaries in TeX and PDF documents.

## 1.1.6

## 1.1.5

### Patch Changes

- 7752cb70: Bump dependency versions

## 1.1.4

## 1.1.3

## 1.1.2

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types

## 1.1.1

### Patch Changes

- ac650f5d: Extract tagged parts

## 1.1.0

### Minor Changes

- 44ff6917: Rearrange package imports and fix versions

### Patch Changes

- Updates to internal dependencies

## 1.0.4

### Patch Changes

- 7b72b097: New Embed and Container node type in myst-spec-ext

## 1.0.3

### Patch Changes

- 4df753a9: Add title and short_title to source dependency

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd

## 1.0.1

### Patch Changes

- Add slug to Dependency type

## 0.0.17

### Patch Changes

- 79e24fd7: Add NotebookCell

## 0.0.16

### Patch Changes

- d28b5e9d: Move KINDS --> SourceFileKind and move to myst-common

## 0.0.15

### Patch Changes

- c832b38e: FootnoteDefinitions remain on the mdast tree during processing

## 0.0.14

### Patch Changes

- 9105d991: Undefined children still have a key defined. Delete the children if they are null-ish.

## 0.0.13

### Patch Changes

- Add ParseTypesEnum to myst-common

## 0.0.12

### Patch Changes

- 27388448: Update packages to unstarred versions

## 0.0.11

### Patch Changes

- e7330dbb: Add mergeTextNodes as a utility to myst-common

## 0.0.10

### Patch Changes

- ececeab6: Move template enums from myst-templates to myst-common

## 0.0.9

### Patch Changes

- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common

## 0.0.8

### Patch Changes

- 11ff02b4: Update doi-utils to 1.0.9

## 0.0.7

### Patch Changes

- 97a888c0: Allow toText to take a null

## 0.0.6

### Patch Changes

- 73db6da8: Add GenericNode and GenericParent

## 0.0.5

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- 3fba7cb7: Modify extractPart to no longer support tags

## 0.0.4

### Patch Changes

- Added extractPart utilities.

## 0.0.3

### Patch Changes

- The package myst-utils was renamed to myst-common, we missed registering this by 7 hours. Super annoying, but it needs a bump across all packages.

## 0.0.2

### Patch Changes

- 2b85858: Html ID now strips starting and ending `-`s
