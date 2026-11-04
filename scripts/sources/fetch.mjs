#!/usr/bin/env node
/**
 * Clone the three source repositories into .sources/<name> at exactly the
 * commits sources.json pins. Idempotent: an existing checkout is fetched and
 * reset to the pinned commit. Nothing is written anywhere else.
 *
 *   node scripts/sources/fetch.mjs            # all three
 *   node scripts/sources/fetch.mjs hatsu nen  # a subset
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSources, sourcesRoot } from './lib.mjs';

const sources = readSources();
const only = process.argv.slice(2);
mkdirSync(sourcesRoot, { recursive: true });

for (const [name, repo] of Object.entries(sources.repos)) {
  if (only.length && !only.includes(name)) continue;
  const dir = resolve(sourcesRoot, name);
  const git = (args, cwd = dir) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();
  if (!existsSync(dir)) {
    execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', repo.url, dir], { stdio: 'inherit' });
  }
  git(['fetch', '--depth', '1', 'origin', repo.commit]);
  git(['checkout', '--detach', '--force', repo.commit]);
  const head = git(['rev-parse', 'HEAD']);
  if (head !== repo.commit) throw new Error(`${name}: HEAD ${head} is not the pinned ${repo.commit}`);
  console.log(`${name}: ${dir} at ${head.slice(0, 12)} (${repo.url})`);
}
