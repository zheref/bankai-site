/**
 * The SDLC stages and the skills that run each one, by code name. The grouping follows the stage list the
 * build prompt fixed (2026-11-04); availability is computed against the skills present in the hatsu
 * repository at build time, never typed: a stage is Available when every skill it names exists there.
 */
export const STAGES: Array<{ id: string; skills: string[] }> = [
  { id: 'intake', skills: ['emperor-time', 'file', 'classify', 'direct', 'kamui', 'dowsing-chain'] },
  { id: 'build', skills: ['ren', 'breath', 'rasengan', 'kokusen', 'amaterasu'] },
  { id: 'review', skills: ['hanten', 'kotoamatsukami', 'byakugan'] },
  { id: 'pr', skills: ['aka', 'mukai', 'en', 'sharingan'] },
  { id: 'backlog', skills: ['futon', 'kazaana', 'kage-bunshin', 'backlog-loop'] },
  { id: 'release', skills: ['getsuga', 'susanoo', 'kagutsuchi', 'mugetsu'] },
  { id: 'adopt', skills: ['tenkai', 'limbo', 'jusshin', 'kuchiyose', 'bakuryuha'] },
  { id: 'validate', skills: ['black-voice', 'cleanup', 'third-hand'] },
];

export function stageAvailability(present: Set<string>, skills: string[]): 'available' | 'planned' {
  return skills.every((s) => present.has(s)) ? 'available' : 'planned';
}
