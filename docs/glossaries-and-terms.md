---
title: Glossaries, Terms, Index Pages, and Abbreviations
short_title: Glossaries, Terms, & Index Pages
---

You can define Terms and generate reference pages for them with Glossaries and Index Pages. This allows you to centralize definitions and pointers to where various items are mentioned throughout your documents.

:::{seealso} See our index and glossary page
- The [glossary for these docs](#glossary-page)
- The [index for these docs](#index-page)
:::

## Glossaries

Glossaries are a collection of definitions for Terms in your documents.
Below is the example of a glossary defining the terms {term}`glossary`, {term}`term`, and {term}`Index`

:::{glossary}
glossary
: A glossary is a [list of terms and their definitions](https://en.wikipedia.org/wiki/Glossary).

term
: A term is a [word with a specialized meaning](https://en.wikipedia.org/wiki/Terminology).

index
: An [organized list of information in a publication](https://en.wikipedia.org/wiki/Index_(publishing)).

:::

To add a glossary to your content, add the {myst:directive}`glossary` directive with the content as [definition lists](#definition-lists).

```{myst}
:::{glossary}
MyST
: An amazing markup language that supports glossaries
:::

You can use {term}`MyST` to create glossaries.
```

You can define multiple glossaries in your documents, as long as they do not re-define the same term.

:::{warning} Compatibility with {term}`Sphinx` and {term}`reStructuredText`
:class: dropdown
The glossary is very similar to the [reStructuredText glossary](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#glossary), but uses [definition lists](#definition-lists) instead of indentation to indicate the terms[^drawback]. For working with glossaries in Sphinx, you can use the following syntax:

````markdown
```{glossary}
Term one
  An indented explanation of term 1

A second term
  An indented explanation of term 2
```
````

[^drawback]: Note that this has a challenge of not being able to have two terms for the same definition.

:::

## Terms

To reference a term in a glossary use the {myst:role}`term` role:

- `` {term}`MyST` `` produces {term}`MyST`
- `` {term}`MyST Markdown <MyST>` `` produces {term}`MyST Markdown <MyST>`

The label that you use for the term should be in the same case/spacing as it appears in the glossary. If there is additional syntax (e.g. a link) in the term, the text only representation will be used. The term is rendered as a cross-reference to the glossary and will provide a hover-reference.

## Index pages

Index pages show the location of various terms and phrases you define throughout your documentation.

### Generate an index page

You can generate an index with the {genindex} directive.
For example:

````
```{genindex}
```
````

See [the index for this documentation](#index-page) for what this generates.

(abbreviations)=

## Abbreviations

To create an abbreviation, you can explicitly do this in your document with an [abbreviation role](#abbr-role), for example, `` {abbr}`HR (Heart Rate)` ``. You can also use the page or project frontmatter:

```{myst}

---
abbreviations:
  RHR: Resting Heart Rate
  HR: Human Resources
---

To lower your RHR, try meditating or contact your local HR representative?
```

The abbreviations are case-sensitive and will replace all instances[^1] in your document with a hover-tooltip and accessibility improvements. Abbreviations in cross-references, code, and links are not replaced. For example, in this project we have a lot of abbreviations defined in our [`myst.yml`](./myst.yml):

[^1]: Abbreviations must be at least two characters!

> Our OA journal ensures your VoR is JATS XML with a PID (usually a DOI) to ensure LTS.
>
> - TLA Soup

:::{tip} Order of Abbreviations
:class: dropdown
Abbreviations defined in your frontmatter are applied in longest-sorted order. If you have two abbreviations with the same suffix (e.g. `RHR` and `HR`), the longer abbreviation will always take precedence.
:::
