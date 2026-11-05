/**
 * The one configuration file for the Bankai developer site.
 *
 * Every URL, label, price and flag the pages read lives here so a later
 * decision (the repository name, the host, the Cloud tier's name, a price)
 * is one edit. Values marked `tbd: true` render with a visible TBD tag.
 * Nothing in this file is read from the source repositories; those values
 * come from `src/data/generated/*.json` (see scripts/sources/collect.mjs).
 */

export type Money = { amount: number | null; currency: 'USD'; tbd: boolean };

const money = (amount: number | null, tbd = true): Money => ({ amount, currency: 'USD', tbd });

export const siteConfig = {
  /** Working codename in docs and commits; the GitHub repository name Sergio decided on 2026-11-04. */
  codename: 'site',
  repoName: 'bankai-site',
  /**
   * The site's ORIGIN (no path): canonical and Open Graph URLs, the sitemap. bankai.zheref.dev is owned; an independent
   * domain comes later. The Pages deploy sets GATSBY_SITE_URL to the origin GitHub serves the site from (the
   * github.io host until the custom domain is set); the path prefix is Gatsby's pathPrefix, never part of this value.
   */
  siteUrl: process.env.GATSBY_SITE_URL || 'https://bankai.zheref.dev',
  siteTitle: 'bankai',
  /** The brand. Lowercase in repository and package names. */
  brand: 'Bankai',
  maintainer: { handle: 'zheref', url: 'https://github.com/zheref' },
  license: 'MIT',
  github: {
    hatsu: 'https://github.com/zheref/hatsu',
    nen: 'https://github.com/zheref/nen',
    handbooks: 'https://github.com/zheref/bankai-handbooks',
    /** The site's own repository, created by Sergio; the name is decided, the remote is not yet created. */
    site: 'https://github.com/zheref/bankai-site',
    sponsors: 'https://github.com/sponsors/zheref',
  },
  /** The future paid tier has no public name yet. One value, so a future name is one change. */
  cloudTier: {
    label: 'Cloud tier',
    teaser: 'Cloud tier, coming later',
    /** Where "Get notified" sends people. Unset: the teaser renders without a form. TBD by Sergio. */
    waitlistUrl: null as string | null,
  },
  /** Bankai-Library does not exist yet; it is roadmap only. */
  library: { status: 'roadmap' as const },
  /** Package naming: `nen` today; publishing as `bankai-nen` is PROPOSED and awaits Sergio. */
  nen: { packageName: 'nen', proposedPackageName: 'bankai-nen', proposalStatus: 'proposed' as const },
  /** The `shibari` → `musubi` rename is PROPOSED only; `shibari` stays the code name until Sergio decides. */
  proposedRenames: [{ from: 'shibari', to: 'musubi', status: 'proposed' as const }],
  /** GitHub Sponsors: approved 2026-11-04. The wall stays empty until there are sponsors. */
  sponsors: {
    url: 'https://github.com/sponsors/zheref',
    funds: [
      'Maintaining Nen, Hatsu and the Handbooks across four agent surfaces',
      'Model usage for building and testing Bankai itself',
      'Documentation, examples and the public site',
    ],
    /** Add `{ name, url }` rows as sponsors arrive; empty renders the empty-wall note. */
    wall: [] as Array<{ name: string; url?: string }>,
  },
  /** Governed AI delivery setup for dev teams, delivered by ValleIA. All prices TBD (Sergio, 2026-11-04). */
  services: {
    provider: 'ValleIA',
    /** The ValleIA site. TBD by Sergio; unset renders no link. */
    providerUrl: null as string | null,
    /** Where the contact CTA goes while no ValleIA contact route is decided. */
    contactUrl: 'https://github.com/zheref',
    setup: { from: money(2500), to: money(7500) },
    carePlanMonthly: { from: money(500), to: money(1500) },
  },
  /** Hidden behind SHOW_PRICING (default false). Every value TBD; the frame is bring-your-own-key. */
  pricing: {
    enabled: process.env.SHOW_PRICING === 'true',
    path: '/pricing/',
    model: 'bring your own model API key',
    publicReposFree: { value: true, tbd: true },
    trialDays: money(null),
    tiers: [
      { id: 'solo', name: 'Solo', price: money(19), per: 'month', includes: '1 private repository' },
      { id: 'team', name: 'Team', price: money(15), per: 'active developer per month', minimum: 5, alternative: { price: money(49), per: 'repository per month' } },
      { id: 'enterprise', name: 'Enterprise', price: money(null), per: 'custom', includes: 'self-hosted runners' },
    ],
  },
  /** Counts shown in copy. The live counts are read from the hatsu repository at build time. */
  hatsuCounts: { skills: '60+', agents: 17 },
  i18n: { defaultLocale: 'en', locales: ['en'] as const },
  /** The three source repositories, pinned in sources.json. */
  sourcesFile: 'sources.json',
} as const;

export type SiteConfig = typeof siteConfig;
export default siteConfig;
