import * as React from 'react';
import { Link } from 'gatsby';
import { t } from '@/library/i18n';

type Entry = { id: string; title: string; text: string; url: string; kind: string };
type Index = { search: (q: string, opts?: { limit?: number }) => Array<{ result: Array<string | number> }> };

/**
 * Local search over public/search-index.json. FlexSearch and the index load on first focus, once, so the landing
 * bundle pays nothing. Plain semantics: a labelled search box and a list of result links with a live result count
 * (no combobox role, since no keyboard-driven active option exists; UX-2).
 */
export function DocsSearch() {
  const [q, setQ] = React.useState('');
  const [entries, setEntries] = React.useState<Record<string, Entry>>({});
  const [index, setIndex] = React.useState<Index | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Entry[]>([]);
  const loading = React.useRef(false);
  const load = React.useCallback(async () => {
    if (index || loading.current) return;
    loading.current = true;
    try {
      const [mod, res] = await Promise.all([import('flexsearch'), fetch('/search-index.json')]);
      if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
      const Document = (mod as { Document?: unknown; default?: { Document?: unknown } }).Document ?? (mod as { default?: { Document?: unknown } }).default?.Document;
      if (typeof Document !== 'function') throw new Error('search: FlexSearch Document is unavailable');
      const data = (await res.json()) as { entries: Entry[] };
      const doc = new (Document as new (o: unknown) => { add: (e: Entry) => void })({ document: { id: 'id', index: ['title', 'text'] }, tokenize: 'forward' });
      for (const e of data.entries) doc.add(e);
      setEntries(Object.fromEntries(data.entries.map((e) => [e.id, e])));
      setIndex(doc as unknown as Index);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      loading.current = false;
    }
  }, [index]);
  React.useEffect(() => {
    if (!index || !q.trim()) { setResults([]); return; }
    const hits = index.search(q, { limit: 8 });
    const ids = [...new Set(hits.flatMap((h) => h.result.map((r) => String(r))))];
    setResults(ids.map((id) => entries[id]).filter((e): e is Entry => Boolean(e)).slice(0, 8));
  }, [q, index, entries]);
  const open = q.trim().length > 0;
  const status = error ? error : !index ? '…' : results.length === 0 ? t('docs.noResults') : `${results.length} results`;
  return (
    <div className="relative">
      <label htmlFor="docs-search" className="sr-only">{t('docs.search')}</label>
      <input id="docs-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} onFocus={load} onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }} placeholder={t('docs.searchPlaceholder')} autoComplete="off" aria-describedby="docs-search-status" className="min-h-11 w-full rounded-md border border-input-border bg-surface px-3 text-sm text-text placeholder:text-muted" />
      <p id="docs-search-status" aria-live="polite" className={open ? 'sr-only' : 'sr-only'}>{open ? status : ''}</p>
      {open ? (
        <div id="docs-search-results" className="surface absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto p-1">
          {results.length === 0 ? <p className="px-3 py-2 text-sm text-muted">{status}</p> : (
            <ul aria-label="Search results">
              {results.map((r) => (
                <li key={r.id}>
                  <Link to={r.url} className="block min-h-11 rounded px-3 py-2 text-sm no-underline hover:bg-bg" onClick={() => setQ('')}><span className="font-mono text-xs uppercase text-muted">{r.kind}</span> <span className="text-text">{r.title}</span></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
