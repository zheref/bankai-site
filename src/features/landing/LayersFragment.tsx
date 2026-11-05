import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Card } from '@/design/Card';
import { Mark, type Tier } from '@/design/Mark';
import { Badge } from '@/design/Badge';
import { useLandingData } from './useLandingData';

export function LayersFragment() {
  const { repos } = useLandingData();
  const hatsu = repos.hatsu;
  const skills = hatsu?.skillCount ? `${hatsu.skillCount >= 60 ? '60+' : hatsu.skillCount}` : siteConfig.hatsuCounts.skills;
  const agents = hatsu?.agentCount ?? siteConfig.hatsuCounts.agents;
  const parts: Array<{ tier: Tier; name: string; role: string; text: string; version?: string; href?: string; status?: 'live' | 'later' }> = [
    { tier: 'nen', name: t('layers.nen.name'), role: t('layers.nen.role'), text: t('layers.nen.text'), version: repos.nen?.version, href: siteConfig.github.nen, status: 'live' },
    { tier: 'hatsu', name: t('layers.hatsu.name'), role: t('layers.hatsu.role'), text: t('layers.hatsu.text', 'en', { skills, agents }), version: hatsu?.version, href: siteConfig.github.hatsu, status: 'live' },
    { tier: 'handbooks', name: t('layers.handbooks.name'), role: t('layers.handbooks.role'), text: t('layers.handbooks.text'), version: repos.handbooks?.version, href: siteConfig.github.handbooks, status: 'live' },
    { tier: 'library', name: t('layers.library.name'), role: t('layers.library.role'), text: t('layers.library.text'), status: 'later' },
    { tier: 'cloud', name: siteConfig.cloudTier.label, role: t('layers.cloud.role'), text: t('layers.cloud.text'), status: 'later' },
  ];
  return (
    <Section id="how" title={t('layers.title')} lead={t('layers.lead')}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map((p) => (
          <Card key={p.tier} as="li" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><Mark tier={p.tier} size={36} /><div><h3 className="text-lg font-semibold">{p.name}</h3><p className="font-mono text-xs uppercase tracking-wide text-muted">{p.role}</p></div></div>
              {p.status === 'later' ? <Badge kind="coming-later">{t('badges.comingLater')}</Badge> : p.version ? <Badge kind="available">v{p.version.replace(/^v/, '')}</Badge> : null}
            </div>
            <p className="text-muted">{p.text}</p>
            {p.href ? <a href={p.href} rel="noopener" className="mt-auto inline-flex min-h-11 items-center text-sm font-medium text-accent">{p.href.replace('https://', '')}</a> : null}
          </Card>
        ))}
      </ul>
    </Section>
  );
}
