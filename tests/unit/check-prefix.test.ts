import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const script = resolve(__dirname, '..', '..', 'scripts', 'pages', 'check-prefix.mjs');
const origin = 'https://zheref.github.io';
const page = (body: string, canonical = `${origin}/bankai-site/docs/`) => `<html><head><link rel="canonical" href="${canonical}" data-baseprotocol="https:"/></head><body>${body}</body></html>`;

/** A public/ tree: { 'docs/index.html': '<html>…' }, plus a sitemap unless `sitemap` is null. */
function site(files: Record<string, string>, sitemap: string | null = `<urlset><url><loc>${origin}/bankai-site/docs/</loc></url></urlset>`) {
  const dir = mkdtempSync(join(tmpdir(), 'pages-'));
  for (const [path, html] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), html);
  }
  if (sitemap !== null) writeFileSync(join(dir, 'sitemap-0.xml'), sitemap);
  return dir;
}
function check(dir: string, env: Record<string, string> = { PATH_PREFIX: '/bankai-site', GATSBY_SITE_URL: origin }) {
  const run = spawnSync('node', [script], { env: { PATH: process.env.PATH ?? '', PAGES_PUBLIC_DIR: dir, ...env }, encoding: 'utf8' });
  return { status: run.status, out: `${run.stdout}${run.stderr}` };
}

describe('scripts/pages/check-prefix.mjs', () => {
  it('passes a tree whose every root-absolute URL, canonical and sitemap entry carries the prefix once', () => {
    const r = check(site({ 'docs/index.html': page('<a href="/bankai-site/docs/concepts/">c</a><script src="/bankai-site/app.js"></script>') }));
    expect(r.out).toMatch(/2 root-absolute URLs all under \/bankai-site/);
    expect(r.status).toBe(0);
  });
  it('fails a link that misses the prefix and one that carries it twice', () => {
    const r = check(site({ 'docs/index.html': page('<a href="/docs/concepts/">c</a><a href="/bankai-site/bankai-site/docs/">d</a>') }));
    expect(r.status).toBe(1);
    expect(r.out).toContain('href="/docs/concepts/" misses /bankai-site');
    expect(r.out).toContain('carries /bankai-site twice');
  });
  it('fails a canonical or a sitemap entry outside the prefixed origin', () => {
    const r = check(site({ 'index.html': page('<a href="/bankai-site/">h</a>', 'https://bankai.zheref.dev/') }, `<urlset><url><loc>${origin}/docs/</loc></url></urlset>`));
    expect(r.status).toBe(1);
    expect(r.out).toContain('canonical https://bankai.zheref.dev/ is not under');
    expect(r.out).toContain(`sitemap-0.xml: ${origin}/docs/ is not under`);
  });
  it('never passes on an absence: no HTML, nothing checked, no canonical, or no sitemap', () => {
    expect(check(site({})).out).toMatch(/no HTML under/);
    expect(check(site({ 'index.html': page('plain text only') })).out).toMatch(/nothing was checked/);
    expect(check(site({ 'index.html': '<html><body><a href="/bankai-site/">h</a></body></html>' })).out).toMatch(/no page carries a canonical/);
    expect(check(site({ 'index.html': page('<a href="/bankai-site/">h</a>') }, null)).out).toMatch(/sitemap-0\.xml is missing/);
    expect(check(site({ 'index.html': page('<a href="/bankai-site/">h</a>') }, null)).status).toBe(1);
  });
  it('is a no-op without a prefix (a custom domain serves from the root)', () => {
    const r = check(site({ 'index.html': page('<a href="/docs/">d</a>') }), {});
    expect(r.status).toBe(0);
    expect(r.out).toContain('nothing to check');
  });
});
