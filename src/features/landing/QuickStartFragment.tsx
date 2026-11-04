import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Tabs } from '@/design/Tabs';
import { Snippet } from '@/design/Snippet';
import { useLandingData } from './useLandingData';

/** Per-surface quick start: install, session and first request from hatsu's docs/using, the Nen bootstrap at the pinned version. All read at build time. */
export function QuickStartFragment() {
  const { surfaces, nenDependency } = useLandingData();
  const tabs = surfaces.map((s) => {
    const rows = JSON.parse(s.rowsJson) as Record<string, string>;
    return {
      id: s.surfaceId,
      label: s.title,
      content: (
        <div className="grid min-w-0 gap-6">
          <Snippet id={`install-${s.surfaceId}`} caption={t('quickstart.install')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface p-4"><p className="font-mono text-xs uppercase tracking-wide text-muted">{t('quickstart.session')}</p><code className="mt-2 block text-sm">{rows['open a session']}</code></div>
            <div className="surface p-4"><p className="font-mono text-xs uppercase tracking-wide text-muted">{t('quickstart.request')}</p><code className="mt-2 block text-sm">{rows['a request']}</code></div>
          </div>
          <Snippet id={`usage-${s.surfaceId}`} caption="A session, end to end" />
          <a href={`${siteConfig.github.hatsu}/blob/main/${s.guide}`} rel="noopener" className="inline-flex min-h-11 items-center text-sm font-medium text-accent">{t('quickstart.guide')}: {s.guide}</a>
        </div>
      ),
    };
  });
  return (
    <Section id="quickstart" title={t('quickstart.title')} lead={t('quickstart.lead')}>
      <Tabs tabs={tabs} label="Agent surface" />
      <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">{t('quickstart.nen')} <span className="font-mono text-sm text-muted">{nenDependency.pinnedRef}</span></h3>
          <p className="mt-2 text-sm text-muted">{t('quickstart.nenNote')}</p>
          <p className="mt-2 font-mono text-xs text-muted">hatsu nen/contract.json · dependency.minimum {nenDependency.minimum} · pinned_ref {nenDependency.pinnedRef} · {nenDependency.source}</p>
        </div>
        <Snippet id="nen-bootstrap" caption={`nen bootstrap · ${nenDependency.pinnedRef}`} />
      </div>
    </Section>
  );
}
