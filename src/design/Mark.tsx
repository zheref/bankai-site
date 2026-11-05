import * as React from 'react';

export type Tier = 'bankai' | 'nen' | 'hatsu' | 'handbooks' | 'library' | 'cloud';

const NAMES: Record<Tier, string> = {
  bankai: 'Bankai mark (Deterministic Path)',
  nen: 'Nen mark (Loop & Gate)',
  hatsu: 'Hatsu mark (Gate Prompt)',
  handbooks: 'Bankai-Handbooks mark',
  library: 'Bankai-Library mark',
  cloud: 'Cloud tier placeholder mark',
};

/**
 * The tier marks, inline, on the brand's 100-unit grid (stroke 12, radius 3, an accent gate on every mark).
 * Geometry is copied from src/brand/logo/marks/*.svg; colours come from the theme tokens so one SVG serves both schemes.
 */
export function Mark({ tier, size = 32, className = '', title }: { tier: Tier; size?: number; className?: string; title?: string }) {
  const neutral = 'currentColor';
  const muted = 'var(--bk-muted)';
  const accent = 'var(--bk-accent)';
  const label = title ?? NAMES[tier];
  // An empty title marks the mark decorative (its meaning is carried by adjacent text): no role, hidden from the tree.
  const common = label ? { width: size, height: size, viewBox: '0 0 100 100', role: 'img' as const, 'aria-label': label, className } : { width: size, height: size, viewBox: '0 0 100 100', 'aria-hidden': true as const, focusable: 'false' as const, className };
  switch (tier) {
    case 'bankai':
      return (
        <svg {...common}>
          <path d="M18 18 H82 V50 H18 V82 H66" fill="none" stroke={neutral} strokeWidth="12" strokeLinejoin="miter" />
          <rect x="70" y="70" width="24" height="24" rx="3" fill={accent} />
        </svg>
      );
    case 'nen':
      return (
        <svg {...common}>
          <path d="M64 18 H30 a12 12 0 0 0 -12 12 V70 a12 12 0 0 0 12 12 H64" fill="none" stroke={neutral} strokeWidth="12" />
          <rect x="76" y="12" width="12" height="76" rx="3" fill={accent} />
        </svg>
      );
    case 'hatsu':
      return (
        <svg {...common}>
          {[
            [12, 12], [26, 28], [40, 44], [26, 60], [12, 76],
          ].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="34" height="12" rx="3" fill={neutral} />)}
          <rect x="80" y="38" width="12" height="24" rx="3" fill={accent} />
        </svg>
      );
    case 'handbooks':
      return (
        <svg {...common}>
          <path d="M12 18 H88 M12 50 H88 M12 82 H66" stroke={neutral} strokeWidth="12" />
          <rect x="70" y="70" width="24" height="24" rx="3" fill={accent} />
        </svg>
      );
    case 'library':
      return (
        <svg {...common}>
          {[[4, 4], [36, 4], [4, 36], [36, 36], [4, 68], [36, 68]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="28" height="28" rx="3" fill="none" stroke={muted} strokeWidth="3" />
          ))}
          <rect x="68" y="68" width="28" height="28" rx="3" fill="none" stroke={accent} strokeWidth="3" />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...common}>
          <path d="M18 18 H82 V50 H18 V82 H66" fill="none" stroke={muted} strokeWidth="12" strokeDasharray="10 8" />
          <rect x="72" y="72" width="20" height="20" rx="3" fill="none" stroke={accent} strokeWidth="4" />
        </svg>
      );
  }
}
