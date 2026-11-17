import { animate, stagger, type DOMKeyframesDefinition } from 'motion';

/** How many rows of cards each state shows, before the "Show more" button reveals more. */
export interface RevealConfig {
  /** Full rows shown at first. */
  rows: number;
  /** Rows each "Show more" adds. */
  step: number;
}

export interface RevealPlan {
  /** Cards shown whole. */
  visible: number;
  /** Cards after them shown as a faded, inert preview of the next row. */
  peek: number;
  /** Cards still hidden after the preview. */
  remaining: number;
  /** The button: more to show, everything shown (offer to collapse), or nothing to toggle. */
  action: 'more' | 'less' | 'none';
}

/** `shownRows` is the full rows currently open; it never goes below `config.rows`. */
export function plan(total: number, columns: number, config: RevealConfig, shownRows = config.rows): RevealPlan {
  const cols = Math.max(1, columns);
  const visible = Math.min(total, Math.max(config.rows, shownRows) * cols);
  const peek = Math.min(total - visible, cols);
  const remaining = total - visible;
  const action = remaining > 0 ? 'more' : total > config.rows * cols ? 'less' : 'none';
  return { visible, peek, remaining, action };
}

/** Rows to open so the card at `index` is shown whole. */
export const rowsFor = (index: number, columns: number, config: RevealConfig) =>
  Math.max(config.rows, Math.floor(index / Math.max(1, columns)) + 1);

/** Wires the "Show more" button under a projects grid; on phones the grid is a carousel and this stays idle. */
export function initReveal(grid: HTMLElement) {
  const section = grid.closest('section')!;
  const more = section.querySelector<HTMLElement>('[data-reveal-more]')!;
  const button = section.querySelector<HTMLButtonElement>('[data-reveal-button]')!;
  const status = section.querySelector<HTMLElement>('[data-reveal-status]')!;
  const config = JSON.parse(grid.dataset.reveal!) as RevealConfig;
  const phone = matchMedia('(max-width: 680px)');
  let rows = config.rows;

  // Cards the domain filter keeps, in order; the filter itself hides the rest with CSS.
  const shown = () => {
    const domain = section.querySelector<HTMLInputElement>('input[name="project-domain"]:checked')?.value ?? 'All';
    return [...grid.querySelectorAll<HTMLElement>('.card')].filter((c) => domain === 'All' || c.dataset.domains!.split(' ').includes(domain));
  };
  const columns = () => getComputedStyle(grid).gridTemplateColumns.split(' ').length;

  // Matches `.card[data-peek]`'s max-height, which is also the fade at the window's bottom.
  const PEEK = 96;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let running: { stop: () => void } | undefined;

  const render = (announce = false) => {
    running?.stop();
    running = undefined;
    grid.style.removeProperty('height');
    grid.style.removeProperty('--fade');
    const cards = shown();
    for (const c of grid.querySelectorAll<HTMLElement>('.card')) {
      c.hidden = false;
      c.removeAttribute('data-peek');
      c.inert = false;
      c.style.removeProperty('opacity');
      c.style.removeProperty('transform');
    }
    if (phone.matches) {
      grid.removeAttribute('data-fold');
      more.hidden = true;
      return;
    }
    const p = plan(cards.length, columns(), config, rows);
    cards.forEach((c, i) => {
      if (i < p.visible) return;
      if (i < p.visible + p.peek) {
        c.dataset.peek = '';
        c.inert = true;
      } else c.hidden = true;
    });
    grid.toggleAttribute('data-fold', p.peek > 0);
    more.hidden = p.action === 'none';
    button.textContent = p.action === 'more' ? `Show more (${p.remaining} left)` : 'Show less';
    if (announce) status.textContent = `Showing ${p.visible} of ${cards.length} projects`;
  };

  // Moves the window's bottom edge, and its fade, between two heights; resolves false if a render cut it short.
  const move = async (
    from: number,
    to: number,
    fade: [number, number],
    cards: HTMLElement[],
    keyframes: DOMKeyframesDefinition,
    follow?: () => void,
  ) => {
    const duration = still.matches ? 0 : 0.25;
    grid.setAttribute('data-fold', '');
    const edge = animate(0, 1, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (t) => {
        const height = from + (to - from) * t;
        grid.style.height = `${height}px`;
        grid.style.setProperty('--fade', `${fade[0] + (fade[1] - fade[0]) * t}px`);
        follow?.();
      },
    });
    const order = keyframes.y ? 'first' : 'last';
    const each = cards.length ? animate(cards, keyframes, { duration, delay: still.matches ? 0 : stagger(0.04, { from: order }) }) : undefined;
    const self = { stop: () => (edge.stop(), each?.stop()) };
    running = self;
    await Promise.all([edge, each]);
    return running === self;
  };

  button.addEventListener('click', async () => {
    if (running) return;
    const cards = shown();
    const p = plan(cards.length, columns(), config, rows);
    if (p.action === 'more') {
      const from = grid.offsetHeight;
      const folded = cards.filter((c) => c.hidden);
      rows += config.step;
      render(true);
      const fade: [number, number] = [PEEK, grid.hasAttribute('data-fold') ? PEEK : 0];
      grid.setAttribute('data-fold', '');
      const to = grid.offsetHeight;
      // The peeking row is uncovered by the moving edge; rows that were not on screen at all rise into place.
      if (await move(from, to, fade, folded.filter((c) => !c.hidden), { opacity: [0, 1], y: [8, 0] })) render();
    } else {
      const after = plan(cards.length, columns(), config, config.rows);
      grid.setAttribute('data-fold', '');
      const from = grid.offsetHeight;
      const to = cards[after.visible].getBoundingClientRect().top - grid.getBoundingClientRect().top + PEEK;
      // Keep the button where it is on screen, so the page shrinks above it instead of under the reader.
      const top = button.getBoundingClientRect().top;
      const follow = () => scrollBy({ top: button.getBoundingClientRect().top - top, behavior: 'instant' });
      if (!(await move(from, to, [0, PEEK], cards.slice(after.visible + after.peek), { opacity: 0 }, follow))) return;
      rows = config.rows;
      render(true);
      follow();
    }
  });

  // The filter, a resize that changes the column count and the phone breakpoint all start over from the first rows.
  section.querySelectorAll('input[name="project-domain"]').forEach((r) =>
    r.addEventListener('change', () => {
      rows = config.rows;
      render();
    }),
  );
  let cols = columns();
  new ResizeObserver(() => {
    if (columns() === cols) return;
    cols = columns();
    render();
  }).observe(grid);
  phone.addEventListener('change', () => render());

  // A link to a card further down, such as "← Projects" from its page, opens enough rows to show it.
  const reveal = () => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const index = target ? shown().indexOf(target) : -1;
    if (!target || index < 0 || phone.matches) return;
    rows = Math.max(rows, rowsFor(index, columns(), config));
    render();
    target.scrollIntoView();
  };
  addEventListener('hashchange', reveal);
  render();
  reveal();
}
