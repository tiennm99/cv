# Rewrite verification

The original and migrated YAML `cv` mappings match exactly. No copy was shortened
to achieve pagination. Screen and print use `renderHtml(cv, css)` with separate
CSS media rules; existing contact and content links remain in both outputs.

Local validation on Node 24 and Chrome 157 passed four unit tests and all
`npm run check` integration assertions. The resulting PDF is one tagged US Letter
page with selectable text. It was rasterized and visually inspected. Responsive
screenshots at 375, 768, and 1440px were inspected, and the frontend checker
reported zero errors. One warning for inline prose links below 44px is accepted:
enlarging them would disrupt reading flow; navigation/contact/download targets
meet the larger target size.

An isolated reviewer inspected the integrated source, CI, README, data parity,
and PDF raster. No actionable findings or blockers remained. The requested
generated HTML was rebuilt after its trailing-whitespace correction.

The [PR Linux build](https://github.com/tiennm99/cv/actions/runs/42497954734)
passed, verifying the locked dependencies and Playwright-installed Chromium in
GitHub Actions. The deployment job was skipped. Delivery is
[PR #4](https://github.com/tiennm99/cv/pull/4); it remains unmerged.

Reversible decisions: retain YAML for existing content editing; use Node and
Playwright instead of a mixed-language pipeline; share the semantic document
between screen and print; deploy only `dist/`; use explicit browser setup and
an optional executable override. No user decisions or prerequisites were waived.

Limitations: system-font substitution and browser versions can change pagination;
the checked build gates on one page and complete selectable source text. Future
content additions may require print CSS adjustment or an explicit pagination
decision. GitHub Pages deployment remains gated to pushes to main.
