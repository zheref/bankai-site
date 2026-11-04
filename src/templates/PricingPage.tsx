import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Layout } from '@/features/shell/Layout';
import { Seo } from '@/features/shell/Seo';
import { Section } from '@/design/Section';
import { Card } from '@/design/Card';
import { Badge } from '@/design/Badge';
import { fmt } from '@/features/landing/ServicesFragment';

/**
 * The hidden pricing page for the unnamed Cloud tier. Built only when SHOW_PRICING=true (gatsby-node.ts), never
 * linked from the nav, footer or sitemap, served with noindex. Every value comes from site.config.ts and is tagged TBD.
 * Commercial page: plain language only, no code names, no character names.
 */
const PricingPage: React.FC<PageProps> = () => {
  const { pricing, cloudTier } = siteConfig;
  const tbd = <Badge kind="tbd" data-tbd="true" className="ml-2">{t('badges.tbd')}</Badge>;
  return (
    <Layout>
      <Section id="pricing" title={t('pricing.title', 'en', { cloud: cloudTier.label })} lead={t('pricing.lead', 'en', { cloud: cloudTier.label })} titleAs="h1">
        <p className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
          <Badge kind="coming-later">{t('badges.comingLater')}</Badge>
          <span>{t('pricing.byok')}</span>
          <span>· {t('pricing.publicFree')} {pricing.publicReposFree.tbd ? tbd : null}</span>
          <span>· {t('pricing.trial')}: {pricing.trialDays.amount ?? '—'} {tbd}</span>
        </p>
        <ul className="grid gap-4 md:grid-cols-3" data-testid="pricing-tiers">
          {pricing.tiers.map((tier) => (
            <Card as="li" key={tier.id} data-tier={tier.id}>
              <h2 className="text-lg font-semibold">{tier.name}</h2>
              <p className="mt-3 text-2xl font-semibold">
                {fmt(tier.price) ?? t('pricing.custom')}
                {tier.price.amount !== null ? <span className="ml-1 text-sm font-normal text-muted">/ {tier.per}</span> : null}
                {tier.price.tbd ? tbd : null}
              </p>
              {'minimum' in tier && tier.minimum ? <p className="mt-1 text-sm text-muted">{t('pricing.minimum', 'en', { n: tier.minimum })}</p> : null}
              {'alternative' in tier && tier.alternative ? <p className="mt-1 text-sm text-muted">{t('pricing.or')} {fmt(tier.alternative.price)} / {tier.alternative.per} {tier.alternative.price.tbd ? tbd : null}</p> : null}
              {'includes' in tier && tier.includes ? <p className="mt-2 text-sm text-muted">{tier.includes}</p> : null}
            </Card>
          ))}
        </ul>
        <p className="mt-8 font-mono text-xs text-muted">{t('pricing.hidden')}</p>
      </Section>
    </Layout>
  );
};

export default PricingPage;
export const Head: HeadFC = () => <Seo title={siteConfig.cloudTier.label} pathname={siteConfig.pricing.path} noindex />;
