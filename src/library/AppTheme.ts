/** The semantic theme layer (UX-5): which scheme is active and how it is switched. Colours themselves live in src/brand/tokens.json → src/styles/tokens.generated.css. */
export type Scheme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'bankai-theme';
export const DEFAULT_SCHEME: Scheme = 'dark';

export function readStoredScheme(storage: Pick<Storage, 'getItem'> | null): Scheme | null {
  try {
    const v = storage?.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/** The scheme the document resolves to: an explicit choice wins, then the OS preference, then dark (dark-first). */
export function resolveScheme(stored: Scheme | null, prefersLight: boolean): Scheme {
  if (stored) return stored;
  return prefersLight ? 'light' : DEFAULT_SCHEME;
}

/** Inline, before paint, so the page never flashes the wrong scheme. Kept tiny and dependency-free. */
export const themeBootScript = `(function(){try{var k='${THEME_STORAGE_KEY}',v=localStorage.getItem(k);if(v==='light'||v==='dark'){document.documentElement.setAttribute('data-theme',v);}}catch(e){}})();`;
