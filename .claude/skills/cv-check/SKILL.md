---
name: cv-check
description: Render the CV with rendercv and check if the output PDF fits within 1 page. If it exceeds 1 page, analyze the YAML content and make it more compact — shorten summaries, simplify highlights, remove redundant or low-value information — until it fits. Use this whenever the user asks to check, validate, or review the CV, or wants to know if it fits on one page.
---

# CV Check

Render the CV and verify it fits within 1 page. If not, compact the YAML content until it does.

## Step 1: Render

```bash
cd "D:/tiennm99/cv" && PYTHONUTF8=1 .venv/Scripts/rendercv render miti99.yml
```

`PYTHONUTF8=1` is required on Windows to avoid encoding errors with rendercv's rich output.

## Step 2: Count pages

```bash
cd "D:/tiennm99/cv" && .venv/Scripts/python.exe -c "
from pypdf import PdfReader
reader = PdfReader('miti99.pdf')
print(len(reader.pages))
"
```

If `pypdf` is missing: `.venv/Scripts/pip install pypdf -q`

## Step 3: Evaluate

- **1 page** → PASS. Tell the user the CV renders cleanly to 1 page.
- **>1 page** → FAIL. Proceed to Step 4.

## Step 4: Compact the YAML (if > 1 page)

The fix is always in `miti99.yml` — never manipulate the PDF directly.

Priorities for compacting, in order:

1. **Shorten summaries** — experience and project summaries are the biggest space consumers. Trim to 1–2 tight sentences, remove filler phrases.
2. **Compress highlights** — merge bullets that cover similar points, cut anything that doesn't add new information beyond the summary.
3. **Remove low-value projects** — if there are 4+ projects, consider dropping the weakest one entirely.
4. **Collapse education highlights** — if GPA/awards take multiple lines, merge into one.
5. **Shorten skills** — remove categories that are implied or redundant.

After editing, re-run from Step 1 and repeat until the CV passes.

## Guiding principles

- Preserve all key technical facts, metrics (CCU, %, team size), and named technologies.
- Prefer cutting vague or soft language ("passionate about", "various tools") before cutting substance.
- Never fabricate or add new information.
