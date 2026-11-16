# Design guide

The site is a reading-first portfolio for a backend engineer.
Every visual decision serves easy reading first.
Each component section below is added in the same pull request that brings the component.

## Principles

- Reading comes first: one column of text, generous line height, no decoration that competes with content.
- Each content type looks different at a glance: its own color, icon and component.
- The page follows the system's light or dark scheme until the reader picks one with the header toggle; that pick is stored and wins from then on.
- Motion is small (250 ms or less) and always disabled under `prefers-reduced-motion`.
- English only, with `lang="en"` so browsers offer translation.
- Interactive pieces are islands loaded with `client:visible`; everything else ships zero JS.

## Color

All colors are CSS custom properties in `src/styles/tokens.css`; dark values apply under `:root[data-mode="dark"]`.
The stored pick lives in `localStorage` under `mode`; an inline script in `Base.astro` applies it, or the system scheme, before the first paint.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#fbfbfa` | `#141518` | Page background |
| `--fg` | `#17191c` | `#e9ebee` | Primary text |
| `--muted` | `#5f6670` | `#9ba2ac` | Secondary text |
| `--faint` | `#8a9099` | `#6e757f` | Meta, dates, hints |
| `--line` | `#e2e4e7` | `#2a2d32` | Borders, dividers |
| `--soft` | `#f1f2f3` | `#1d1f23` | Chip and pill fills, subtle panels |
| `--accent` | `#c2410c` | `#fb8a4c` | Links, focus ring |

## Typography

IBM Plex, loaded from Google Fonts with system fallbacks (`--font-sans`, `--font-serif`, `--font-mono`).

| Role | Face | Size / line height |
|---|---|---|
| UI and body | IBM Plex Sans 400/500/600 | 16px / 1.6 |
| Item titles | IBM Plex Serif 600 | 16 to 19px / 1.3 |
| Section labels | IBM Plex Mono 600, uppercase, letter-spacing 0.1em | 15px |
| Dates, meta, data | IBM Plex Mono 400/500 | 12 to 12.5px |
| Code | IBM Plex Mono | 13.5px / 1.65 |

Use `font-variant-numeric: tabular-nums` wherever digits line up.

## Shape and spacing

- Spacing steps: 4, 8, 12, 16, 24, 32, 44, 72 px; sections are separated by 72px.
- Radius: 6px for controls, 8px for cards, 10 to 12px for panels and popovers, 999px for pills.
- Borders are 1px `--line`; cards get a border, never a shadow, except floating layers.
- Page gutter is at least 16px, written with `max(16px, env(safe-area-inset-*))`.
- Header, page and footer share one 1040px frame (`.page`), centered in the viewport; their edges line up.
- Breakpoints: 680px (phone), 960px (side index hides).

## Interaction rules

- Every interactive element has a visible focus ring: 2px `--accent`, offset 2px.
- Hover-only behavior always has a keyboard and touch equivalent.
- Copy buttons fall back to "select it" when the clipboard is refused.

## Writing on the site

- Plain, direct English; sentence case for headings and buttons.
- Name things by what visitors recognize ("Resume", not "CV PDF asset").
- No skill bars, no logo walls, no "passionate about" copy.
