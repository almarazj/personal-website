# Design guide

The site is a reading-first portfolio for a backend engineer.
Every visual decision serves easy reading first.
Each component section below is added in the same pull request that brings the component.

## Principles

- Reading comes first: one column of text, generous line height, no decoration that competes with content.
- Each content type looks different at a glance: its own color, icon and component.
- The page follows the system's light or dark scheme until the reader picks one with the header toggle; that pick is stored and wins from then on.
- Motion is small (250 ms or less) and always disabled under `prefers-reduced-motion`.
- Animations that CSS alone cannot coordinate (layout, scroll and staggered elements together) use `motion` (motion.dev), never a hand-rolled loop.
- Scrolling to an anchor, from a link, the palette or a shortcut, is smooth (it jumps under reduced motion) and stops 72px from the top so the sticky header never covers the target.
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

### Section colors

Every section, and everything that points at it, uses the same hue through `--sc`.

| Section | Light | Dark |
|---|---|---|
| Experience | `#2457c5` | `#86a8ff` |
| Education | `#2f7a4f` | `#7cc79a` |
| Projects | `#c2410c` | `#fb8a4c` |
| About | `#b4366f` | `#f07aae` |

`--ok` (`#1f8a4c` / `#4cc985`) marks live projects.

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

- Spacing steps: 4, 8, 12, 16, 24, 32, 44, 72 px; sections are separated by 72px (`--section-gap`).
- A section (`.section`) starts with that space and its label (`.section-label`, mono uppercase in the section color) alone, with no rule under it; hairlines only divide entries inside a section.
- Radius: 6px for controls, 8px for cards, 10 to 12px for panels and popovers, 999px for pills.
- Borders are 1px `--line`; cards get a border, never a shadow, except floating layers.
- Page gutter is at least 16px, written with `max(16px, env(safe-area-inset-*))`.
- Header, page and footer share one 1040px frame (`.page`), centered in the viewport; their edges line up.
- Breakpoints: 680px (phone), 960px (side index hides).

## Components

### Header

Sticky at the top of every page: the name, linking home, on the left, and the mode toggle on the right, both on the page frame's edges.
Once the hero has scrolled under it, it gains a 1px `--line` bottom border.
The toggle is a bare icon with no box that names what a click switches to: a moon in light mode, a sun in dark mode.
Its bar is light glass: the page background at 72% over a 14px blur, reaching the viewport edges; solid under `prefers-reduced-transparency`.

### Hero

One terminal window 800px wide and centered (474px tall with its 34px header bar; on phones `min(634px, 85svh)`), with a visually hidden h1 carrying the name.
It is a Linux window: a header bar titled `<login>@ubuntu: ~` with minimize, maximize and close buttons, over translucent dark glass (blur 22px) on the plain page background; solid under `prefers-reduced-transparency`.
The login is the profile's first name, lowercase and without accents.

It opens straight on `neofetch`: the profile's initials spinning in 3D ASCII on the left and, on the right, Role, Uptime (years since `careerStart`), Stack, Based (with the visitor-side local time in the profile's `timeZone`), Education, Languages, Links and Packages, then the color swatches and "type help to look around".
The build renders the same screen without the clock, so it reads as finished before JS runs.
Stack comes from the current roles, Education from the latest degree and Packages counts the projects.

The prompt is a small bash-like shell over the site content:
- Files: `about.md`, `.bashrc`, `experience/`, `education/` and `projects/`; each section adds its own directory.
- Commands: `help`, `ls`, `cd`, `cat`, `open` (profile links by name), `neofetch`, `git log` and `git status` (the commit the page was built from), `history`, `clear`, `exit`, plus `pwd`, `whoami`, `date`, `echo`, `man`, `which` and `head`, `tail`, `grep`, `wc`, `sort` behind pipes.
- Line editing: block cursor, grey suggestion from history then common commands (accept with → or End, or a tap), Tab completion with a menu that Tab cycles, ↑ ↓ filtered by what was typed, Ctrl+C, Ctrl+L, Ctrl+A, Ctrl+E, Ctrl+U, Ctrl+K; history persists in `localStorage["terminal-history"]`.
- The art spins only while on screen and the tab is visible, and holds still under `prefers-reduced-motion`.
- Tab on an empty prompt moves focus on, so the terminal never traps the keyboard; a swipe on it scrolls the page.

### Experience

Titled "Work experience"; one Markdown file per role in `content/experience/`, whose body is the summary paragraph and then the highlights as a list.
One entry per role, without a frame, separated by hairlines: a 48px logo with a 1px `--line` border (the organization's monogram on a soft tile when there is none), the role in Plex Serif with the period on the same line, the organization (linked when it has a URL), place and mode, then tenure in years and the employment type in mono, the summary, highlights as square bullets in the section color, and the stack as chips.
Current roles come first, longest-running first, then past roles by most recent end; there is no manual order.
The terminal lists each role under `experience/`, and neofetch's Stack row is the current roles' stacks.

### Education

Each degree, one Markdown file in `content/education/` whose body is its summary, is laid out like a work experience entry (shared `Entry` component): logo or monogram, the title in Plex Serif with the years (no months) on the same line, the school linked to its site with the place, the summary, and the thesis under a mono "Thesis" label.
Below it, "Papers" from `content/publications.yaml`: each title (in its own language) links to the PDF kept in `content/papers/`, over a mono line with the language when it is not English, venue and year, the coauthors, and links to the project page and the proceedings.
The project page of a paper lists it as a "Paper" pill before its other links.
Then "Certs" from `content/certificates.yaml`: certificates inline, separated by middle dots, issuer in mono, newest first and then by name; a certificate with a `url` links to it.
The "Papers" and "Certs" labels sit in the entry's 48px logo column so every row shares one left edge.
The terminal lists each degree, `papers.txt` and `certificates.txt` under `education/`, and neofetch's Education row is the latest degree's title.

### Projects

One file per project in `content/projects/`: frontmatter for the card and an `order` for its place on the home (lowest first), and the body for its page.
One grid of cover cards, as many to a row as fit at 230px minimum (four at full width, one on phones).
Each card: a 16:9 cover (the project's `cover`, else a line drawing for its first domain in the projects color), then the year on the left and, on the right, a 6px green live dot (`.live-dot`) that sends out a 4px ripple lasting 0.5s (fast start, long fade: `cubic-bezier(0.16, 1, 0.3, 1)`), then rests 1s (only for live projects; a "Live in production" tooltip on hover and keyboard focus; still under reduced motion) and the context badge (Work, Client, Personal, Academic); the title in Plex Serif linking to `/projects/<id>`, the domains in mono with "confidential" when it applies, a 3-line summary, and up to three stack chips plus "+n".
Above the grid, a domain filter of `.tag` choices with counts, "All" first and only domains that have projects; it is radios and CSS `:has()`, so it works without JavaScript.
On wide screens the grid shows one full row, and the next row peeks out 96px tall, faded and inert, to show there is more; "Show more (n left)" opens one more row per click and becomes "Show less" once everything is open.
The grid is a window whose bottom 96px fade out; opening and folding move that edge over 250ms (`cubic-bezier(0.16, 1, 0.3, 1)`), so the peeking row is uncovered in place, never squeezed.
On "Show more", rows that were not on screen at all rise 8px and fade in, 40ms apart; once nothing is left below, the fade shrinks away with the edge.
On "Show less", the cards that fold away fade out, last first, while the edge rises and the fade grows back over the new peeking row; the page scrolls with it so the button stays where it was on screen, and the reader does not lose their place.
Under reduced motion both are instant.
The rows shown at first and per click are set in `REVEAL` at the top of `Projects.astro`; the filter, a column count change and the phone breakpoint start over from the first rows, and a link to a folded card (like "← Projects") opens enough rows to show it.
On phones the cards sit in one row that slides sideways with scroll snapping, each 82% wide so the next one shows at the edge, and there is no button.
Without JavaScript every project is shown.
Confidential work never uses a screenshot as its cover; a diagram is fine.
Diagrams are SVG exported from Excalidraw, kept next to their `.excalidraw` source in `content/projects/diagrams/` and served as is; screenshots are raster, converted to WebP and never shown wider than their natural size.

### Project page

`/projects/<id>`: "← Projects" back to the card on the home, then a mono meta line in the projects color (year, a green "Live" dot when live, the context badge, the domains), the title, the summary, and the cover shown whole instead of cropped.
The page spans the content column like the home; only the summary and the body keep the 68ch reading measure, left-aligned.
The cover sits centered in a bordered box across the column, shown whole and never taller than 560px, in a `<figure>` with an optional caption (`coverCaption`) under it in mono, `--muted`, as wide as the image box: the alt text says what the image shows, the caption what it means, and neither repeats the other.
The body is the file's Markdown in the prose styles (Plex Serif 18px, 68ch measure), with the projects color for links.
An image alone in its paragraph with a title, `![What it shows](./images/x.png "What it means")`, becomes a figure across the 68ch measure with the title as a mono `--muted` caption, like the cover's; images live in the project's `images/` folder and are converted to WebP at build time.
Below it: a "Confidential client work" note when it applies, the stack chips and link pills, then previous and next project cards in the home's order.
The terminal lists each project under `projects/`, `open` goes to its page, and neofetch's Packages row counts them.

### About

From `content/about.md`: the body is the bio, a 68ch paragraph; the frontmatter lists the photos and the quick questions.
Left of the bio (above it on phones), the photos as a stack of polaroids 400px wide (narrower on small phones), the first on top: drag the top one away (over 90px) to send it to the back, or tap it, press Enter or the arrow keys, or use "Next photo"; a counter shows "1 / n" and screen readers hear each new photo's caption and alt text.
Photos are square, in `content/about/`, with any camera metadata (GPS) stripped before they are committed; the caption is two to four words and the alt text describes the place.
Below it, "Quick questions" as rows separated by hairlines: the question in mono on the left (200px), the answer in Plex Serif 19px with a 20px stroke icon in its color, and a muted detail line with an optional link.
The icon is one of a fixed set (book, book-open, film, music, flag, ball), checked by the schema.
The terminal's `about.md` carries the bio and opens the section.

### Command palette

Opens with `/` (the hint shown in the header field), `⌘K` or `Ctrl+K`, or the header's "Search or jump to..." field, centered between the name and the mode toggle (an icon button on phones).
Desktop: a centered modal, results grouped (Sections, Experience, Projects, Education, About, Links, Actions) with a dot in the section color, each result showing its direct shortcut, and a cheat sheet at the bottom.
Phone: a bottom sheet with group filter chips and tall rows.
The index is `/search-index.json`, built from `content/` at build time and fetched on first open; only site paths, PDFs, https links and two actions are ever followed.
Shortcuts, ignored while typing in a field: `g e` experience, `g d` education, `g p` projects, `g a` about, `j`/`k` next and previous section, `t` theme, `g g` top.

### Footer

Two rows on the page frame, below a 1px `--line` rule and 72px after the content.
Row 1: "© year name" and the profile links, separated by middle dots, on the left; on the right, the commit the page was built from as a mono stamp linking to it on GitHub.
Row 2, in mono `--faint`: the keyboard shortcuts on the left (hidden on touch screens) and "↑ back to top" on the right.
On phones each row wraps.
## Interaction rules

- Every interactive element has a visible focus ring: 2px `--accent`, offset 2px.
- Hover-only behavior always has a keyboard and touch equivalent.
- External links and PDFs open in a new tab (`external()` in `src/lib/links.ts`, and a Markdown plugin for links in content), and screen readers hear "(opens in a new tab)" after the link text from a CSS rule, never shown; internal links stay in the tab.
- Copy buttons fall back to "select it" when the clipboard is refused.

## Writing on the site

- Plain, direct English; sentence case for headings and buttons.
- Name things by what visitors recognize ("Resume", not "CV PDF asset").
- No skill bars, no logo walls, no "passionate about" copy.
