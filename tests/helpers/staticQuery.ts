import { vi } from 'vitest';
import { generated } from './generated';

type Hatsu = {
  version: string; commit: string; readAt: string; skillCount: number; agentCount: number; description: string;
  skills: Array<Record<string, unknown> & { name: string }>; agents: Array<Record<string, unknown> & { name: string }>;
  quickstart: Array<Record<string, unknown> & { id: string; rows: Record<string, string>; facts: Record<string, string> }>;
  gates: Array<Record<string, unknown>>; tiers: Array<Record<string, unknown>>; humanPhases: Array<Record<string, unknown>>;
  profilesTable: Array<Record<string, unknown>>; configFiles: Array<Record<string, unknown>>;
  nenDependency: { minimum: string; pinnedRef: string; source: string; bootstrap: { url: string | null; scriptSha256: string | null } | null };
};
type Nen = { version: string; commit: string; readAt: string; latestTag: string; verbCount: number; description: string; packageName: string; verbs: Array<Record<string, unknown> & { verb: string; block: { code: string } | null }> };
type Handbooks = { version: string; commit: string; readAt: string; families: Array<Record<string, unknown>>; uxRules: Array<{ id: string; title: string }> };

/**
 * One static-query result shaped like every query the site makes, built from the generated data the
 * build reads, so render tests exercise the real rows (the same source plugin maps them one to one).
 */
export function buildStaticData() {
  const hatsu = generated<Hatsu>('hatsu.json');
  const nen = generated<Nen>('nen.json');
  const hb = generated<Handbooks>('handbooks.json');
  const changelog = generated<{ entries: Array<Record<string, unknown>> }>('changelog.json');
  const { snippets } = generated<{ snippets: Record<string, Record<string, unknown>> }>('snippets.json');
  const nodes = <T,>(xs: T[]) => ({ nodes: xs });
  return {
    allHatsuSkill: nodes(hatsu.skills.map((s, order) => ({ ...s, order }))),
    allHatsuAgent: nodes(hatsu.agents.map((a, order) => ({ ...a, order }))),
    allQuickStartSurface: nodes(hatsu.quickstart.map((q, order) => ({ ...q, surfaceId: q.id, order, rowsJson: JSON.stringify(q.rows), factsJson: JSON.stringify(q.facts) }))),
    allHatsuGate: nodes(hatsu.gates),
    allModelTier: nodes(hatsu.tiers),
    allHumanPhase: nodes(hatsu.humanPhases),
    allRunProfile: nodes(hatsu.profilesTable),
    allConfigFile: nodes(hatsu.configFiles),
    nenDependency: { ...hatsu.nenDependency, bootstrapUrl: hatsu.nenDependency.bootstrap?.url ?? null, bootstrapScriptSha256: hatsu.nenDependency.bootstrap?.scriptSha256 ?? null },
    allNenVerb: nodes(nen.verbs.map((v) => ({ ...v, blockCode: v.block?.code ?? null }))),
    allHandbookFamily: nodes(hb.families),
    allUxRule: nodes(hb.uxRules.map((r) => ({ ...r, ruleId: r.id }))),
    allChangelogEntry: nodes(changelog.entries),
    allSnippet: nodes(Object.entries(snippets).map(([key, s]) => ({ key, ...s }))),
    allSourceRepo: nodes([
      { name: 'hatsu', version: hatsu.version, commit: hatsu.commit, readAt: hatsu.readAt, skillCount: hatsu.skillCount, agentCount: hatsu.agentCount, verbCount: null, latestTag: null },
      { name: 'nen', version: nen.version, commit: nen.commit, readAt: nen.readAt, skillCount: null, agentCount: null, verbCount: nen.verbCount, latestTag: nen.latestTag },
      { name: 'handbooks', version: hb.version, commit: hb.commit, readAt: hb.readAt, skillCount: null, agentCount: null, verbCount: null, latestTag: null },
    ]),
  };
}

/** Points the gatsby mock's useStaticQuery at the fixture for the rest of the test file. */
export async function mockStaticQuery(data: ReturnType<typeof buildStaticData> = buildStaticData()) {
  const gatsby = await import('gatsby');
  vi.mocked(gatsby.useStaticQuery).mockReturnValue(data);
  return data;
}
