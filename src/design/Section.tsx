import * as React from 'react';

/** A landing section: an id for the nav, one heading, an optional lead. */
export function Section({ id, title, lead, children, className = '', titleAs: Title = 'h2' }: { id: string; title: React.ReactNode; lead?: React.ReactNode; children: React.ReactNode; className?: string; titleAs?: 'h1' | 'h2' }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`py-16 sm:py-24 ${className}`}>
      <div className="container-x">
        <Title id={`${id}-title`} className="text-3xl sm:text-4xl font-semibold">{title}</Title>
        {lead ? <p className="mt-3 max-w-2xl text-lg text-muted">{lead}</p> : null}
        <div className="mt-10 min-w-0">{children}</div>
      </div>
    </section>
  );
}
