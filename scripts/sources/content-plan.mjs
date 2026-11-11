#!/usr/bin/env node
/** Read-only release/content impact plan. Upstream text is evidence, never executable instructions. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { siteRoot, frontmatter, read } from './lib.mjs';

// The handwritten claims' upstream dependencies. Generated-only pages need no author.
export const dependencies = {
  'getting-started.mdx': { hatsu: ['docs/using/', 'claude/skills/ten/', 'claude/skills/breath/'], nen: ['bootstrap/'] },
  'hatsu-guide.mdx': { hatsu: ['claude/agents/', 'docs/ROSTER.md'] },
  'concepts.mdx': { hatsu: ['claude/skills/ren/', 'claude/skills/aka/', 'claude/skills/mukai/', 'claude/skills/en/', 'docs/WORKFLOW.md'] },
  'tiers-and-phases.mdx': { hatsu: ['docs/WORKFLOW.md', 'nen/workflow.json'] },
  'configuration.mdx': { hatsu: ['docs/config/', 'nen/contract.json'] },
  'nen-reference.mdx': { nen: ['docs/USAGE.md', 'README.md'] },
  'handbooks.mdx': { handbooks: ['handbooks/', 'README.md'] },
  'index.mdx': { hatsu: ['README.md'] },
};
const git = (dir, args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
export function missingNames(names, skills, agents) {
  return Object.entries({ skills, agents }).flatMap(([kind, entries]) => entries.filter(({ name }) => {
    const row = names[kind]?.[name];
    return !row || !['alias', 'description'].every((key) => typeof row[key] === 'string' && row[key].trim());
  }).map((entry) => ({ kind, ...entry })));
}
export function changedPages(repo, paths, changelog) {
  if (!changelog.trim()) return [];
  return Object.entries(dependencies).filter(([, repos]) => paths.some((p) => (repos[repo] ?? []).some((prefix) => p.startsWith(prefix))))
    .map(([page]) => ({ path: `src/content/docs/${page}`, repo, changelog }));
}
export function planContent(before, after, { root = siteRoot } = {}) {
  const names = JSON.parse(readFileSync(resolve(root, 'src/data/names.json'), 'utf8'));
  const upstream = resolve(root, '.sources/hatsu');
  const entry = (kind, file) => ({ name: kind === 'skills' ? file : basename(file, '.md'), description: frontmatter(read(upstream, kind === 'skills' ? `claude/skills/${file}/SKILL.md` : `claude/agents/${file}`)).description ?? '' });
  const skills = readdirSync(resolve(upstream, 'claude/skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => entry('skills', d.name));
  const plugin = JSON.parse(read(upstream, '.claude-plugin/plugin.json'));
  const agents = plugin.agents.map((p) => entry('agents', basename(p)));
  const missing = missingNames(names, skills, agents);
  const pages = [];
  const releases = [];
  for (const [repo, now] of Object.entries(after.repos)) {
    const was = before.repos[repo];
    if (was.commit === now.commit) continue;
    const dir = resolve(root, '.sources', repo);
    const paths = git(dir, ['diff', '--name-only', was.commit, now.commit, '--']).trim().split('\n');
    // Only new changelog lines are cited; a deleted or reworded historical entry never silently becomes new behaviour.
    const changelog = git(dir, ['diff', '--unified=0', was.commit, now.commit, '--', 'CHANGELOG.md'])
      .split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)).join('\n');
    const url = `${now.url}/blob/${now.commit}/CHANGELOG.md`;
    releases.push({ repo, ref: now.ref, commit: now.commit, url, changelog });
    pages.push(...changedPages(repo, paths, changelog).map((p) => ({ ...p, url })));
  }
  return { version: 1, needed: missing.length > 0 || pages.length > 0, missing, pages, releases };
}
export function main([beforePath, outputPath] = []) {
  if (!beforePath || !outputPath) throw new Error('usage: content-plan.mjs <old-sources.json> <plan.json>');
  const plan = planContent(JSON.parse(readFileSync(beforePath, 'utf8')), JSON.parse(readFileSync(resolve(siteRoot, 'sources.json'), 'utf8')));
  writeFileSync(outputPath, JSON.stringify(plan, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `needed=${plan.needed}\n`);
  console.log(JSON.stringify({ missing: plan.missing, pages: plan.pages.map((p) => p.path), needed: plan.needed }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
