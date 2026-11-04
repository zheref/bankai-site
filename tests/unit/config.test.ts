import { siteConfig } from '@config';
import names from '@/data/names.json';

describe('site.config.ts', () => {
  it('labels the future paid tier only as the configured Cloud tier label, with no name', () => {
    expect(siteConfig.cloudTier.label).toBe('Cloud tier');
    expect(siteConfig.cloudTier.teaser).toContain('coming later');
  });
  it('tags every price as TBD until Sergio decides', () => {
    const monies = [siteConfig.services.setup.from, siteConfig.services.setup.to, siteConfig.services.carePlanMonthly.from, siteConfig.services.carePlanMonthly.to, siteConfig.pricing.trialDays, ...siteConfig.pricing.tiers.flatMap((t) => [t.price, ...('alternative' in t && t.alternative ? [t.alternative.price] : [])])];
    for (const m of monies) expect(m.tbd).toBe(true);
    expect(siteConfig.pricing.publicReposFree.tbd).toBe(true);
  });
  it('keeps the pricing page off by default', () => {
    expect(siteConfig.pricing.enabled).toBe(false);
    expect(siteConfig.pricing.path).toBe('/pricing/');
  });
  it('keeps nen as the package name while bankai-nen is only proposed', () => {
    expect(siteConfig.nen.packageName).toBe('nen');
    expect(siteConfig.nen.proposalStatus).toBe('proposed');
    expect(siteConfig.proposedRenames.map((r) => `${r.from}->${r.to}`)).toEqual(['shibari->musubi']);
    expect(names.proposedRenames[0]).toMatchObject({ from: 'shibari', to: 'musubi' });
  });
  it('points sponsors and GitHub links at the maintainer', () => {
    expect(siteConfig.sponsors.url).toBe('https://github.com/sponsors/zheref');
    expect(siteConfig.sponsors.wall).toEqual([]);
    expect(siteConfig.github.hatsu).toBe('https://github.com/zheref/hatsu');
    expect(siteConfig.siteUrl).toBe('https://bankai.zheref.dev');
  });
});
