/**
 * The release side of a repin: which published GitHub release a followed source repository is at, and the
 * sources.json entry that pins it. Pure functions plus one network reader, so the decision is unit-tested
 * without the network (tests/unit/release.test.ts) and scripts/sources/refresh.mjs stays a thin driver.
 *
 * A release, not a tag: GitHub's `releases/latest` answers only a PUBLISHED release that is neither a draft
 * nor a prerelease, so a pushed tag with no release behind it never moves a pin.
 */

/** `0.30.0`, `v0.30.0` → [0, 30, 0]; anything that is not MAJOR.MINOR[.PATCH] is null. */
export function parseVersion(v) {
  const m = String(v ?? '').trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)] : null;
}

/** -1, 0 or 1; throws on a version neither side can parse, so a malformed pin is never read as "older". */
export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) throw new Error(`cannot compare versions ${JSON.stringify(a)} and ${JSON.stringify(b)}`);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
}

/** `https://github.com/zheref/nen` → `zheref/nen`. */
export function slugOf(url) {
  const m = String(url).match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/);
  if (!m) throw new Error(`not a github.com repository url: ${url}`);
  return m[1];
}

/** `package.json#version (latest tag v0.29.0)` → { path: 'package.json', key: 'version' }; null when the entry names no JSON file. */
export function versionSource(versionFrom) {
  const m = String(versionFrom ?? '').match(/^([^\s#]+\.json)#([\w.]+)/);
  return m ? { path: m[1], key: m[2] } : null;
}

/** Whether a release moves a pin: only a strictly newer version does, so a pin ahead of the latest release (main read before a cut) is never moved back. */
export function decide(entry, release) {
  if (!release) return { action: 'skip', reason: 'no published release' };
  const version = release.tag.replace(/^v/, '');
  const order = compareVersions(version, entry.version);
  if (order <= 0) return { action: 'skip', reason: order === 0 ? `already at ${entry.version}` : `pinned ${entry.version} is ahead of release ${release.tag}` };
  return { action: 'repin', version, tag: release.tag };
}

/** The entry after a repin: the tag as the ref, its commit, the version, and a versionFrom whose "(latest tag …)" note follows. */
export function repinEntry(entry, { tag, version, commit }) {
  const versionFrom = String(entry.versionFrom ?? '').replace(/\(latest tag v?[\d.]+\)/, `(latest tag ${tag})`);
  return { ...entry, ref: tag, commit, version, ...(entry.versionFrom === undefined ? {} : { versionFrom }) };
}

/** sources.json as it is kept on disk: two-space JSON, string arrays on one line, a trailing newline. */
export function formatSources(sources) {
  return `${JSON.stringify(sources, null, 2).replace(/\[\n\s+("(?:[^"\\]|\\.)*"(?:,\n\s+"(?:[^"\\]|\\.)*")*)\n\s+\]/g, (_, items) => `[${items.split(/,\n\s+/).join(', ')}]`)}\n`;
}

/**
 * Reads the latest published release of `slug`, the commit its tag names, and the manifest version at that commit.
 * @param {string} slug
 * @param {{ token?: string, versionFrom?: string, fetchImpl?: (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean, status: number, json: () => Promise<any> }> }} [options]
 */
export async function readRelease(slug, { token, versionFrom, fetchImpl = fetch } = {}) {
  const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const get = async (url, ok404 = false) => {
    const res = await fetchImpl(url, { headers });
    if (ok404 && res.status === 404) return null;
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };
  const latest = await get(`https://api.github.com/repos/${slug}/releases/latest`, true);
  if (!latest) return null;
  const tag = latest.tag_name;
  const commit = (await get(`https://api.github.com/repos/${slug}/commits/${encodeURIComponent(tag)}`)).sha;
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error(`${slug}: tag ${tag} resolved to no commit`);
  let manifestVersion = null;
  const source = versionSource(versionFrom);
  if (source) {
    const file = await get(`https://api.github.com/repos/${slug}/contents/${source.path}?ref=${commit}`);
    const json = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    manifestVersion = source.key.split('.').reduce((o, k) => (o == null ? o : o[k]), json) ?? null;
  }
  return { tag, commit, publishedAt: latest.published_at ?? null, manifestVersion };
}
