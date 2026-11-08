---
name: cv-check
description: Build and check the Node.js CV website and PDF, including pagination and selectable text. Preserve CV copy unless the user explicitly requests edits.
---

# CV Check

Build the CV and verify the website and PDF. Preserve all CV content; adjust
print CSS to fix layout issues. The current CV should fit on one page.

## Build and check

From the repository root, run `npm run check`. See `README.md` for Node.js,
Chromium, and Poppler setup and the optional existing-browser override.

To inspect pagination directly, use `pdfinfo miti99.pdf`. Extract selectable
text with `pdftotext -layout miti99.pdf -`. Report the actual page count and
check result. Inspect the PDF visually for clipping, orphaned headings,
and readable text even when automated checks pass.

## Repair layout if necessary

Adjust print rules in `styles/cv.css`, then rebuild and recheck. Do not clip,
hide content, directly manipulate the PDF, or shrink text beyond readability.
Do not shorten copy, remove projects, or fabricate facts to satisfy pagination.
If new content cannot fit legibly, report the page count and ask about the
content/layout trade-off before changing the CV copy.
