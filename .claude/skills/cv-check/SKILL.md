---
name: cv-check
description: Build and check the landing site and the PDF CV (one-page pagination, selectable text, no phone number on the site, no overflow). Preserve CV copy unless the user explicitly requests edits.
---

# CV Check

The repo builds two outputs into `dist/`: the landing site (`site/`) and
`miti99.pdf`, typeset by Typst from `miti99.yml` through `pdf/cv.typ` (no
browser). Preserve all CV content; fix PDF layout in the template, not in the copy. The PDF
must fit one page.

## Build and check

From the repository root:

```sh
npm run lint
npm test
npm run check:all
```

`npm run check:all` builds both outputs, then runs `scripts/check.mjs` (PDF and
`dist/` layout), `scripts/check-url-regressions.mjs` and
`scripts/check-site.mjs` (the site under `/cv/` in Chromium). CI runs only
`npm run check`, without a browser, so run `check:all` before every push. See `docs/development.md` for what each
asserts, and `README.md` for setup (uv for the PDF) and the
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` browser override used by the site check.

To inspect the PDF directly, use `pdfinfo miti99.pdf` and
`pdftotext -layout miti99.pdf -`. Report the actual page count and check
result. Look at the PDF for clipping, orphaned headings and readable text even
when the checks pass. After a content change, the rebuilt root `miti99.pdf` must
be committed (the check fails when it differs from `dist/miti99.pdf`).

## Repair the PDF layout if necessary

Adjust sizes and spacing in `pdf/cv.typ`, then rebuild and recheck. Do not clip,
hide content, directly manipulate the PDF, or shrink text beyond readability.
Do not shorten copy, remove projects, or fabricate facts to satisfy pagination.
If new content cannot fit legibly, report the page count and ask about the
content/layout trade-off before changing the CV copy.

## Site failures

A phone-number, CDN-host or overflow failure names the file or element. Fix it
in the owning `site/src/sections/<id>/` folder or `site/src/lib/`; never add
the phone number to the site data (`site/src/lib/profile-shape.js` whitelists
fields).
