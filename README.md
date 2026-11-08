# Tien Nguyen Minh's CV

[Read the web CV](https://tiennm99.github.io/cv/) · [Download the PDF](miti99.pdf)

A static, responsive CV and a compact PDF generated from the same
[CV data](miti99.yml). The build uses Node.js, HTML/CSS, and Playwright's Chromium
PDF renderer. The published website needs no JavaScript, CDN, or server.

## Setup

Use Node.js 24 or newer and npm:

```sh
npm ci
npx playwright install chromium
```

On Linux, install browser system dependencies with
`npx playwright install --with-deps chromium`. The integration checks also need
Poppler's `pdfinfo` and `pdftotext` commands (`sudo apt-get install poppler-utils`
on Ubuntu, or `brew install poppler` on macOS).

## Edit and generate

Edit `miti99.yml`, then run:

```sh
npm run build
```

The build validates the data and generates `index.html` and `miti99.pdf` at the
repository root, plus matching copies in `dist/`. Commit the root artifacts
alongside content or presentation changes. `dist/` contains only the two public
files and is the GitHub Pages deployment artifact; source files and plans are
not published.

The `cv` mapping in `miti99.yml` is the single content source. It contains contact
details, social links, experience, projects, skills, and education. Existing
Markdown links in summaries, names, and highlights are supported. Screen and
print presentation live in [styles/cv.css](styles/cv.css); the shared document
structure lives in [src/render-html.mjs](src/render-html.mjs). Change print CSS
to adjust spacing or pagination while preserving the CV copy.

By default the build uses Playwright's installed Chromium. To use an existing
compatible browser instead, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its
executable path, for example:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run build
```

## Preview and verify

```sh
npm run preview
```

Open `http://localhost:4173` after building. The preview serves `dist/` only;
stop it with Ctrl+C when finished. The PDF download uses a relative URL so it
works under a GitHub Pages repository path as well as on a custom domain.

```sh
npm test
npm run check
```

The first command runs focused unit tests. The second builds both outputs and
checks the website in Chromium at mobile, tablet, and desktop sizes, validates
the PDF download, and inspects PDF text and pagination. Both generation and
checks use the browser override above when it is set.

## GitHub Pages

[The CV workflow](.github/workflows/cv.yml) installs the locked npm dependencies,
runs tests and output checks, and uploads only `dist/`. Pull requests and manual
workflow runs build and verify the outputs. A successful push to `main` also
deploys the resulting artifact to GitHub Pages. In repository settings, select
**GitHub Actions** as the Pages build source. The workflow does not commit
generated files or require Python or RenderCV.
