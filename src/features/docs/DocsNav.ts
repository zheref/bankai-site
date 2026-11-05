export const DOCS_NAV: Array<{ slug: string; title: string }> = [
  { slug: 'index', title: 'Overview' },
  { slug: 'getting-started', title: 'Getting started' },
  { slug: 'concepts', title: 'Concepts' },
  { slug: 'hatsu-guide', title: 'Hatsu guide' },
  { slug: 'tiers-and-phases', title: 'Tiers and phases' },
  { slug: 'nen-reference', title: 'Nen reference' },
  { slug: 'handbooks', title: 'Handbooks' },
  { slug: 'configuration', title: 'Configuration' },
  { slug: 'changelog', title: 'Changelog' },
];
export const docPath = (slug: string) => (slug === 'index' ? '/docs/' : `/docs/${slug}/`);
