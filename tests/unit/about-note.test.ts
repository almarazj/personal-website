import { describe, expect, it } from 'vitest';
import { pointAt } from '../../src/components/home/about-note';

describe('about note', () => {
  it('finds the run and offset of a character across text runs', () => {
    expect(pointAt([5, 3, 4], 0)).toEqual({ run: 0, offset: 0 });
    expect(pointAt([5, 3, 4], 7)).toEqual({ run: 1, offset: 2 });
    expect(pointAt([5, 3, 4], 9)).toEqual({ run: 2, offset: 1 });
  });
  it('stays inside the text past either end', () => {
    expect(pointAt([5, 3], -2)).toEqual({ run: 0, offset: 0 });
    expect(pointAt([5, 3], 99)).toEqual({ run: 1, offset: 3 });
  });
});
