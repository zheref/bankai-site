import * as React from 'react';
import { Link } from 'gatsby';
import { t } from '@/library/i18n';

type Entry = { id: string; title: string; text: string; url: string; kind: string };
type Index = { search: (q: string, opts?: { limit?: number; enrich?: boolean }) => Array<{ result: Array<{ id: string }> }> };

/** Local search over public/search-index.json. FlexSearch and the index load on first focus, so the landing bundle pays nothing. */
export function DocsSearch() {
  const [q, setQ] = React.useState('');
  const [entries, setEntries] = React.useState<Record<string, Entry>>({});
  const [index, setIndex] = React.useState<Index | null>(null);
  const [results, setResults] = React.useState<Entry[]>([]);
  const load = React.useCallback(async () => {
    if (index) return;
    const [{ Document }, res] = await Promise.all([import('flexsearch'), fetch('/search-index.json')]);
    const data = (await res.json()) as { entries: Entry[] };
    const doc = new Document({ document: { id: 'id', index: ['title', 'text'] }, tokenize: 'forward' });
    for (const e of data.entries) doc.add(e);
    setEntries(Object.fromEntries(data.entries.map((e) => [e.id, e])));
    setIndex(doc as unknown as Index);
  }, [index]);
  React.useEffect(() => {
    if (!index || !q.trim()) { setResults([]); return; }
    const hits = index.search(q, { limit: 8 });
    const ids = [...new Set(hits.flatMap((h) => h.result.map((r) => String(r.id))))];
    setResults(ids.map((id) => entries[id]).filter((e): e is Entry => Boolean(e)).slice(0, 8));
  }, [q, index, entries]);
  const listId = 'docs-search-results';
  return (
    <div className="relative">
      <label htmlFor="docs-search" className="sr-only">{t('docs.search')}</label>
      <input id="docs-search" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" value={q} onChange={(e) => setQ(e.target.value)} onFocus={load} placeholder={t('docs.searchPlaceholder')} autoComplete="off" aria-controls={listId} aria-expanded={results.length > 0} className="min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm text-text placeholder:text-muted" />
      {q.trim() ? (
        <ul id={listId} role="listbox" aria-label="Search results" className="surface absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto p-1">
          {results.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{index ? t('docs.noResults') : '…'}</li> : results.map((r) => (
            <li key={r.id} role="option" aria-selected="false">
              <Link to={r.url} className="block rounded px-3 py-2 text-sm no-underline hover:bg-bg" onClick={() => setQ('')}><span className="font-mono text-xs uppercase text-muted">{r.kind}</span> <span className="text-text">{r.title}</span></Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
