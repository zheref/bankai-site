#!/usr/bin/env node
/**
 * Exit 0 when two sources.json files pin every repository to the same ref and commit, 1 when they differ.
 * .github/workflows/sources-refresh.yml uses it to skip a repin the open bot/sources-repin PR already proposes, so
 * an unmerged proposal is not re-proved and re-pushed every hour. No dependency is imported.
 *
 *   node scripts/sources/same-pins.mjs <proposed sources.json> <candidate sources.json>
 */
import { readFileSync } from 'node:fs';
import { samePins } from './release.mjs';

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: same-pins.mjs <proposed sources.json> <candidate sources.json>');
  process.exit(2);
}
const same = samePins(JSON.parse(readFileSync(a, 'utf8')), JSON.parse(readFileSync(b, 'utf8')));
console.log(same ? 'same-pins: already proposed' : 'same-pins: a different repin');
process.exit(same ? 0 : 1);
