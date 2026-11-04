import * as React from 'react';
import { siteConfig } from '@config';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Mark, type Tier } from '@/design/Mark';
import { Badge } from '@/design/Badge';
import { InlineMd } from '@/design/InlineMd';
import { useLandingData } from './useLandingData';

type Layer = { id: Tier; name: string; summary: string; status: 'live' | 'later' | 'roadmap'; detail: string };

/** The layers, selectable; each selection reveals one detail panel. Buttons, not hover, so it works by keyboard and touch (UX-2). */
export function ArchitectureFragment() {
  const { gates } = useLandingData();
  const layers: Layer[] = [
    { id: 'cloud', name: siteConfig.cloudTier.label, summary: t('layers.cloud.text'), status: 'later', detail: 'The future autonomous plane: what Hatsu does, run for you in your own org on GitHub Actions or self-hosted runners, always with your own model API key. Unnamed, unpriced and not for sale yet.' },
    { id: 'hatsu', name: 'Hatsu', summary: t('layers.hatsu.role'), status: 'live', detail: 'The governance harness: a plugin of skills and agents for Claude Code, Codex, Cursor and Antigravity. It drives work from a request to a human gate; every deterministic step is a Nen verb.' },
    { id: 'nen', name: 'Nen', summary: t('layers.nen.role'), status: 'live', detail: 'One deterministic CLI binary. It detects, computes, formats and verifies: PR readiness, backlog boards, label taxonomy, release preflight, scaffold. It never decides.' },
    { id: 'handbooks', name: 'Bankai-Handbooks', summary: t('layers.handbooks.role'), status: 'live', detail: 'Citable practices per stack and baselines for security, UX, release and quality. Agents and humans follow the same written canon; reviewers cite rules by id.' },
    { id: 'library', name: 'Bankai-Library', summary: t('layers.library.role'), status: 'roadmap', detail: 'Reusable components, next on the path. Not created yet; shown as roadmap only.' },
  ];
  const [selected, setSelected] = React.useState<string>('hatsu');
  const current = layers.find((l) => l.id === selected) ?? gates.find((g) => g.gate.replace(/\*/g, '') === selected);
  const gateId = (g: { gate: string }) => g.gate.replace(/\*/g, '');
  return (
    <Section id="architecture" title={t('architecture.title')} lead={t('architecture.lead')}>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ol className="flex flex-col gap-2" aria-label="Layers">
            {layers.map((l) => {
              const active = selected === l.id;
              return (
                <li key={l.id}>
                  <button type="button" aria-pressed={active} onClick={() => setSelected(l.id)} className={`flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors motion-reduce:transition-none ${active ? 'border-accent bg-surface' : 'border-line hover:border-accent/60'} ${l.status !== 'live' ? 'border-dashed' : ''}`}>
                    <Mark tier={l.id} size={32} />
                    <span className="flex-1"><span className="block font-semibold">{l.name}</span><span className="block text-sm text-muted">{l.summary}</span></span>
                    {l.status === 'later' ? <Badge kind="coming-later">{t('badges.comingLater')}</Badge> : l.status === 'roadmap' ? <Badge kind="roadmap">{t('badges.roadmap')}</Badge> : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <h3 id="gates" className="mt-8 scroll-mt-24 text-xl font-semibold">{t('architecture.gatesTitle')}</h3>
          <p className="mt-1 text-sm text-muted">{t('architecture.gatesLead')}</p>
          <ol className="mt-3 flex flex-wrap gap-2" aria-label="Human gates">
            {gates.map((g) => {
              const id = gateId(g);
              const active = selected === id;
              return (
                <li key={id}>
                  <button type="button" aria-pressed={active} onClick={() => setSelected(id)} className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 font-mono text-sm ${active ? 'border-accent bg-surface text-text' : 'border-line text-muted hover:text-text'}`}>
                    <span className="gate-square" aria-hidden="true" />{id}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="surface p-6" aria-live="polite">
          {current && 'detail' in current ? (
            <>
              <div className="flex items-center gap-3"><Mark tier={current.id} size={40} /><h3 className="text-xl font-semibold">{current.name}</h3></div>
              <p className="mt-3 text-muted">{current.detail}</p>
            </>
          ) : current ? (
            <>
              <h3 className="font-mono text-xl font-semibold">{gateId(current)} <span className="text-sm text-muted">· {current.clause}</span></h3>
              <InlineMd as="p" className="mt-3 text-muted" html={current.whatHtml} />
              <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted">Delegable?</p>
              <InlineMd as="p" className="text-sm text-muted" html={current.delegableHtml} />
            </>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
