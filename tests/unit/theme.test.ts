import { resolveScheme, readStoredScheme, themeBootScript, THEME_STORAGE_KEY } from '@/library/AppTheme';

describe('AppTheme', () => {
  it('is dark-first when nothing is stored and the OS states no light preference', () => {
    expect(resolveScheme(null, false)).toBe('dark');
  });
  it('honours the OS light preference when nothing is stored', () => {
    expect(resolveScheme(null, true)).toBe('light');
  });
  it('lets an explicit choice win over the OS preference', () => {
    expect(resolveScheme('dark', true)).toBe('dark');
    expect(resolveScheme('light', false)).toBe('light');
  });
  it('ignores garbage in storage', () => {
    expect(readStoredScheme({ getItem: () => 'blue' })).toBeNull();
    expect(readStoredScheme({ getItem: () => { throw new Error('denied'); } })).toBeNull();
    expect(readStoredScheme({ getItem: () => 'light' })).toBe('light');
  });
  it('ships a boot script that reads the same storage key', () => {
    expect(themeBootScript).toContain(THEME_STORAGE_KEY);
    expect(themeBootScript).toContain('data-theme');
  });
});

describe('useAppTheme', () => {
  it('keeps two mounted toggles in sync through the document attribute', async () => {
    const React = await import('react');
    const { renderHook, act } = await import('@testing-library/react');
    const { useAppTheme } = await import('@/library/useAppTheme');
    document.documentElement.removeAttribute('data-theme');
    const a = renderHook(() => useAppTheme());
    const b = renderHook(() => useAppTheme());
    act(() => a.result.current.set('light'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(b.result.current.scheme).toBe('light');
    act(() => b.result.current.toggle());
    expect(a.result.current.scheme).toBe('dark');
    expect(React.version).toBeTruthy();
  });
});
