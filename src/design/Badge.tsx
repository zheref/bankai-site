import * as React from 'react';

export type BadgeKind = 'available' | 'planned' | 'tbd' | 'proposed' | 'roadmap' | 'coming-later' | 'neutral';
const styles: Record<BadgeKind, string> = {
  available: 'border-accent text-accent',
  planned: 'border-line text-muted',
  tbd: 'border-line text-muted',
  proposed: 'border-line text-muted',
  roadmap: 'border-line text-muted',
  'coming-later': 'border-line text-muted',
  neutral: 'border-line text-muted',
};

/** A small status label. Never colour alone: the text carries the meaning (UX-12). */
export function Badge({ kind = 'neutral', children, className = '', ...rest }: { kind?: BadgeKind; children: React.ReactNode; className?: string } & Record<`data-${string}`, string | undefined>) {
  return <span data-badge={kind} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${styles[kind]} ${className}`} {...rest}>{children}</span>;
}
