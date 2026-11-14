# Development and checks

## Layout

| Path | What it is |
| --- | --- |
| `miti99.yml` | The single CV data source (contact, experience, projects, skills, education). |
| `site/` | Landing site: `src/App.svelte` shell, `src/sections/<id>/` one folder per section, `src/lib/` shared code, `test/` Vitest. |
| `src/load-cv.mjs` | Loads and validates `miti99.yml`. |
| `src/build-pdf.mjs` | Turns the CV into JSON for Typst and runs `pdf/build.py` through uv. |
| `pdf/` | The PDF: `cv.typ` Typst template, bundled Be Vietnam Pro fonts (OFL), and a uv project pinning the Typst Python binding. |
| `scripts/build.mjs` | Builds the PDF, builds the site into `dist/`, copies the PDF in. |
| `scripts/check*.mjs` | Output checks run by `npm run check` and `npm run check:all`. |
| `scripts/preview.mjs` | Serves `dist/` at `/cv/` (port from `PORT`, default 4173). |

## Content rules

- The site reads `miti99.yml` through the `virtual:profile` Vite module, which
  whitelists fields and never copies the phone number. The PDF keeps the phone.
- Curated site copy (featured projects, links, cross-links) lives in
  `site/src/lib/content.js` and in data files inside section folders; it may only
  restate facts from `miti99.yml` or the
  content brief.
- Website URLs in `miti99.yml` need an explicit `http://` or `https://`.
- After a content change, run `npm run build` and commit the rebuilt root
  `miti99.pdf`. `dist/` is never committed.

## Live data

GitHub (avatar, stars, repos, languages, recent pushes) is fetched in the
browser from the GitHub REST API, cached in `localStorage` with a TTL and ETag,
and respects the rate-limit headers: stale cache first, then numbers hidden.
Posts come from `https://miti99.com/index.xml`.

## Dev helpers

- `?section=<id>` renders one section alone (isolate mode), for example
  `http://127.0.0.1:5199/?section=craft`.
- `?nogl` forces the no-WebGL fallback.
- The palette (Cmd/Ctrl+K or `/`) toggles theme and motion.

## Checks

```sh
npm run lint
npm test
npm run check:all   # before every push
```

`npm test` runs the Node tests (CV validation, link normalisation, preview
server) and the Vitest suites in `site/test/` and `site/src/**`.

`npm run check` builds everything and runs the checks that need no browser;
CI runs it. `npm run check:all` adds the browser check of the site, which runs
only locally, so run it before every push. The checks:

- `check.mjs`: the PDF is one tagged US Letter page holding every text and link
  from `miti99.yml`; `dist/` holds only the site and the PDF; the root PDF
  matches `dist/miti99.pdf`; the old root `index.html` web CV is gone.
- `check-site.mjs` (`check:all` only, Chromium): serves `dist/` under `/cv/` and, with external requests
  blocked, checks relative URLs, no phone number in any web asset, no CDN
  hosts, only the allowed live hosts requested, no console or page errors, no
  horizontal overflow at 360, 390, 768, 1440 and 1920px (motion on, and reduced
  motion with `?nogl`), and that the PDF download link returns the PDF.
- `check-url-regressions.mjs`: unusual URL spellings survive as PDF links.

To fix PDF pagination, adjust sizes and spacing in `pdf/cv.typ`; never shorten
the CV copy to make it fit. The PDF uses only the bundled fonts and carries no
date, so an unchanged `miti99.yml` rebuilds to the same bytes.

## GitHub Pages

[The workflow](../.github/workflows/cv.yml) installs the locked npm and uv dependencies,
lints, tests, runs `npm run check` (no browser) and uploads `dist/`. A push to `main` deploys
it to GitHub Pages (source: **GitHub Actions**). The site uses a relative base,
so it works at `tiennm99.github.io/cv/`. A Windows job checks that the preview
server starts there too.
