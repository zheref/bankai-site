import * as React from 'react';
import { siteConfig, type Money } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Card } from '@/design/Card';
import { Badge } from '@/design/Badge';
import { Button } from '@/design/Button';

export const fmt = (m: Money) => (m.amount === null ? null : new Intl.NumberFormat('en-US', { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }).format(m.amount));

function Price({ from, to, suffix }: { from: Money; to: Money; suffix?: string }) {
  const a = fmt(from);
  const b = fmt(to);
  const tbd = from.tbd || to.tbd;
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-2">
      {a ? <><span className="text-sm text-muted">{t('services.from')}</span><span className="text-2xl font-semibold">{a}</span>{b ? <span className="text-muted">– {b}</span> : null}{suffix ? <span className="text-sm text-muted">{suffix}</span> : null}</> : <span className="text-xl font-semibold">{t('services.contactUs')}</span>}
      {tbd ? <Badge kind="tbd" data-tbd="true">{t('services.tbd')}</Badge> : null}
    </p>
  );
}

/** Commercial copy: plain aliases only, no code names and no character names on this section or its page. */
export function ServicesFragment({ titleAs = 'h2' as const }: { titleAs?: 'h1' | 'h2' }) {
  const s = siteConfig.services;
  const H = titleAs === 'h1' ? 'h2' : 'h3'; // headings descend from the section title (Lighthouse heading-order)
  return (
    <Section id="services" title={t('services.title')} lead={t('services.lead', 'en', { provider: s.provider })} titleAs={titleAs}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <H className="text-lg font-semibold">{t('services.setupTitle')}</H>
          <p className="mt-2 text-sm text-muted">{t('services.setupText')}</p>
          <Price from={s.setup.from} to={s.setup.to} />
        </Card>
        <Card>
          <H className="text-lg font-semibold">{t('services.careTitle')}</H>
          <p className="mt-2 text-sm text-muted">{t('services.careText')}</p>
          <Price from={s.carePlanMonthly.from} to={s.carePlanMonthly.to} suffix={t('services.perMonth')} />
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button href={s.contactUrl} data-testid="services-contact">{t('services.contactUs')}</Button>
        {s.providerUrl ? <Button variant="secondary" href={s.providerUrl}>{t('services.providerLink', 'en', { provider: s.provider })}</Button> : <Badge kind="tbd">{s.provider} · {t('services.tbd')}</Badge>}
      </div>
    </Section>
  );
}
