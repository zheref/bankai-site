import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Badge } from '@/design/Badge';
import { Button } from '@/design/Button';

const rows: Array<{ key: string; oss: 'yes' | 'no' | 'later'; cloud: 'yes' | 'no' | 'later' }> = [
  { key: 'nen', oss: 'yes', cloud: 'yes' },
  { key: 'hatsu', oss: 'yes', cloud: 'yes' },
  { key: 'handbooks', oss: 'yes', cloud: 'yes' },
  { key: 'library', oss: 'later', cloud: 'later' },
  { key: 'credentials', oss: 'yes', cloud: 'yes' },
  { key: 'autonomous', oss: 'no', cloud: 'later' },
  { key: 'apps', oss: 'no', cloud: 'later' },
  { key: 'runners', oss: 'no', cloud: 'later' },
  { key: 'byok', oss: 'yes', cloud: 'yes' },
];

const cell = (v: 'yes' | 'no' | 'later') => (v === 'yes' ? <span className="text-accent">● {t('oss.yes')}</span> : v === 'later' ? <span className="text-muted">◌ {t('oss.later')}</span> : <span className="text-muted">— {t('oss.no')}</span>);

export function OssVsCloudFragment() {
  const cloud = siteConfig.cloudTier.label;
  return (
    <Section id="open-source" title={t('oss.title')} lead={t('oss.lead')}>
      <div className="overflow-x-auto" tabIndex={0} aria-label="Open source versus the Cloud tier, scrollable">
        <table className="w-full min-w-[32rem] table-fixed border-collapse text-sm">
          <colgroup><col className="w-[44%]" /><col className="w-[28%]" /><col className="w-[28%]" /></colgroup>
          <caption className="sr-only">Open source versus the {cloud}</caption>
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pr-4"> </th>
              <th scope="col" className="py-2 pr-4">{t('oss.freeTitle')} · {siteConfig.license}</th>
              <th scope="col" className="py-2">{t('oss.cloudTitle', 'en', { cloud })} <Badge kind="coming-later" className="ml-1">{t('badges.comingLater')}</Badge></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line">
                <th scope="row" className="py-3 pr-4 text-left font-medium">{t(`oss.rows.${r.key}`)}</th>
                <td className="py-3 pr-4">{cell(r.oss)}</td>
                <td className="py-3">{cell(r.cloud)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 max-w-2xl font-medium">{t('oss.complete')}</p>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t('oss.credentialsNote')}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <p className="text-muted">{t('oss.teaser')}</p>
        {siteConfig.cloudTier.waitlistUrl ? <Button variant="secondary" href={siteConfig.cloudTier.waitlistUrl}>{t('oss.notify')}</Button> : <Badge kind="tbd">{t('oss.notifyUnset')}</Badge>}
      </div>
    </Section>
  );
}
