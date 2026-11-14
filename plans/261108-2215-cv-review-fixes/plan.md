---
title: "Fix preview startup and CV URL handling"
description: "Resolve all three verified review findings without changing CV content or design."
status: completed
priority: P1
effort: "1h"
branch: feature/cv-rewrite-with-codex
issue: 5
tags: [bugfix, frontend, infra]
created: 2026-11-09
---

# Fix preview startup and CV URL handling

The user confirmed the fix contract and reported prerequisites ready. Repair
preview startup for Windows and reserved path characters, normalize complete
URL destinations in output checks, and reject malformed website URLs before
generation. Update PR #4 with regression tests, passing CI, and isolated review.
CV content/design changes, unrelated fixes, merging, and deployment are excluded.

## Phases

| Phase | Status |
|-------|--------|
| [Fix, verify, and publish](phase-01-start.md) | Completed |

## Acceptance

- [x] Preview regressions pass on Linux and native Windows CI.
- [x] Equivalent URLs pass actual browser PDF and HTML checks.
- [x] Malformed HTTP(S) website syntax fails with a field-specific error.
- [x] Full unit and web/PDF checks pass; CV content/design unchanged.
- [x] Isolated review clean; fixes pushed to PR #4 with passing CI.
- [x] Issue state matches delivery and temporary resources are cleaned.

## Ownership and decisions

Tracking: [issue #5](https://github.com/tiennm99/cv/issues/5),
[PR #4](https://github.com/tiennm99/cv/pull/4).

Baseline: `5594323`. Preview agent owns `scripts/preview.mjs` and
`test/preview.test.mjs` in `/tmp/cv-preview-fix`. URL agent owns validation,
`scripts/check.mjs`, link-check helpers and URL regression tests in
`/tmp/cv-url-fix`. Controller owns CI, npm wiring if needed, README, records,
integration, and publication. Integrate commits sequentially and verify locally.

Use Node filesystem-to-file-URL conversion and normalized complete destinations;
preserve case-sensitive paths and queries. Keep explicit HTTP(S) website syntax.
Add native Windows CI rather than claiming Windows behavior from Linux alone.
No new dependencies or content/schema extensions. Existing toolchain and GitHub
access were verified; no missing prerequisites or decisions remain.

## Verification

- `npm test`: all 12 unit/subprocess tests passed on the integrated source.
- Full `npm run check` passed in a disposable source copy, including real
  Chromium URL regressions. Generated CV text matched the committed PDF exactly.
- [Linux and native Windows CI](https://github.com/tiennm99/cv/actions/runs/42529735418)
  passed for implementation commit `f11c190`; deployment was skipped.
- Isolated review: no actionable findings. Preview regressions fail the old
  entrypoint guard and pass filesystem URL conversion.
- `git diff 5594323 -- miti99.yml src/render-html.mjs styles/cv.css index.html miti99.pdf`
  is empty. No source, layout, or tracked output change.
- [Issue #5](https://github.com/tiennm99/cv/issues/5) is labelled done and remains
  open for the unmerged [PR #4](https://github.com/tiennm99/cv/pull/4).
- Temporary implementation worktrees and helper branches removed; test browser,
  server, subprocess, and disposable build resources cleaned. No waivers.
