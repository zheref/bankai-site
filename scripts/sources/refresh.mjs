#!/usr/bin/env node
/**
 * Move the sources.json pins of every repository marked `"follow": "release"` to its latest PUBLISHED GitHub
 * release, when that release is newer than the pin. Prints what it decided per repository; writes nothing
 * without --write. A release whose manifest version (versionFrom) disagrees with its tag is refused, so the
 * site never shows a version the source tree does not carry.
 *
 *   node scripts/sources/refresh.mjs            # report only
 *   node scripts/sources/refresh.mjs --write    # rewrite sources.json (pins and readAt)
 *
 * GITHUB_TOKEN (optional) lifts the API rate limit. Under GitHub Actions it also writes `changed` and `summary`
 * to $GITHUB_OUTPUT for .github/workflows/sources-refresh.yml.
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSources, siteRoot } from './lib.mjs';
import { decide, formatSources, readRelease, repinEntry, slugOf } from './release.mjs';

const write = process.argv.includes('--write');
const sources = readSources();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;
const moved = [];

for (const [name, entry] of Object.entries(sources.repos)) {
  if (entry.follow !== 'release') continue;
  const release = await readRelease(slugOf(entry.url), { token, versionFrom: entry.versionFrom });
  const verdict = decide(entry, release);
  if (verdict.action === 'skip') {
    console.log(`${name}: ${verdict.reason}`);
    continue;
  }
  if (release.manifestVersion !== null && String(release.manifestVersion).replace(/^v/, '') !== verdict.version) {
    throw new Error(`${name}: release ${release.tag} carries ${entry.versionFrom.split(' ')[0]} = ${release.manifestVersion}; refusing to pin a release whose manifest disagrees with its tag`);
  }
  console.log(`${name}: ${entry.version} → ${verdict.version} (release ${release.tag} at ${release.commit.slice(0, 12)})`);
  sources.repos[name] = repinEntry(entry, { tag: release.tag, version: verdict.version, commit: release.commit });
  moved.push(`${name} ${release.tag}`);
}

if (moved.length && write) {
  sources.readAt = new Date().toISOString().slice(0, 10);
  writeFileSync(resolve(siteRoot, 'sources.json'), formatSources(sources));
  console.log(`sources.json: repinned ${moved.join(', ')}`);
} else if (moved.length) {
  console.log('dry run: pass --write to rewrite sources.json');
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${moved.length > 0 && write}\nsummary=${moved.length ? `repin ${moved.join(', ')}` : 'no newer release'}\n`);
}
