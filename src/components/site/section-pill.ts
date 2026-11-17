export interface Mark {
  id: string;
  /** Viewport top, in px. */
  top: number;
}

/**
 * The section being read at viewport height `y`: the last one that starts at or above it.
 * Nothing while the first section is still below `y` (the hero is in view); at the page's end the last section, which may be too short to reach `y`.
 */
export function locate(sections: Mark[], y: number, atEnd = false): string | null {
  if (atEnd) return sections.at(-1)?.id ?? null;
  return sections.filter((s) => s.top <= y).at(-1)?.id ?? null;
}

// The reading line sits this far down the space under the sticky header.
const READ_AT = 0.3;
const HEADER = 56;

/** Wires the floating pill that names the section being read, and opens a menu to jump to any of them. */
export function initSectionPill(root: HTMLElement, page: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('[data-spill-button]')!;
  const menu = root.querySelector<HTMLElement>('[data-spill-menu]')!;
  const list = root.querySelector<HTMLElement>('[data-spill-list]')!;
  const sectionName = root.querySelector<HTMLElement>('[data-spill-section]')!;
  const progress = root.querySelector<HTMLElement>('[data-spill-progress]')!;
  const footer = document.querySelector<HTMLElement>('.site-footer');

  const sections = [...page.querySelectorAll<HTMLElement>(':scope > section.section[id]')].map((el) => ({
    el,
    name: el.querySelector('.section-label')?.textContent?.trim() ?? el.id,
    color: el.style.getPropertyValue('--sc'),
    entries: el.querySelectorAll('[data-entry]').length,
  }));
  if (!sections.length) return;

  const link = (href: string, name: string, count?: number) => {
    const a = document.createElement('a');
    a.href = `#${href}`;
    a.dataset.spillTarget = href;
    const label = document.createElement('span');
    label.textContent = name;
    a.append(label);
    if (count && count > 1) {
      const n = document.createElement('span');
      n.className = 'spill-count';
      n.textContent = String(count);
      a.append(n);
    }
    return a;
  };
  for (const s of sections) {
    const li = document.createElement('li');
    li.style.setProperty('--sc', s.color);
    li.append(link(s.el.id, s.name, s.entries));
    list.append(li);
  }
  const links = [...list.querySelectorAll<HTMLAnchorElement>('[data-spill-target]')];

  const isOpen = () => button.getAttribute('aria-expanded') === 'true';
  const toggle = (open: boolean, refocus = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (!open && refocus) button.focus();
  };
  button.addEventListener('click', () => toggle(!isOpen()));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) toggle(false, true);
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !root.contains(e.target as Node)) toggle(false);
  });
  list.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) toggle(false);
  });

  let shown: string | null = null;
  const update = () => {
    const y = HEADER + (innerHeight - HEADER) * READ_AT;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const place = locate(
      sections.map((s) => ({ id: s.el.id, top: s.el.getBoundingClientRect().top })),
      y,
      atEnd,
    );
    root.style.setProperty('--lift', `${Math.max(0, innerHeight - (footer?.getBoundingClientRect().top ?? innerHeight))}px`);
    progress.style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
    if (place === shown) return;
    shown = place;
    root.toggleAttribute('data-on', !!place);
    if (!place) return toggle(false);
    const s = sections.find((x) => x.el.id === place)!;
    root.style.setProperty('--sc', s.color);
    sectionName.textContent = s.name;
    button.setAttribute('aria-label', `On this page: ${s.name}`);
    for (const a of links) a.toggleAttribute('data-current', a.dataset.spillTarget === place);
  };

  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), update()));
  };
  addEventListener('scroll', schedule, { passive: true });
  // The page also moves without scrolling: "Show more" in projects, images loading.
  new ResizeObserver(schedule).observe(page);
  root.hidden = false;
  update();
}
