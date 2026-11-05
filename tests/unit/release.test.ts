import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseVersion, compareVersions, slugOf, versionSource, decide, repinEntry, formatSources, readRelease } from '../../scripts/sources/release.mjs';

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
  it('fails loudly on an API error or a tag that names no commit', async () => {
    await expect(readRelease('zheref/x', { fetchImpl: asFetch(respond({ '/releases/latest': { status: 403 } })) })).rejects.toThrow(/HTTP 403/);
    const fetchImpl = respond({ '/releases/latest': { body: { tag_name: 'v1.0.0' } }, '/commits/v1.0.0': { body: { sha: 'nope' } } });
    await expect(readRelease('zheref/x', { fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(/resolved to no commit/);
  });
});
