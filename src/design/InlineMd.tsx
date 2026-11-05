import * as React from 'react';

/** Renders the collector's inline HTML (code, bold, links) from the source repositories' own prose. */
export function InlineMd({ html, as: Tag = 'span', className = '' }: { html: string | null | undefined; as?: 'span' | 'p' | 'td' | 'div' | 'li' | 'dd'; className?: string }) {
  if (!html) return null;
  return <Tag className={`inline-md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
