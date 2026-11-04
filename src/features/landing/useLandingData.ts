import { graphql, useStaticQuery } from 'gatsby';

export type SkillLite = { name: string; alias: string | null; description: string | null; gate: string | null; group: string | null };
export type Gate = { gate: string; clause: string; whatHtml: string; delegableHtml: string };
export type Surface = { surfaceId: string; title: string; rowsJson: string; factsJson: string; guide: string; order: number };

export function useLandingData() {
  const data = useStaticQuery<{
    allHatsuSkill: { nodes: SkillLite[] };
    allHatsuGate: { nodes: Gate[] };
    allQuickStartSurface: { nodes: Surface[] };
    nenDependency: { minimum: string; pinnedRef: string; source: string; bootstrapUrl: string | null };
    allSourceRepo: { nodes: Array<{ name: string; version: string; commit: string; readAt: string; skillCount: number | null; agentCount: number | null; verbCount: number | null; latestTag: string | null }> };
  }>(graphql`
    query LandingData {
      allHatsuSkill(sort: { order: ASC }) { nodes { name alias description gate group } }
      allHatsuGate(sort: { order: ASC }) { nodes { gate clause whatHtml delegableHtml } }
      allQuickStartSurface(sort: { order: ASC }) { nodes { surfaceId title rowsJson factsJson guide order } }
      nenDependency { minimum pinnedRef source bootstrapUrl }
      allSourceRepo { nodes { name version commit readAt skillCount agentCount verbCount latestTag } }
    }
  `);
  const repos = Object.fromEntries(data.allSourceRepo.nodes.map((n) => [n.name, n]));
  const skills = Object.fromEntries(data.allHatsuSkill.nodes.map((s) => [s.name, s]));
  return { skills, skillList: data.allHatsuSkill.nodes, gates: data.allHatsuGate.nodes, surfaces: data.allQuickStartSurface.nodes, nenDependency: data.nenDependency, repos };
}
