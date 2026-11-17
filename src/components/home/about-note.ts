/** Where the `n`th character falls among consecutive text runs of the given lengths: the run index and the offset inside it. */
export function pointAt(lengths: number[], n: number): { run: number; offset: number } {
  let left = Math.max(0, n);
  for (const [run, length] of lengths.entries()) {
    if (left <= length) return { run, offset: left };
    left -= length;
  }
  return { run: lengths.length - 1, offset: lengths.at(-1) ?? 0 };
}

const clamp = (x: number) => Math.min(1, Math.max(0, x));

// Matches the stage's sticky top in About.astro: 16px under the 56px header.
const STICK = 72;

/**
 * Writes the note as the reader scrolls: the unwritten tail is painted transparent with a CSS highlight, so the text
 * stays whole in the DOM for screen readers, search and copy. On wide screens the section is pinned over a scroll
 * track and the track's progress writes it; on phones it writes while the note crosses the screen.
 */
export function initAboutNote(note: HTMLElement, track: HTMLElement, stage: HTMLElement) {
  if (!('highlights' in CSS)) return;
  const walker = document.createTreeWalker(note, NodeFilter.SHOW_TEXT, {
    acceptNode: (t) => (t.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  if (!texts.length) return;
  const lengths = texts.map((t) => t.length);
  const total = lengths.reduce((a, b) => a + b, 0);

  // Links, the struck words and the signature draw their lines once their last character is written.
  const marks = [...note.querySelectorAll<HTMLElement>('a, del, [data-sign]')].map((el) => {
    const last = texts.findLastIndex((t) => el.contains(t));
    return { el, end: lengths.slice(0, last + 1).reduce((a, b) => a + b, 0) };
  });

  const highlight = new Highlight();
  CSS.highlights.set('unwritten', highlight);
  const pinned = matchMedia('(min-width: 680px) and (prefers-reduced-motion: no-preference)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const progress = () => {
    if (reduced.matches) return 1;
    if (pinned.matches) return clamp((STICK - track.getBoundingClientRect().top) / Math.max(1, track.offsetHeight - stage.offsetHeight));
    return clamp((innerHeight * 0.88 - note.getBoundingClientRect().top) / (innerHeight * 0.6));
  };

  let written = -1;
  const update = () => {
    const n = Math.round(progress() * total);
    if (n === written) return;
    written = n;
    note.dataset.written = String(n);
    highlight.clear();
    if (n < total) {
      const { run, offset } = pointAt(lengths, n);
      const range = new Range();
      range.setStart(texts[run], offset);
      range.setEnd(texts.at(-1)!, texts.at(-1)!.length);
      highlight.add(range);
    }
    for (const m of marks) m.el.toggleAttribute('data-written', n >= m.end);
  };

  note.dataset.total = String(total);
  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), update()));
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  pinned.addEventListener('change', schedule);
  reduced.addEventListener('change', schedule);
  update();
}
