#!/usr/bin/env node
/**
 * The landing gate of .github/workflows/sources-refresh.yml: the write-token job runs this, and nothing installed,
 * before it commits a repin the read-only job proved. It compares the proved sources.json against main's and
 * refuses anything but a pin move (scripts/sources/release.mjs checkRepin). No dependency is imported, so this
 * runs on a bare checkout with no `pnpm install`.
 *
 *   node scripts/sources/verify-repin.mjs <main's sources.json> <proved sources.json>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkRepin } from './release.mjs';

/** Exit code for the two paths: 0 landable, 1 refused, 2 usage. */
export function main([beforePath, afterPath] = [], { log = console.log, error = console.error } = {}) {
  if (!beforePath || !afterPath) {
    error('usage: verify-repin.mjs <main sources.json> <proved sources.json>');
    return 2;
  }
  const problems = checkRepin(JSON.parse(readFileSync(beforePath, 'utf8')), JSON.parse(readFileSync(afterPath, 'utf8')));
  if (problems.length) {
    error(`verify-repin: refusing to land:\n  ${problems.join('\n  ')}`);
    return 1;
  }
  log('verify-repin: only release pins moved; landable');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(main(process.argv.slice(2)));
