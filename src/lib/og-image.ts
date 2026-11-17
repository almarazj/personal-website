import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

export const OG_SIZE = { width: 1200, height: 630 };

export interface OgCard {
  name: string;
  role: string;
  location: string;
  host: string;
}

// Dark tokens from docs/design.md: the card stands out in both light and dark feeds.
const C = {
  bg: '#141518',
  fg: '#e9ebee',
  muted: '#9ba2ac',
  faint: '#6e757f',
  line: '#2a2d32',
  accent: '#fb8a4c',
  sections: ['#86a8ff', '#7cc79a', '#fb8a4c', '#f07aae'],
};

const require = createRequire(import.meta.url);
const font = (pkg: string, weight: 400 | 500 | 600) =>
  readFile(require.resolve(`@fontsource/ibm-plex-${pkg}/files/ibm-plex-${pkg}-latin-${weight}-normal.woff`));

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const div = (style: Record<string, unknown>, children?: unknown): Node => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

/** The Open Graph card: a 1200x630 PNG with the profile's name, role and location. */
export async function renderOgImage({ name, role, location, host }: OgCard): Promise<Buffer> {
  const [sans, sansMedium, serif, mono] = await Promise.all([font('sans', 400), font('sans', 500), font('serif', 600), font('mono', 400)]);
  const card = div(
    { ...OG_SIZE, boxSizing: 'border-box', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: C.bg, color: C.fg, fontFamily: 'Plex Sans' },
    [
      div({ fontFamily: 'Plex Mono', fontSize: 28, color: C.accent }, host),
      div({ flexDirection: 'column' }, [
        div({ fontFamily: 'Plex Serif', fontSize: 92, lineHeight: 1.1 }, name),
        div({ marginTop: 20, fontSize: 40, fontWeight: 500, color: C.muted }, role),
      ]),
      div({ alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: `1px solid ${C.line}` }, [
        div({ fontFamily: 'Plex Mono', fontSize: 26, color: C.faint }, location),
        div({ gap: 12 }, C.sections.map((background) => div({ width: 40, height: 8, borderRadius: 999, background }))),
      ]),
    ],
  );
  const svg = await satori(card as Parameters<typeof satori>[0], {
    ...OG_SIZE,
    fonts: [
      { name: 'Plex Sans', data: sans, weight: 400 },
      { name: 'Plex Sans', data: sansMedium, weight: 500 },
      { name: 'Plex Serif', data: serif, weight: 600 },
      { name: 'Plex Mono', data: mono, weight: 400 },
    ],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
