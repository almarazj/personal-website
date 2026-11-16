import { describe, expect, it } from 'vitest';
import { dotColor, search, type PaletteItem } from '../../src/components/site/palette';

const item = (group: string, label: string, hint = '', target = '/'): PaletteItem => ({ group, label, hint, target });
const idx: PaletteItem[] = [
  item('Actions', 'Switch theme'),
  item('About', 'Quick questions', 'Recommend a book Ficciones'),
  item('Projects', 'Webhook relay', 'Retries without double charges'),
  item('Sections', 'Work experience'),
  item('Experience', 'Backend engineer', 'Acme · Remote'),
  item('Links', 'GitHub'),
];

describe('search', () => {
  it('finds an item by text in its hint, case-insensitively', () => {
    expect(search(idx, 'ficciones').map((i) => i.label)).toEqual(['Quick questions']);
  });
  it('matches the group name', () => {
    expect(search(idx, 'ACTIONS').map((i) => i.label)).toEqual(['Switch theme']);
  });
  it('returns everything for an empty query, in group order', () => {
    expect(search(idx, '').map((i) => i.group)).toEqual(['Sections', 'Experience', 'Projects', 'About', 'Links', 'Actions']);
  });
});

describe('dotColor', () => {
  it('uses the section color for section groups and an explicit color, and faint otherwise', () => {
    expect(dotColor(item('Projects', 'x'))).toBe('var(--c-projects)');
    expect(dotColor({ ...item('Sections', 'Work experience'), color: 'experience' })).toBe('var(--c-experience)');
    expect(dotColor(item('Links', 'GitHub'))).toBe('var(--faint)');
  });
});
