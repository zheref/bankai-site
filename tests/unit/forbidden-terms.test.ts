import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { forbiddenPattern } from '../helpers/forbidden';
import { generatedDir, root } from '../helpers/generated';
import en from '@/i18n/en.json';

describe('internal codenames never reach the site', () => {
  it('are absent from every generated data file the pages read (the collector redacts them)', () => {
    for (const f of readdirSync(generatedDir)) {
      if (f === 'report.json') continue; // the report records the redactions by term
      const text = readFileSync(resolve(generatedDir, f), 'utf8');
      expect(text.match(forbiddenPattern), f).toBeNull();
    }
  });
  it('are absent from the copy, the names map, the brand data and the docs sources', () => {
    const files = ['src/i18n/en.json', 'src/data/names.json', 'src/brand/tokens.json', 'src/brand/positioning.md', 'site.config.ts', ...readdirSync(resolve(root, 'src/content/docs')).map((f) => `src/content/docs/${f}`)];
    for (const f of files) expect(readFileSync(resolve(root, f), 'utf8').match(forbiddenPattern), f).toBeNull();
    expect(JSON.stringify(en).match(forbiddenPattern)).toBeNull();
  });
});
