import { animate } from 'motion';
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
  let loading: Promise<void> | null = null;
  let opening = false;

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
    status.textContent = failed ? 'Search is unavailable right now.' : index ? (results.length ? '' : 'No results.') : loading ? 'Loading...' : '';
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

  // One request in flight at a time; a failed one is forgotten so the next open retries.
  function load() {
    if (index) return Promise.resolve();
    return (loading ??= fetchIndex());
  }

  async function fetchIndex() {
    failed = false;
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) throw new Error(String(res.status));
      index = (await res.json()) as PaletteItem[];
    } catch {
      failed = true;
      loading = null;
      render();
      return;
    }
    failed = false;
    renderChips();
    render();
  }

  // The on-screen keyboard shrinks the visual viewport but not dvh; on phones the sheet keeps to what is visible.
  const fit = () => dialog.style.setProperty('--palette-room', `${visualViewport?.height ?? innerHeight}px`);
  visualViewport?.addEventListener('resize', fit);

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 680px)');
  const EASE_OUT = [0.16, 1, 0.3, 1] as const;
  const EASE_IN = [0.4, 0, 1, 1] as const;
  // On phones the sheet unrolls from the top edge like a blind, and rolls back up into it.
  const ROLLED = 'inset(0% 0% 100% 0% round 0 0 12px 12px)';
  const UNROLLED = 'inset(0% 0% 0% 0% round 0 0 12px 12px)';
  const LEFT_BY_MOTION = ['clip-path', 'opacity', 'transform', 'translate', 'scale'];

  function enter() {
    if (still.matches) return;
    const field = dialog.querySelector<HTMLElement>('.field')!;
    // Everything on screen cascades in reading order, group labels with their rows; the delay is capped so long lists stay quick.
    const rows = [...list.querySelectorAll<HTMLElement>('.group-label, [role="option"]')].filter((r) => r.offsetTop - list.offsetTop < list.clientHeight);
    if (phone.matches) {
      animate(dialog, { clipPath: [ROLLED, UNROLLED] }, { duration: 0.28, ease: EASE_OUT });
      animate(field, { opacity: [0, 1], x: [-10, 0] }, { duration: 0.24, delay: 0.06, ease: EASE_OUT });
      animate(chips, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.2, delay: 0.1, ease: EASE_OUT });
    } else {
      animate(dialog, { opacity: [0, 1], scale: [0.97, 1], y: [-6, 0] }, { duration: 0.22, ease: EASE_OUT });
    }
    if (rows.length) animate(rows, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.2, delay: (i: number) => 0.08 + Math.min(i * 0.02, 0.16), ease: EASE_OUT });
  }

  async function open(from?: HTMLElement | null) {
    if (dialog.open || opening) return;
    opener = from ?? (document.activeElement as HTMLElement | null);
    input.value = '';
    filter = null;
    active = 0;
    fit();
    // The field takes focus at once so keys typed right after / are not lost to the page; the panel stays hidden meanwhile.
    dialog.dataset.opening = '';
    dialog.showModal();
    input.focus();
    // Rows landing mid-entrance make the panel jump, so give the index a moment; a slow network still gets the panel quickly.
    opening = true;
    await Promise.race([load(), new Promise((done) => setTimeout(done, 300))]);
    opening = false;
    delete dialog.dataset.opening;
    if (!dialog.open) return;
    renderChips();
    render();
    enter();
  }

  let closing = false;
  // `instant` skips the exit when the page is about to be left anyway.
  async function close(restoreFocus = true, instant = false) {
    if (!dialog.open || closing) return;
    if (!instant && !still.matches) {
      closing = true;
      dialog.dataset.closing = '';
      await (phone.matches
        ? animate(dialog, { clipPath: [UNROLLED, ROLLED] }, { duration: 0.2, ease: EASE_IN })
        : animate(dialog, { opacity: 0, scale: 0.97, y: -6 }, { duration: 0.15, ease: EASE_IN }));
      delete dialog.dataset.closing;
      closing = false;
    }
    dialog.close();
    for (const prop of LEFT_BY_MOTION) dialog.style.removeProperty(prop);
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
    const action = t.startsWith('action:');
    close(action, !action && !opensNewTab(t));
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
  dialog.querySelector('[data-palette-close]')?.addEventListener('click', () => close());
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
    } else if (!dialog.open && !opening) shortcuts(e);
  });

  // Fetched ahead of the first open, which would otherwise animate an empty panel.
  (window.requestIdleCallback ?? setTimeout)(() => void load());
}
