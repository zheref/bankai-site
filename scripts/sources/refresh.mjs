#!/usr/bin/env node
/**
 * Move the sources.json pins of every repository marked `"follow": "release"` to its latest PUBLISHED GitHub
 * release, when that release is newer than the pin. Prints what it decided per repository; writes nothing
 * without --write. A release whose manifest version (versionFrom) disagrees with its tag is refused, so the
 * site never shows a version the source tree does not carry.
 *
 *   node scripts/sources/refresh.mjs            # report only
 *   node scripts/sources/refresh.mjs --write    # rewrite sources.json (pins and readAt)
 *   node scripts/sources/refresh.mjs --write --notes <file>   # also write the repin's compare links (the PR body)
 *
 * GITHUB_TOKEN (optional) lifts the API rate limit. Under GitHub Actions it also writes `changed` and `summary`
 * to $GITHUB_OUTPUT for .github/workflows/sources-refresh.yml, and one compare link per repin (the upstream diff
 * between the old and new pinned commits) to $GITHUB_STEP_SUMMARY.
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readSources, siteRoot } from './lib.mjs';
import { checkManifest, decide, formatSources, outputLines, readRelease, repinEntry, slugOf } from './release.mjs';

/**
 * The whole refresh, with its inputs injectable so it is tested in-process (tests/unit/release.test.ts).
 * @param {{ argv?: string[], env?: Record<string, string | undefined>, sources?: any, sourcesPath?: string, fetchImpl?: any, now?: Date, log?: (line: string) => void }} [options]
 * @returns {Promise<{ moved: string[], compares: string[], sources: any }>}
 */
export async function refresh({ argv = [], env = {}, sources = readSources(), sourcesPath = resolve(siteRoot, 'sources.json'), fetchImpl = fetch, now = new Date(), log = console.log } = {}) {
  const write = argv.includes('--write');
  const notesAt = argv.indexOf('--notes');
  const notes = notesAt >= 0 ? argv[notesAt + 1] : undefined;
  if (notesAt >= 0 && !notes) throw new Error('--notes needs a file path');
  const token = env.GITHUB_TOKEN || env.GH_TOKEN || undefined;
  const moved = [];
  const compares = [];

  for (const [name, entry] of Object.entries(sources.repos)) {
    if (entry.follow !== 'release') continue;
    const release = await readRelease(slugOf(entry.url), { token, versionFrom: entry.versionFrom, fetchImpl });
    const verdict = decide(entry, release);
    if (verdict.action === 'skip') {
      log(`${name}: ${verdict.reason}`);
      continue;
    }
    checkManifest(name, release, verdict.version);
    log(`${name}: ${entry.version} → ${verdict.version} (release ${release.tag} at ${release.commit.slice(0, 12)})`);
    sources.repos[name] = repinEntry(entry, { tag: release.tag, version: verdict.version, commit: release.commit });
    moved.push(`${name} ${release.tag}`);
    // What changed upstream, install snippets included, is one click from the PR and the run summary.
    compares.push(`- **${name}** ${entry.version} → ${verdict.version}: ${entry.url}/compare/${entry.commit}...${release.commit}`);
  }

  if (moved.length && write) {
    sources.readAt = now.toISOString().slice(0, 10);
    writeFileSync(sourcesPath, formatSources(sources));
    log(`sources.json: repinned ${moved.join(', ')}`);
  } else if (moved.length) {
    log('dry run: pass --write to rewrite sources.json');
  }
  if (notes) writeFileSync(notes, compares.length ? `${compares.join('\n')}\n` : '');
  if (env.GITHUB_STEP_SUMMARY && compares.length) appendFileSync(env.GITHUB_STEP_SUMMARY, `### Release repin\n\n${compares.join('\n')}\n`);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, outputLines(moved, write));
  return { moved, compares, sources };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await refresh({ argv: process.argv.slice(2), env: process.env });
}
