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

/**
 * `package.json#version (latest tag v0.29.0)` → { path: 'package.json', key: 'version' }; `handbooks/VERSION` → { path:
 * 'handbooks/VERSION', key: null }, a plain-text file that is the version itself; null when the entry names no file.
 */
export function versionSource(versionFrom) {
  const s = String(versionFrom ?? '');
  const json = s.match(/^([^\s#]+\.json)#([\w.]+)/);
  if (json) return { path: json[1], key: json[2] };
  const text = s.match(/^([^\s#]+)(?:\s|$)/);
  return text && !text[1].endsWith('.json') ? { path: text[1], key: null } : null;
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

/**
 * Refuses a release whose manifest version (read at its tag's commit) is not the tag's version; null means no manifest
 * was named. Compared as MAJOR.MINOR[.PATCH], so the handbooks' `v0.11` VERSION file vouches for tag v0.11.0, and a
 * manifest version that does not parse is refused like a disagreeing one.
 */
export function checkManifest(name, release, version) {
  if (release.manifestVersion === null || release.manifestVersion === undefined) return;
  if (!parseVersion(release.manifestVersion) || compareVersions(release.manifestVersion, version) !== 0) {
    throw new Error(`${name}: release ${release.tag} carries manifest version ${release.manifestVersion}; refusing to pin a release whose manifest disagrees with its tag`);
  }
}

/** The step outputs sources-refresh.yml reads: `changed` (true only when a pin moved and was written) and `summary`. */
export function outputLines(moved, written) {
  return `changed=${moved.length > 0 && written}\nsummary=${moved.length ? `repin ${moved.join(', ')}` : 'no newer release'}\n`;
}

/** Whether two sources.json documents pin every repository to the same ref and commit (readAt and prose aside). */
export function samePins(a, b) {
  const pins = (s) => Object.entries(s?.repos ?? {}).map(([name, e]) => [name, e.ref, e.commit]).sort((x, y) => (x[0] < y[0] ? -1 : 1));
  return JSON.stringify(pins(a)) === JSON.stringify(pins(b));
}

/** The keys a repin may move; every other key of an entry, and of the file, must arrive unchanged. */
const REPIN_KEYS = new Set(['ref', 'commit', 'version', 'versionFrom']);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What the write-token job checks before it lands a repin proved elsewhere: `after` may differ from `before` only by
 * repinned entries of followed repositories (ref = a release tag, its 40-hex commit, the tag's version, the
 * versionFrom note) and `readAt`. Returns the problems found; an empty list is the only landable answer.
 */
export function checkRepin(before, after) {
  const problems = [];
  const keys = (o) => Object.keys(o ?? {}).sort();
  if (!same(keys(before), keys(after))) problems.push('top-level keys differ');
  for (const k of keys(before)) if (k !== 'repos' && k !== 'readAt' && !same(before[k], after?.[k])) problems.push(`${k} changed`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(after?.readAt))) problems.push(`readAt ${JSON.stringify(after?.readAt)} is not a date`);
  if (!same(keys(before?.repos), keys(after?.repos))) problems.push('repository names differ');
  let moved = 0;
  for (const name of keys(before?.repos)) {
    const was = before.repos[name];
    const now = after?.repos?.[name] ?? {};
    if (same(was, now)) continue;
    moved++;
    if (was.follow !== 'release') problems.push(`${name} is not followed by release and may not move`);
    for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) if (!REPIN_KEYS.has(k) && !same(was[k], now[k])) problems.push(`${name}.${k} changed`);
    // The same optional-v reading parseVersion and decide give a tag, so every repin the refresh accepts can land.
    if (!/^v?\d+\.\d+(?:\.\d+)?$/.test(String(now.ref))) problems.push(`${name}.ref ${JSON.stringify(now.ref)} is not a release tag`);
    else if (now.ref.replace(/^v/, '') !== now.version) problems.push(`${name}.version ${now.version} is not its tag ${now.ref}`);
    if (!/^[0-9a-f]{40}$/.test(String(now.commit))) problems.push(`${name}.commit is not a 40-hex sha`);
    if (parseVersion(now.version) && parseVersion(was.version) && compareVersions(now.version, was.version) <= 0) problems.push(`${name} moves back or sideways (${was.version} → ${now.version})`);
  }
  if (!moved) problems.push('no repository moved');
  return problems;
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
    const text = Buffer.from(file.content, 'base64').toString('utf8');
    if (source.key === null) manifestVersion = text.trim() || null;
    else manifestVersion = source.key.split('.').reduce((o, k) => (o == null ? o : o[k]), JSON.parse(text)) ?? null;
    // A manifest that names no version cannot vouch for the tag: refuse rather than skip the comparison.
    if (manifestVersion === null) throw new Error(`${slug}: ${source.path} at ${tag} has no ${source.key ?? 'version'}`);
  }
  return { tag, commit, publishedAt: latest.published_at ?? null, manifestVersion };
}
