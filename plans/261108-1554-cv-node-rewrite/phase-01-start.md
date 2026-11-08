---
title: "Phase 1: Start"
status: todo
---

# Phase 1: Start

## Overview

Implement the shared Node build and responsive/print presentation in isolated
worktrees. The controller preserves the YAML CV mapping and removes legacy config.

## Requirements

- [x] Preserve current CV content and links without Python.
- [x] Render standalone HTML and a compact selectable-text PDF.

## Implementation Steps

1. Build agent implements YAML validation, browser lifecycle, build, preview, tests.
2. Design agent implements `renderHtml(cv, css)` and token-based screen/print CSS.
3. Controller updates README, CI, ignore rules, data/config and obsolete CV skill.
4. Commit owned pieces and integrate sequentially; rerun checks on integrated code.

## Todo

- [x] Integrate build agent commit.
- [x] Integrate design agent commit.
- [x] Complete controller-owned migration.

## Success Criteria

`npm test` and `npm run check` pass on integrated outputs. Source CV mapping is
unchanged; current PDF fits one page without clipping or copy changes. Print
regressions are repaired through CSS, never by deleting content.

## Risk and rollback

Browser setup and typography can affect pagination. Use a pinned lockfile and
explicit browser setup, then inspect rendered PDF/screenshots. All changes are
on the rewrite branch; rollback is reverting the scoped rewrite commits.
