import * as React from 'react';
import tokens from '@/brand/tokens.json';

/** The wordmark as live text: lowercase bankai, `ai` in the accent at the same weight and case (Build spec, LOCKED). */
export function Wordmark({ className = '', size = 'text-2xl' }: { className?: string; size?: string }) {
  const { text, accentPart } = tokens.wordmark;
  const head = text.slice(0, text.length - accentPart.length);
  return (
    <span className={`wordmark ${size} ${className}`} role="img" aria-label={text} translate="no">
      <span aria-hidden="true">{head}</span>
      <span className="ai" aria-hidden="true">{accentPart}</span>
    </span>
  );
}
