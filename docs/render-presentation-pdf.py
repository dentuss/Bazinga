#!/usr/bin/env python3
"""
Render the slide-deck Markdown (`presentation.md`) to a landscape A4 PDF.
Each `---` divider in the source starts a new slide. Mermaid diagrams under
`docs/diagrams/*.svg` get inlined verbatim into the page so the PDF doesn't
depend on an image fetch.
"""
from pathlib import Path
import re

import markdown as md
from weasyprint import HTML, CSS

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "presentation.md"
OUT = ROOT / "presentation.pdf"
DIAGRAMS = ROOT / "diagrams"


CSS_TEXT = """
@page {
  size: A4 landscape;
  margin: 15mm 18mm 14mm 18mm;
  background: #0a0a0a;
  @bottom-left {
    content: "Bazinga · Випускна кваліфікаційна робота · 2025";
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #888;
  }
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
    font-size: 9pt;
    color: #888;
  }
}
@page :first {
  background: linear-gradient(135deg, #0a0a0a 0%, #2a0a0a 100%);
  @bottom-left { content: ""; }
  @bottom-right { content: ""; }
}
html, body {
  background: #0a0a0a;
  color: #f0f0f0;
  font-family: "Liberation Sans", "DejaVu Sans", sans-serif;
  font-size: 13pt;
  line-height: 1.45;
  margin: 0;
}
.slide {
  page-break-after: always;
  min-height: 165mm;
}
.slide:last-child { page-break-after: auto; }

/* Title slide */
.slide.title {
  background: linear-gradient(135deg, #0a0a0a 0%, #2a0a0a 100%);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30mm 30mm;
}
.slide.title h1 {
  font-size: 72pt;
  font-weight: 900;
  letter-spacing: -3px;
  margin: 0;
  color: #E50914;
  text-shadow: 0 0 30px rgba(229, 9, 20, 0.45);
  border-bottom: none;
  display: block;
}
.slide.title h2 {
  font-size: 20pt;
  font-weight: 400;
  color: #d0d0d0;
  margin: 8mm 0 0 0;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.3;
}
.slide.title hr { display: none; }
.slide.title p {
  color: #999;
  font-size: 13pt;
  margin-top: 20mm;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

h1, h2, h3 {
  color: #ffffff;
  letter-spacing: -0.5px;
}
h1 {
  font-size: 22pt;
  font-weight: 900;
  margin: 0 0 4mm 0;
  padding-bottom: 3mm;
  border-bottom: 3px solid #E50914;
  display: inline-block;
}
h2 {
  font-size: 18pt;
  font-weight: 700;
  margin: 5mm 0 3mm 0;
  color: #E50914;
}
h3 {
  font-size: 14pt;
  font-weight: 700;
  margin: 4mm 0 2mm 0;
  color: #F97316;
}
p { margin: 0 0 2mm 0; }
ul, ol { margin: 1mm 0 3mm 8mm; padding: 0; }
li { margin-bottom: 1mm; }
strong, b { color: #ffffff; font-weight: 700; }
em, i { color: #F97316; font-style: italic; }
code {
  font-family: "Liberation Mono", "DejaVu Sans Mono", monospace;
  font-size: 0.85em;
  background: #1f1f1f;
  padding: 1px 4px;
  border-radius: 3px;
  color: #f5d4a0;
}
a { color: #F97316; text-decoration: none; word-break: break-all; }
hr { display: none; }

/* Diagrams: contain to slide, dark background */
img, svg {
  display: block;
  max-width: 100%;
  max-height: 110mm;
  margin: 3mm auto;
}

/* Three-column tech grid for the "Tools" slide */
.cols-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6mm;
}
"""


def slide_class_for(html: str) -> str:
    """Tag the title slide so we can style it differently."""
    if "title-marker" in html:
        return "slide title"
    return "slide"


def inline_svgs(html: str, source_dir: Path) -> str:
    """Replace <img src="diagrams/...svg"> tags with the SVG file contents,
    so the PDF is fully self-contained."""
    def replace(match: re.Match[str]) -> str:
        src = match.group(1)
        if not src.endswith(".svg"):
            return match.group(0)
        path = source_dir / src
        if not path.exists():
            return match.group(0)
        return path.read_text(encoding="utf-8")
    return re.sub(r'<img[^>]+src="([^"]+)"[^>]*/?>', replace, html)


def build_html() -> str:
    raw = SRC.read_text(encoding="utf-8")
    # Title-page heuristic: insert a marker into the first chunk so CSS can spot it.
    raw = raw.replace(
        "# Bazinga\n",
        "<div class='title-marker'></div>\n\n# Bazinga\n",
        1,
    )

    chunks = [c.strip() for c in raw.split("\n---\n") if c.strip()]
    slides_html: list[str] = []
    for chunk in chunks:
        body = md.markdown(
            chunk,
            extensions=["extra", "sane_lists", "md_in_html"],
            output_format="html5",
        )
        body = inline_svgs(body, ROOT)
        klass = slide_class_for(body)
        slides_html.append(f'<section class="{klass}">{body}</section>')

    body = "\n".join(slides_html)
    return f"""<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>Bazinga · Презентація</title>
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
