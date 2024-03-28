# tex-to-myst

## 1.0.24

### Patch Changes

- Updated dependencies [bba5baf]
- Updated dependencies [117d6008]
- Updated dependencies [ebe65816]
- Updated dependencies [20108545]
- Updated dependencies [6f0183de]
- Updated dependencies [bba5baf]
- Updated dependencies [20108545]
- Updated dependencies [117d6008]
- Updated dependencies [bba5baf]
  - myst-common@1.1.32
  - myst-spec-ext@1.1.32
  - myst-frontmatter@1.1.32

## 1.0.23

### Patch Changes

- 1880a465: Fix bug where certain affiliations without authors crash tex-to-myst
- Updated dependencies [1880a465]
- Updated dependencies [22c5fff]
- Updated dependencies [1880a465]
  - myst-common@1.1.31
  - myst-frontmatter@1.1.31
  - myst-spec-ext@1.1.31

## 1.0.22

### Patch Changes

- 8c148f7: Add Function and Procedure to algorithm handlers
- Updated dependencies [3c9d9962]
- Updated dependencies [cff47b14]
- Updated dependencies [cff47b14]
  - myst-common@1.1.28
  - myst-spec-ext@1.1.28
  - myst-frontmatter@1.1.28

## 1.0.21

### Patch Changes

- 84a89663: Support verbatim comment environment
- 0234a0ff: Add support for texttimes
- 9f359e2b: Support quote and displayquote environments as well as epigraph macro
- 822ee744: Change \\ in latex to add a break, already supported in tables.
- 5ed4fa65: Support textrm
- 6a97176d: Add quotation to handlers
- Updated dependencies [9cdd2044]
  - myst-common@1.1.26
  - myst-frontmatter@1.1.26
  - myst-spec-ext@1.1.26

## 1.0.20

### Patch Changes

- 4ac0833: Add tex-include to allow for input of sub-tex files
- 4ac0833: Recognize input / include statements
- Updated dependencies [03db3a35]
  - myst-frontmatter@1.1.25
  - myst-common@1.1.25
  - myst-spec-ext@1.1.25

## 1.0.19

### Patch Changes

- d5416ff8: Add subref, subfigure, and landscape functions for tex
- Updated dependencies [d5416ff8]
  - myst-spec-ext@1.1.24
  - myst-common@1.1.24
  - myst-frontmatter@1.1.24

## 1.0.18

### Patch Changes

- e2e6caa7: Support cref
- Updated dependencies [50416784]
- Updated dependencies [50416784]
- Updated dependencies [01322e48]
  - myst-frontmatter@1.1.23
  - myst-spec-ext@1.1.23
  - myst-common@1.1.23

## 1.0.17

### Patch Changes

- cb3bad07: Improve latex characters
- Updated dependencies [7596172]
- Updated dependencies [f78db0bf]
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
  - myst-spec-ext@1.1.22
  - myst-common@1.1.22

## 1.0.16

### Patch Changes

- 6354420: Update versions of myst packages

## 1.0.15

### Patch Changes

- Updated dependencies [a58eddf2]
  - myst-frontmatter@1.1.19
  - myst-common@1.1.19
  - myst-spec-ext@1.1.19

## 1.0.14

### Patch Changes

- Updated dependencies [6693972b]
- Updated dependencies [2dfde615]
- Updated dependencies [81a47ef5]
  - myst-frontmatter@1.1.15
  - myst-spec-ext@1.1.15
  - myst-common@1.1.15

## 1.0.13

### Patch Changes

- 9410e8d: Fix circular dependencies
- Updated dependencies [9410e8d]
- Updated dependencies [dd8249c5]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
  - myst-frontmatter@1.1.13
  - myst-common@1.1.13
  - myst-spec-ext@1.1.13

## 1.0.12

### Patch Changes

- Updated dependencies [f15ec37b]
- Updated dependencies [4534f995]
- Updated dependencies [f15ec37b]
- Updated dependencies [f15ec37b]
  - myst-frontmatter@1.1.12
  - myst-common@1.1.12
  - myst-spec-ext@1.1.12

## 1.0.11

## 1.0.10

### Patch Changes

- fb4cb203: Ensure spaces are picked up after macros
- 3980b6ff: Ensure there is no space before ~
- 417efdc9: Add `algorithm` and `algorithmic` handlers for latex parsing

  - Figures: Environment centering
  - newtheorem in frontmatter is parsed
  - safely ignore `itemsep`, `setcounter`, `cmidrule` for now

- cd674261: Support for cline, itemsep (has arguments), par, env centering bug
- e3edb2aa: Fix SI unit parsing bug
- 9010aa81: Parse tex-macros
- a7f830af: Support for sub-equations, including adding the MathGroup node.
- b14b3a4a: Leading space in paragraph bug
- Updated dependencies [417efdc9]
- Updated dependencies [ebe096b7]
- Updated dependencies [a7f830af]
- Updated dependencies [1574ff8]
  - myst-spec-ext@1.1.11
  - myst-frontmatter@1.1.11
  - myst-common@1.1.11

## 1.0.9

### Patch Changes

- Updated dependencies [5737951e]
  - myst-spec-ext@1.1.10
  - myst-common@1.1.10
  - myst-frontmatter@1.1.10

## 1.0.8

### Patch Changes

- bb2cd4fb: Add nameref and adjustwidth nodes for parsing latex
- 8fa5f438: Support `\bf` in table cells.
- 6fa758f8: Updates to various latex parsing functions
- 8b7b5fe6: Update dependencies
- Updated dependencies [6d0e4e3f]
- Updated dependencies [09db3e25]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [651dd773]
- Updated dependencies [aecf6164]
- Updated dependencies [3d2fe87e]
- Updated dependencies [3be5a920]
- Updated dependencies [09db3e25]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-frontmatter@1.1.9
  - myst-spec-ext@1.1.9

## 1.0.7

### Patch Changes

- Updated dependencies [e846cf4]
  - myst-common@1.1.8
  - myst-frontmatter@1.1.8
  - myst-spec-ext@1.1.8

## 1.0.6

### Patch Changes

- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
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
  - myst-frontmatter@1.1.7

## 1.0.5

### Patch Changes

- 7752cb70: Bump dependency versions
- Updated dependencies [7752cb70]
- Updated dependencies [ba0441a0]
  - myst-common@1.1.5
  - myst-frontmatter@1.1.5
  - myst-spec-ext@1.1.5

## 1.0.4

### Patch Changes

- Updates to internal dependencies
- Updated dependencies [44ff6917]
- Updated dependencies [44ff6917]
- Updated dependencies
  - myst-common@1.1.0
  - myst-frontmatter@1.1.0
  - myst-spec-ext@1.1.0

## 1.0.3

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- Updated dependencies [b0a2a34b]
  - myst-frontmatter@1.0.2
  - myst-spec-ext@1.0.2
  - myst-common@1.0.2

## 1.0.1

### Patch Changes

- 6fa7f022: Updates to chemical formulas and verbatim parsing
- 3b32538b: Add comment node functionality
- Updated dependencies [2c19d72c]
- Updated dependencies [3b32538b]
  - myst-frontmatter@1.0.1

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
  - myst-spec-ext@1.0.0

## 0.0.28

### Patch Changes

- Updated dependencies [97518ca3]
- Updated dependencies [f97d4d50]
  - myst-frontmatter@0.0.14

## 0.0.27

### Patch Changes

- 1a8040e4: Add resizebox macro as a pass through

## 0.0.26

### Patch Changes

- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12

## 0.0.25

### Patch Changes

- 685bbe58: Add SI Units (see https://texdoc.org/serve/siunitx/0)
- da8abded: Groups of accented characters are picked up correctly
- da8abded: Allow characters in groups {\c S} --> Ş
- Updated dependencies [8b1f65d9]
- Updated dependencies [79743342]
- Updated dependencies [685bbe58]
- Updated dependencies [3da85094]
  - myst-frontmatter@0.0.13
  - myst-spec-ext@0.0.11

## 0.0.24

### Patch Changes

- Updated dependencies [caf45cd1]
  - myst-frontmatter@0.0.12

## 0.0.23

### Patch Changes

- Updated dependencies [039a49a3]
- Updated dependencies [d28b5e9d]
  - myst-frontmatter@0.0.11
  - myst-common@0.0.16

## 0.0.22

### Patch Changes

- e5fb426a: Allow LaTeX macros in options when parsing arguments
- 265a8ed4: Ensure suffix/prefix is on the cite node not citeGroup
- Updated dependencies [c832b38e]
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
  - myst-frontmatter@0.0.10
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15

## 0.0.21

### Patch Changes

- Updated dependencies [45ecdf86]
  - myst-spec-ext@0.0.9

## 0.0.20

### Patch Changes

- cf7b7004: Fix multirow/multicolumn tex macros to correctly close nodes
- 6713f432: All citations are groups for correct parenthetical rendering
- 6713f432: Tex \cite explicitly makes narrative citations
- 70519a00: Support supertabular tex environment
- 826276dc: Basic support for multiple minipage figures in a single tex figure
- b4670ec4: Support tex adjustbox argument
- 82b583ba: Fix bug with undefined myst node associated with table macros
- Updated dependencies [833be5a9]
  - myst-spec-ext@0.0.8

## 0.0.19

### Patch Changes

- 4da8eef5: Warn on multiple titles in latex
- 452846eb: Support multirow macro
- 4da8eef5: Support latex renewcommand
- 4da8eef5: Pass on latex commands adjustbox, makecell, textwidth, onecolumn
- 9fcf25a9: Add citation nodes to myst-spec-ext
- 452846eb: Implement multicolumn macro
- Updated dependencies [9fcf25a9]
  - myst-spec-ext@0.0.7

## 0.0.18

### Patch Changes

- 7a78b7be: Only insert figure number for latex \ref
- Updated dependencies [ccd1d5ee]
  - myst-frontmatter@0.0.9

## 0.0.17

### Patch Changes

- Updated dependencies [9105d991]
  - myst-common@0.0.14

## 0.0.16

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13

## 0.0.15

### Patch Changes

- Updated dependencies [9f9954d2]
  - myst-frontmatter@0.0.8

## 0.0.14

## 0.0.13

## 0.0.12

### Patch Changes

- Updated dependencies [e1a2407f]
  - myst-frontmatter@0.0.7

## 0.0.11

### Patch Changes

- Updated dependencies [c27a0587]
- Updated dependencies [3769a662]
- Updated dependencies [5436ab41]
- Updated dependencies [0aff6dc1]
- Updated dependencies [5436ab41]
- Updated dependencies [8b779cf7]
- Updated dependencies [770bb8da]
  - myst-frontmatter@0.0.6

## 0.0.10

### Patch Changes

- Updated dependencies [27388448]
  - myst-common@0.0.12

## 0.0.2

### Patch Changes

- 8b545a0b: Argument parsing improvements for nested parenthesis
- a79a78c4: Capture abstract information for blocks
- Updated dependencies [bfd72456]
- Updated dependencies [e7330dbb]
- Updated dependencies [0a87866d]
- Updated dependencies [6ebaffda]
  - myst-frontmatter@0.0.5
  - myst-common@0.0.11

## 0.0.1

- Initial Release
