# Browserless PDF engine for the HR CV

Date: 2026-11-14. Scope: replace the Playwright-printed `miti99.pdf` with an engine that needs no
browser, installs with `npm ci` only, and stays in the npm ecosystem (no Python).

## Recommendation

**Typst through `@myriaddreamin/typst-ts-node-compiler` (0.7.0, bundles Typst 0.14.2).**
Node reads `miti99.yml`, maps an allow-list of fields to JSON (phone never copied), passes it
through `sys.inputs`, and a ~30-line `.typ` template lays it out. It is the only candidate whose
output passed every criterion in the proof of concept: tagged PDF with a full structure tree
(H1/H2/H3, P, L/LI/Lbl/LBody, Link with OBJR), PDF/UA-1 identification, embedded subset fonts,
clickable links, selectable text, byte-identical rebuilds, one-page typographic quality
(Knuth-Plass style line breaking, real lists/grids) and 0.2 s per build.

**Runner-up: pdfkit 0.20.2** (pure JS, no native code). It has a real PDF/UA mode, but the
structure tree is hand-built and link annotations are not in it, and every line, column and
page fit is hand-measured. Pick it only if a native addon or a second template language is
unacceptable.

Trade-off to accept with Typst: the template is Typst markup, not JS. Data shaping and all
build logic stay in JS; the `.typ` file is presentation only, like the current `cv.css`.

## Comparison

| Engine | Browserless, `npm ci` only | Tagged / accessible | Links | Layout effort for 1 compact page | Maintenance (2026-11) | Deterministic |
| --- | --- | --- | --- | --- | --- | --- |
| **Typst (typst-ts-node-compiler)** | Yes; prebuilt napi binary per platform via optionalDependencies (linux x64/arm64 gnu+musl, macOS, Windows) | **Yes by default**; `pdfStandard: 'ua-1'`; PDF/A too; links tagged with OBJR | Yes | Low: declarative markup, grid, lists, auto-wrapping, `justify`, hyphenation | Active (npm 0.7.0 on 2026-11-09, 1.3k stars), single core maintainer; Typst itself very active | Yes (`creationTimestamp`, `date: none`) - verified identical SHA-256 |
| pdfkit | Yes; pure JS (fontkit, fflate) | Yes, manual: `tagged`, `subset: 'PDF/UA'`, `struct`/`markStructureContent`; links not in structure tree | Yes (PoC produced a duplicated annotation for one inline link) | High: imperative x/y, measure heights yourself | Active (0.20.2, 10.7k stars, 4 maintainers) | Yes with fixed `CreationDate` - verified |
| pdfmake 0.3.14 | Yes; pure JS on pdfkit | Only sets the `Marked` flag (`tagged: true`); no structure tree code in the repo, so it would claim Tagged falsely | Yes | Medium: JSON doc definition, tables/columns | Active (12.4k stars) | Yes with fixed dates |
| @react-pdf/renderer 4.9 | Yes; pure JS (pdfkit fork + Yoga) | No structure tree (no `markStructureContent` usage; open a11y issue #1790) | Yes | Medium: flexbox JSX, but adds React + JSX build | Active (16.9k stars), one maintainer | Mostly |
| jsPDF 4.2 | Yes; pure JS | No tagging support | Yes | High: manual coordinates, weak text flow | Active (31k stars), browser-first | Mostly |
| `typst` npm (jcbhmr) | Downloads CLI binary at install | Same as Typst | Yes | Low | Unofficial, version 0.10.0-8 | - |
| pdf-lib 1.17 | Yes | No | Manual | Very high (no text layout) | Unmaintained since 2022 | - |

Excluded: Playwright/Puppeteer/Paged.js (need a browser), WeasyPrint/ReportLab (Python),
LaTeX (not npm), pdfme (form-template oriented, no tagging).

## Proof of concept (Typst)

Scratch dir `temp/pdf-poc/` (gitignored by `temp/`; own `package.json`, local install only):

- `build-typst.mjs` - loads `../../miti99.yml`, splits `[label](url)` Markdown into
  `{text, url}` segments (no hand-escaping of Typst markup), allow-lists name, headline,
  location, email, website and the first experience entry, compiles, writes
  `out/cv-typst.pdf` with `pdfStandard: 'ua-1'`, `creationTimestamp: 0`.
- `cv.typ` - template: `json(bytes(sys.inputs.cv))`, A4, Be Vietnam Pro with
  `fallback: false` (only committed fonts can be used), headings, grid for title/dates, list.
- `fonts/` - Be Vietnam Pro Regular/Bold/Italic TTF + OFL licence from `google/fonts`
  (static TTFs with full Vietnamese coverage; ~410 KB to commit).
- `compare-pdfkit.mjs` - same header in pdfkit PDF/UA mode, for the runner-up evidence.

Run: `cd temp/pdf-poc && npm install && node build-typst.mjs`.

### Verification results

`pdfinfo out/cv-typst.pdf`: Title "Tien Nguyen Minh - CV", Creator Typst 0.14.2,
**Tagged: yes**, Metadata Stream yes, 1 page A4, PDF 1.7, 37 KB.
Raw objects: `/Marked true`, `/Lang (en)`, `/DisplayDocTitle true`, `pdfuaid:part 1`, 6 `/OBJR`.

`pdffonts`: three `BeVietnamPro-*` CID TrueType fonts, emb yes / sub yes / uni yes. No system
font leaked in.

`pdftotext -layout`: name, headline, contact line, "Experience", position + right-aligned
"2020-07 – present", summary and two bullets extract cleanly in reading order. `869` (phone)
absent from extracted text.

`pdfinfo -url`: 6 link annotations (mailto, website, 4 Play Store links from highlights).

`pdfinfo -struct`: Document > H1, P (with 2 Link), H2, H3, P, L > LI > Lbl + LBody > Link.

Determinism: two builds, identical SHA-256 `6b1d784a...d4598`.

pdfkit comparison: Tagged yes, PDF/UA id present, fonts embedded and deterministic, but
structure is only `Document > H1, P` that the code built by hand, no `Link` elements or OBJR,
and the single inline link produced two annotations.

## Integration sketch (for the later plan)

- Add `@myriaddreamin/typst-ts-node-compiler` as a devDependency; drop `playwright` from the
  PDF path (it can stay for link/visual checks if wanted). CI: `npm ci && npm run build:pdf`
  on `ubuntu-latest`, no `playwright install`.
- Reuse `src/load-cv.mjs` validation; add one `toTypstData(cv)` mapper with an explicit
  field allow-list. Phone excluded at the mapper, plus a test asserting the phone digits are
  not in `pdftotext` output.
- Commit `fonts/` (OFL TTFs) and `cv.typ`; pass `fontPaths` only, `fallback: false`.
- Fail the build on Typst diagnostics (`compile()` returns no `result`) and when the page
  count is not 1 (`doc.result` / query or `pdfinfo` in the check script).
- Check script: `pdfinfo` (Tagged yes, Pages 1), `pdffonts` (all emb), `pdftotext` (phone
  absent, key strings present). Whether poppler-utils is preinstalled on GitHub's Ubuntu
  runners was not checked; add an `apt-get install poppler-utils` step or check with
  `command -v pdfinfo` and fail loudly. Optional: veraPDF (Java) for a full
  PDF/UA validation run, not installed here.

## Risks

- Native addon: a platform without a prebuilt binary cannot build (all mainstream CI and dev
  OSes are covered). Pin through the lockfile; version-pinning rule allows `^0.7`.
- typst.ts lags upstream Typst by a release (0.8.0-rc on main moves to Typst 0.15.1); the
  Node API is marked partly experimental (`pdfStandard`). Small API surface used, so upgrades
  are cheap.
- Typst's PDF/UA-1 export is new (0.14, 2025); the PoC was checked with poppler only, not a
  validator such as veraPDF or PAC.
- A second language (`.typ`) for the template; mitigated by keeping all logic in JS.

## Unresolved questions

1. Is a native npm addon acceptable, or must the PDF path be pure JS (then pdfkit)?
2. Font choice: Be Vietnam Pro was picked for the PoC; the final CV may want another OFL
   family (must ship static TTF/OTF, not only woff2).
3. Should CI run veraPDF for PDF/UA validation (adds a Java download in CI)?
