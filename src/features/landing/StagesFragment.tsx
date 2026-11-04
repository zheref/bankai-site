import * as React from 'react';
import { Link } from 'gatsby';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';
import { Card } from '@/design/Card';
import { Badge } from '@/design/Badge';
import { STAGES, stageAvailability } from './stages';
import { useLandingData } from './useLandingData';

export function StagesFragment() {
  const { skills } = useLandingData();
  const present = new Set(Object.keys(skills));
  return (
    <Section id="stages" title={t('stages.title')} lead={t('stages.lead')}>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage, i) => {
          const status = stageAvailability(present, stage.skills);
          return (
            <Card key={stage.id} as="li" className="flex flex-col gap-3" data-stage={stage.id} data-status={status}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                <Badge kind={status}>{status === 'available' ? t('stages.available') : t('stages.planned')}</Badge>
              </div>
              <h3 className="text-lg font-semibold">{t(`stages.items.${stage.id}.title`)}</h3>
              <p className="text-base text-muted">{t(`stages.items.${stage.id}.text`)}</p>
              <ul className="mt-auto flex flex-wrap gap-2">
                {stage.skills.map((name) => {
                  const s = skills[name];
                  return (
                    <li key={name}>
                      <Link to={`/docs/hatsu-guide/#skill-${name}`} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-2.5 py-1 text-sm no-underline hover:border-accent" title={s?.description ?? undefined}>
                        <code className="text-text">{name}</code>
                        {s?.alias ? <span className="text-muted">· {s.alias}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </ol>
    </Section>
  );
}
