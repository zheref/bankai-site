import * as React from 'react';

export type TermLine = { kind: 'cmd' | 'out' | 'note'; text: string; prompt?: string };

/**
 * A terminal panel whose lines appear in order with a CSS-only typing effect. Every line is in the DOM from the start
 * (screen readers read the whole transcript); prefers-reduced-motion shows everything at once (UX-9).
 */
export function Terminal({ lines, title = 'terminal', className = '' }: { lines: TermLine[]; title?: string; className?: string }) {
  return (
    <div className={`min-w-0 max-w-full rounded-xl border border-line bg-terminal text-[#e6e9ef] shadow-2xl ${className}`} role="group" aria-label={title}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 font-mono text-xs text-[#9aa4b2]">
        <span className="gate-square" aria-hidden="true" />
        <span>{title}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 sm:text-sm" aria-live="off" tabIndex={0}>
        {lines.map((line, i) => {
          const style = { '--i': i, '--n': line.text.length } as React.CSSProperties;
          const last = i === lines.length - 1;
          if (line.kind === 'cmd') {
            return (
              <div key={i} className="term-line" style={style}>
                <span className="text-[#22d3ee]" aria-hidden="true">{line.prompt ?? '$'} </span>
                <span className={`term-cmd ${last ? 'term-cursor' : ''}`} style={style}>{line.text}</span>
              </div>
            );
          }
          return (
            <div key={i} className={`term-line ${line.kind === 'note' ? 'text-[#9aa4b2]' : ''} ${last ? 'term-cursor' : ''}`} style={style}>
              {line.text}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
