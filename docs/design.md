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
- Personal data comes from `content/`, never from code: even the terminal's login and the letters it draws derive from the profile name.
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

### Graphite and tty (terminal surfaces)

Identical in both modes: `--g-acc` (prompt, keys), `--g-ok` (prompt user), `--g-info` (directories), and the `--tty-*` screen colors.
The hero window's glass (`--tty-glass`, `--tty-edge`, `--tty-shadow`) changes with the mode.

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

## Components

### Header

Sticky at the top of every page: the name, linking home, on the left, and the mode toggle on the right, both on the page frame's edges.
The toggle is a bare icon with no box that names what a click switches to: a moon in light mode, a sun in dark mode.
Its bar is light glass: the page background at 72% over a 14px blur, reaching the viewport edges; solid under `prefers-reduced-transparency`.

### Hero

One terminal window 800px wide and centered (474px tall with its 34px header bar; on phones `min(634px, 85svh)`), with a visually hidden h1 carrying the name.
It is a Linux window: a header bar titled `<login>@ubuntu: ~` with minimize, maximize and close buttons, over translucent dark glass (blur 22px) on the plain page background; solid under `prefers-reduced-transparency`.
The login is the profile's first name, lowercase and without accents.

It opens straight on `neofetch`: the profile's initials spinning in 3D ASCII on the left and, on the right, Role, Uptime (years since `careerStart`), Based (with the visitor-side local time in the profile's `timeZone`), Languages and Links, then the color swatches and "type help to look around".
The build renders the same screen without the clock, so it reads as finished before JS runs.
Rows for experience, education and projects join as those sections arrive.

The prompt is a small bash-like shell over the site content:
- Files: `about.md` and `.bashrc` for now; each section adds its own directory.
- Commands: `help`, `ls`, `cd`, `cat`, `open` (profile links by name), `neofetch`, `git log` and `git status` (the commit the page was built from), `history`, `clear`, `exit`, plus `pwd`, `whoami`, `date`, `echo`, `man`, `which` and `head`, `tail`, `grep`, `wc`, `sort` behind pipes.
- Line editing: block cursor, grey suggestion from history then common commands (accept with → or End, or a tap), Tab completion with a menu that Tab cycles, ↑ ↓ filtered by what was typed, Ctrl+C, Ctrl+L, Ctrl+A, Ctrl+E, Ctrl+U, Ctrl+K; history persists in `localStorage["terminal-history"]`.
- The art spins only while on screen and the tab is visible, and holds still under `prefers-reduced-motion`.
- Tab on an empty prompt moves focus on, so the terminal never traps the keyboard; a swipe on it scrolls the page.

### Footer

One row on the page frame, below a 1px `--line` rule and 72px after the content: "© year name" and the profile links, separated by middle dots, on the left.
On the right, the commit the page was built from as a mono stamp linking to it on GitHub, then "↑ back to top".
On phones the row wraps and the stamp goes under the links.

## Interaction rules

- Every interactive element has a visible focus ring: 2px `--accent`, offset 2px.
- Hover-only behavior always has a keyboard and touch equivalent.
- Copy buttons fall back to "select it" when the clipboard is refused.

## Writing on the site

- Plain, direct English; sentence case for headings and buttons.
- Name things by what visitors recognize ("Resume", not "CV PDF asset").
- No skill bars, no logo walls, no "passionate about" copy.
