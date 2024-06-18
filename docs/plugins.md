---
title: Plugins
description: Plugins provide powerful ways to extend and customize MyST
---

Plugins provide powerful ways to extend and customize MyST by adding directives and roles or specific transformations on the AST that can download or augment your articles and documentation. These plugins also support custom rendering and transformation pipelines for various export targets including React, HTML, LaTeX, and Microsoft Word.

:::{danger} Plugins are incomplete and in Beta
The interfaces and packaging for the plugins may change substantially in the future.\
**Expect changes!!**

If you are implementing a plugin, please let us know on [GitHub](https://github.com/executablebooks/mystmd) or [Discord](https://discord.mystmd.org/).
:::

## Overview of a Plugin

Plugins are executable javascript code that can modify a document source. The supported plugin types are:

directives
: Add or overwrite directives, which provide a "block-level" extension point.
: For example, create a `:::{proof}` extension that allows for numbered proofs.

roles
: Add or overwrite roles, which provide an inline extension point.
: For example, create a role for showing units, `` {si}`4 kg per meter squared` ``.

transforms
: These plugins transform the document source while it is rendered.
: For example, add metadata or transform a link to a DOI.

:::{warning} Planned - Not Yet Implemented
:class: dropdown

renderers
: These plugins add handlers for various nodes when exporting to a specific format.
: For example, do something special for node in HTML, React, Microsoft Word, or LaTeX.
:::

## Building a Plugin

There are two ways to implement a plugin in MyST

:::{card} JavaScript Plugins
:link: ./javascript-plugins.md

Plugins written in JavaScript with access to helpful AST manipulation routines.
:::

:::{card} Executable Plugins
:link: ./executable-plugins.md

Plugins written in other languages which communicate with MyST over stdin and stdout.
:::

