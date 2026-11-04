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
          <Button href={sponsors.url} className="mt-6" data-testid="sponsor-button"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 2.6 4.8 6 4.2c2-.3 3.8.6 6 2.9 2.2-2.3 4-3.2 6-2.9 3.4.6 5.1 4.1 3.6 7.6C19.5 16.4 12 21 12 21z" /></svg> {t('support.button')}</Button>
        </div>
        <div className="surface p-6" data-testid="sponsor-wall">
          <h3 className="text-lg font-semibold">{t('support.wallTitle')}</h3>
          {sponsors.wall.length === 0 ? <p className="mt-3 text-sm text-muted">{t('support.wallEmpty')}</p> : (
            <ul className="mt-3 flex flex-wrap gap-2">{sponsors.wall.map((s) => <li key={s.name}>{s.url ? <a href={s.url} rel="noopener" className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm">{s.name}</a> : <span className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm">{s.name}</span>}</li>)}</ul>
          )}
        </div>
      </div>
    </Section>
  );
}
