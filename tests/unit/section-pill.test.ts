import { describe, expect, it } from 'vitest';
import { locate } from '../../src/components/site/section-pill';

const sections = (...tops: number[]) => tops.map((top, i) => ({ id: `s${i}`, top }));

describe('section pill', () => {
  it('names nothing while the first section is still below the reading line', () => {
    expect(locate(sections(400, 900), 200)).toBeNull();
  });
  it('names the last section that starts at or above the reading line', () => {
    expect(locate(sections(-500, 100, 900), 200)).toBe('s1');
    expect(locate(sections(-500, 200, 900), 200)).toBe('s1');
  });
  it('names the last section at the end of the page, even if it never reaches the line', () => {
    expect(locate(sections(-900, -100, 500), 200, true)).toBe('s2');
  });
});
