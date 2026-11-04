import type { TermLine } from '@/design/Terminal';

/**
 * The hero's real flow in Claude Code's spelling. Commands are the ones hatsu's docs/using/claude-code.md § 3 prints (the example request shortened to fit one line);
 * the step lists are the hatsu README's own ("How a request flows" and the skill tables). Output lines are
 * illustrative summaries of those steps, not captured tool output (docs/SOURCES.md).
 */
export const HERO_FLOW: TermLine[] = [
  { kind: 'cmd', prompt: '›', text: '/kurapika Add a "Clear all" action to the notifications list' },
  { kind: 'out', text: 'ren · breath → rasengan → kokusen → amaterasu → spiritual-message → jutaisho' },
  { kind: 'note', text: 'committed locally · nothing pushed' },
  { kind: 'cmd', prompt: '›', text: '/hatsu:aka' },
  { kind: 'out', text: 'gyo → squash unpushed → ao → gyo → push' },
  { kind: 'cmd', prompt: '›', text: '/hatsu:mukai' },
  { kind: 'out', text: 'murasaki → hanten → kokusen → kotoamatsukami → byakugan → shibari → landing report' },
  { kind: 'note', text: 'one PR opened · offering en' },
  { kind: 'cmd', prompt: '›', text: '/hatsu:en on HA#12' },
  { kind: 'out', text: 'sharingan → observe CI and the current-head round → Ready' },
  { kind: 'note', text: 'G2 · the merge is yours' },
];
