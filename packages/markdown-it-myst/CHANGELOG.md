# markdown-it-myst

## 1.0.6

### Patch Changes

- 20108545: Add block tightness to the directives

## 1.0.5

### Patch Changes

- c242d9b1: Improve the suffix label parsing for citations

## 1.0.4

### Patch Changes

- f7c29db6: Improve citation parsing to exclude trailing punctuation.

## 1.0.3

### Patch Changes

- 757f1fe4: Add column information to citations and roles

## 1.0.2

### Patch Changes

- Updates to internal dependencies

## 1.0.1

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

## 0.1.3

### Patch Changes

- 99948cc8: Allow whitespace around role name inside brackets

## 0.1.2

### Patch Changes

- 9f8613ef: Fix flag colon option with trailing whitespace
- 5f506356: Allow directives to have spaces, and trim the name before passing it onto other directives
- d14bb127: Do not parse nested colon fence as directive option

## 0.1.1

### Patch Changes

- a22fafa0: Log parse errors with vfile
- a22fafa0: New markdown-it package for generically parsing myst roles/directives - replaces markdown-it-docutils
- a22fafa0: Directive options defined with colons (e.g. :key: value) just parse line-by-line, they no longer use yaml loading.
