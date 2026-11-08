---
title: "Phase 2: integrate-and-publish"
status: todo
---

# Phase 2: integrate-and-publish

## Overview

Verify the integrated outputs, run an isolated review, and publish a PR without
merging or deploying. Depends on [implementation](phase-01-start.md).

## Requirements

- [ ] Independent review has no blocking findings.
- [ ] PR and issue state match the verified delivery state.

## Implementation Steps

1. Run unit and browser/PDF checks; inspect screenshots and PDF raster.
2. Review data parity and check documentation against actual commands.
3. Move issue to in review; dispatch fresh read-only reviewer.
4. Fix evidenced findings and repeat isolated review as needed.
5. Commit/push, open PR, verify CI, move issue to done, and remove owned resources.

## Todo

- [ ] Integrated verification and isolated review clean.
- [ ] PR opened and CI verified.
- [ ] Temporary worktrees/processes/artifacts cleaned.

## Success Criteria

Each contract item has command or artifact evidence; the PR remains unmerged and
the issue remains open with the done label until merge. No production deployment
is triggered from this branch. Do not delete user resources during cleanup.
