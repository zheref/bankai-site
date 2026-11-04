/**
 * gatsby-source-bankai: the build-time source plugin.
 *
 * collect.mjs reads the three source repositories at the commits sources.json
 * pins and writes JSON under src/data/generated/. This plugin turns those
 * files into GraphQL nodes so every page reads versions, skills, agents,
 * commands, verbs and changelogs through queries, never from hand-typed copy.
 */
const fs = require('node:fs');
const path = require('node:path');

const generated = () => path.resolve(__dirname, '..', '..', 'src', 'data', 'generated');
const load = (file) => JSON.parse(fs.readFileSync(path.join(generated(), file), 'utf8'));

exports.onPreBootstrap = ({ reporter }) => {
  const dir = generated();
  for (const f of ['hatsu.json', 'nen.json', 'handbooks.json', 'changelog.json', 'snippets.json', 'report.json']) {
    if (!fs.existsSync(path.join(dir, f))) reporter.panic(`gatsby-source-bankai: ${f} is missing under ${dir}. Run \`pnpm sources:collect\` (the build and develop scripts run it first).`);
  }
};

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions;
  const make = (type, id, data) => createNode({ ...data, id: createNodeId(`${type}-${id}`), parent: null, children: [], internal: { type, contentDigest: createContentDigest(data) } });

  const hatsu = load('hatsu.json');
  const nen = load('nen.json');
  const handbooks = load('handbooks.json');
  const changelog = load('changelog.json');
  const { snippets } = load('snippets.json');
  const report = load('report.json');

  make('SourceRepo', 'hatsu', { name: 'hatsu', version: hatsu.version, commit: hatsu.commit, readAt: hatsu.readAt, skillCount: hatsu.skillCount, agentCount: hatsu.agentCount, description: hatsu.description });
  make('SourceRepo', 'nen', { name: 'nen', version: nen.version, commit: nen.commit, readAt: nen.readAt, latestTag: nen.latestTag, verbCount: nen.verbCount, description: nen.description, packageName: nen.packageName });
  make('SourceRepo', 'handbooks', { name: 'handbooks', version: handbooks.version, commit: handbooks.commit, readAt: handbooks.readAt });

  hatsu.skills.forEach((s, i) => make('HatsuSkill', s.name, { ...s, order: i }));
  hatsu.agents.forEach((a, i) => make('HatsuAgent', a.name, { ...a, order: i }));
  hatsu.quickstart.forEach((q, i) => make('QuickStartSurface', q.id, { ...q, surfaceId: q.id, order: i, rowsJson: JSON.stringify(q.rows), factsJson: JSON.stringify(q.facts) }));
  hatsu.gates.forEach((g, i) => make('HatsuGate', g.gate, { ...g, order: i }));
  hatsu.tiers.forEach((t, i) => make('ModelTier', t.tier, { ...t, order: i }));
  hatsu.humanPhases.forEach((p, i) => make('HumanPhase', p.phase, { ...p, order: i }));
  hatsu.profilesTable.forEach((p, i) => make('RunProfile', p.profile, { ...p, order: i }));
  hatsu.configFiles.forEach((c, i) => make('ConfigFile', c.file, { ...c, order: i }));
  make('NenDependency', 'hatsu', { ...hatsu.nenDependency, bootstrapUrl: hatsu.nenDependency.bootstrap?.url ?? null, bootstrapScriptSha256: hatsu.nenDependency.bootstrap?.scriptSha256 ?? null });
  nen.verbs.forEach((v, i) => make('NenVerb', v.verb, { ...v, order: i, blockCode: v.block?.code ?? null }));
  handbooks.families.forEach((f, i) => make('HandbookFamily', f.prefix + f.where, { ...f, order: i }));
  handbooks.uxRules.forEach((r, i) => make('UxRule', r.id, { ...r, ruleId: r.id, order: i }));
  changelog.entries.forEach((e, i) => make('ChangelogEntry', `${e.repo}-${e.version}-${i}`, { ...e, order: i }));
  Object.entries(snippets).forEach(([key, s]) => make('Snippet', key, { key, ...s }));
  make('SourceReport', 'report', { readAt: report.readAt, generatedAt: report.generatedAt, redactionCount: report.redactions.length, warnings: report.warnings, reposJson: JSON.stringify(report.repos) });
};

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type HatsuSkill implements Node { name: String!, alias: String, aliasSource: String, description: String, gate: String, group: String, frontmatterDescription: String, meaningHtml: String, stepsHtml: String, calledByHtml: String, prerequisitesHtml: [String], runsHtml: [String], workflowNames: [String], inNamesMap: Boolean, inReadme: Boolean, path: String, order: Int }
    type HatsuAgentMode { mode: String, lane: String, stops: String, alias: String }
    type HatsuAgent implements Node { name: String!, alias: String, aliasSource: String, description: String, frontmatterDescription: String, model: String, disciplineHtml: String, raisedByHtml: String, standingHtml: String, modes: [HatsuAgentMode], inNamesMap: Boolean, path: String, order: Int }
    type CodeBlock { lang: String, code: String }
    type QuickStartSurface implements Node { surfaceId: String!, title: String, rowsJson: String, factsJson: String, guide: String, setupBlocks: [CodeBlock], usageBlock: CodeBlock, order: Int }
    type HatsuGate implements Node { gate: String, clause: String, whatHtml: String, delegableHtml: String, order: Int }
    type ModelTier implements Node { tier: String, role: String, claudeCode: String, codex: String, cursor: String, antigravity: String, order: Int }
    type HumanPhase implements Node { phase: String, whatHtml: String, whyHtml: String, order: Int }
    type RunProfile implements Node { profile: String, perTurnHtml: String, deferredHtml: String, report: String, order: Int }
    type ConfigFile implements Node { file: String, livesIn: String, decidesHtml: String, page: String, order: Int }
    type NenDependency implements Node { minimum: String, pinnedRef: String, source: String, bootstrapUrl: String, bootstrapScriptSha256: String }
    type NenVerb implements Node { family: String, verb: String, purposeHtml: String, readsHtml: String, json: String, summaryHtml: String, blockCode: String, order: Int }
    type HandbookFamily implements Node { family: String, where: String, prefix: String, order: Int }
    type UxRule implements Node { ruleId: String!, title: String, order: Int }
    type ChangelogEntry implements Node { repo: String, title: String, version: String, date: String, bullets: [String], truncated: Boolean, order: Int }
    type Snippet implements Node { key: String!, lang: String, code: String, html: String, source: String }
    type SourceRepo implements Node { name: String!, version: String, commit: String, readAt: String, skillCount: Int, agentCount: Int, verbCount: Int, latestTag: String, description: String, packageName: String }
    type SourceReport implements Node { readAt: String, generatedAt: String, redactionCount: Int, warnings: [String], reposJson: String }
  `);
};
