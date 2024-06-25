---
title: Deploying your MyST Site
short_title: Deployment
description: Deploy your MyST site to static HTML or a MyST-aware server.
---

There are two different kinds of MyST website that can be deployed out of the box:
- Statically generated sites, which can be served from static site hosts (like GitHub Pages).
- Dynamically rendered sites, which use a MyST server.

The high-level differences between these approaches are outlined in [](#deployment-comparison).
:::{table} High-Level Comparison of MyST Site Deployment Types
:label: deployment-comparison

| Deployment Type | High Performance | Seamless Updates | Static Hosting |
|:---------------:|:----------------:|:----------------:|:--------------:|
|  Static website |         ❌        |         ❌        |        ✅       |
|   MyST server   |         ✅        |         ✅        |        ❌       |
:::

The [default themes](website-templates.md#themes-bundled-with-myst) for MyST are designed to be MyST servers. Sites deployed in this manner benefit from [performance enhancements](./accessibility-and-performance.md) such as pre-fetching for instant page-transitions, loading indicators, and smaller network payloads. As the MyST themes receive new updates, it is easy to upgrade existing websites that have been deployed upon MyST servers, as the MyST site _content_ is only ever built once.

%  - Static deployments are MPA (each page own HTML document), SSG (rendered ahead of time)
%  - Servers are SPA (request JSON), SSR+hydration
%- Term definitions?
%  - SPA vs MPA
%  - SSR vs CSR vs SSG

However, commonly used website hosts like GitHub Pages and ReadTheDocs are _static website hosts_, meaning that they can only serve webpages that have been built ahead of time. Therefore, the choice between using a static website or a MyST server deployment often comes down to the type of website hosting that is available.

## Static Websites
### Creating Static HTML

To create a static HTML export of your MyST site, build it as HTML:

```bash
myst build --html
```

After the build process, you can see the folder in `_build/html`, which has all assets for your static website. You can verify that the site is working correctly by starting a static web-server, for example,
```shell
npx serve _build/html
```
which will serve a static version of the site.

:::{danger} Static sites should have an `index.html`
:class: dropdown

Your site should be configured with a single project at the root, this can be done by removing the `site.projects` list so that the site builds at the root url, rather than in a nested folder.

If your project is configured to be in a nested folder using a project `slug`, a site index will _not_ be created and your project will be instead accessible at a nested slug.

To fix this, change your `site` configuration to use a flat rather than nested project:

```yaml
version: 1
# Your project must be listed in the same myst.yml configuration
project: ...
site:
  title: Site Title
  # Delete the following `site.projects` configuration:
  # projects:
  #   - slug: nested-folder
  #     path: .
```

:::

:::{tip} Ignore the `_build` folder in Git
:class: dropdown

If you are using Git, add the `_build` folder to your `.gitignore` so that it is not tracked. This folder contains auto-generated assets that can easily be re-built -- for example in a Continuous Integration system like GitHub Actions.
:::

### Deploying to a Static Webhost
The contents of the `_build/html` can be served from any static web server. The following articles outline the process of deploying your static site to well-known website providers:

:::{card} GitHub Pages
:link: ./deployment-github-pages.md
Deploy as a static site to GitHub pages using an action.
:::

:::{card} Netlify
:link: ./deployment-netlify.md
Deploy to Netlify as static HTML, and pull-request previews.
:::

% TODO: ReadTheDocs

## Dynamic MyST Sites

### Creating Structured Site Data
MyST servers consume _structured data_ that represents a MyST website. These data can be built using the `myst build` command,
```shell
myst build --site
```
which populates the `_build/site` directory with information about your website including the metadata, cross-references, static images, and [MyST AST](https://mystmd.org/spec).

### Deploying to a MyST-Aware Server
:::{note}
At present, only [Curvenote](https://curvenote.com/) provides out-of-the-box support for deployment of MyST websites:
:::

% TODO: vercel/netlify server

:::{card} Curvenote
:link: ./deployment-curvenote.md
Deploy to Curvenote as a dynamic site with a managed MyST theme.
:::

