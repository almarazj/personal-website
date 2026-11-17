import { describe, expect, it } from 'vitest';
import { locate } from '../../src/components/site/section-pill';

const sections = (...tops: number[]) => tops.map((top, i) => ({ id: `s${i}`, top }));

describe('section pill', () => {
  it('names nothing while the first section is still below the reading line', () => {
    expect(locate(sections(400, 900), [], 200)).toEqual({ section: null, entry: null });
  });
  it('names the last section that starts at or above the reading line', () => {
    expect(locate(sections(-500, 100, 900), [], 200).section).toBe('s1');
    expect(locate(sections(-500, 200, 900), [], 200).section).toBe('s1');
  });
  it('names the last entry read, only within the current section', () => {
    const entries = [
      { id: 'a', section: 's0', top: -300 },
      { id: 'b', section: 's1', top: 150 },
      { id: 'c', section: 's1', top: 600 },
    ];
    expect(locate(sections(-500, 100), entries, 200)).toEqual({ section: 's1', entry: 'b' });
    expect(locate(sections(-500, 100), entries, 120)).toEqual({ section: 's1', entry: null });
  });
  it('names the last section and its last entry at the end of the page, even if they never reach the line', () => {
    const entries = [
      { id: 'a', section: 's1', top: 300 },
      { id: 'b', section: 's1', top: 600 },
    ];
    expect(locate(sections(-900, 500), entries, 200, true)).toEqual({ section: 's1', entry: 'b' });
  });
});
