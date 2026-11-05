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
import { checkRepin } from './release.mjs';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error('usage: verify-repin.mjs <main sources.json> <proved sources.json>');
  process.exit(2);
}
const problems = checkRepin(JSON.parse(readFileSync(beforePath, 'utf8')), JSON.parse(readFileSync(afterPath, 'utf8')));
if (problems.length) {
  console.error(`verify-repin: refusing to land:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('verify-repin: only release pins moved; landable');
