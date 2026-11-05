#!/usr/bin/env node
/**
 * Lighthouse, mobile preset, against a served build. Prints the four category scores and the core metrics
 * (the median of LH_RUNS runs, default 6, the first discarded; p90 printed beside the LCP) and fails when any score is under the threshold (95)
 * or LCP > 2.0 s or CLS > 0.05.
 *
 *   pnpm exec gatsby serve -p 9000 &   # or BASE_URL=... for a deployed preview (Chrome comes from Playwright's chromium)
 *   node scripts/lighthouse.mjs [/ /docs/ /services/]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
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
// QA-15 method: LH_RUNS samples per page (default 6; one warm-up run is discarded before the statistics), the median and p90 reported, the median run's report saved, the host named.
const runs = Math.max(2, Number(process.env.LH_RUNS ?? 6));
// Median: the mean of the two middle samples on an even count. p90: nearest-rank (the smallest sample at or above the 90th percentile).
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const p90 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)]; };
console.log(`host: ${os.platform()} ${os.release()} ${os.arch()} · ${os.cpus()[0]?.model ?? 'cpu unknown'} × ${os.cpus().length} · ${Math.round(os.totalmem() / 2 ** 30)} GiB · lighthouse simulated mobile (390×844, dpr 3) · runs ${runs}, first discarded · thermal state: not read`);
for (const p of paths) {
  // Simulated throttling is noisy run to run (the same page measured 1.4 s and 2.4 s LCP minutes apart); CI takes the median of LH_RUNS.
  const all = [];
  for (let i = 0; i < runs; i++) {
    const result = await lighthouse(`${base}${p}`, { port: chrome.port, output: 'json', logLevel: 'error', formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }, throttlingMethod: 'simulate' });
    all.push(result.lhr);
  }
  const lhrs = all.slice(1); // the first run is the warm-up
  const lcps = lhrs.map((r) => r.audits['largest-contentful-paint'].numericValue);
  // The saved report is the run whose LCP is nearest the median (the median itself may be a mean on an even count).
  const med = median(lcps);
  const lhr = lhrs[lcps.reduce((best, v, i) => (Math.abs(v - med) < Math.abs(lcps[best] - med) ? i : best), 0)];
  const scores = Object.fromEntries(Object.keys(lhr.categories).map((k) => [k, Math.round(median(lhrs.map((r) => r.categories[k].score ?? 0)) * 100)]));
  const lcp = median(lcps) / 1000;
  const lcp90 = p90(lcps) / 1000;
  const cls = median(lhrs.map((r) => r.audits['cumulative-layout-shift'].numericValue));
  const tbt = median(lhrs.map((r) => r.audits['total-blocking-time'].numericValue));
  writeFileSync(`Reports/lighthouse/${p.replace(/\W+/g, '_') || 'root'}.json`, JSON.stringify(lhr));
  const bad = Object.values(scores).some((s) => s < threshold) || lcp > 2.0 || cls > 0.05;
  failed ||= bad;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${p} (median of ${lhrs.length})  performance ${scores.performance} · accessibility ${scores.accessibility} · best-practices ${scores['best-practices']} · seo ${scores.seo} · LCP ${lcp.toFixed(2)}s (p90 ${lcp90.toFixed(2)}s) · CLS ${cls.toFixed(3)} · TBT ${Math.round(tbt)}ms`);
}
await chrome.kill();
process.exit(failed ? 1 : 0);
