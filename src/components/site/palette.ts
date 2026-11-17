import { opensNewTab } from '../../lib/links';
import { createShortcuts } from './shortcuts';
import { toggleTheme } from './theme';

export interface PaletteItem {
  group: string;
  label: string;
  hint: string;
  // "/#id" and "/projects/id" navigate, "https://..." and ".pdf" open in a new tab, "action:theme" and "action:top" run.
  target: string;
  keys?: string[];
  // Section color token name (c-<color>); defaults to the group's.
  color?: string;
}

export const GROUPS = ['Sections', 'Experience', 'Projects', 'Education', 'About', 'Links', 'Actions'];

export function search(index: PaletteItem[], q: string): PaletteItem[] {
  const needle = q.trim().toLowerCase();
  const rank = (g: string) => GROUPS.indexOf(g);
  return index
    .filter((i) => !needle || `${i.label}\n${i.hint}\n${i.group}`.toLowerCase().includes(needle))
    .sort((a, b) => rank(a.group) - rank(b.group)); // stable: keeps index order inside a group
}

export function dotColor(i: PaletteItem): string {
  const name = i.color ?? i.group.toLowerCase();
  return ['experience', 'projects', 'education', 'about'].includes(name) ? `var(--c-${name})` : 'var(--faint)';
}

/** Wires the command palette dialog and the site-wide keyboard shortcuts that open it or move around the page. */
export function initPalette(dialog: HTMLDialogElement) {
  const input = dialog.querySelector<HTMLInputElement>('[data-palette-input]')!;
  const list = dialog.querySelector<HTMLElement>('[data-palette-list]')!;
  const chips = dialog.querySelector<HTMLElement>('[data-palette-chips]')!;
  const status = dialog.querySelector<HTMLElement>('[data-palette-status]')!;

  let index: PaletteItem[] | null = null;
  let results: PaletteItem[] = [];
  let active = 0;
  let filter: string | null = null;
  let opener: HTMLElement | null = null;
  let failed = false;

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderChips() {
    chips.replaceChildren();
    const names = ['All', ...GROUPS.filter((g) => (index ?? []).some((i) => i.group === g))];
    for (const name of names) {
      const b = el('button', '', name);
      b.type = 'button';
      b.setAttribute('aria-pressed', String((filter ?? 'All') === name));
      b.addEventListener('click', () => {
        filter = name === 'All' ? null : name;
        renderChips();
        render();
        input.focus();
      });
      chips.append(b);
    }
  }

  function setActive(n: number, scroll = true) {
    active = n;
    const options = list.querySelectorAll<HTMLElement>('[role="option"]');
    options.forEach((o, i) => o.setAttribute('aria-selected', String(i === n)));
    if (options[n]) {
      input.setAttribute('aria-activedescendant', options[n].id);
      if (scroll) options[n].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }

  function render() {
    list.replaceChildren();
    results = search(index ?? [], input.value).filter((i) => !filter || i.group === filter);
    status.textContent = failed ? 'Search is unavailable right now.' : index ? (results.length ? '' : 'No results.') : '';
    let group = '';
    let box: HTMLElement | null = null;
    results.forEach((item, n) => {
      if (item.group !== group) {
        group = item.group;
        const label = el('div', 'group-label', group);
        label.id = `palette-g-${group}`;
        label.setAttribute('aria-hidden', 'true');
        box = el('div', '');
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', group);
        list.append(label, box);
      }
      const row = el('div', '');
      row.id = `palette-o-${n}`;
      row.setAttribute('role', 'option');
      const dot = el('span', 'dot');
      dot.style.background = dotColor(item);
      row.append(dot, el('span', 'label', item.label), el('span', 'hint', item.hint));
      if (item.keys) {
        const keys = el('span', 'keys');
        keys.setAttribute('aria-label', `shortcut ${item.keys.join(' then ')}`);
        item.keys.forEach((k) => keys.append(el('kbd', '', k)));
        row.append(keys);
      }
      row.addEventListener('click', () => go(item));
      row.addEventListener('mousemove', () => active !== n && setActive(n, false));
      box!.append(row);
    });
    setActive(Math.min(active, Math.max(results.length - 1, 0)));
  }

  async function load() {
    if (index) return;
    failed = false;
    status.textContent = 'Loading...';
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) throw new Error(String(res.status));
      index = (await res.json()) as PaletteItem[];
    } catch {
      failed = true;
      render();
      return;
    }
    failed = false;
    renderChips();
    render();
  }

  function open(from?: HTMLElement | null) {
    if (dialog.open) return;
    opener = from ?? (document.activeElement as HTMLElement | null);
    input.value = '';
    filter = null;
    active = 0;
    dialog.showModal();
    input.focus();
    renderChips();
    render();
    void load();
  }

  function close(restoreFocus = true) {
    dialog.close();
    if (restoreFocus) opener?.focus({ preventScroll: true });
  }

  function scrollToTop() {
    scrollTo({ top: 0 });
  }

  function go(item: PaletteItem) {
    const t = item.target;
    const known =
      t === 'action:theme' || t === 'action:top' || t.startsWith('https://') || (t.startsWith('/') && !t.startsWith('//'));
    if (!known) return; // the index is fetched data: never hand an unknown scheme to the browser
    close(t.startsWith('action:'));
    if (t === 'action:theme') toggleTheme();
    else if (t === 'action:top') scrollToTop();
    else if (opensNewTab(t)) window.open(t, '_blank', 'noopener');
    else location.assign(t);
  }

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      if (results.length) setActive((active + step + results.length) % results.length);
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault(); // close() ourselves so focus goes back to the opener
    close();
  });
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-palette-open]');
    if (trigger) open(trigger);
  });

  const jump = (id: string) => () => location.assign(`/#${id}`);
  const home = () => location.pathname === '/';
  const step = (dir: 1 | -1) => () => {
    if (!home()) return;
    const sections = [...document.querySelectorAll<HTMLElement>('main section.section')];
    const here = sections.filter((s) => s.getBoundingClientRect().top <= 120).length - 1;
    const next = here + dir;
    if (next < 0) scrollToTop();
    else sections[Math.min(next, sections.length - 1)]?.scrollIntoView();
  };
  const shortcuts = createShortcuts({
    '/': () => open(),
    'g e': jump('experience'),
    'g p': jump('projects'),
    'g d': jump('education'),
    'g a': jump('about'),
    'g g': scrollToTop,
    j: step(1),
    k: step(-1),
    t: toggleTheme,
  });
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) input.focus();
      else open();
    } else if (!dialog.open) shortcuts(e);
  });
}
