---
title: JavaScript Plugins
description: Plugins implemented in JavaScript are easily used across different projects, as they do not require any additional programs to be installed.
---

JavaScript plugins are native MyST plugins, which are loaded as modules into the MyST engine. Transforms defined in these modules have access to helpful AST manipulation routines made available by MyST. Edits to JavaScript plugins have no effect during execution of a MyST build, instead the build must be restarted.

## Defining a new directive

To create a plugin, you will need a single Javascript file[^esm] that exports one or more of the objects above. For example, a simple directive that pulls a random image from [Unsplash](https://unsplash.com/) can be created with a single file that exports an `unsplash` directive.

[^esm]: The format of the Javascript should be an ECMAScript modules, not CommonJS. This means it uses `import` statements rather than `require()` and is the most modern style of Javascript.

:::{literalinclude} unsplash.mjs
:name: unsplash-js-source
:caption: A plugin to add an `unsplash` directive that includes a beautiful, random picture based on a query string.
:::

This code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: javascript
      path: unsplash.mjs
```

Then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Unsplash Images (unsplash.mjs) loaded: 1 directive
...
```

You can now use the directive, for example:

```markdown
:::{unsplash} misty,mountains
:::
```

:::{unsplash} misty,mountains
:size: 600x250
:::

If you change the source code you will have to stop and re-start the server to see the results.

The types are defined in `myst-common` ([npm](https://www.npmjs.com/package/myst-common), [github](https://github.com/executablebooks/mystmd/tree/main/packages/myst-common)) with the [`DirectiveSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L68-L77) and [`RoleSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L79-L85) being the main types to implement.


## Implementing a custom transform

Directives can be used to extend MyST with rich structured content. However, sometimes we want to _modify_ the existing behavior of MyST. One of the ways to do this is by writing a custom transform. In this section, we'll implement a transform that replaces **bold** text with _emphasis_.

First, let's define the transform
:::{literalinclude} markup.mjs
:caption: A plugin to add a transform that replaces strong nodes with emphasis nodes.
:::
this code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: javascript
      path: markup.mjs
```

then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Strong to emphasis (markup.mjs) loaded: 1 directive
...
```

you can now use the directive, for example:

```markdown
I am **special bold text**, whilst I am **normal bold text**
```

I am **special bold text**, whilst I am **normal bold text**


## Examples of plugins

The documentation you're reading now defines several of its own plugins to extend MyST functionality.
These are all registered in the documentation's [myst.yml configuration](myst.yml) with syntax like below:


```{literalinclude} myst.yml
:start-at: plugins
:end-before: error_rules
```

Each plugin is defined as a `.mjs` file in the same folder as the documentation's MyST content.
Below is the contents of each file for reference.

::::{dropdown} Plugin: Latex rendering
```{literalinclude} latex.mjs
```
::::

::::{dropdown} Plugin: Display an image
```{literalinclude} unsplash.mjs
```
::::

::::{dropdown} Plugin: Custom directive for documenting roles and directives
```{literalinclude} directives.mjs
```
::::

::::{dropdown} Plugin: Render web template options as a table
```{literalinclude} templates.mjs
```
::::
