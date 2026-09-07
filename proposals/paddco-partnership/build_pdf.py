#!/usr/bin/env python3
"""Render the ISISEL × PADDCO partnership proposal to PDF via WeasyPrint."""

from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parent
HTML_PATH = ROOT / "proposal.html"
PDF_PATH = ROOT / "ISISEL_PADDCO_Strategic_Partnership_Proposal.pdf"


def main() -> None:
    HTML(filename=str(HTML_PATH), base_url=str(ROOT)).write_pdf(str(PDF_PATH))
    print(f"Wrote {PDF_PATH} ({PDF_PATH.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
