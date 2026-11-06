import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseVersion, compareVersions, slugOf, versionSource, decide, repinEntry, formatSources, readRelease, checkRepin, checkManifest, outputLines, samePins } from '../../scripts/sources/release.mjs';

const sourcesPath = resolve(__dirname, '..', '..', 'sources.json');

describe('release-driven repin', () => {
  it('parses MAJOR.MINOR[.PATCH] with or without the v, and nothing else', () => {
    expect(parseVersion('v0.30.0')).toEqual([0, 30, 0]);
    expect(parseVersion('0.13')).toEqual([0, 13, 0]);
    expect(parseVersion('1.2.3-rc.1')).toBeNull();
    expect(parseVersion('main')).toBeNull();
  });
  it('orders versions numerically and refuses an unparseable one', () => {
    expect(compareVersions('0.30.0', '0.29.9')).toBe(1);
    expect(compareVersions('v0.152.0', '0.159.0')).toBe(-1);
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1);
    expect(compareVersions('v1.0', '1.0.0')).toBe(0);
    expect(() => compareVersions('main', '0.1.0')).toThrow(/cannot compare/);
  });
  it('reads the repository slug and the versionFrom manifest', () => {
    expect(slugOf('https://github.com/zheref/nen')).toBe('zheref/nen');
    expect(slugOf('https://github.com/zheref/bankai-handbooks.git')).toBe('zheref/bankai-handbooks');
    expect(() => slugOf('https://gitlab.com/a/b')).toThrow(/github\.com/);
    expect(versionSource('package.json#version (latest tag v0.29.0)')).toEqual({ path: 'package.json', key: 'version' });
    expect(versionSource('.claude-plugin/plugin.json#version')).toEqual({ path: '.claude-plugin/plugin.json', key: 'version' });
    expect(versionSource('handbooks/VERSION')).toBeNull();
  });
  it('repins only on a strictly newer published release, never backwards', () => {
    const entry = { version: '0.29.0' };
    expect(decide(entry, null)).toEqual({ action: 'skip', reason: 'no published release' });
    expect(decide(entry, { tag: 'v0.29.0' })).toMatchObject({ action: 'skip', reason: 'already at 0.29.0' });
    expect(decide({ version: '0.159.0' }, { tag: 'v0.152.0' })).toMatchObject({ action: 'skip', reason: 'pinned 0.159.0 is ahead of release v0.152.0' });
    expect(decide(entry, { tag: 'v0.30.0' })).toEqual({ action: 'repin', version: '0.30.0', tag: 'v0.30.0' });
  });
  it('rewrites ref, commit, version and the latest-tag note, keeping every other key', () => {
    const entry = { url: 'https://github.com/zheref/nen', follow: 'release', ref: 'main', commit: 'a'.repeat(40), version: '0.29.0', versionFrom: 'package.json#version (latest tag v0.29.0)', reads: ['README.md'] };
    expect(repinEntry(entry, { tag: 'v0.30.0', version: '0.30.0', commit: 'b'.repeat(40) })).toEqual({ ...entry, ref: 'v0.30.0', commit: 'b'.repeat(40), version: '0.30.0', versionFrom: 'package.json#version (latest tag v0.30.0)' });
    const bare = { ref: 'main', commit: 'a'.repeat(40), version: '1.0.0' };
    expect(repinEntry(bare, { tag: 'v1.1.0', version: '1.1.0', commit: 'c'.repeat(40) })).toEqual({ ref: 'v1.1.0', commit: 'c'.repeat(40), version: '1.1.0' });
  });
  it('formats sources.json byte-for-byte as it is committed', () => {
    const text = readFileSync(sourcesPath, 'utf8');
    expect(formatSources(JSON.parse(text))).toBe(text);
  });
  it('marks hatsu and nen as release-followed and leaves the handbooks pinned by hand', () => {
    const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
    expect(sources.repos.hatsu.follow).toBe('release');
    expect(sources.repos.nen.follow).toBe('release');
    expect(sources.repos.handbooks.follow).toBeUndefined();
  });
});

describe('refresh driver refusals and outputs', () => {
  it('passes a manifest that matches the tag, refuses one that does not, and skips when no manifest was named', () => {
    expect(() => checkManifest('nen', { tag: 'v0.30.0', manifestVersion: '0.30.0' }, '0.30.0')).not.toThrow();
    expect(() => checkManifest('nen', { tag: 'v0.30.0', manifestVersion: 'v0.30.0' }, '0.30.0')).not.toThrow();
    expect(() => checkManifest('nen', { tag: 'v0.30.0', manifestVersion: '0.29.0' }, '0.30.0')).toThrow(/manifest disagrees with its tag/);
    expect(() => checkManifest('handbooks', { tag: 'v1.0.0', manifestVersion: null }, '1.0.0')).not.toThrow();
  });
  it('writes the step outputs the workflow reads', () => {
    expect(outputLines([], true)).toBe('changed=false\nsummary=no newer release\n');
    expect(outputLines(['nen v0.30.0'], false)).toBe('changed=false\nsummary=repin nen v0.30.0\n');
    expect(outputLines(['hatsu v0.160.0', 'nen v0.30.0'], true)).toBe('changed=true\nsummary=repin hatsu v0.160.0, nen v0.30.0\n');
  });
});

describe('readRelease', () => {
  const asFetch = (fn: unknown) => fn as typeof fetch;
  const sha = 'd'.repeat(40);
  const respond = (routes: Record<string, { status?: number; body?: unknown }>) => vi.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
    const hit = Object.entries(routes).find(([k]) => url.endsWith(k));
    const { status = 200, body = {} } = hit?.[1] ?? { status: 500 };
    void init;
    return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
  });

  it('answers null when the repository has no published release', async () => {
    const fetchImpl = respond({ '/releases/latest': { status: 404 } });
    expect(await readRelease('zheref/x', { fetchImpl })).toBeNull();
  });
  it('resolves the tag to its commit and reads the manifest version at that commit, sending the token when given', async () => {
    const content = Buffer.from(JSON.stringify({ version: '0.30.0' })).toString('base64');
    const fetchImpl = respond({
      '/releases/latest': { body: { tag_name: 'v0.30.0', published_at: '2026-11-05T12:01:57Z' } },
      '/commits/v0.30.0': { body: { sha } },
      [`/contents/package.json?ref=${sha}`]: { body: { content } },
    });
    expect(await readRelease('zheref/nen', { token: 't0k', versionFrom: 'package.json#version', fetchImpl: asFetch(fetchImpl) })).toEqual({ tag: 'v0.30.0', commit: sha, publishedAt: '2026-11-05T12:01:57Z', manifestVersion: '0.30.0' });
    expect(fetchImpl.mock.calls[0]?.[1]?.headers?.authorization).toBe('Bearer t0k');
  });
  it('refuses a release whose named manifest carries no version', async () => {
    const content = Buffer.from(JSON.stringify({ name: 'nen' })).toString('base64');
    const fetchImpl = respond({
      '/releases/latest': { body: { tag_name: 'v0.30.0' } },
      '/commits/v0.30.0': { body: { sha } },
      [`/contents/package.json?ref=${sha}`]: { body: { content } },
    });
    await expect(readRelease('zheref/nen', { versionFrom: 'package.json#version', fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(/has no version/);
  });
  it('fails loudly on an API error or a tag that names no commit', async () => {
    await expect(readRelease('zheref/x', { fetchImpl: asFetch(respond({ '/releases/latest': { status: 403 } })) })).rejects.toThrow(/HTTP 403/);
    const fetchImpl = respond({ '/releases/latest': { body: { tag_name: 'v1.0.0' } }, '/commits/v1.0.0': { body: { sha: 'nope' } } });
    await expect(readRelease('zheref/x', { fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(/resolved to no commit/);
  });
});

describe('checkRepin (the landing gate)', () => {
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const sha = 'e'.repeat(40);
  const repinned = () => {
    const after = structuredClone(sources);
    after.readAt = '2026-11-06';
    after.repos.nen = repinEntry(after.repos.nen, { tag: 'v9.0.0', version: '9.0.0', commit: sha });
    return after;
  };

  it('lands a pin move of a followed repository and nothing else', () => {
    expect(checkRepin(sources, repinned())).toEqual([]);
  });
  it('refuses when nothing moved', () => {
    expect(checkRepin(sources, sources)).toContain('no repository moved');
  });
  it('refuses a moved url, an unfollowed repository, or a changed top-level key', () => {
    const url = repinned();
    url.repos.nen.url = 'https://github.com/attacker/nen';
    expect(checkRepin(sources, url)).toContain('nen.url changed');
    const handbooks = structuredClone(sources);
    handbooks.repos.handbooks.commit = sha;
    expect(checkRepin(sources, handbooks)).toContain('handbooks is not followed by release and may not move');
    const extra = repinned();
    extra.$comment = 'rewritten';
    expect(checkRepin(sources, extra)).toContain('$comment changed');
  });
  it('refuses a ref that is not a release tag, a version off its tag, a bad sha, or a move backwards', () => {
    const ref = repinned();
    ref.repos.nen.ref = 'main';
    expect(checkRepin(sources, ref).join('\n')).toMatch(/nen\.ref "main" is not a release tag/);
    const version = repinned();
    version.repos.nen.version = '9.0.1';
    expect(checkRepin(sources, version).join('\n')).toMatch(/nen\.version 9\.0\.1 is not its tag v9\.0\.0/);
    const commit = repinned();
    commit.repos.nen.commit = 'nope';
    expect(checkRepin(sources, commit)).toContain('nen.commit is not a 40-hex sha');
    const bare = structuredClone(sources);
    bare.readAt = '2026-11-06';
    bare.repos.nen = repinEntry(bare.repos.nen, { tag: '9.0.0', version: '9.0.0', commit: sha });
    expect(checkRepin(sources, bare)).toEqual([]);
    const back = structuredClone(sources);
    back.repos.nen = repinEntry(back.repos.nen, { tag: 'v0.1.0', version: '0.1.0', commit: sha });
    expect(checkRepin(sources, back).join('\n')).toMatch(/moves back or sideways/);
  });
  it('is what verify-repin.mjs exits on: 0 for a pin move, 1 for anything else', () => {
    const dir = mkdtempSync(join(tmpdir(), 'repin-'));
    const ok = join(dir, 'ok.json');
    const bad = join(dir, 'bad.json');
    writeFileSync(ok, formatSources(repinned()));
    const tampered = repinned();
    tampered.repos.nen.url = 'https://github.com/attacker/nen';
    writeFileSync(bad, formatSources(tampered));
    const script = resolve(__dirname, '..', '..', 'scripts', 'sources', 'verify-repin.mjs');
    expect(execFileSync('node', [script, sourcesPath, ok], { encoding: 'utf8' })).toMatch(/landable/);
    expect(() => execFileSync('node', [script, sourcesPath, bad], { stdio: 'pipe' })).toThrow(/nen\.url changed/);
  });
});

describe('samePins (skip a repin already proposed)', () => {
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const sha = 'f'.repeat(40);
  it('ignores readAt and prose, and tells a different ref or commit apart', () => {
    const later = structuredClone(sources);
    later.readAt = '2030-01-01';
    later.$comment = 'other words';
    expect(samePins(sources, later)).toBe(true);
    const moved = structuredClone(sources);
    moved.repos.nen = repinEntry(moved.repos.nen, { tag: 'v9.0.0', version: '9.0.0', commit: sha });
    expect(samePins(sources, moved)).toBe(false);
  });
  it('is what same-pins.mjs exits on: 0 already proposed, 1 a different repin', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pins-'));
    const moved = structuredClone(sources);
    moved.repos.nen = repinEntry(moved.repos.nen, { tag: 'v9.0.0', version: '9.0.0', commit: sha });
    const other = join(dir, 'moved.json');
    writeFileSync(other, formatSources(moved));
    const script = resolve(__dirname, '..', '..', 'scripts', 'sources', 'same-pins.mjs');
    expect(execFileSync('node', [script, sourcesPath, sourcesPath], { encoding: 'utf8' })).toMatch(/already proposed/);
    expect(() => execFileSync('node', [script, sourcesPath, other], { stdio: 'pipe' })).toThrow();
  });
});

describe('the scripts, in-process', () => {
  const sources = () => JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const sha = '1'.repeat(40);
  const api = (nenTag: string, nenManifest = nenTag.slice(1)) =>
    vi.fn(async (url: string) => {
      const json = (status: number, body: unknown) => ({ ok: status < 300, status, json: async () => body });
      if (url.endsWith('zheref/hatsu/releases/latest')) return json(200, { tag_name: 'v0.152.0' });
      if (url.endsWith('zheref/nen/releases/latest')) return json(200, { tag_name: nenTag, published_at: '2026-11-05T12:00:00Z' });
      if (url.includes('/commits/')) return json(200, { sha });
      const manifest = (version: string) => json(200, { content: Buffer.from(JSON.stringify({ version })).toString('base64') });
      if (url.includes('zheref/hatsu/contents/')) return manifest('0.152.0');
      if (url.includes('zheref/nen/contents/package.json')) return manifest(nenManifest);
      return json(404, {});
    });

  it('refresh reports without --write, and with it writes the pins, readAt, notes, summary and outputs', async () => {
    const { refresh } = await import('../../scripts/sources/refresh.mjs');
    const dir = mkdtempSync(join(tmpdir(), 'refresh-'));
    const lines: string[] = [];
    const dry = await refresh({ argv: [], env: {}, sources: sources(), sourcesPath: join(dir, 'sources.json'), fetchImpl: api('v9.0.0'), log: (l: string) => lines.push(l) });
    expect(dry.moved).toEqual(['nen v9.0.0']);
    expect(lines.join('\n')).toMatch(/hatsu: pinned .* is ahead of release v0\.152\.0[\s\S]*dry run/);

    const env = { GITHUB_TOKEN: 't', GITHUB_OUTPUT: join(dir, 'out'), GITHUB_STEP_SUMMARY: join(dir, 'summary') };
    const notes = join(dir, 'notes.md');
    const done = await refresh({ argv: ['--write', '--notes', notes], env, sources: sources(), sourcesPath: join(dir, 'sources.json'), fetchImpl: api('v9.0.0'), now: new Date('2030-01-02T03:04:05Z'), log: () => {} });
    const written = JSON.parse(readFileSync(join(dir, 'sources.json'), 'utf8'));
    expect(written.readAt).toBe('2030-01-02');
    expect(written.repos.nen).toMatchObject({ ref: 'v9.0.0', commit: sha, version: '9.0.0' });
    expect(checkRepin(sources(), written)).toEqual([]);
    expect(readFileSync(notes, 'utf8')).toContain(`https://github.com/zheref/nen/compare/${sources().repos.nen.commit}...${sha}`);
    expect(readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8')).toContain('### Release repin');
    expect(readFileSync(env.GITHUB_OUTPUT, 'utf8')).toBe('changed=true\nsummary=repin nen v9.0.0\n');
    expect(done.compares).toHaveLength(1);
  });
  it('refresh refuses a release whose manifest disagrees, and a --notes with no path', async () => {
    const { refresh } = await import('../../scripts/sources/refresh.mjs');
    await expect(refresh({ sources: sources(), fetchImpl: api('v9.0.0', '8.0.0'), log: () => {} })).rejects.toThrow(/manifest disagrees/);
    await expect(refresh({ argv: ['--notes'], sources: sources(), fetchImpl: api('v9.0.0'), log: () => {} })).rejects.toThrow(/--notes needs a file path/);
  });
  it('refresh writes nothing and outputs changed=false when no release is newer', async () => {
    const { refresh } = await import('../../scripts/sources/refresh.mjs');
    const dir = mkdtempSync(join(tmpdir(), 'refresh-'));
    const out = join(dir, 'out');
    const notes = join(dir, 'notes.md');
    const r = await refresh({ argv: ['--write', '--notes', notes], env: { GITHUB_OUTPUT: out }, sources: sources(), sourcesPath: join(dir, 'sources.json'), fetchImpl: api(`v${sources().repos.nen.version}`), log: () => {} });
    expect(r.moved).toEqual([]);
    expect(readFileSync(out, 'utf8')).toBe('changed=false\nsummary=no newer release\n');
    expect(readFileSync(notes, 'utf8')).toBe('');
  });
  it('verify-repin and same-pins main() answer 0, 1 and 2', async () => {
    const verify = await import('../../scripts/sources/verify-repin.mjs');
    const pins = await import('../../scripts/sources/same-pins.mjs');
    const dir = mkdtempSync(join(tmpdir(), 'mains-'));
    const moved = sources();
    moved.repos.nen = repinEntry(moved.repos.nen, { tag: 'v9.0.0', version: '9.0.0', commit: sha });
    const movedPath = join(dir, 'moved.json');
    writeFileSync(movedPath, formatSources(moved));
    const quiet = { log: () => {}, error: () => {} };
    expect(verify.main([sourcesPath, movedPath], quiet)).toBe(0);
    expect(verify.main([sourcesPath, sourcesPath], quiet)).toBe(1);
    expect(verify.main([], quiet)).toBe(2);
    expect(pins.main([sourcesPath, sourcesPath], quiet)).toBe(0);
    expect(pins.main([sourcesPath, movedPath], quiet)).toBe(1);
    expect(pins.main([sourcesPath], quiet)).toBe(2);
  });
});
