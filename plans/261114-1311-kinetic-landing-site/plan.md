---
title: "Kinetic-type landing site with a full profile"
description: "Replace the public web CV with a Svelte 5 kinetic-type landing site; keep the PDF CV pipeline."
status: pending
priority: P1
branch: feature/cv-rewrite-with-codex
tags: [frontend, design, motion]
created: 2026-11-14
---

# Kinetic landing site: design spec

## Outcome and boundaries

- Public site at `tiennm99.github.io/cv` becomes a kinetic-type landing site built from `site/`. The old HTML CV
  page leaves `dist/`; `dist/miti99.pdf` stays, built by the untouched Chromium pipeline (`scripts/build.mjs`,
  `src/*.mjs`, `styles/cv.css`).
- Style source: `temp/landing-concepts/kinetic-type/index.html` (read-only reference). Content sources:
  `miti99.yml` (never edited), `plans/261114-1228-landing-site/content-brief.md`, live GitHub REST and
  `https://miti99.com/index.xml`. No invented metrics, employers, awards, availability or quotes. The phone
  number never reaches the bundle.
- Critic fixes carried in: no muddy melt (new hero effect below); no stats row under the name; no per-frame
  `getBoundingClientRect`; every section has its own heading treatment, layout, motion and interaction; live
  GitHub numbers framed as public side projects, after the game-backend story; all small text passes WCAG AA.
- Non-goals: PDF engine change, blog content, i18n, sound, analytics, a backend. Decided: total stars count
  archived repos; the site email is the yml address.

## Design tokens (`site/src/app.css`, Tailwind v4 `@theme`)

Colour (OKLCH, mirrored in `site/src/lib/tokens.js` for the WebGL uniforms and the contrast test):

| Token | Paper (default) | Invert | Use |
| --- | --- | --- | --- |
| `--paper` | `oklch(0.965 0.01 95)` | `oklch(0.13 0.01 270)` | page background |
| `--paper-2` | `oklch(0.93 0.012 95)` | `oklch(0.19 0.012 270)` | panels, cards, terminal |
| `--ink` | `oklch(0.17 0.012 270)` | `oklch(0.97 0.01 95)` | text, display type |
| `--ink-2` | `oklch(0.40 0.012 270)` | `oklch(0.78 0.01 95)` | secondary text, mono labels (min 12px) |
| `--line` | ink at 14% alpha | ink at 18% alpha | hairlines, 12-col grid |
| `--accent` | `oklch(0.63 0.235 31)` | `oklch(0.70 0.20 33)` | vermilion: fills, dots, text >= 24px only |
| `--accent-text` | `oklch(0.50 0.20 31)` | `oklch(0.76 0.17 35)` | vermilion text under 24px, focus ring |
| `--accent-ink` | `oklch(0.99 0.005 95)` | `oklch(0.13 0.01 270)` | text on accent fills |

Rules: one accent, no gradients except the halftone; mono labels use `--ink-2` or `--ink`, never `--accent`
below 24px; a Vitest test converts the tokens to sRGB and asserts >= 4.5:1 for every text pair (3:1 for >= 24px
and UI borders). `forced-colors: active` drops the canvas and custom cursor. Theme: `data-theme="light|invert"`
on `<html>`; default follows `prefers-color-scheme`; choice in `localStorage` (try/catch).

Type (Fontsource, self-hosted, latin + latin-ext + vietnamese subsets): `@fontsource-variable/anybody` (the
stylesheet carrying the `wdth` axis, 50-150), `@fontsource-variable/instrument-sans`,
`@fontsource-variable/jetbrains-mono`. Scale: `--t-hero clamp(3.5rem, min(24vw, 26svh), 18rem)` (name, CTA);
`--t-mega clamp(4rem, 2rem + 12vw, 14rem)` (year, flaps); `--t-sec clamp(2.6rem, 1rem + 6vw, 7rem)`; `--t-xl
clamp(1.6rem, 1.2rem + 1.6vw, 2.6rem)`; `--t-lg clamp(1.15rem, 1rem + .5vw, 1.45rem)`; `--t-md 1rem`; `--t-sm
.875rem`; `--t-xs .75rem` (mono micro-labels, uppercase, +0.04em tracking).

Display axes: rest `wght 820, wdth 68`; peak `wght 200, wdth 138`; display line-height 0.82. Spacing: 4px base
`--s-1..--s-10` = 4 8 12 16 24 32 48 64 96 144; `--gutter: clamp(16px,3vw,40px)`; 12-column grid with hairline
columns, max content width 1680px; section padding `--s-9`/`--s-10`. Motion: `--ease-out:
cubic-bezier(.16,1,.3,1)` (reveals), `--ease-io: cubic-bezier(.65,0,.35,1)` (scrubs, theme), `--ease-snap:
cubic-bezier(.3,1.4,.5,1)` (flaps, chips); durations `--d-fast 180ms`, `--d-med 320ms`, `--d-slow 700ms`,
stagger 0.03s per char / 0.08s per line. GSAP eases mirror these (`expo.out`, `power3.inOut`, `back.out(1.4)`).

## Global shell

- **Nav bar** (fixed, 56px, hairline bottom): `miti99` monogram (scroll to top) left; centre a section ruler `01
  ... 10` whose active index and fill come from a CSS `scroll()` timeline (IntersectionObserver fallback);
  right: live-data chip, `⌘K` button, theme toggle. Under 768px the ruler collapses to `03/10`, and the `⌘K`
  button reads "Menu" (the palette is the mobile menu). Skip link to `#main` first in tab order.
- **Command palette**: native `<dialog>`, `role=combobox` + `listbox`, fuzzy match (unit tested), groups Jump to
  (10 sections) / Do (download CV, copy email, toggle theme, toggle motion, refresh live data) / Open (GitHub
  x2, blog, LinkedIn, link-in-bio, each featured project). Cmd/Ctrl+K and `/` open it; arrows, Enter, Esc.
  Command list lives in `lib/commands.js`.
- **Cursor**: only on `(hover: hover) and (pointer: fine)` with motion on. 10px ink dot plus a ring driven by
  `gsap.quickTo`, `mix-blend-mode: difference`; states `link` (ring grows), `view` (label "Open", projects),
  `drag` (label "Drag", experience track), `type` (I-beam, terminal). Native cursor stays visible on form fields
  and the palette.
- **Theme invert**: `document.startViewTransition` with a circular `clip-path` reveal from the toggle; instant
  under reduced motion. The WebGL uniforms read the new tokens on change.
- **Motion runtime** (`lib/motion/runtime.js`): register ScrollTrigger, SplitText, Flip, ScrambleText once;
  Lenis 1.3 created in `App.svelte` `$effect`, `lenis.raf` on `gsap.ticker`, `lenis.on('scroll',
  ScrollTrigger.update)`, `lagSmoothing(0)`. `gsap.matchMedia()` branches `motion` / `reduced`; every section
  builds its timelines inside a `gsap.context` reverted on destroy. User motion toggle (`localStorage`)
  overrides the media query. Reduced: no Lenis, no pins or scrubs, reveals become 200ms fades, canvas shows the
  CSS poster.
- **Live-data chip**: states `connecting`, `live · hh:mm`, `cached · as of hh:mm`, `offline` (numbers hidden),
  with `aria-live="polite"`. Click opens a popover (anchor-positioned, `popover` attribute) naming the source,
  refresh time and a Refresh button disabled while `X-RateLimit-Remaining < 4`.
- **Quality tier** (`lib/motion/quality.js`): `high | mid | low | off` from WebGL2 support, `devicePixelRatio`,
  `hardwareConcurrency`, first-60-frame FPS; drops a tier when FPS < 45.

## Sections

| # | id | Layout | Motion | Interaction |
| --- | --- | --- | --- | --- |
| 01 | hero | full-viewport stage, name over 12 cols | WebGL halftone + per-char axes | cursor/touch on name, scroll exit |
| 02 | now | asymmetric 5/7 split + full-bleed ticker | line-masked SplitText, marquee | hover/focus ticker items, live clock |
| 03 | experience | pinned horizontal track of 5 panels | scrub (ScrollTrigger pin) | drag, arrow keys, panel dots |
| 04 | craft | split: sticky terminal + flow diagram | typed log, SVG packet pulses | run commands by click or typing |
| 05 | projects | full-width index table | Flip on filter, hover-reveal card | filter chips, sort, cursor preview |
| 06 | stack | sticky stacked cards | scroll-driven scale/tilt (CSS) | chips open popovers with cross-links |
| 07 | timeline | sticky giant odometer year + entry column | digit roll per year (view timeline) | year rail buttons |
| 08 | writing | newspaper masthead + 3-column grid | ScrambleText titles, column rules draw | topic filter (if feed has categories) |
| 09 | github | split-flap departures board | flap flips on data arrival | refresh, per-language rows |
| 10 | contact | finale CTA over halftone reprise | name-style axes on CTA, magnetic button | download, copy email, links |

### 01 hero: "the magician"

Heading: the name itself (`<h1>`, three lines Tien / Nguyen / Minh., vermilion full stop). Under it the GitHub
bio as a `<q>` (live `bio` verbatim; fallback the brief's verbatim "A developer wants to be magician") and the
yml headline as subtitle. Meta row: "Nº 001 — Portfolio 2026", Ho Chi Minh City, local time (Asia/Saigon). No
stats here; a "Scroll" cue sits at the bottom edge, clear of the name. Avatar: small live circle
(`avatar_url&s=256`, fallback `https://github.com/tiennm99.png`) tucked into the first line's counter space.

Kinetic letters (`lib/motion/kinetic.js`): chars split once; rects measured on mount, `document.fonts.ready`,
`ResizeObserver` and `ScrollTrigger.refresh`, stored in page coordinates and offset by `scrollY` per frame (no
reads in the loop). The loop writes only `font-variation-settings`, runs on `gsap.ticker` only while the stage
is intersecting and either the pointer moved within 2s or the idle wave is on (stops after 6s idle). Each line
has a reserved box (`contain: layout`, fixed height = lines x line-height, max width checked at peak `wdth`) so
glyph growth never pushes neighbours. Touch: drag across the name drives the same field.

WebGL moment 1, "riso halftone ink" (replaces the liquid melt): one full-screen quad, three.js `WebGLRenderer`
(WebGL2, one fragment pass; WebGPU buys nothing here), loaded by dynamic `import()` after first paint.
- Plate A (vermilion, 15°) and plate B (ink, 45°, very sparse) halftone grids; cell size 8 CSS px (11 on `low`).
  Dot radius = domain-warped fBm drifting slowly + a pointer ink trail (ping-pong FBO at 1/8 resolution, decay
  0.96) + a soft halo around the name. Plate B sits 1-2px off register, shifting with pointer velocity.
- Name mask: glyph shapes drawn into a 2D canvas at half resolution from the cached layout, redrawn only on a
  dirty flag (resize, font load, theme). Dots knock out inside glyphs plus a 2px gutter, so text stays crisp DOM
  on top and contrast is untouched.
- Scroll exit (`uScroll` 0→1): cells grow and dots fall with slight gravity, draining into section 02's ticker
  band; the canvas fades out by 100%.
- Budget: DPR `min(dpr, 1.5)` (`1` on low), 30fps cap on low, idle frame every 100ms after 4s without input,
  paused off-screen and on `visibilitychange`. Colours come from `tokens.js`.
- Fallback (`off`, reduced motion, no WebGL2, forced colours): a CSS halftone (`radial-gradient` dot pattern,
  `mask` with an `@property` radius following the pointer; static under reduced motion).

### 02 now: "right now"

Heading: no display heading; a mono label "(02) Now" and a lead sentence set in `--t-xl` that reveals line by
line (SplitText `mask: 'lines'`). Left 5 cols: role, employer, city, live local time and the years-in-games
count computed from `2020-07`. Right 7 cols: "Recently pushed" list of the 5 latest public repos by `pushed_at`
(both accounts, non-fork, relative dates). Full-bleed ticker below: repo names and stack words, CSS-animated,
pauses on hover or focus; each item is a link whose description shows in an anchor-positioned popover. Fallback:
no live data → the list hides and the ticker uses the curated featured names.

### 03 experience: "keeping live games alive"

Heading: a vertical (rotated 90°) display line pinned at the left edge of the track. Track of 5 panels: (1)
ZingPlay summary, 2020-07 → present, entry-level to senior; (2) Chaos Age 2 as primary Java backend contributor
with its stack; (3) Burkozel, Show, Sky Garden with Play Store links; (4) engineering quality (packet handlers,
JUnit 5, Mockito, Docker, Gradle, GitLab CI); (5) AI-assisted development (internal Claude Code plugin and skill
marketplace). Motion: `pin` + horizontal `scrub`, a hairline progress rail with panel dots; panel titles widen
on arrival. Interaction: drag the track (cursor `drag`), arrow keys when focused, dot buttons jump. Each panel
is a focusable `article`; `focusin` scrolls it into view. Under 768px and reduced motion: vertical stack, no
pin.

### 04 craft: "production forensics and real-time systems"

Heading: typed at a terminal prompt (`$ whoami --craft`) instead of a display block. Left: sticky terminal panel
(`--paper-2`, mono, `role=log`). Tabs as commands: `threads`, `heap`, `gc`, `loadtest`, `tests`, `thesis`.
Running one types a short scripted log describing the method in the CV's words (thread dumps, heap analysis, GC
logs, load-testing tools that reproduce game-server workloads, JUnit 5 + Mockito, Survival2D anti-cheat and
behavior-tree AI). Log lines carry tool names and steps only, no numbers, and a caption says "the method,
illustrated". Visitors can type a command (input with completion) or click a chip. Right: an SVG flow, generic
and labelled "simplified": client → WebSocket/Netty → packet handler → gameplay module → Couchbase / Redis, with
events → Kafka; pulses travel the paths on scroll (stroke-dashoffset scrub) and the node matching the active
command highlights.

### 05 projects: "built after hours"

Heading: the index table's own header row (`No. / Project / Stack / ★ / Updated`) set in display type that
compresses (`wdth` 138 → 68) as the table enters. Rows: the 10 featured repos from the brief (curated names,
descriptions and stack in `content.js`; stars, `pushed_at` and description fallback live). Filter chips (All,
Go, Real-time, three.js, Svelte, Edge, Bots) and sort (Curated / Stars / Recent) reorder with GSAP Flip (instant
when reduced). Hover or focus a row: a card follows the cursor (cursor `view`) with stack, homepage host and
live stars; on touch the card expands inline. Footer: "Stars load live from api.github.com", all-repos link.

### 06 stack: "Java by day, everything else"

Heading: split across the stack; each card's title is one word of the line. Six cards (Languages, Frameworks,
Data & messaging, Infra & DevOps, Engineering, AI tooling) with `position: sticky` and staggered `top`, scaled
and dimmed by a CSS `view()` timeline as the next card covers them (`@supports` gate; plain list otherwise).
Java leads Languages and is marked strongest. Chips are buttons opening anchor-positioned popovers that
cross-link where the skill appears (experience panel, project rows, thesis) using a map in `content.js` built
from yml and brief text only.

### 07 timeline: "2017 → 2026"

Heading: the year. Left: a sticky `--t-mega` odometer; each digit is a column of 0-9 that rolls to the year of
the entry in view (view timeline per entry, IO fallback). Right: entries from brief section 2: 2017-09 HCMUT
starts; 2018-05 GitHub account; 2020-04 first blog posts; 2020-07 joins ZingPlay; 2023-06 graduates (GPA
8.14/10, Academic Excellence Scholarship, Five Good Student Award) with an expandable Survival2D thesis card;
2025 blog restarts, Store Scraper Bot; 2026-08 `tiennm99dev` org; 2026 Gomoku, Rubik, Nối từ, rplace, AI tools
ranking, the Claude Code plugin marketplace. Interaction: year rail buttons (2017 ... 2026) jump with Lenis; the
thesis card opens with a View Transition.

### 08 writing: "notes from the desk"

Heading: a newspaper masthead ("The miti99 Desk", issue date = latest post date, "Vietnamese and English, since
2020"). Grid: lead post spanning 2 columns, 5 more in single columns, with column rules that draw in on entry.
Titles run ScrambleText on hover/focus (once on entry with motion on). Topic chips appear only when the feed
items carry `<category>`; otherwise hidden. Skeleton while loading; on failure the grid hides and a plain "Read
the blog" link stays. Post count text uses only what the feed returns or the brief's "nearly 200 posts".

### 09 github: "public side projects, live"

Heading: a departures-board title in flap tiles. Framing line above the board: "Public side projects only. The
day-job Java lives in private repositories." Rows (split-flap tiles, each character a flip): total stars
(non-fork, both accounts, archived included), public repos (non-fork count, both accounts), followers, years on
GitHub (since `created_at`), then the top 6 primary languages by repo count as rows with counts, no percentage
bar. Flaps cycle when data arrives; numbers stay hidden (tiles show `—`) in `offline`. Interaction: Refresh
button (rate-limit aware) and hover a language row to highlight matching rows in section 05. Caption: source and
"as of" time.

### 10 contact: "the one-page version"

Heading: "Download the CV." in hero-size kinetic type (same `kinetic.js`, its own instance). WebGL moment 2: the
hero halftone reprised in `uMode=1`, dots converging toward the CTA; same fixed canvas and renderer, shown only
while hero or contact intersect. Row: magnetic "Download CV (PDF)" (`./miti99.pdf`,
`download="Tien-Nguyen-Minh-CV.pdf"`), copy-email button (yml email, toast), GitHub, GitHub WIP org, LinkedIn,
blog, link-in-bio. Footer: © 2026 Tien Nguyen Minh · miti99, local time, "data live from api.github.com".

## File layout

```text
package.json, package-lock.json   root; site deps + scripts added (npm only, caret ranges)
eslint.config.js                  flat config: js, svelte, jsdoc
scripts/check-site.mjs            dist checks (below)
site/
  index.html  vite.config.js (base './', outDir ../dist, dev 5199, preview 5198)  svelte.config.js  public/
  src/main.js  src/App.svelte  src/app.css (Tailwind v4 import, @theme tokens, base)
  src/lib/   tokens.js  content.js  profile.js  commands.js
             live/github.js  live/github.svelte.js  live/rss.js
             motion/runtime.js  motion/kinetic.js  motion/quality.js  motion/actions.js (reveal, magnetic,
             splitLines, inView)  gl/halftone.js  gl/halftone.{vert,frag}.glsl
  src/shell/ Nav, Palette, Cursor, LiveChip, ThemeToggle, Toast (.svelte)
  src/sections/<id>/<Name>.svelte: hero/Hero, now/Now, experience/Experience, craft/Craft,
             projects/Projects, stack/Stack, timeline/Timeline, writing/Writing, github/GithubBoard,
             contact/Contact
  test/      Vitest: profile, github, rss, tokens, commands
```

Ownership: phase 1 owns everything outside `src/sections/`; each phase 2 agent owns one `sections/<id>/` and
adds files only there. Sections take no props and import from `lib/`; shared changes go back to phase 1.

## Data contract

`virtual:profile` (Vite plugin in `vite.config.js`, uses `loadCv` from `src/load-cv.mjs`): whitelists and
exports `{ name, headline, location, email, website, socials: [{network, username, url}], experience: [{company,
position, start, end, location, summary, highlights: [{text, links:[{label,url}]}]}], projects, skills: [{label,
items: string[]}], education }`. `phone` is never copied; a test asserts no key or value equal to it exists, and
`check-site.mjs` greps `dist/` for its digits.

`content.js` (brief facts only): `positioning`, `featured: [{repo:'owner/name', title, blurb, stack: string[],
tags: string[], href}]`, `games: [{name, store}]`, `timeline: [{date, title, body, kind}]`, `crossLinks: {skill:
[anchorId]}`, `blog: {url, feed, languages}`, `links`.

`live/github.js` (pure functions + `loadGitHub({force})`):
- Calls: `GET /users/tiennm99`, `/users/tiennm99/repos?type=owner&per_page=100` following `Link: rel="next"`,
  `/orgs/tiennm99dev/repos?type=public&per_page=100`: 4 requests cold.
- Cache `localStorage['gh:v1']` = `{fetchedAt, etags, user, repos}`; TTL 20 min; refetch with `If-None-Match`;
  skip network when cached `X-RateLimit-Remaining < 4` and reset is ahead; 5s `AbortController` timeout; 403/429
  log to console only.
- Returns `{ status: 'fresh'|'stale'|'offline', asOf, rateRemaining, user: {avatarUrl, name, bio, followers,
  createdAt}, repos: [{fullName, owner, name, fork, archived, stars, language, description, homepage, url,
  pushedAt}], totals: {stars, repos}, languages: [{name, count}], recent: Repo[5], byName: Map }`. Totals and
  languages use non-fork repos of both accounts, archived included.

`live/github.svelte.js`: `gh` `$state` object with the fields above plus `status: 'connecting'` initially and
`refresh()`. `live/rss.js`: `loadPosts({limit})` → `{status, posts: [{title, url, date, categories: string[],
summary}]}`; cache 30 min.

## Build, checks and CI

- CI `cv.yml` adds `npm run lint`; upload of `dist` unchanged. Scripts: `site:dev` (vite, port 5199),
  `site:build`, `build` = `site:build` then `scripts/build.mjs`; `build.mjs` keeps its PDF render but only
  copies `miti99.pdf` into `dist/` without deleting the Vite output (the one allowed edit near the PDF
  pipeline). `lint` (eslint), `test` (node tests + `vitest run`), `check` updated: `check.mjs` expects the new
  `dist/` listing; `check-site.mjs` asserts `dist/index.html`, relative asset URLs, no phone digits, no runtime
  CDN hosts, `dist/miti99.pdf` present.
- Browser verification with agent-browser (`AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome`, unique
  session, `close` after): widths 360, 390, 768, 1280, 1920 for horizontal overflow, console errors, palette
  keyboard flow, reduced-motion emulation, WebGL disabled, offline API. Never use ports 4173 or 4180; stop every
  server started.

## Phases

1. Foundation (one agent): config, tokens, fonts, shell, data layer, live clients, motion, halftone, tests,
   build.
2. Sections in parallel, one agent per `sections/<id>/` against the contract above.
3. Integration: order and ids, palette, mobile perf pass, a11y pass, `npm run check`, browser matrix, review.

## Acceptance criteria

- Ten sections in order, each with a distinct layout, motion and interaction per the table.
- Hero halftone renders crisp around DOM text, pauses off-screen, and falls back to CSS.
- No layout reads inside animation loops; loops stop when off-screen or idle.
- Live numbers degrade fresh → stale (labelled) → hidden; 4 requests per cold visit max.
- No phone number in `dist/`; email is the yml email; no runtime CDN requests.
- WCAG AA contrast test passes for both themes; full keyboard path; reduced motion honoured.
- No horizontal overflow from 360 to 1920px; `npm run lint`, `npm test`, `npm run check` pass.

## Working on a section

Foundation status (phase 1): config, tokens, fonts, shell, data layer, live clients, motion helpers, halftone
and tests are in place; every section is a stub that renders its title.

- **Dev server:** `npm run dev:site -- --port <port>` (default 5199, strict). Give each parallel agent its own
  port (for example 5201-5210); never 4173 or 4180. Stop it when done. Built check: `npm run build:site`, then
  `npm run preview:site -- --port <port>`.
- **Isolate URL:** `http://127.0.0.1:<port>/?section=<id>` renders only that section with the shell (nav,
  palette, cursor, toast). Sections load lazily through `import.meta.glob`, so a broken component elsewhere
  never breaks the isolated one; on the full page each section has its own error boundary.
- **Rule:** a section agent edits and adds files only inside `site/src/sections/<id>/`. The entry component name
  is fixed by `site/src/lib/sections.js`; sections take no props. Anything shared (lib, shell, `app.css`, tokens,
  tests outside your folder) goes back to the foundation owner as a request, not an edit.
- **Anchors:** `App.svelte` already wraps each section in `<div id="<id>" data-section>`; render your own
  `<section aria-labelledby="<id>-title">` inside. Keep the ids in `content.js` `anchors` (experience panels,
  `craft-terminal`, `tl-thesis`) and `projectAnchor(repo)` rows, since stack chips cross-link to them.

Shared helpers (import from `site/src/lib/`):

| Module | What it gives you |
| --- | --- |
| `profile.js` | `profile` (whitelisted yml: name, headline, location, email, website, socials, experience, projects, skills, education; rich text as `{text, links}`), `social(network)`, `formatYm()` |
| `content.js` | `positioning`, `featured`, `projectFilters`, `projectAnchor()`, `games`, `anchors`, `timeline`, `crossLinks`, `blog`, `links` |
| `sections.js` | `SECTIONS` manifest (id, num, label, file) |
| `live/github.svelte.js` | reactive `gh` (`status` connecting/fresh/stale/offline, `asOf`, `user`, `repos`, `totals`, `languages`, `recent`, `byName`), `repo('owner/name')`, `refreshGitHub()`, `canRefresh()`; hide numbers when `totals` is null |
| `live/rss.js` | `loadPosts({ limit })` → `{ status, asOf, posts: [{ title, url, date, categories, summary }] }` |
| `ui.svelte.js` | `ui` (theme, quality, active, paletteOpen), `reduced()`, `webglAllowed()`, `toggleTheme()`, `toggleMotion()`, `toast()`, `copyText()` |
| `clock.svelte.js`, `time.js` | `clock.now` (1s tick), `localTime()`, `localDate()`, `yearsSince()`, `relativeTime()` (Asia/Saigon) |
| `motion/runtime.js` | `gsap`, `ScrollTrigger`, `SplitText`, `Flip`, `ScrambleTextPlugin`, `EASE`, `DUR`, `use:sectionMotion={({ node, reduced }) => ...}` (gsap.context, rebuilt on motion toggle), `scrollToId()`, `getLenis()`, `refreshScroll()` |
| `motion/actions.js` | `use:inView`, `use:reveal`, `use:splitLines`, `use:magnetic`, `use:halftonePointer` |
| `motion/kinetic.js` | `createKinetic(root)` for `[data-kinetic-line]` lines: cached rects, no layout reads per frame, idle wave, `boxes()` for the halftone; reserve each line's box in CSS |
| `gl/halftone.js` | `attachHalftone(stageEl, { mode: 0 or 1, boxes, focus, onFallback })` → `{ detach }`; call only when `webglAllowed()`, else (or on fallback) use the `.halftone-css` class |
| `app.css` | tokens as Tailwind utilities (`bg-paper`, `text-ink-2`, `text-accent-text`, `border-line`, `font-display`, `text-sec`, `text-hero`, `text-mega`), classes `.label`, `.display`, `.section`, `.grid-12`, `.cols`, `.btn`, `.btn-ghost`, `.halftone-css` |
| Cursor | set `data-cursor="link|view|drag|type"` and optional `data-cursor-label` on elements |

Contrast rules: small text uses `--ink` or `--ink-2`; vermilion text under 24px uses `--accent-text`; text on an
accent fill uses `--accent-ink`. Mono labels over the halftone need a paper backing.

Deviations from the spec above, decided in phase 1: light `--accent-ink` is ink, not near-white (near-white on
the vermilion fill is 3.8:1, below AA); the halftone knock-out uses live glyph boxes passed as uniforms (signed
distance in the shader) instead of a 2D-canvas mask texture, so no texture upload follows the kinetic type; npm
script names are `dev:site`, `build:site`, `preview:site`, `check:site`. `build`, `check`, `check.mjs` and the
`build.mjs` copy change are still phase 3 (`build:site` empties `dist/`, and `npm run build` still writes the
old CV page there).
