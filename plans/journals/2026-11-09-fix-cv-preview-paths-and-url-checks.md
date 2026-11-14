---
title: Fix CV preview paths and URL checks
date: 2026-11-09
summary: Resolved the three follow-up review findings with regression and native Windows coverage.
---

# Fix CV preview paths and URL checks

## What happened

Preview startup used URL parsing for a filesystem path, so Windows drive paths
and reserved URL characters could silently disable the entrypoint. It now uses
Node filesystem-to-file-URL conversion; subprocess tests exercise absolute and
relative paths from a temporary directory containing reserved characters.

PDF link checks compared raw strings even though Chromium canonicalizes hosts
and default ports. Checks now compare complete normalized destinations while
preserving path case and query order. URL validation now rejects malformed
explicit HTTP(S) syntax before Markdown can normalize it.

## Evidence and decisions

All 12 integrated unit/subprocess tests passed. The full build, website/PDF
checks, and real Chromium URL regression passed in a disposable copy. Generated
CV text matched the committed PDF exactly; content, design, and tracked output
files were unchanged. Independent review found no actionable issues.

Added native Windows preview CI and made deployment depend on both platform
checks. Temporary implementation worktrees and helper branches were removed.

## Delivery

Issue: https://github.com/tiennm99/cv/issues/5
PR: https://github.com/tiennm99/cv/pull/4

The PR remains unmerged. No prerequisite was waived or scope changed.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
