import { STAGES, stageAvailability } from '@/features/landing/stages';
import { generated } from '../helpers/generated';

const hatsu = generated<{ skills: Array<{ name: string }> }>('hatsu.json');

describe('SDLC stages', () => {
  it('covers the eight stages the brief names, in order', () => {
    expect(STAGES.map((s) => s.id)).toEqual(['intake', 'build', 'review', 'pr', 'backlog', 'release', 'adopt', 'validate']);
  });
  it('names only skills the hatsu repository ships', () => {
    const present = new Set(hatsu.skills.map((s) => s.name));
    for (const stage of STAGES) for (const name of stage.skills) expect(present.has(name), `${stage.id}: ${name}`).toBe(true);
  });
  it('marks a stage Available only when every skill exists, Planned otherwise', () => {
    expect(stageAvailability(new Set(['a', 'b']), ['a', 'b'])).toBe('available');
    expect(stageAvailability(new Set(['a']), ['a', 'b'])).toBe('planned');
    expect(stageAvailability(new Set(), [])).toBe('available');
  });
});
