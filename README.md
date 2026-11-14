# Tien Nguyen Minh (miti99)

[Visit the site](https://tiennm99.github.io/cv/) · [Download the CV (PDF)](miti99.pdf)

Two outputs from one [CV data file](miti99.yml):

- **Landing site** (`site/`): a kinetic-type personal site built with Svelte 5,
  Vite, Tailwind CSS 4, GSAP, Lenis and three.js. GitHub numbers and blog posts
  load live in the visitor's browser; nothing from those APIs is stored here.
- **PDF CV** for recruiters: one US Letter page, rendered by Chromium from an
  internal HTML render of `miti99.yml` (`src/`, `styles/cv.css`). That HTML is
  never published.

## Quick start

Node.js 24+ and npm. The checks also need Poppler (`pdfinfo`, `pdftotext`).

```sh
npm ci
npx playwright install chromium
npm run dev        # landing site with hot reload at http://127.0.0.1:5199/
npm run build      # dist/: landing site + miti99.pdf (also refreshes the root miti99.pdf)
npm run preview    # serves dist/ at http://127.0.0.1:4173/cv/, like GitHub Pages
```

`npm run build:site` rebuilds only the site and reuses the committed root PDF.
To use an existing Chromium instead of Playwright's, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (for example `/usr/bin/google-chrome`).

More: [development and checks](docs/development.md).
