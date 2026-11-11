import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { missingNames, changedPages } from '../../scripts/sources/content-plan.mjs';
import { allowedContent, validateBundle, apply } from '../../scripts/sources/content-bundle.mjs';

const plan = { missing: [{ kind: 'skills', name: 'new-skill' }], pages: [{ path: 'src/content/docs/concepts.mdx', repo: 'hatsu', url: 'https://github.com/zheref/hatsu/blob/abc/CHANGELOG.md', changelog: '- Changed the turn loop.' }] };
const names = { skills: {} };
const bundle = () => ({ version: 1, files: [
  { path: 'src/data/names.json', content: JSON.stringify({ skills: { 'new-skill': { alias: 'New skill', description: 'A complete description.' } } }) },
  { path: 'src/content/docs/concepts.mdx', content: '# Updated loop\n' },
], notes: [{ path: plan.pages[0]!.path, url: plan.pages[0]!.url, entry: '- Changed the turn loop.', reason: 'The loop changed.', changed: true }] });

describe('release content planning', () => {
  it('reports missing names and incomplete rows as data', () => {
    expect(missingNames({ skills: { known: { alias: 'Known', description: 'Complete' }, partial: { alias: 'Partial' } } }, [{ name: 'known' }, { name: 'partial' }, { name: 'new' }], [{ name: 'agent' }])).toEqual([
      { kind: 'skills', name: 'partial' }, { kind: 'skills', name: 'new' }, { kind: 'agents', name: 'agent' },
    ]);
  });
  it('does not spend authoring on machinery-only releases', () => {
    expect(changedPages('hatsu', ['scripts/internal.mts', '.claude-plugin/plugin.json'], '- Fix internal check.')).toEqual([]);
  });
  it('carries the changelog evidence beside impacted handwritten pages', () => {
    expect(changedPages('hatsu', ['claude/skills/ren/SKILL.md'], '- Changed loop.')).toEqual([{ path: 'src/content/docs/concepts.mdx', repo: 'hatsu', changelog: '- Changed loop.' }]);
  });
});
describe('content artifact trust boundary', () => {
  it.each(['../escape', '/tmp/file', 'src/content/docs/../../workflow.yml', '.github/workflows/pwn.yml', 'src/content/docs/nested/file.mdx', 'src/content/docs/file.js', 'src/content/docs/file.mdx\0'])('rejects escape path %s', (path) => {
    expect(allowedContent(path)).toBe(false);
    const value = bundle(); value.files.push({ path, content: 'bad' });
    expect(() => validateBundle(value, plan, names)).toThrow(/forbidden/);
  });
  it('requires the missing name and a cited disposition for every page', () => {
    expect(() => validateBundle({ ...bundle(), files: [] }, plan, names)).toThrow(/content still missing/);
    expect(() => validateBundle({ ...bundle(), notes: [] }, plan, names)).toThrow(/review still missing/);
    const value = bundle(); value.notes[0]!.entry = 'Invented';
    expect(() => validateBundle(value, plan, names)).toThrow(/invalid or duplicate/);
  });
  it('rejects duplicate files, oversized content and binary data', () => {
    const value = bundle(); value.files.push(value.files[0]!);
    expect(() => validateBundle(value, plan, names)).toThrow(/duplicate/);
    expect(() => validateBundle({ ...bundle(), files: [{ path: 'src/data/names.json', content: 'x'.repeat(1024 * 1024 + 1) }] }, plan, names)).toThrow(/1 MiB/);
    expect(() => validateBundle({ ...bundle(), files: [{ path: 'src/data/names.json', content: '\0' }] }, plan, names)).toThrow(/binary/);
  });
  it('permits unchanged pages only with an evidenced explanation', () => {
    const value = bundle(); value.files.pop(); value.notes[0]!.changed = false;
    expect(validateBundle(value, plan, names)).toBe(value);
  });
  it('validates every destination before writing and refuses symlink escapes', () => {
    const root = mkdtempSync(join(tmpdir(), 'content-'));
    mkdirSync(join(root, 'src/data'), { recursive: true });
    mkdirSync(join(root, 'src/content/docs'), { recursive: true });
    writeFileSync(join(root, 'src/data/names.json'), JSON.stringify(names));
    const outside = join(root, 'outside'); writeFileSync(outside, 'untouched');
    symlinkSync(outside, join(root, plan.pages[0]!.path));
    expect(() => apply(root, bundle(), plan)).toThrow(/ordinary/);
    expect(JSON.parse(readFileSync(join(root, 'src/data/names.json'), 'utf8'))).toEqual(names);
    expect(readFileSync(outside, 'utf8')).toBe('untouched');
  });
  it('accepts a pin-only empty bundle without authoring', () => {
    expect(validateBundle({ version: 1, files: [], notes: [] }, { missing: [], pages: [] }, names).files).toEqual([]);
  });
});

describe('failed release attempts', () => {
  it('holds only the same base and pins, allowing repaired bases and newer releases', async () => {
    const { matchesAttempt } = await import('../../scripts/sources/failed-attempt.mjs');
    const sources = { repos: { hatsu: { ref: 'v1.0.0', commit: 'abc' } } };
    expect(matchesAttempt({ base: 'base\n', sources }, 'base', sources)).toBe(true);
    expect(matchesAttempt({ base: 'base', sources }, 'fixed-base', sources)).toBe(false);
    expect(matchesAttempt({ base: 'base', sources }, 'base', { repos: { hatsu: { ref: 'v1.1.0', commit: 'def' } } })).toBe(false);
  });
});

describe('real content fixtures', () => {
  it('plans a release from committed upstream trees and applies a packed content-only edit', async () => {
    const { execFileSync } = await import('node:child_process');
    const { planContent } = await import('../../scripts/sources/content-plan.mjs');
    const { pack } = await import('../../scripts/sources/content-bundle.mjs');
    const root = mkdtempSync(join(tmpdir(), 'release-plan-'));
    const upstream = join(root, '.sources/hatsu');
    for (const dir of ['src/data', 'src/content/docs', '.sources/hatsu/claude/skills/new-skill', '.sources/hatsu/claude/agents', '.sources/hatsu/.claude-plugin', '.sources/hatsu/claude/skills/ren']) mkdirSync(join(root, dir), { recursive: true });
    const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
    for (const dir of [root, upstream]) { git(dir, 'init', '-q'); git(dir, 'config', 'user.email', 'fixture@example.test'); git(dir, 'config', 'user.name', 'Fixture'); }
    writeFileSync(join(root, '.gitignore'), '.sources/\n');
    writeFileSync(join(root, 'src/data/names.json'), JSON.stringify(names));
    writeFileSync(join(root, plan.pages[0]!.path), '# Old loop\n');
    writeFileSync(join(upstream, '.claude-plugin/plugin.json'), '{"agents":["claude/agents/agent.md"]}');
    writeFileSync(join(upstream, 'claude/skills/new-skill/SKILL.md'), '---\ndescription: Skill purpose\n---\n');
    writeFileSync(join(upstream, 'claude/skills/ren/SKILL.md'), '---\ndescription: Loop\n---\nOld');
    writeFileSync(join(upstream, 'claude/agents/agent.md'), '---\ndescription: Agent purpose\n---\n');
    writeFileSync(join(upstream, 'CHANGELOG.md'), '# Changelog\n');
    git(upstream, 'add', '.'); git(upstream, 'commit', '-qm', 'old');
    const old = git(upstream, 'rev-parse', 'HEAD');
    writeFileSync(join(upstream, 'claude/skills/ren/SKILL.md'), '---\ndescription: Loop\n---\nNew');
    writeFileSync(join(upstream, 'CHANGELOG.md'), '# Changelog\n- Changed the turn loop.\n');
    git(upstream, 'add', '.'); git(upstream, 'commit', '-qm', 'new');
    const head = git(upstream, 'rev-parse', 'HEAD');
    const before = { repos: { hatsu: { commit: old } } };
    const after = { repos: { hatsu: { commit: head, ref: 'v1.0.0', url: 'https://github.com/example/hatsu' } } };
    const planned = planContent(before, after, { root });
    expect(planned.needed).toBe(true);
    expect(planned.missing).toHaveLength(3);
    expect(planned.pages).toHaveLength(1);
    expect(planned.releases[0]!.url).toContain(head);
    git(root, 'add', '.'); git(root, 'commit', '-qm', 'site');
    const map = { skills: { 'new-skill': { alias: 'New', description: 'Purpose' }, ren: { alias: 'Loop', description: 'Loop purpose' } }, agents: { agent: { alias: 'Agent', description: 'Agent purpose' } } };
    writeFileSync(join(root, 'src/data/names.json'), JSON.stringify(map));
    writeFileSync(join(root, plan.pages[0]!.path), '# New loop\n');
    const notes = [{ path: planned.pages[0]!.path, url: planned.pages[0]!.url, entry: '- Changed the turn loop.', changed: true, reason: 'Updated loop.' }];
    const packed = pack(root, planned, notes);
    expect(packed.files).toHaveLength(2);
    git(root, 'restore', '.');
    apply(root, packed, planned);
    expect(readFileSync(join(root, plan.pages[0]!.path), 'utf8')).toBe('# New loop\n');
    expect(planContent(after, after, { root }).needed).toBe(false);
    writeFileSync(join(root, 'forbidden.txt'), 'escape');
    expect(() => pack(root, planned, notes)).toThrow(/forbidden path/);
  });
});
