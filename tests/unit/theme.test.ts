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
