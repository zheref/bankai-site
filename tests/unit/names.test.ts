import { readFileSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import names from '@/data/names.json';
import { generated } from '../helpers/generated';

type Hatsu = { skills: Array<{ name: string; inNamesMap: boolean; alias: string | null; description: string | null }>; agents: Array<{ name: string; inNamesMap: boolean; alias: string | null }>; skillCount: number; agentCount: number };
const hatsu = generated<Hatsu>('hatsu.json');
const pinnedAgents = (JSON.parse(readFileSync('.sources/hatsu/.claude-plugin/plugin.json', 'utf8')).agents as string[]).map((p) => basename(p, '.md'));
const pinnedSkills = readdirSync('.sources/hatsu/claude/skills', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

describe('names.json covers the hatsu repository', () => {
  it('lists every skill directory the repository ships (the collector refuses a build with one missing; this test checks CI)', () => {
    const missing = hatsu.skills.filter((s) => !(s.name in names.skills)).map((s) => s.name);
    expect(missing).toEqual([]);
  });
  it('lists every agent the plugin manifest declares', () => {
    const missing = hatsu.agents.filter((a) => !(a.name in names.agents)).map((a) => a.name);
    expect(missing).toEqual([]);
  });
  it('names nothing the repository no longer has (stale entries are removed, not kept)', () => {
    const skillNames = new Set(hatsu.skills.map((s) => s.name));
    const agentNames = new Set(hatsu.agents.map((a) => a.name));
    expect(Object.keys(names.skills).filter((k) => !skillNames.has(k))).toEqual([]);
    expect(Object.keys(names.agents).filter((k) => !agentNames.has(k))).toEqual([]);
  });
  it('gives every entry a plain alias and a one-line description', () => {
    for (const [k, v] of Object.entries({ ...names.skills, ...names.agents })) {
      expect(v.alias, k).toBeTruthy();
      expect(v.description, k).toBeTruthy();
      expect(v.description.length, k).toBeLessThan(220);
    }
  });
  it('keeps shibari as the code name while the musubi rename is only proposed', () => {
    expect(names.skills).toHaveProperty('shibari');
    expect(names.skills).not.toHaveProperty('musubi');
    expect(names.proposedRenames).toEqual([expect.objectContaining({ from: 'shibari', to: 'musubi', status: 'proposed' })]);
  });
  it('carries exactly the pinned character roster used by the commercial-page check', () => {
    expect(names.characterNames).toHaveLength(pinnedAgents.length);
    expect(new Set(names.characterNames)).toEqual(new Set(pinnedAgents));
  });
  it('matches the pinned source roster and its counts', () => {
    expect(hatsu.skills.map((s) => s.name).sort()).toEqual(pinnedSkills.sort());
    expect(hatsu.agents.map((a) => a.name).sort()).toEqual(pinnedAgents.sort());
    expect(hatsu.skillCount).toBe(pinnedSkills.length);
    expect(hatsu.agentCount).toBe(pinnedAgents.length);
  });
});
