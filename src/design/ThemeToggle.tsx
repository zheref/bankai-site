import * as React from 'react';
import { useAppTheme } from '@/library/useAppTheme';
import { t } from '@/library/i18n';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { scheme, toggle } = useAppTheme();
  const label = scheme === 'dark' ? t('nav.theme.toLight') : t('nav.theme.toDark');
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line text-text hover:border-accent ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        {scheme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></> : <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </svg>
    </button>
  );
}
