import * as React from 'react';
import { graphql, Link, type HeadFC, type PageProps } from 'gatsby';
import { MDXProvider } from '@mdx-js/react';
import { Layout } from '@/features/shell/Layout';
import { Seo } from '@/features/shell/Seo';
import { DOCS_NAV, docPath } from '@/features/docs/DocsNav';
import { DocsSearch } from '@/features/docs/Search';
import { docsComponents } from '@/features/docs/DocsComponents';
import { t } from '@/library/i18n';

type Data = { mdx: { frontmatter: { slug: string; title: string; description?: string }; tableOfContents: { items?: Array<{ url: string; title: string }> } } };

const DocPage: React.FC<PageProps<Data>> = ({ data, children }) => {
  const { frontmatter, tableOfContents } = data.mdx;
  const toc = tableOfContents.items ?? [];
  return (
    <Layout main={false}>
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[14rem_1fr_12rem]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DocsSearch />
          <nav aria-label="Docs" className="mt-4" data-testid="docs-nav">
            <ul className="flex flex-row flex-wrap gap-1 lg:flex-col">
              {DOCS_NAV.map((d) => (
                <li key={d.slug}><Link to={docPath(d.slug)} activeClassName="text-accent border-accent" className="block min-h-11 rounded-md border border-transparent px-3 py-2 text-sm text-muted no-underline hover:text-text lg:min-h-9 lg:py-1.5">{d.title}</Link></li>
              ))}
            </ul>
          </nav>
        </aside>
        <main id="main" className="prose-site min-w-0">
          <h1 className="text-3xl font-semibold sm:text-4xl">{frontmatter.title}</h1>
          {frontmatter.description ? <p className="mt-2 text-lg text-muted">{frontmatter.description}</p> : null}
          <div className="mt-8">
            <MDXProvider components={docsComponents}>{children}</MDXProvider>
          </div>
        </main>
        {toc.length ? (
          <nav aria-label={t('docs.onThisPage')} className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
            <p className="font-mono text-xs uppercase tracking-wide text-muted">{t('docs.onThisPage')}</p>
            <ul className="mt-2 space-y-1 text-sm">{toc.map((i) => <li key={i.url}><a href={i.url} className="text-muted no-underline hover:text-text">{i.title}</a></li>)}</ul>
          </nav>
        ) : null}
      </div>
    </Layout>
  );
};

export default DocPage;
export const Head: HeadFC<Data> = ({ data }) => <Seo title={data.mdx.frontmatter.title} description={data.mdx.frontmatter.description} pathname={docPath(data.mdx.frontmatter.slug)} />;
export const query = graphql`
  query DocPage($id: String!) { mdx(id: { eq: $id }) { frontmatter { slug title description } tableOfContents(maxDepth: 2) } }
`;
