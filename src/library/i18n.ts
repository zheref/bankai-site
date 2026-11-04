import en from '@/i18n/en.json';

/** i18n-ready strings: one JSON per locale, keyed by dotted path; English is the default and the only locale today (Spanish later, never translating technical terms or skill and agent names). */
export type Locale = 'en';
type Dict = typeof en;
const dictionaries: Record<Locale, Dict> = { en };

export function t(key: string, locale: Locale = 'en', vars: Record<string, string | number> = {}): string {
  const dict: Record<string, unknown> = dictionaries[locale];
  const value = key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), dict);
  const text = typeof value === 'string' ? value : typeof value === 'object' && value && 'text' in value ? String((value as { text: string }).text) : null;
  if (text === null) throw new Error(`missing i18n string: ${key}`);
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Strings whose copy the positioning doc does not provide; they render with the minimum and are flagged for review. */
export function needsReview(key: string, locale: Locale = 'en'): boolean {
  const dict: Record<string, unknown> = dictionaries[locale];
  const value = key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), dict);
  return Boolean(value && typeof value === 'object' && (value as { review?: boolean }).review);
}
