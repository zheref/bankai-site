import * as React from 'react';
import { t } from '@/library/i18n';
import { Section } from '@/design/Section';

const ITEMS = ['free', 'agents', 'merge', 'where', 'pays', 'stacks', 'update', 'hosted'];

export function FaqFragment() {
  return (
    <Section id="faq" title={t('faq.title')}>
      <div className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((k) => (
          <details key={k} className="surface group p-4 open:border-accent">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">
              <span className="text-base font-semibold">{t(`faq.items.${k}.q`)}</span>
              <span aria-hidden="true" className="font-mono text-accent transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
            </summary>
            <p className="mt-2 text-base text-muted">{t(`faq.items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
