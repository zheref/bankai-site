#!/usr/bin/env node
/**
 * Lighthouse, mobile preset, against a served build. Prints the four category scores and the core metrics
 * (the median of LH_RUNS runs; 3 in CI, 1 locally) and fails when any score is under the threshold (95)
 * or LCP > 2.0 s or CLS > 0.05.
 *
 *   pnpm exec gatsby serve -p 9000 &   # or BASE_URL=... for a deployed preview (Chrome comes from Playwright's chromium)
 *   node scripts/lighthouse.mjs [/ /docs/ /services/]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:9000';
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/docs/', '/services/'];
const threshold = Number(process.env.LH_MIN ?? 95);
const port = Number(process.env.LH_PORT ?? 9222);
const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`, '--no-sandbox'] });
const chrome = { port, kill: () => browser.close() };
mkdirSync('Reports/lighthouse', { recursive: true });
let failed = false;
const runs = Number(process.env.LH_RUNS ?? (process.env.CI ? 3 : 1));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const p of paths) {
  // Simulated throttling is noisy run to run (the same page measured 1.4 s and 2.4 s LCP minutes apart); CI takes the median of LH_RUNS.
  const lhrs = [];
  for (let i = 0; i < runs; i++) {
    const result = await lighthouse(`${base}${p}`, { port: chrome.port, output: 'json', logLevel: 'error', formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }, throttlingMethod: 'simulate' });
    lhrs.push(result.lhr);
  }
  const lhr = lhrs[0];
  const scores = Object.fromEntries(Object.keys(lhr.categories).map((k) => [k, Math.round(median(lhrs.map((r) => r.categories[k].score ?? 0)) * 100)]));
  const lcp = median(lhrs.map((r) => r.audits['largest-contentful-paint'].numericValue)) / 1000;
  const cls = median(lhrs.map((r) => r.audits['cumulative-layout-shift'].numericValue));
  const tbt = median(lhrs.map((r) => r.audits['total-blocking-time'].numericValue));
  writeFileSync(`Reports/lighthouse/${p.replace(/\W+/g, '_') || 'root'}.json`, JSON.stringify(lhr));
  const bad = Object.values(scores).some((s) => s < threshold) || lcp > 2.0 || cls > 0.05;
  failed ||= bad;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${p} (median of ${runs})  performance ${scores.performance} · accessibility ${scores.accessibility} · best-practices ${scores['best-practices']} · seo ${scores.seo} · LCP ${lcp.toFixed(2)}s · CLS ${cls.toFixed(3)} · TBT ${Math.round(tbt)}ms`);
}
await chrome.kill();
process.exit(failed ? 1 : 0);
