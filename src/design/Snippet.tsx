import * as React from 'react';
import { graphql, useStaticQuery } from 'gatsby';

type SnippetNode = { key: string; lang: string; code: string; html: string; source: string };

export function useSnippets(): Record<string, SnippetNode> {
  const data = useStaticQuery<{ allSnippet: { nodes: SnippetNode[] } }>(graphql`
    query AllSnippets { allSnippet { nodes { key lang code html source } } }
  `);
  return React.useMemo(() => Object.fromEntries(data.allSnippet.nodes.map((n) => [n.key, n])), [data]);
}

/** A code snippet read from the source repositories at build time (highlighted by shiki in the collector, no runtime highlighter). */
export function Snippet({ id, caption, showSource = false, className = '' }: { id: string; caption?: string; showSource?: boolean; className?: string }) {
  const snippets = useSnippets();
  const s = snippets[id];
  if (!s) throw new Error(`unknown snippet: ${id}`);
  return <SnippetBlock {...s} caption={caption} showSource={showSource} className={className} />;
}

export function SnippetBlock({ code, html, source, caption, showSource = false, className = '' }: { code: string; html: string; source?: string; caption?: string; showSource?: boolean; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  return (
    <figure className={`snippet min-w-0 max-w-full ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-3">
        {caption ? <figcaption className="font-mono text-xs uppercase tracking-wide text-muted">{caption}</figcaption> : <span />}
        <button type="button" onClick={copy} aria-live="polite" className="min-h-9 rounded-md border border-line bg-surface px-2.5 font-mono text-xs text-text hover:border-accent">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="snippet-body min-w-0" dangerouslySetInnerHTML={{ __html: html }} />
      {showSource && source ? <p className="mt-1 font-mono text-xs text-muted">source: {source}</p> : null}
    </figure>
  );
}
