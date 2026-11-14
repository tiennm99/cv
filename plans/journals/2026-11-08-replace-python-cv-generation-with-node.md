---
title: Replace Python CV generation with Node
date: 2026-11-08
summary: Shared HTML and CSS now generate the responsive CV and compact PDF.
---

# Replace Python CV generation with Node

## What happened

Replaced the RenderCV/Python workflow with a locked Node.js build that validates
YAML and generates standalone HTML plus a tagged PDF using Playwright. Kept the
existing CV mapping exactly unchanged and preserved the public PDF filename.
Updated documentation, the local CV check instructions, and GitHub Actions.

## Decisions and evidence

Used the existing YAML source and a single semantic HTML renderer for screen and
print. Public deployments upload only dist, and PR/manual runs cannot deploy.
Four unit tests and browser/PDF integration checks passed locally. The PDF fits
one US Letter page at 10pt body text. An independent review found no blockers.
The initial sandboxed GitHub auth failure was disproven by an unrestricted
read-only check; no credential changes were required.

## Delivery

PR: https://github.com/tiennm99/cv/pull/4
Issue: https://github.com/tiennm99/cv/issues/3

The PR is intentionally unmerged. CI checks its own browser and font output;
future CV growth may require print spacing or a deliberate pagination decision.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
