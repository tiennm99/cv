"""Compile the CV PDF with Typst, no browser involved.

Reads the validated CV as JSON on stdin (prepared by src/build-pdf.mjs) and
writes the PDF to the path given as the only argument. Only bundled fonts are
used and the document has no date, so the same input gives the same bytes.
"""

import sys
from pathlib import Path

import typst

HERE = Path(__file__).resolve().parent


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: build.py <output.pdf>  (CV JSON on stdin)")
    typst.compile(
        str(HERE / "cv.typ"),
        output=sys.argv[1],
        root=str(HERE),
        font_paths=[str(HERE / "fonts")],
        ignore_system_fonts=True,
        sys_inputs={"cv": sys.stdin.read()},
        pdf_standards=["ua-1"],
    )


if __name__ == "__main__":
    main()
