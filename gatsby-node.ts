import type { GatsbyNode } from 'gatsby';
import path from 'node:path';
import fs from 'node:fs';
import { siteConfig } from './site.config';

type DocNode = { id: string; frontmatter: { slug: string; title: string; description?: string; order?: number; section?: string }; internal: { contentFilePath: string }; excerpt: string };

export const createSchemaCustomization: GatsbyNode['createSchemaCustomization'] = ({ actions }) => {
  actions.createTypes(`
    type Mdx implements Node { frontmatter: MdxFrontmatter! }
    type MdxFrontmatter { slug: String!, title: String!, description: String, order: Int, section: String }
  `);
};

export const createPages: GatsbyNode['createPages'] = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;
  const result = await graphql<{ allMdx: { nodes: DocNode[] } }>(`
    query DocPages { allMdx(sort: { frontmatter: { order: ASC } }) { nodes { id frontmatter { slug title description order section } internal { contentFilePath } excerpt(pruneLength: 240) } } }
  `);
  if (result.errors || !result.data) { reporter.panicOnBuild('docs query failed', result.errors); return; }
  const template = path.resolve('src/templates/DocPage.tsx');
  const docs = result.data.allMdx.nodes;
  for (const node of docs) {
    createPage({
      path: `/docs/${node.frontmatter.slug}/`.replace('/docs/index/', '/docs/'),
      component: `${template}?__contentFilePath=${node.internal.contentFilePath}`,
      context: { id: node.id, slug: node.frontmatter.slug },
    });
  }
  // The pricing page exists only when SHOW_PRICING=true (local and preview builds); production never creates it.
  if (siteConfig.pricing.enabled) {
    createPage({ path: siteConfig.pricing.path, component: path.resolve('src/templates/PricingPage.tsx'), context: {} });
    reporter.info(`SHOW_PRICING=true: created ${siteConfig.pricing.path}`);
  } else {
    reporter.info(`SHOW_PRICING unset: ${siteConfig.pricing.path} is not built`);
  }
};

/** The local search index: docs pages, skills, agents and nen verbs, written once for FlexSearch to load lazily on the docs pages. */
export const onPostBuild: GatsbyNode['onPostBuild'] = async ({ graphql, reporter }) => {
  const result = await graphql<{
    allMdx: { nodes: DocNode[] };
    allHatsuSkill: { nodes: Array<{ name: string; alias: string | null; description: string | null }> };
    allHatsuAgent: { nodes: Array<{ name: string; alias: string | null; description: string | null }> };
    allNenVerb: { nodes: Array<{ verb: string; purposeHtml: string | null }> };
  }>(`
    query SearchIndex {
      allMdx { nodes { id frontmatter { slug title description } internal { contentFilePath } excerpt(pruneLength: 400) } }
      allHatsuSkill { nodes { name alias description } }
      allHatsuAgent { nodes { name alias description } }
      allNenVerb { nodes { verb purposeHtml } }
    }
  `);
  if (!result.data) { reporter.warn('search index: query returned no data'); return; }
  const strip = (s: string | null | undefined) => (s ?? '').replace(/<[^>]+>/g, '');
  const entries = [
    ...result.data.allMdx.nodes.map((n) => ({ id: `doc:${n.frontmatter.slug}`, title: n.frontmatter.title, text: `${n.frontmatter.description ?? ''} ${n.excerpt}`, url: `/docs/${n.frontmatter.slug}/`.replace('/docs/index/', '/docs/'), kind: 'page' })),
    ...result.data.allHatsuSkill.nodes.map((n) => ({ id: `skill:${n.name}`, title: `${n.name} · ${n.alias ?? ''}`, text: strip(n.description), url: `/docs/hatsu-guide/#skill-${n.name}`, kind: 'skill' })),
    ...result.data.allHatsuAgent.nodes.map((n) => ({ id: `agent:${n.name}`, title: `${n.name} · ${n.alias ?? ''}`, text: strip(n.description), url: `/docs/hatsu-guide/#agent-${n.name}`, kind: 'agent' })),
    ...result.data.allNenVerb.nodes.map((n) => ({ id: `verb:${n.verb}`, title: n.verb, text: strip(n.purposeHtml), url: `/docs/nen-reference/#verb-${n.verb.replace(/\s+/g, '-')}`, kind: 'verb' })),
  ];
  fs.mkdirSync(path.resolve('public'), { recursive: true });
  fs.writeFileSync(path.resolve('public/search-index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), entries }));
  reporter.info(`search index: ${entries.length} entries`);
};

export const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: { alias: { '@': path.resolve(__dirname, 'src'), '@config': path.resolve(__dirname, 'site.config.ts') } },
  });
};
