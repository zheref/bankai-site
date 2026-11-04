#!/usr/bin/env node
/**
 * Read the pinned source repositories (hatsu, nen, bankai-handbooks) and write
 * everything the site shows about them to src/data/generated/*.json:
 * versions, the pinned Nen bootstrap, every skill and agent, the README's
 * skill tables, the quick-start commands per surface, the gates and model
 * tiers, the Nen verb index, the configuration files, the handbook families
 * and both changelogs. Nothing here is typed by hand: a value the repository
 * does not carry is absent, never invented.
 *
 * Refuses a checkout whose HEAD is not the commit sources.json pins, unless
 * BANKAI_SOURCES_ALLOW_DRIFT=1 (the report then records the drift).
 */
import { mkdirSync, readdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHighlighter } from 'shiki';
import {
  readSources, repoDir, read, frontmatter, section, tables, strip, codeBlocks, inlineHtml, generatedDir, siteRoot,
  deepRedact, bind as bindCheckout, latestTagOf,
} from './lib.mjs';

const sources = readSources();
const names = JSON.parse(readFileSync(resolve(siteRoot, 'src/data/names.json'), 'utf8'));
const tokens = JSON.parse(readFileSync(resolve(siteRoot, 'src/brand/tokens.json'), 'utf8'));
const CLOUD_LABEL = process.env.BANKAI_CLOUD_LABEL || 'Cloud tier';
const allowDrift = process.env.BANKAI_SOURCES_ALLOW_DRIFT === '1';
const report = { readAt: sources.readAt, generatedAt: new Date().toISOString(), repos: {}, redactions: [], warnings: [] };

/** A missing checkout is fetched at its pin first (a fresh CI runner), never silently skipped; an override path is the caller's. */
function bind(name) {
  const dir = repoDir(name);
  if (!existsSync(resolve(dir, '.git')) && !process.env[`BANKAI_SOURCE_${name.toUpperCase()}`]) {
    execFileSync(process.execPath, [resolve(siteRoot, 'scripts/sources/fetch.mjs'), name], { stdio: 'inherit' });
  }
  bindCheckout(name, dir, sources.repos[name].commit, report, { allowDrift });
  report.repos[name].url = sources.repos[name].url;
  return dir;
}

/** Every table the site renders must parse to rows: an empty section is a changed upstream heading, never an empty page. */
function nonEmpty(label, rows) {
  if (!rows || rows.length === 0) throw new Error(`${label}: parsed to zero rows at the pinned commit; the upstream heading or table moved. Fix the reader before building.`);
  return rows;
}

const write = (file, data) => {
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(resolve(generatedDir, file), JSON.stringify(deepRedact(data, file, report, CLOUD_LABEL), null, 2) + '\n');
};

// ---------------------------------------------------------------- hatsu
const hatsu = bind('hatsu');
const plugin = JSON.parse(read(hatsu, '.claude-plugin/plugin.json'));
const readme = read(hatsu, 'README.md');
const contract = JSON.parse(read(hatsu, 'nen/contract.json'));
const workflow = JSON.parse(read(hatsu, 'nen/workflow.json'));

const skillDirs = readdirSync(resolve(hatsu, 'claude/skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(resolve(hatsu, 'claude/skills', d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();
const agentFiles = plugin.agents.map((p) => basename(p, '.md'));

// README skill tables, grouped by their section heading.
const skillsSection = section(readme, 'The skills', 2) || '';
const groupHeadings = [
  ['session', 'Session and host'],
  ['turn-loop', 'The turn loop'],
  ['pr-side', 'The PR side'],
  ['backlog', 'Issues, backlog and reports'],
  ['release-canon', 'Release, consumers and canon'],
];
const readmeRows = {};
for (const [group, heading] of groupHeadings) {
  const sec = section(skillsSection, heading, 3);
  if (!sec) throw new Error(`hatsu README: no skills section '${heading}' under § The skills; the reader must be updated before building.`);
  for (const t of tables(sec)) {
    for (const r of t.rows) {
      const key = strip(r[0]).replace(/^\//, '');
      for (const k of key.split(/\s*·\s*/)) readmeRows[k] = { group, meaning: r[1], steps: r[2], calledBy: r[3] };
    }
  }
}
// README workflow tables: prerequisites + what runs, keyed by the skills named in "Start it".
const workflows = [];
const wfSection = section(readme, 'Workflows', 2) || '';
for (const t of tables(wfSection)) {
  if (t.header.length < 4) continue;
  for (const r of t.rows) workflows.push({ workflow: strip(r[0]), start: r[1], prerequisites: r[2], runs: r[3] });
}

const skills = skillDirs.map((name) => {
  const fm = frontmatter(read(hatsu, `claude/skills/${name}/SKILL.md`));
  const n = names.skills[name];
  const row = readmeRows[name];
  const wf = workflows.filter((w) => new RegExp(`\`${name}\\b`).test(w.start));
  return {
    name, alias: n?.alias ?? null, aliasSource: n?.aliasSource ?? null, description: n?.description ?? null, gate: n?.gate ?? null,
    group: n?.group ?? row?.group ?? null, frontmatterDescription: fm.description ?? '',
    meaningHtml: row ? inlineHtml(row.meaning) : null, stepsHtml: row ? inlineHtml(row.steps) : null, calledByHtml: row ? inlineHtml(row.calledBy) : null,
    prerequisitesHtml: wf.map((w) => inlineHtml(w.prerequisites)), runsHtml: wf.map((w) => inlineHtml(w.runs)), workflowNames: wf.map((w) => w.workflow),
    inNamesMap: Boolean(n), inReadme: Boolean(row), path: `claude/skills/${name}/SKILL.md`,
  };
});

// Roster tables (independents + examiners) for standing and discipline.
const rosterSection = section(readme, 'The roster', 2) || '';
const rosterRows = {};
for (const t of tables(rosterSection)) {
  for (const r of t.rows) {
    const key = strip(r[1] ?? '').toLowerCase().split(' ')[0];
    if (key) rosterRows[key] = r;
  }
}
const modesTable = tables(section(rosterSection, 'Kurapika, the lead persona', 3) || '')[0];
const agents = agentFiles.map((name) => {
  const fm = frontmatter(read(hatsu, `claude/agents/${name}.md`));
  const n = names.agents[name];
  const r = rosterRows[name];
  return {
    name, alias: n?.alias ?? null, aliasSource: n?.aliasSource ?? null, description: n?.description ?? null,
    frontmatterDescription: fm.description ?? '', model: fm.model ?? null,
    disciplineHtml: r ? inlineHtml(r[2]) : null, raisedByHtml: r ? inlineHtml(r[3]) : null, standingHtml: r ? inlineHtml(r[4]) : null,
    modes: name === 'kurapika' && modesTable ? modesTable.rows.map((m) => ({ mode: strip(m[0]).replace(/^\S+\s/, ''), lane: inlineHtml(m[1]), stops: inlineHtml(m[2]), alias: n?.modes?.find((x) => strip(m[0]).includes(x.code))?.alias ?? null })) : [],
    inNamesMap: Boolean(n), path: `claude/agents/${name}.md`,
  };
});

// Quickstart table: one column per surface.
const qs = tables(section(readme, 'Quickstart', 2) || '')[0];
nonEmpty('hatsu README § Quickstart', qs?.rows);
const surfaces = ['claude-code', 'codex', 'cursor', 'antigravity'];
const surfaceTitles = qs ? qs.header.slice(1).map(strip) : [];
const quickstart = surfaces.map((id, i) => {
  const rows = {};
  for (const r of qs?.rows ?? []) rows[strip(r[0])] = strip(r[i + 1]);
  const guide = read(hatsu, `docs/using/${id}.md`);
  const blocks = codeBlocks(section(guide, 'Setup', 2) || '').concat(codeBlocks(section(guide, 'Usage', 2) || ''));
  const summary = tables(guide)[0];
  const facts = {};
  for (const r of summary?.rows ?? []) facts[strip(r[0])] = inlineHtml(r[1]);
  return { id, title: surfaceTitles[i] ?? id, rows, facts, guide: `docs/using/${id}.md`, setupBlocks: blocks.slice(0, 2), usageBlock: codeBlocks(section(guide, 'Usage', 2) || '')[0] ?? null };
});

const gates = nonEmpty('hatsu README § The gates', tables(section(readme, 'The gates', 2) || '')[0]?.rows).map((r) => ({ gate: strip(r[0]), clause: strip(r[1]), whatHtml: inlineHtml(r[2]), delegableHtml: inlineHtml(r[3]) }));
const tiers = nonEmpty('hatsu README § Models and surfaces', tables(section(readme, 'Models and surfaces', 2) || '')[0]?.rows).map((r) => ({ tier: strip(r[0]), role: inlineHtml(r[1]), claudeCode: strip(r[2]), codex: strip(r[3]), cursor: strip(r[4]), antigravity: strip(r[5]) }));
const humanPhases = nonEmpty('hatsu WORKFLOW § 4 phases', tables(section(read(hatsu, 'docs/WORKFLOW.md'), 'The phases, and which of them a human calls', 2) || '')[0]?.rows).map((r) => ({ phase: strip(r[0]), whatHtml: inlineHtml(r[1]), whyHtml: inlineHtml(r[2]) }));
const profiles = workflow.profile ?? null;
const profilesTable = nonEmpty('hatsu WORKFLOW § profile', tables(section(read(hatsu, 'docs/WORKFLOW.md'), 'profile', 3) || '')[0]?.rows).map((r) => ({ profile: strip(r[0]), perTurnHtml: inlineHtml(r[1]), deferredHtml: inlineHtml(r[2]), report: strip(r[3]) }));
const configFiles = nonEmpty('hatsu docs/config/README § The files', tables(section(read(hatsu, 'docs/config/README.md'), 'The files', 2) || '')[0]?.rows).map((r) => ({ file: strip(r[0]), livesIn: inlineHtml(r[1]), decidesHtml: inlineHtml(r[2]), page: strip(r[3]) }));
const nenDependency = {
  minimum: contract.dependency.minimum, pinnedRef: contract.dependency.pinned_ref, source: contract.dependency.source,
  bootstrap: contract.dependency.bootstrap ? { url: contract.dependency.bootstrap.url ?? null, scriptSha256: contract.dependency.bootstrap.scriptSha256 ?? null } : null,
  nenContract: Object.keys(contract.dependency),
};
const contractSummary = { file: 'nen/contract.json', keys: Object.keys(contract), dependencyKeys: Object.keys(contract.dependency), projectLanes: Object.keys(contract.project?.lanes ?? {}) };

const unmapped = [...skills.filter((x) => !x.inNamesMap).map((x) => `skill ${x.name}`), ...agents.filter((x) => !x.inNamesMap).map((x) => `agent ${x.name}`)];
if (unmapped.length) throw new Error(`src/data/names.json lacks ${unmapped.join(', ')}: every skill and agent in the hatsu repository needs a code name, alias and description before the site builds.`);
write('hatsu.json', {
  version: plugin.version, name: plugin.name, displayName: plugin.displayName, description: plugin.description, repository: plugin.repository,
  skillCount: skills.length, agentCount: agents.length, commit: report.repos.hatsu.head, readAt: sources.readAt,
  skills, agents, quickstart, gates, tiers, humanPhases, profiles, profilesTable, configFiles, nenDependency, contractSummary, workflowKeys: Object.keys(workflow).filter((k) => !k.startsWith('$')),
});

// ---------------------------------------------------------------- nen
const nen = bind('nen');
const nenLatestTag = latestTagOf(nen);
if (!nenLatestTag) throw new Error('nen: no reachable tag in the checkout; the latest release cannot be read');
if (nenLatestTag.replace(/^v/, '') !== sources.repos.nen.version.replace(/^v/, '')) {
  const msg = `nen: latest reachable tag ${nenLatestTag} differs from sources.json version ${sources.repos.nen.version}`;
  if (!allowDrift) throw new Error(`${msg}. Update sources.json.`);
  report.warnings.push(msg);
}
const nenPkg = JSON.parse(read(nen, 'package.json'));
const nenReadme = read(nen, 'README.md');
const usage = read(nen, 'docs/USAGE.md');
const verbIndex = tables(section(usage, 'Verb index', 2) || '')[0];
const verbs = nonEmpty('nen USAGE § Verb index', verbIndex?.rows).map((r) => ({ family: strip(r[0]), verb: strip(r[1]), purposeHtml: inlineHtml(r[2]), readsHtml: inlineHtml(r[3]), json: strip(r[4]) }));
const verbSections = {};
for (const m of usage.matchAll(/^### `(nen [^`]+)`\s*$/gm)) {
  const start = m.index + m[0].length;
  const rest = usage.slice(start);
  const end = rest.search(/^#{1,3} /m);
  const body = (end < 0 ? rest : rest.slice(0, end)).trim();
  const firstPara = body.split(/\n\s*\n/).find((p) => p && !p.startsWith('```') && !p.startsWith('|')) ?? '';
  verbSections[m[1]] = { summaryHtml: inlineHtml(firstPara.replace(/\s+/g, ' ')), block: codeBlocks(body)[0] ?? null };
}
const installBlocks = codeBlocks(section(nenReadme, 'Install', 2) || '');
const dayToDayInstall = codeBlocks(section(nenReadme, 'Install', 3) || '');
write('nen.json', {
  version: nenPkg.version, description: nenPkg.description, license: nenPkg.license, commit: report.repos.nen.head, readAt: sources.readAt,
  latestTag: nenLatestTag, packageName: nenPkg.name,
  verbCount: verbs.length, verbs: verbs.map((v) => ({ ...v, ...(verbSections[v.verb] ?? {}) })),
  families: [...new Set(verbs.map((v) => v.family))],
  install: { blocks: installBlocks, dayToDay: dayToDayInstall, targets: ['linux-x64', 'darwin-arm64', 'windows-x64'] },
  conventions: section(usage, 'Conventions', 2)?.split('\n').filter((l) => l.startsWith('### ')).map((l) => l.replace(/^### /, '').replace(/`/g, '')) ?? [],
});

// ---------------------------------------------------------------- handbooks
const hb = bind('handbooks');
const hbReadme = read(hb, 'README.md');
const hbVersion = read(hb, 'handbooks/VERSION').trim();
const familyTable = tables(hbReadme)[0];
const families = nonEmpty('handbooks README families table', familyTable?.rows).map((r) => ({ family: strip(r[0]), where: strip(r[1]), prefix: strip(r[2]) }));
const ux = read(hb, 'handbooks/ux-baseline.md');
const uxRules = nonEmpty('handbooks ux-baseline UX rules', [...ux.matchAll(/^\*\*(UX-\d+) — ([^*]+)\*\*/gm)].map((m) => ({ id: m[1], title: m[2].trim().replace(/\.$/, '') })));
const stacks = families.filter((f) => /stack/i.test(f.family)).map((f) => ({ ...f }));
write('handbooks.json', { version: hbVersion, commit: report.repos.handbooks.head, readAt: sources.readAt, families, stacks, uxRules });

// ---------------------------------------------------------------- changelogs
function changelog(text, repo, limit = 12) {
  const out = [];
  const re = /^## (.+)$/gm;
  const heads = [...text.matchAll(re)];
  for (let i = 0; i < heads.length && out.length < limit; i++) {
    const h = heads[i];
    const body = text.slice(h.index + h[0].length, heads[i + 1]?.index ?? text.length).trim();
    const title = h[1].trim();
    const version = (title.match(/v?\d+\.\d+\.\d+/) || [null])[0];
    if (!version && !/unreleased/i.test(title)) continue;
    const date = (title.match(/\d{4}-\d{2}-\d{2}/) || [null])[0];
    const bullets = body.split('\n').filter((l) => /^\s*[-*] /.test(l)).map((l) => inlineHtml(l.replace(/^\s*[-*] /, '').trim())).slice(0, 14);
    out.push({ repo, title: strip(title), version, date, bullets, truncated: body.split('\n').filter((l) => /^\s*[-*] /.test(l)).length > 14 });
  }
  return out;
}
write('changelog.json', { entries: [...changelog(read(hatsu, 'CHANGELOG.md'), 'hatsu'), ...changelog(read(nen, 'CHANGELOG.md'), 'nen'), ...changelog(read(hb, 'CHANGELOG.md'), 'handbooks')] });

// ---------------------------------------------------------------- highlighted snippets (shiki, build time, no runtime JS)
const highlighter = await createHighlighter({ themes: ['github-dark-default', 'github-light'], langs: ['bash', 'json', 'text'] });
// tabindex on the <pre>: it is the scroll region, so keyboard users can reach it (axe scrollable-region-focusable).
const focusablePre = { pre(node) { node.properties.tabindex = '0'; } };
const hl = (code, lang = 'bash') => highlighter.codeToHtml(code, { lang, themes: { dark: 'github-dark-default', light: 'github-light' }, defaultColor: false, transformers: [focusablePre] });
const snippets = {};
for (const s of quickstart) {
  snippets[`install-${s.id}`] = { lang: 'bash', code: s.setupBlocks[0]?.code ?? s.rows.install, html: hl(s.setupBlocks[0]?.code ?? s.rows.install), source: `hatsu:${s.guide} § 2 · Setup` };
  snippets[`usage-${s.id}`] = { lang: 'bash', code: s.usageBlock?.code ?? `${s.rows['open a session']}\n${s.rows['a request']}`, html: hl(s.usageBlock?.code ?? s.rows['a request']), source: `hatsu:${s.guide} § 3 · Usage` };
}
const pin = nenDependency.pinnedRef;
const bootstrapCode = `curl -fsSL https://raw.githubusercontent.com/zheref/nen/${pin}/bootstrap/nen.sh -o nen-bootstrap.sh\nbash nen-bootstrap.sh --ref ${pin}`;
snippets['nen-bootstrap'] = { lang: 'bash', code: bootstrapCode, html: hl(bootstrapCode), source: `nen:README.md § Install, with the ref hatsu pins (nen/contract.json dependency.pinned_ref = ${pin})` };
const latestCode = installBlocks[0]?.code ?? bootstrapCode;
snippets['nen-bootstrap-latest'] = { lang: 'bash', code: latestCode, html: hl(latestCode), source: 'nen:README.md § Install (the latest release)' };
snippets['nen-try'] = { lang: 'bash', code: codeBlocks(section(nenReadme, 'Try it', 2) || '')[0]?.code ?? '', html: hl(codeBlocks(section(nenReadme, 'Try it', 2) || '')[0]?.code ?? '', 'text'), source: 'nen:README.md § Try it' };
write('snippets.json', { snippets });

// ---------------------------------------------------------------- tokens → CSS
const css = ['/* generated from src/brand/tokens.json by scripts/sources/collect.mjs; do not edit */'];
const vars = (scheme) => Object.entries(tokens.colors[scheme]).map(([k, v]) => `  --bk-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${v};`).join('\n');
css.push(`:root, :root[data-theme="dark"] {\n${vars('dark')}\n  color-scheme: dark;\n}`);
css.push(`:root[data-theme="light"] {\n${vars('light')}\n  color-scheme: light;\n}`);
css.push(`@media (prefers-color-scheme: light) {\n  :root:not([data-theme]) {\n${vars('light')}\n    color-scheme: light;\n  }\n}`);
mkdirSync(resolve(siteRoot, 'src/styles'), { recursive: true });
writeFileSync(resolve(siteRoot, 'src/styles/tokens.generated.css'), css.join('\n\n') + '\n');

if (report.warnings.length && !allowDrift) throw new Error(`collect: ${report.warnings.length} warning(s) would be silent: ${report.warnings.join('; ')}`);
writeFileSync(resolve(generatedDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`collected: hatsu ${plugin.version} (${skills.length} skills, ${agents.length} agents), nen ${nenPkg.version} (${verbs.length} verbs), handbooks ${hbVersion}; ${report.redactions.length} redactions, ${report.warnings.length} warnings`);
