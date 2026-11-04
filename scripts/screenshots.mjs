#!/usr/bin/env node
/**
 * One screenshot per landing section (and one per other page) at 390 px and 1440 px, against a served build.
 *   pnpm exec gatsby serve -p 9000 &
 *   node scripts/screenshots.mjs [outDir]   # default Reports/screenshots
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:9000';
const out = process.argv[2] ?? 'Reports/screenshots';
mkdirSync(out, { recursive: true });
const sections = ['hero', 'problem', 'how', 'stages', 'architecture', 'quickstart', 'open-source', 'support', 'services', 'faq'];
const pages = [['services', '/services/'], ['docs', '/docs/'], ['docs-hatsu-guide', '/docs/hatsu-guide/'], ['docs-nen-reference', '/docs/nen-reference/']];
if (process.env.SHOW_PRICING === 'true') pages.push(['pricing', '/pricing/']);
const browser = await chromium.launch();
for (const [name, width, height] of [['390', 390, 844], ['1440', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: process.env.SCHEME === 'light' ? 'light' : 'dark' });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  // The sticky header would overlay every section capture; pin it for the shots.
  await page.addStyleTag({ content: 'header { position: static !important; }' });
  for (const id of sections) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${out}/${name}-${id}.png` });
  }
  await page.screenshot({ path: `${out}/${name}-footer.png`, clip: await page.locator('footer').boundingBox().then((b) => ({ x: 0, y: b.y, width, height: b.height })).catch(() => undefined), fullPage: true });
  for (const [pname, path] of pages) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'header { position: static !important; }' });
    await page.screenshot({ path: `${out}/${name}-${pname}.png`, fullPage: pname === 'services' || pname === 'pricing' });
  }
  await ctx.close();
}
await browser.close();
console.log(`screenshots written to ${out}`);
