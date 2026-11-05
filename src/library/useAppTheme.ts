import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SCHEME, THEME_STORAGE_KEY, readStoredScheme, resolveScheme, type Scheme } from './AppTheme';

const THEME_EVENT = 'bankai-theme-change';

/** The storage object, or null where even touching it throws (blocked storage raises a SecurityError on access). */
function storage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

const currentScheme = (): Scheme => {
  if (typeof document === 'undefined') return DEFAULT_SCHEME;
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;
  const prefersLight = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
  return resolveScheme(readStoredScheme(storage()), prefersLight);
};

/** Reads and switches the colour scheme; the attribute on <html> is the single runtime source, and every mounted instance follows it (the header mounts two toggles). */
export function useAppTheme() {
  const [scheme, setScheme] = useState<Scheme>(DEFAULT_SCHEME);
  useEffect(() => {
    const sync = () => setScheme(currentScheme());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);
  const set = useCallback((next: Scheme) => {
    document.documentElement.setAttribute('data-theme', next);
    try { storage()?.setItem(THEME_STORAGE_KEY, next); } catch { /* storage may be unavailable */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);
  const toggle = useCallback(() => set(currentScheme() === 'dark' ? 'light' : 'dark'), [set]);
  return { scheme, set, toggle };
}
