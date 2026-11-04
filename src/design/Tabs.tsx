import * as React from 'react';

export type Tab = { id: string; label: string; content: React.ReactNode };

/** WAI-ARIA tabs: arrow keys move focus and selection, Home/End jump, every panel is reachable by keyboard (UX-2). */
export function Tabs({ tabs, label, initial, className = '' }: { tabs: Tab[]; label: string; initial?: string; className?: string }) {
  const [active, setActive] = React.useState(initial ?? tabs[0]?.id ?? '');
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    setActive(tab.id);
    refs.current[next]?.focus();
  };
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2 border-b border-line">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => { refs.current[i] = el; }}
              role="tab"
              id={`tab-${tab.id}`}
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-11 px-4 py-2 font-mono text-sm -mb-px border-b-2 transition-colors motion-reduce:transition-none ${selected ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} hidden={tab.id !== active} tabIndex={0} className="pt-6 focus-visible:outline-none">
          {tab.id === active ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
