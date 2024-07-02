import { z } from 'zod';
import { defined } from '../../utils/defined.js';
import type { Config, ProjectConfig, SiteConfig } from 'myst-config';
import { ExportFormats } from 'myst-frontmatter';
import { parse } from 'node:path';

const JupyterBookConfig = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  copyright: z.string().optional(),
  logo: z.string().optional(),
  exclude_patterns: z.array(z.string()).optional(),
  parse: z
    .object({
      myst_enable_extensions: z.union([z.null(), z.array(z.string())]).optional(),
      myst_url_schemes: z.union([z.null(), z.array(z.string())]).optional(),
      myst_dmath_double_inline: z.boolean().default(true),
    })
    .optional(),
  execute: z
    .object({
      eval_regex: z.string().default('^.*$'),
      raise_on_error: z.boolean().default(false),
      show_tb: z.boolean().default(false),
      execute_notebooks: z
        .union([
          z.literal('auto'),
          z.literal('cache'),
          z.literal('force'),
          z.literal('inline'),
          z.literal('off'),
          z.literal(false),
        ])
        .default('auto'),
      cache: z.string().optional(),
      timeout: z.number().gte(-1).default(30),
      allow_errors: z.boolean().default(false),
      stderr_output: z
        .enum(['show', 'remove', 'remove-warn', 'warn', 'error', 'severe'])
        .default('show'),
      run_in_temp: z.boolean().default(false),
      exclude_patterns: z.array(z.string()).optional(),
    })
    .optional(),
  html: z
    .object({
      favicon: z.string().optional(),
      use_edit_page_button: z.boolean().optional(),
      use_repository_button: z.boolean().optional(),
      use_issues_button: z.boolean().optional(),
      extra_footer: z.string().optional(),
      analytics: z
        .object({
          plausible_analytics_domain: z.string().optional(),
          google_analytics_id: z.string().optional(),
        })
        .optional(),
      home_page_in_navbar: z.boolean().optional(),
      baseurl: z.string().optional(),
      comments: z
        .object({
          hypothesis: z.union([z.boolean(), z.record(z.any())]).optional(),
          utterances: z.union([z.boolean(), z.record(z.any())]).optional(),
        })
        .optional(),
      announcement: z.string().optional(),
    })
    .optional(),
  latex: z
    .object({
      latex_engine: z.string().default('pdflatex'),
      use_jupyterbook_latex: z.boolean().optional(),
      latex_documents: z
        .object({
          targetname: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  bibtex_bibfiles: z.array(z.string()).optional(),
  launch_buttons: z
    .object({
      notebook_interface: z.string().optional(),
      binderhub_url: z.string().optional(),
      jupyterhub_url: z.string().optional(),
      thebe: z.boolean().optional(),
      colab_url: z.string().optional(),
    })
    .optional(),
  repository: z
    .object({
      url: z.string().optional(),
      path_to_book: z.string().optional(),
      branch: z.string().optional(),
    })
    .optional(),
  sphinx: z
    .object({
      extra_extensions: z.union([z.null(), z.array(z.string())]).optional(),
      local_extensions: z.union([z.null(), z.record(z.any())]).optional(),
      recursive_update: z.boolean().optional(),
      config: z.union([z.null(), z.record(z.any())]).optional(),
    })
    .optional(),
});

export type JupyterBookConfig = z.infer<typeof JupyterBookConfig>;

/**
 * Validate a loaded Jupyter Book _config.yml, or return undefined
 *
 * @param config - config object
 */
export function validateJupyterBookConfig(config: unknown): JupyterBookConfig | undefined {
  const result = JupyterBookConfig.safeParse(config);
  if (!result.success) {
    console.error(result.error);
    return undefined;
  } else {
    return result.data;
  }
}

/**
 * Parse a GitHub repo URL to extract the user/repo substring
 *
 * @param url - GitHub URL
 */
function parseGitHubRepoURL(url: string): string | undefined {
  //eslint-disable-next-line
  const match = url.match(/(?:git@|https:\/\/)github.com[:\/](.*)(?:.git)?/);
  if (!match) {
    return undefined;
  }
  return match[1];
}

/**
 * Upgrade a Jupyter Book _config.yml into a myst.yml configuration
 *
 * @param config - validated Jupyter Book configuration
 */
export function upgradeConfig(data: JupyterBookConfig): Pick<Config, 'project' | 'site'> {
  const project: ProjectConfig = {};
  const siteOptions: SiteConfig['options'] = {};
  const site: SiteConfig = {
    options: siteOptions,
    template: 'book-theme',
  };

  if (defined(data.title)) {
    project.title = data.title;
  }

  if (defined(data.author)) {
    // Try and parse comma-delimited author lists into separate authors
    const authors = data.author.split(/,\s*(?:and\s)?\s*|\s+and\s+/);
    if (authors.length === 1) {
      project.authors = [{ name: data.author }]; // TODO prompt user for alias?
    } else {
      project.authors = authors.map((name) => ({ name }));
    }
  }

  if (defined(data.copyright)) {
    project.copyright = data.copyright;
  }

  if (defined(data.logo)) {
    siteOptions.logo = data.logo;
  }

  if (defined(data.exclude_patterns)) {
    project.exclude = data.exclude_patterns;
  }

  if (defined(data.html?.favicon)) {
    siteOptions.favicon = data.html.favicon;
  }

  if (defined(data.html?.analytics?.google_analytics_id)) {
    siteOptions.analytics_google = data.html.analytics.google_analytics_id;
  }

  if (defined(data.html?.analytics?.plausible_analytics_domain)) {
    siteOptions.analytics_plausible = data.html.analytics.plausible_analytics_domain;
  }

  const repo = defined(data.repository?.url) ? parseGitHubRepoURL(data.repository?.url) : undefined;
  if (defined(repo)) {
    project.github = repo;
  }

  // Do we want to enable thebe and mybinder?
  if (
    defined(repo) &&
    (defined(data.launch_buttons?.binderhub_url) || !!data.launch_buttons?.thebe)
  ) {
    project.thebe = {
      binder: {
        repo: repo,
        provider: 'github',
        url: data.launch_buttons?.binderhub_url,
        ref: data.repository?.branch,
      },
    };
  }

  // Take bibliography
  if (defined(data.bibtex_bibfiles)) {
    project.bibliography = data.bibtex_bibfiles;
  }

  // Defined LaTeX target name
  if (defined(data.latex?.latex_documents?.targetname)) {
    project.exports = project.exports ?? [];

    // Strip any extensions
    const { name } = parse(data.latex.latex_documents.targetname);
    project.exports.push({
      format: ExportFormats.pdf,
      template: 'plain_latex_book',
      output: `exports/${name}.pdf`,
    });
  }

  return { project, site };
}
