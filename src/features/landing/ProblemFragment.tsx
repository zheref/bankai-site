import * as React from 'react';
import { t } from '@/library/i18n';

export function ProblemFragment() {
  return (
    <section id="problem" aria-labelledby="problem-title" className="border-y border-line bg-surface/60 py-12">
      <div className="container-x">
        <h2 id="problem-title" className="text-2xl font-semibold sm:text-3xl">{t('problem.title')}</h2>
        <p className="mt-2 max-w-2xl text-lg text-muted">{t('problem.body')}</p>
      </div>
    </section>
  );
}
