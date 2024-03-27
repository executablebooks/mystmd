# myst-frontmatter

## 1.1.32

### Patch Changes

- 6f0183d: Add copyright to frontmatter

## 1.1.31

### Patch Changes

- 1880a465: Expand parts to other aliases

## 1.1.30

## 1.1.29

### Patch Changes

- 5565d60: Expand numbering items to include template and start

## 1.1.28

## 1.1.27

### Patch Changes

- f1ee6f7: Add id to project frontmatter and populate on init

## 1.1.26

## 1.1.25

### Patch Changes

- 03db3a35: allow author affiliations to be an object and change it into an array for validation

## 1.1.24

## 1.1.23

### Patch Changes

- 50416784: Update licensese

## 1.1.22

### Patch Changes

- 7596172: Support export toc
- 7596172: Allow page frontmatter in export articles
- 7596172: Change export articles into objects with file/title/level
- 7596172: Pass heading depth through multi-page transform
- 7596172: Enumerate multi-article export formats
- 7596172: Allow page frontmatter in export article validation
- 9178a214: Allow typst to have multiple pages for export (e.g. as a book)
- 7596172: Add export frontmatter at template render time
- ffc1061f: Allow enumeration to start at a different number
- aa335d74: Gather page frontmatter on load

## 1.1.21

### Patch Changes

- 134c26ab: Infer export format from output file

## 1.1.20

### Patch Changes

- a0044da: Add typst export to CLI

## 1.1.19

### Patch Changes

- a58eddf2: Move beamer option to myst_to_tex settings

## 1.1.18

### Patch Changes

- 4846c7fa: Allow new numbering options to filter through. Add new `kind` option to figure directive
- d83e4b6f: Simplify error message suppression in numbering

## 1.1.17

### Patch Changes

- 7bc50110: The `github` field will be used for binder connections when no `repo` is provided in the `thebe`/`jupyter` fields
- 959c0a0: Changes thebe types to correctly provide the shapes of expanded thebe options after frontmatter validation. Updated the validator to use the types.

## 1.1.16

## 1.1.15

### Patch Changes

- 6693972b: Export article -> articles with coercion and erroring
- 2dfde615: Introduce mystToTex settings, including minted, listings, or verbatim
- Updated dependencies [6693972b]
  - simple-validators@1.0.4

## 1.1.14

### Patch Changes

- d9953976: Add output_matplotlib_strings as a project setting
- d9953976: Add settings to page and project
- d9953976: Add `output_stderr` and `output_stdout` options to settings

## 1.1.13

### Patch Changes

- 9410e8d: Fix circular dependencies
- dd8249c5: Remove JupyterLocalOptions type from myst-frontmatter, we should be using JupyterServerOptions and base Thebe connections.
- b127d5e7: Consume frontmatter parts alongside tagged parts
- b127d5e7: Transform frontmatter parts into blocks in the mdast
- b127d5e7: Consume frontmatter options for template/site options
- b127d5e7: Add options to site/project/page frontmatter
- b127d5e7: Add parts to page frontmatter
- b127d5e7: Frontmatter parts each coerce to list

## 1.1.12

### Patch Changes

- f15ec37b: Postal code may be a number
- f15ec37b: Move list coercing to simple-validators
- f15ec37b: Share frontmatter aliases, improve validation naming
- Updated dependencies [f15ec37b]
- Updated dependencies [f15ec37b]
  - simple-validators@1.0.3

## 1.1.11

### Patch Changes

- ebe096b7: Allow specifying zipcode for postal_code

## 1.1.10

## 1.1.9

### Patch Changes

- 09db3e25: `jupyter.local` options have been removed
- 6d0e4e3f: Add equal-contributor as an alias for equal_contributor
- 651dd773: Add doi as affiliation identifier in frontmatter and jats
- aecf6164: Remove restriction on short_title length from validation.
- 3d2fe87e: Allow funding award IDs to be numeric, and then be cast to strings.
- 3be5a920: Update OSI licenses
- 09db3e25: is specified, `jupyter.server` must be an object with valid `token` and `url` fields
- Updated dependencies [3d2fe87e]
  - simple-validators@1.0.2

## 1.1.8

## 1.1.7

## 1.1.6

### Patch Changes

- 911d1b1: Make institution an alias of name on Affiliation type rather than allowing both
- 911d1b1: Separate contributors from authors on processed frontmatter
- 911d1b1: Add funding to frontmatter
- 59b54584: Support parsed author names and parse string names

## 1.1.5

### Patch Changes

- ba0441a0: enable custom binder providers in frontmatter

## 1.1.4

## 1.1.3

### Patch Changes

- 6655c90: Update generated affiliation ids to not use crypto

## 1.1.2

### Patch Changes

- 2696fada: Add rich affiliations to frontmatter
- d873b941: Upgrade credit-roles for alias support (writing, editing, review, administration, etc.)

## 1.1.1

### Patch Changes

- 8f687eba: Allow thumbnail to be set on project or site

## 1.1.0

### Minor Changes

- 44ff6917: Rearrange package imports and fix versions

### Patch Changes

- 44ff6917: Add jupyter alias in frontmatter for thebe
- Updates to internal dependencies

## 1.0.4

### Patch Changes

- ed0d571d: Add banner and bannerOptimized

## 1.0.3

### Patch Changes

- 18c513bb: Improve MECA export structure and contents for validation with meca js library

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - simple-validators@1.0.1

## 1.0.1

### Patch Changes

- 2c19d72c: Update licenses to most recent spdx licenses
- 3b32538b: Add frontmatter for requirements and resources.

## 0.0.14

### Patch Changes

- 97518ca3: Add collaborations list to myst-frontmatter
- f97d4d50: Add abbreviation frontmatter option to add abbreviations automatically to documents.

## 0.0.13

### Patch Changes

- 8b1f65d9: Update thebe frontmatter options

## 0.0.12

### Patch Changes

- caf45cd1: Add article/sub_articles to export frontmatter

## 0.0.11

### Patch Changes

- 039a49a3: Added a frontmatter field to hold `thebe` options, this includes a numebr of top level keys and nested options.

## 0.0.10

### Patch Changes

- c832b38e: myst-cli may now be used to build JATS xml exports
- c832b38e: FootnoteDefinitions remain on the mdast tree during processing

## 0.0.9

### Patch Changes

- ccd1d5ee: Update license list from https://spdx.org

## 0.0.8

### Patch Changes

- 9f9954d2: Validate short_title and subtitle on site and project

## 0.0.7

### Patch Changes

- e1a2407f: Allow strings in each export

## 0.0.6

### Patch Changes

- c27a0587: Validate cc-by in licenses
- 3769a662: Validate keywords if given as a CSV string
- 5436ab41: Add export to an alias of exports
- 0aff6dc1: Expose short_title on the project pages and allow subtitle on project as well as pages
- 5436ab41: Add validateExportsList for more shared utilities
- 8b779cf7: Allow the export to be a single string of an export format
- 770bb8da: Improve author and affiliation parsing

## 0.0.5

### Patch Changes

- bfd72456: Validate orcid using the `orcid` package
- 0a87866d: Rely on `credit-roles` package for CRediT role validation
- 6ebaffda: Allow author and authors in frontmatter, also allow them to be strings.
- Updated dependencies [0fa33b10]
  - simple-validators@0.0.3

## 0.0.4

### Patch Changes

- 5403b5b5: Modify site frontmatter/config for templating - remove some fields, allow arbitrary template options, do not inherit from site frontmatter on page/project
- 11ff02b4: Update doi-utils to 1.0.9

## 0.0.3

### Patch Changes

- 184ad9f9: Move to https://github.com/executablebooks/mystmd
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- Updated dependencies [184ad9f9]
  - simple-validators@0.0.2
