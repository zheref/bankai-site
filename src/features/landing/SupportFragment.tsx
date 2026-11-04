import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Button } from '@/design/Button';

export function SupportFragment() {
  const { sponsors } = siteConfig;
  return (
    <Section id="support" title={t('support.title')} lead={t('support.lead')}>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold">{t('support.fundsTitle')}</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">{sponsors.funds.map((f) => <li key={f}>{f}</li>)}</ul>
          <Button href={sponsors.url} className="mt-6" data-testid="sponsor-button">♥ {t('support.button')}</Button>
        </div>
        <div className="surface p-6" data-testid="sponsor-wall">
          <h3 className="text-lg font-semibold">{t('support.wallTitle')}</h3>
          {sponsors.wall.length === 0 ? <p className="mt-3 text-sm text-muted">{t('support.wallEmpty')}</p> : (
            <ul className="mt-3 flex flex-wrap gap-2">{sponsors.wall.map((s) => <li key={s.name}>{s.url ? <a href={s.url} rel="noopener" className="rounded-md border border-line px-3 py-1 text-sm">{s.name}</a> : <span className="rounded-md border border-line px-3 py-1 text-sm">{s.name}</span>}</li>)}</ul>
          )}
        </div>
      </div>
    </Section>
  );
}
