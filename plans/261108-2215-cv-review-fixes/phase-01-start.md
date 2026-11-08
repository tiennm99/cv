---
title: "Fix, verify, and publish"
status: completed
---

# Fix, verify, and publish

Repair the three diagnosed failures and verify through focused regressions,
existing web/PDF checks, and native Windows CI. See [contract](plan.md).

## Steps

1. Preview agent reproduces startup failure, fixes entrypoint conversion, tests.
2. URL agent reproduces validation/comparison failures, fixes checks, tests real PDF.
3. Controller adds Windows CI and scoped README updates.
4. Integrate commits, inspect diffs, run focused then full checks.
5. Run isolated review, fix findings, push PR update, verify CI, clean resources.

## Acceptance

- [x] Implementation integrated and verified.
- [x] Independent review clean and docs accurate.
- [x] PR/CI/issue updated and temporary resources cleaned.

Every contract item needs command/CI evidence. Current PDF remains one tagged US
Letter page. No CV data or design diff. Normalize links without weakening
missing-link detection or collapsing different paths/queries.

## Risk and rollback

Path behavior differs by platform; verify native Windows. URL comparison must
preserve destination semantics. Scoped commit reverts provide rollback without
rewriting published history. Test processes and temporary files are removed.
