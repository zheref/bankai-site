#!/usr/bin/env node
/**
 * Exit 0 when two sources.json files pin every repository to the same ref and commit, 1 when they differ.
 * .github/workflows/sources-refresh.yml uses it to skip a repin the open bot/sources-repin PR already proposes, so
 * an unmerged proposal is not re-proved and re-pushed every hour. No dependency is imported.
 *
 *   node scripts/sources/same-pins.mjs <proposed sources.json> <candidate sources.json>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { samePins } from './release.mjs';

/** Exit code: 0 already proposed, 1 a different repin, 2 usage. */
export function main([a, b] = [], { log = console.log, error = console.error } = {}) {
  if (!a || !b) {
    error('usage: same-pins.mjs <proposed sources.json> <candidate sources.json>');
    return 2;
  }
  const same = samePins(JSON.parse(readFileSync(a, 'utf8')), JSON.parse(readFileSync(b, 'utf8')));
  log(same ? 'same-pins: already proposed' : 'same-pins: a different repin');
  return same ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(main(process.argv.slice(2)));
