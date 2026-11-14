---
title: "Integration and PR"
status: completed
---

# Integration and PR

## Overview

Verify the integrated outputs, run an isolated review, and publish a PR without
merging or deploying. Depends on [implementation](phase-01-start.md).

## Requirements

- [x] Independent review has no blocking findings.
- [x] PR and issue state match the verified delivery state.

## Implementation Steps

1. Run unit and browser/PDF checks; inspect screenshots and PDF raster.
2. Review data parity and check documentation against actual commands.
3. Move issue to in review; dispatch fresh read-only reviewer.
4. Fix evidenced findings and repeat isolated review as needed.
5. Commit/push, open PR, verify CI, move issue to done, and remove owned resources.

## Todo

- [x] Integrated verification and isolated review clean.
- [x] PR opened and CI verified: [PR #4](https://github.com/tiennm99/cv/pull/4),
  [successful Linux build](https://github.com/tiennm99/cv/actions/runs/42497954734).
- [x] Temporary worktrees removed; no task-owned background process remains.

## Success Criteria

Each contract item has command or artifact evidence; the PR remains unmerged and
the issue remains open with the done label until merge. No production deployment
is triggered from this branch. Do not delete user resources during cleanup.
