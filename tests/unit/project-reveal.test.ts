import { describe, expect, it } from 'vitest';
import { plan, rowsFor } from '../../src/components/home/project-reveal';

const config = { rows: 1, step: 1 };

describe('project reveal', () => {
  it('shows one row and previews the next', () => {
    expect(plan(12, 4, config)).toEqual({ visible: 4, peek: 4, remaining: 8, action: 'more' });
  });
  it('opens a row per step and offers to collapse once all are shown', () => {
    expect(plan(12, 4, config, 2)).toEqual({ visible: 8, peek: 4, remaining: 4, action: 'more' });
    expect(plan(12, 4, config, 3)).toEqual({ visible: 12, peek: 0, remaining: 0, action: 'less' });
  });
  it('previews a partial last row and stops there', () => {
    expect(plan(6, 4, config)).toEqual({ visible: 4, peek: 2, remaining: 2, action: 'more' });
    expect(plan(6, 4, config, 2)).toEqual({ visible: 6, peek: 0, remaining: 0, action: 'less' });
  });
  it('has nothing to toggle when everything fits in the first rows', () => {
    expect(plan(3, 4, config)).toEqual({ visible: 3, peek: 0, remaining: 0, action: 'none' });
    expect(plan(0, 4, config).action).toBe('none');
  });
  it('honors more initial rows and never goes below them', () => {
    expect(plan(20, 3, { rows: 2, step: 2 }).visible).toBe(6);
    expect(plan(20, 3, { rows: 2, step: 2 }, 1).visible).toBe(6);
  });
  it('finds the rows needed to show a given card', () => {
    expect(rowsFor(0, 4, config)).toBe(1);
    expect(rowsFor(4, 4, config)).toBe(2);
    expect(rowsFor(11, 4, config)).toBe(3);
  });
});
