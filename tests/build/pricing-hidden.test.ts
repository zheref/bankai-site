import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { forbiddenPattern } from '../helpers/forbidden';
import names from '../../src/data/names.json';

const root = resolve(__dirname, '..', '..');
const pub = resolve(root, 'public');

function build(env: Record<string, string>) {
  execFileSync('pnpm', ['exec', 'gatsby', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production', GATSBY_TELEMETRY_DISABLED: '1', ...env } });
}
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const html = (rel: string) => readFileSync(resolve(pub, rel), 'utf8');
const navAndFooterLinks = (page: string) => [...page.matchAll(/<(?:header|footer|nav)[\s\S]*?<\/(?:header|footer|nav)>/g)].flatMap((m) => [...m[0].matchAll(/href="([^"]+)"/g)].map((h) => h[1] ?? ''));

describe('production build (SHOW_PRICING unset)', () => {
  beforeAll(() => build({ SHOW_PRICING: '' }));
  it('does not emit the pricing page', () => {
    expect(existsSync(resolve(pub, 'pricing'))).toBe(false);
    expect(existsSync(resolve(pub, 'page-data', 'pricing'))).toBe(false);
  });
  it('keeps the pricing path out of the sitemap', () => {
    const sitemaps = readdirSync(pub).filter((f) => /^sitemap.*\.xml$/.test(f));
    expect(sitemaps.length).toBeGreaterThan(0);
    for (const f of sitemaps) expect(html(f)).not.toMatch(/\/pricing/);
  });
  it('links the pricing path from no nav or footer on any page', () => {
    const pages = walk(pub).filter((p) => p.endsWith('.html'));
    expect(pages.length).toBeGreaterThan(5);
    for (const p of pages) expect(navAndFooterLinks(readFileSync(p, 'utf8')).some((h) => h.includes('/pricing')), p).toBe(false);
  });
  it('contains none of the internal codenames in any page, page data, metadata or alt text', () => {
    const files = walk(pub).filter((p) => /\.(html|json|xml|txt)$/.test(p));
    for (const p of files) expect(readFileSync(p, 'utf8').match(forbiddenPattern), p).toBeNull();
  });
  it('renders both disclaimer lines verbatim in the footer of every page', () => {
    const full = 'Bankai is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by the creators, publishers, or rights holders of any anime or manga whose terms inspired its names. All trademarks belong to their respective owners.';
    const short = 'Independent open-source project. Not affiliated with or endorsed by any anime or manga rights holder.';
    for (const p of ['index.html', 'services/index.html', 'docs/index.html']) {
      const page = html(p);
      expect(page).toContain(full);
      expect(page).toContain(short);
    }
  });
  it('shows no character name on the commercial services page', () => {
    const page = html('services/index.html').replace(/<script[\s\S]*?<\/script>/g, '');
    for (const name of names.characterNames) expect(page.toLowerCase(), name).not.toMatch(new RegExp(`\\b${name}\\b`));
  });
  it('renders the hero tagline and the sponsors and services sections with config values', () => {
    const page = html('index.html');
    expect(page).toContain('Agents do the work. You hold the gates.');
    expect(page).toContain('https://github.com/sponsors/zheref');
    expect(page).toContain('From');
    expect(page).toContain('$2,500');
    expect(page).toContain('data-tbd="true"');
  });
});

describe('preview build (SHOW_PRICING=true)', () => {
  beforeAll(() => build({ SHOW_PRICING: 'true' }));
  it('renders the pricing page with every value tagged TBD from one config file', () => {
    const page = html('pricing/index.html');
    expect(page).toContain('data-testid="pricing-tiers"');
    expect(page).toContain('data-tier="solo"');
    expect(page).toContain('data-tier="team"');
    expect(page).toContain('data-tier="enterprise"');
    expect(page).toContain('$19');
    expect(page).toContain('$15');
    expect(page).toContain('$49');
    const tbdCount = (page.match(/data-tbd="true"/g) ?? []).length;
    expect(tbdCount).toBeGreaterThanOrEqual(6);
  });
  it('serves the pricing page with noindex, labels the tier only as the configured label, and shows no character name', () => {
    const page = html('pricing/index.html');
    expect(page).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    expect(page).toContain('Cloud tier');
    const body = page.replace(/<script[\s\S]*?<\/script>/g, '');
    for (const name of names.characterNames) expect(body.toLowerCase(), name).not.toMatch(new RegExp(`\\b${name}\\b`));
    expect(body.match(forbiddenPattern)).toBeNull();
  });
  it('still keeps the pricing path out of the sitemap and out of every nav and footer', () => {
    for (const f of readdirSync(pub).filter((x) => /^sitemap.*\.xml$/.test(x))) expect(html(f)).not.toMatch(/\/pricing/);
    for (const p of walk(pub).filter((x) => x.endsWith('.html'))) expect(navAndFooterLinks(readFileSync(p, 'utf8')).some((h) => h.includes('/pricing')), p).toBe(false);
  });
});
