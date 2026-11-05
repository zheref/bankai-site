import { t, needsReview } from '@/library/i18n';
import en from '@/i18n/en.json';

describe('i18n strings', () => {
  it('resolves a plain string and an object string', () => {
    expect(t('nav.docs')).toBe('Docs');
    expect(t('hero.headline')).toBe('Agents do the work. You hold the gates.');
  });
  it('interpolates variables and leaves unknown ones visible', () => {
    expect(t('layers.hatsu.text', 'en', { skills: '60+', agents: 17 })).toContain('60+ skills, 17 agents');
    expect(t('services.lead', 'en', {})).toContain('{provider}');
  });
  it('throws on a missing key rather than rendering an empty string', () => {
    expect(() => t('nope.missing')).toThrow(/missing i18n string/);
  });
  it('flags minimum copy the positioning doc does not provide', () => {
    expect(needsReview('stages.title')).toBe(true);
    expect(needsReview('hero.headline')).toBe(false);
  });
  it('renders both legal lines verbatim and the credentials rule', () => {
    expect(en.footer.disclaimerFull).toBe('Bankai is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by the creators, publishers, or rights holders of any anime or manga whose terms inspired its names. All trademarks belong to their respective owners.');
    expect(en.footer.disclaimerShort).toBe('Independent open-source project. Not affiliated with or endorsed by any anime or manga rights holder.');
    expect(t('faq.items.pays.a')).toMatch(/your own key/);
    expect(en.oss.credentialsNote.text).toContain("never for customers' work");
    expect(en.oss.credentialsNote.text).toContain('bring their own model API key');
  });
});
