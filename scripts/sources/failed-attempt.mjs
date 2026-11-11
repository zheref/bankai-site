#!/usr/bin/env node
/** Suppress repeated automatic failures using this workflow's retained, read-only attempt artifacts. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { samePins } from './release.mjs';
export function matchesAttempt(attempt, base, sources) {
  return attempt.base.trim() === base && samePins(attempt.sources, sources);
}
export function failedAttempt({ env = process.env, run = execFileSync, log = console.log } = {}) {
  const repo = env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) throw new Error('GITHUB_REPOSITORY must be owner/name');
  const json = (args) => JSON.parse(run('gh', args, { encoding: 'utf8' }));
  const base = run('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const sources = JSON.parse(readFileSync('sources.json', 'utf8'));
  // Paginate failures, not successes: held daily runs do not bury the failed attempt.
  for (let page = 1; ; page++) {
    const data = json(['api', `repos/${repo}/actions/workflows/sources-refresh.yml/runs?status=failure&branch=main&per_page=100&page=${page}`]);
    for (const attempt of data.workflow_runs) {
      if (String(attempt.id) === env.GITHUB_RUN_ID) continue;
      const jobs = json(['api', `repos/${repo}/actions/runs/${attempt.id}/jobs?per_page=100`]);
      if (!jobs.jobs.some((j) => ['author', 'prove'].includes(j.name) && j.conclusion === 'failure')) continue;
      const artifacts = json(['api', `repos/${repo}/actions/runs/${attempt.id}/artifacts?per_page=100`]);
      if (!artifacts.artifacts.some((a) => a.name === 'prepared-sources' && !a.expired)) continue;
      const dir = mkdtempSync(resolve(tmpdir(), 'source-attempt-'));
      try {
        run('gh', ['run', 'download', String(attempt.id), '--repo', repo, '--name', 'prepared-sources', '--dir', dir], { encoding: 'utf8' });
        const previous = { base: readFileSync(resolve(dir, 'base.txt'), 'utf8'), sources: JSON.parse(readFileSync(resolve(dir, 'sources.json'), 'utf8')) };
        if (matchesAttempt(previous, base, sources)) {
          log(`Held: these pins already failed at this base in ${attempt.html_url}. Review its missing-content report and use workflow_dispatch to retry.`);
          return true;
        }
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
    if (data.workflow_runs.length < 100) return false;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = failedAttempt() ? 0 : 1; }
  catch (error) { console.error(`Cannot read prior attempts: ${JSON.stringify(error.message)}`); process.exitCode = 2; }
}
