import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SCHEME, THEME_STORAGE_KEY, readStoredScheme, resolveScheme, type Scheme } from './AppTheme';

const currentScheme = (): Scheme => {
  if (typeof document === 'undefined') return DEFAULT_SCHEME;
  const stored = readStoredScheme(typeof localStorage === 'undefined' ? null : localStorage);
  const prefersLight = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
  return resolveScheme(stored, prefersLight);
};

/** Reads and switches the colour scheme; the attribute on <html> is the single runtime source. */
export function useAppTheme() {
  const [scheme, setScheme] = useState<Scheme>(DEFAULT_SCHEME);
  useEffect(() => setScheme(currentScheme()), []);
  const set = useCallback((next: Scheme) => {
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage may be unavailable */ }
    setScheme(next);
  }, []);
  const toggle = useCallback(() => set(scheme === 'dark' ? 'light' : 'dark'), [scheme, set]);
  return { scheme, set, toggle };
}
