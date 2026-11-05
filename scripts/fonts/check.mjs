#!/usr/bin/env node
/**
 * The font-swap layout guard. Renders each page twice at 390 px, once with the web fonts blocked (the fallback faces
 * paint) and once with them, and reports every block-level text element whose height differs: those are the lines a
 * swap moves (CLS, UX-7). Also prints what the host resolves for each fallback family, so a runner without the
 * expected local fonts is visible. Exit 1 when any page has a differing block unless FONT_CHECK_ADVISORY=1.
 *   pnpm exec gatsby serve -p 9000 &  &&  node scripts/fonts/check.mjs [/ /docs/ ...]
 */
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:9000';
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/docs/', '/services/', '/docs/nen-reference/', '/docs/hatsu-guide/', '/docs/changelog/'];
const advisory = process.env.FONT_CHECK_ADVISORY === '1';
try { console.log('host fonts:', execSync("fc-list : family 2>/dev/null | sort -u | grep -i -E 'arial|liberation|dejavu|helvetica|courier|menlo|noto sans$' | tr '\\n' ';'", { encoding: 'utf8' }).trim() || '(fc-list unavailable or none of the expected families)'); } catch { console.log('host fonts: fc-list unavailable'); }

const browser = await chromium.launch();
let failures = 0;
const render = async (path, blockFonts) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  if (blockFonts) await ctx.route(/\.woff2?(\?.*)?$/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const data = await page.evaluate(async () => {
    await document.fonts.ready;
    const probe = (fam) => { const s = document.createElement('span'); s.textContent = 'Agents do the work. You hold the gates. 0123456789'; Object.assign(s.style, { fontFamily: fam, fontSize: '16px', whiteSpace: 'nowrap', position: 'absolute', visibility: 'hidden' }); document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w * 100) / 100; };
    const widths = { display: probe(getComputedStyle(document.body).fontFamily), displayFallbackOnly: probe('"Space Grotesk Fallback", "Space Grotesk Fallback DejaVu", serif'), displayFallbackArial: probe('"Space Grotesk Fallback", serif'), displayFallbackDejaVu: probe('"Space Grotesk Fallback DejaVu", serif'), serifControl: probe('serif'), mono: probe('"JetBrains Mono Variable", "JetBrains Mono Fallback", "JetBrains Mono Fallback DejaVu", serif'), monoFallbackOnly: probe('"JetBrains Mono Fallback", "JetBrains Mono Fallback DejaVu", serif') };
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family}`);
    // Keyed by position in document order: the DOM is identical in both renders, and cell text repeats ("yes", "Included").
    const blocks = [];
    let i = 0;
    for (const el of document.querySelectorAll('main p, section p, main li, section li, h1, h2, h3, dd, dt, td, th')) {
      const r = el.getBoundingClientRect();
      i++;
      if (r.height === 0) continue;
      blocks.push({ key: `#${i} ${el.tagName}:${el.textContent.trim().slice(0, 40)}`, top: Math.round(r.top), height: Math.round(r.height * 10) / 10 });
    }
    return { widths, loaded, blocks };
  });
  await ctx.close();
  return data;
};
for (const p of paths) {
  const blocked = await render(p, true);
  const real = await render(p, false);
  const diffs = [];
  const byKey = new Map(blocked.blocks.map((b) => [b.key, b]));
  for (const b of real.blocks) { const f = byKey.get(b.key); if (f && Math.abs(f.height - b.height) > 0.5) diffs.push(`${b.key} ${f.height}→${b.height}`); }
  console.log(`${diffs.length ? 'DIFF' : 'ok  '} ${p}  blocks ${real.blocks.length} · differing ${diffs.length}` + (diffs.length ? `\n     ${diffs.slice(0, 6).join('\n     ')}` : ''));
  if (p === paths[0]) console.log('  fallback-only probe widths (px, 16px sample):', JSON.stringify(blocked.widths), '\n  web-font probe widths:', JSON.stringify(real.widths), '\n  loaded faces with fonts blocked:', blocked.loaded.join(', ') || '(none)');
  if (diffs.length) failures++;
}
await browser.close();
process.exit(failures && !advisory ? 1 : 0);
