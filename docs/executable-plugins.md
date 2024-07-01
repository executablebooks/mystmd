---
title: Executable Plugins
description: Plugins built as stand-alone applications can be written in languages such as Python, and may be more familiar to some developers.
---

MyST is able to invoke plugins written in different languages through standard IO protocols. Executable MyST plugins are treated as a [](wiki:Black_box), whereby MyST only sees the data it passes to the plugin, and the response from the plugin itself.


## Defining a new directive

:::{note}
There are many different ways to create an executable plugin. Here we'll use Python to implement an `unsplash-py` directive, but any programming language that can read and write from stdin, stdout, and stderr, and define a commandline interface would work.
:::

First, we'll declare the plugin _specification_ that allows MyST to discover the directives, transforms, and/or roles that the plugin implements. This specification looks very similar to [the definition of a JavaScript plugin](javascript-plugins.md#unsplash-js-source), except the implementation logic (e.g. the directive `run` method) is not defined.

:::{literalinclude} unsplash.py
:caption: a plugin to add an `unsplash-py` directive that includes a beautiful, random picture based on a query string.
:::
this code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: executable
      path: unsplash.mjs
```

then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 unsplash images (unsplash.py) loaded: 1 directive
...
```

you can now use the directive, for example:

```markdown
:::{unsplash-py} misty,mountains
:::
```

:::{unsplash-py} misty,mountains
:size: 600x250
:::

If you change the source code you will have to stop and re-start the server to see the results.

The types are defined in `myst-common` ([npm](https://www.npmjs.com/package/myst-common), [github](https://github.com/executablebooks/mystmd/tree/main/packages/myst-common)) with the [`DirectiveSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L68-L77) and [`RoleSpec`](https://github.com/executablebooks/mystmd/blob/9965925030c3fab6f34c20d11eeee7ffdafa73df/packages/myst-common/src/types.ts#L79-L85) being the main types to implement.

## Implementing a custom transform

Directives can be used to extend MyST with rich structured content. However, sometimes we want to _modify_ the existing behavior of MyST. One of the ways to do this is by writing a custom transform. In this section, we'll implement a transform that replaces **bold** text with _emphasis_.

First, let's define the transform
:::{literalinclude} markup.py
:caption: A plugin to add a transform that replaces strong nodes with emphasis nodes.
:::
this code should be referenced from your `myst.yml` under the `projects.plugins`:

```{code} yaml
:filename: myst.yml
project:
  plugins:
    - type: executable
      path: markup.mjs
```

then start or build your document using `myst start` or `myst build`, and you will see that the plugin is loaded.

```text
myst start
...
🔌 Strong to emphasis (markup.py) loaded: 1 directive
...
```

you can now use the directive, for example:

```markdown
I am **special bold text (python)**, whilst I am **normal bold text**
```

I am **special bold text (python)**, whilst I am **normal bold text**

