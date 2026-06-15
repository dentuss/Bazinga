#!/usr/bin/env python3
"""
Render `defense-plan-2-content-discovery.md` as a presenter-friendly A4 PDF.
Large body font, generous line spacing, code-cue lines (lines starting with
→) highlighted so they're easy to spot while speaking.
"""
from pathlib import Path
import re

import markdown as md
from weasyprint import HTML, CSS

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "defense-plan-2-content-discovery.md"
OUT = ROOT / "defense-plan-2-content-discovery.pdf"


CSS_TEXT = """
@page {
  size: A4 portrait;
  margin: 18mm 20mm 18mm 20mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #888;
  }
  @bottom-left {
    content: "Bazinga · Розробник 2 · план захисту";
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #888;
  }
}

html, body {
  font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
  font-size: 13pt;
  line-height: 1.55;
  color: #1a1a1a;
  margin: 0;
}

h1 {
  font-size: 22pt;
  font-weight: 900;
  color: #1a1a1a;
  margin: 0 0 2mm 0;
  padding-bottom: 3mm;
  border-bottom: 3px solid #E50914;
}

h1 + p {
  font-size: 14pt;
  color: #555;
  margin: 0 0 8mm 0;
}

h2 {
  font-size: 16pt;
  font-weight: 800;
  color: #E50914;
  margin: 8mm 0 3mm 0;
  padding-top: 2mm;
}

p {
  margin: 0 0 3mm 0;
  text-align: justify;
}

/* Code-cue paragraphs (start with →) — highlighted box, indented,
   slightly smaller, distinct background. */
p.cue {
  background: #fff7ed;
  border-left: 4px solid #F97316;
  padding: 3mm 5mm 3mm 5mm;
  margin: 3mm 0 3mm 0;
  font-size: 12pt;
  line-height: 1.5;
  page-break-inside: avoid;
}

/* Horizontal rule (underscore separators) */
hr {
  border: none;
  border-top: 1px dashed #ccc;
  margin: 8mm 0;
}

/* Standalone separator paragraphs (raw underscores) */
p.separator {
  text-align: center;
  color: #ccc;
  letter-spacing: 2px;
  margin: 6mm 0;
}

/* "And right away" emphasis sentence */
p em.urgent {
  background: #fef3c7;
  font-style: normal;
  padding: 0 2px;
}

code {
  font-family: "Liberation Mono", "DejaVu Sans Mono", monospace;
  font-size: 0.9em;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
  color: #b91c1c;
}

strong, b { color: #000; font-weight: 700; }
em, i { color: #444; }

/* Q&A bullets at the end (lines starting with —) */
p.qa {
  background: #f9fafb;
  border-left: 3px solid #9ca3af;
  padding: 2mm 4mm;
  margin: 2mm 0;
  font-size: 12pt;
}
"""


def post_process_html(html: str) -> str:
    """Tag paragraphs so CSS can style them differently:
    - lines starting with → become .cue
    - lines that are just underscores become .separator
    - lines starting with — (Q&A) become .qa
    """
    # Cue paragraphs
    html = re.sub(
        r'<p>→\s*',
        '<p class="cue">→ ',
        html,
    )
    # Q&A paragraphs (em dash bullets in the resume section)
    html = re.sub(
        r'<p>—\s*',
        '<p class="qa">— ',
        html,
    )
    # Underscore separators rendered as plain paragraphs
    html = re.sub(
        r'<p>_{10,}</p>',
        '<hr/>',
        html,
    )
    return html


def build_html() -> str:
    raw = SRC.read_text(encoding="utf-8")
    body = md.markdown(
        raw,
        extensions=["extra", "sane_lists"],
        output_format="html5",
    )
    body = post_process_html(body)
    return f"""<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>Bazinga · Розробник 2 — план захисту</title>
</head>
<body>
{body}
</body>
</html>"""


def main() -> None:
    html = build_html()
    HTML(string=html, base_url=str(ROOT)).write_pdf(
        target=str(OUT),
        stylesheets=[CSS(string=CSS_TEXT)],
    )
    print(f"wrote {OUT.name} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
