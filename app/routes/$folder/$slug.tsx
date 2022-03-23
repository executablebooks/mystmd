import { MetaFunction, redirect, useCatch, useLoaderData } from 'remix';
import type { LoaderFunction, LinksFunction } from 'remix';
import { getData } from '~/utils/file.loader.server';
import { GenericParent } from 'mystjs';
import { ReferencesProvider, ContentBlock } from '~/components';
import {
  getMetaTagsForArticle,
  getFolder,
  PageLoader,
  getFooterLinks,
  Config,
  getConfig,
} from '~/utils';
import { Footer } from '~/components/FooterLinks';
import { Bibliography } from '../../components/renderers/cite';

export const meta: MetaFunction = (args) => {
  const config = args.parentsData.root.config as Config | undefined;
  const data = args.data as PageLoader | undefined;
  if (!data) return {};
  return getMetaTagsForArticle({
    origin: '',
    url: args.location.pathname,
    title: `${data?.frontmatter.title} - ${config?.site.name}`,
    description: data.frontmatter.description,
  });
};

export const links: LinksFunction = () => {
  return [
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/katex@0.15.2/dist/katex.min.css',
      integrity:
        'sha384-MlJdn/WNKDGXveldHDdyRP1R4CTHr3FeuDNfhsLPYrq2t0UBkUdK2jyTnXPEK1NQ',
      crossOrigin: 'anonymous',
    },
  ];
};

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<PageLoader | Response> => {
  const folderName = params.folder;
  const config = await getConfig(request);
  const folder = getFolder(config, folderName);
  if (!folder) {
    throw new Response('Article was not found', { status: 404 });
  }
  if (folder.index === params.id) {
    return redirect(`/${folderName}`);
  }
  const slug = params.loadIndexPage ? folder.index : params.slug;
  const loader = await getData(folderName, slug).catch((e) => {
    console.log(e);
    return null;
  });
  if (!loader) throw new Response('Article was not found', { status: 404 });
  const footer = getFooterLinks(config, folderName, slug);
  return { ...loader, footer };
};

export default function Page() {
  const article = useLoaderData<PageLoader>();
  const blocks = article.mdast.children as GenericParent[];
  return (
    <ReferencesProvider references={article.references}>
      <div>
        <h1 className="title">{article.frontmatter.title}</h1>
        {article.frontmatter.author && article.frontmatter.author.length > 0 && (
          <header className="not-prose mb-10">
            <ol>
              {article.frontmatter.author?.map((author, i) => (
                <li key={i}>{author}</li>
              ))}
            </ol>
          </header>
        )}
        {blocks.map((node, index) => {
          return <ContentBlock key={node.key} id={`${index}`} node={node} />;
        })}
        {article.references.cite.order.length > 0 && <Bibliography />}
        <Footer links={article.footer} />
      </div>
    </ReferencesProvider>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  // TODO: This can give a pointer to other pages in the space
  return (
    <div>
      {caught.status} {caught.statusText}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Test</h1>
      <div>Something went wrong.</div>
    </>
  );
}
