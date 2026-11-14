---
title: "Replace RenderCV with a Node.js web and PDF build"
description: "Preserve the CV content while generating a responsive website and compact PDF without Python."
status: completed
priority: P1
effort: "3h"
branch: feature/cv-rewrite-with-codex
issue: 3
tags: [refactor, frontend, infra]
created: 2026-11-08
---

# cv-node-rewrite

## Overview

Confirmed contract: Node.js and shared HTML/CSS replace Python RenderCV. Preserve
all CV content and links, keep `miti99.pdf`, add a web download link, update
documentation and CI, verify both outputs, obtain an isolated review, and open a PR.
Merging, production deployment, content rewrites, backend services, and paid
services are out of scope. The user confirmed scope and reported prerequisites ready.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | One editable CV source and matching web/PDF content | P1 |
| 2 | Responsive website and compact, selectable-text PDF | P1 |
| 3 | Reproducible Node build, tests, Pages artifact, and reviewed PR | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Node build and layout](./phase-01-start.md) | Completed |
| 2 | [Integration and PR](./phase-02-integrate-and-publish.md) | Completed |

## Success Criteria

- [x] All original CV text and links preserved in the integrated outputs.
- [x] Website works at 375, 768, and 1440px with a working PDF download.
- [x] Current CV PDF is readable, selectable, and checked for pagination.
- [x] Python/RenderCV dependencies and CI removed; Node commands documented.
- [x] Unit and integration checks pass; independent review has no blockers.
- [x] PR opened, issue labelled done, temporary processes/worktrees removed.

## Evidence

- Issue: https://github.com/tiennm99/cv/issues/3
- PR: https://github.com/tiennm99/cv/pull/4 (unmerged).
- Linux CI passed: https://github.com/tiennm99/cv/actions/runs/42497954734;
  the deployment job was skipped as intended for a pull request.
- Original and migrated `cv` mappings compare deeply equal.
- `npm test`: four tests passed outside sandbox subprocess restrictions.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run check`:
  passed text/link parity, one-page tagged Letter PDF, 375/768/1440px layouts,
  public-only preview, output copies, and downloaded PDF byte parity.
- PDF raster and responsive screenshots inspected: no clipping or missing content.
- Frontend render checker: zero errors; one accepted warning for inline prose
  links smaller than 44px. Navigation/contact/download controls have 44px targets.
  Design rubric: 23/24; inline link touch sizing accounts for the remaining point.
- Fresh independent review: no blockers or optional concerns requiring changes.
- README file links, YAML workflow, main-only deployment condition, public-only
  Pages upload, legacy file removal, and whitespace checks verified.

## Ownership and dependencies

- Build agent: `package*.json`, `src/load-cv.mjs`, `src/browser.mjs`, `scripts/`, `test/`.
- Design agent: `src/render-html.mjs`, `styles/cv.css`.
- Controller: YAML migration, README, CI, legacy cleanup, integration and publication.
- Shared interface: `renderHtml(cv, css)` returns standalone HTML; source remains
  `miti99.yml` with its existing `cv` mapping. Build emits root artifacts and a
  Pages-only `dist/` containing `index.html` and `miti99.pdf`.
- Both implementation branches start at `1ea67df` in separate temporary worktrees.
- Screen and print share the same content renderer; only CSS presentation differs.
- No runtime backend, framework, CDN, or external font dependency is needed.

## Validation

Source paths and current generation workflow were inspected. Node 24, npm, Chrome,
Poppler tools, GitHub admin access, disk, and memory are available. The initial
sandboxed GitHub auth failure was disproven by an unrestricted read-only check.
No missing prerequisites or open product decisions remain. The one-page print
goal comes from the existing local CV check; preserve copy and adjust layout only.
Verify with `npm test`, `npm run check`, PDF raster inspection, responsive
screenshots, a source-content comparison, and the PR's CI run.

<!-- slug: cv-node-rewrite -->
