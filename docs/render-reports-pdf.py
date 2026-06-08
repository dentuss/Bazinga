#!/usr/bin/env python3
"""
Render the bachelor's-report Markdown files to A4 PDFs styled after the
two reference documents (Times-like serif, justified body, centred chapter
headings, page numbers in the bottom-right).

Custom front page is rebuilt from the meta block at the top of each report
so it visually matches the reference, instead of dumping the markdown
front-matter as plain HTML.
"""
import re
import sys
from pathlib import Path

import markdown as md
from weasyprint import HTML, CSS

ROOT = Path(__file__).resolve().parent
DOCS = ROOT
OUT = ROOT


def parse_front_matter(text: str):
    """Pull title-page fields out of the leading markdown block.

    Returns a dict and the remaining body markdown (starting from
    "## АНОТАЦІЯ").
    """
    fm = {}
    # university line
    if m := re.search(r"\*\*(Приватний заклад[^\n]+?)\*\*", text):
        fm["institution_line1"] = m.group(1)
    if m := re.search(r"\*\*(Одеський технологічний університет[^\n]+?)\*\*", text):
        fm["institution_line2"] = m.group(1)
    if m := re.search(r"^(Кафедра[^\n]+?)$", text, re.M):
        fm["department"] = m.group(1)

    # project title — the H2 just above "на здобуття…" (separated by blank line in MD)
    if m := re.search(r"##\s+(.+?)\n+на здобуття", text):
        fm["project_title"] = m.group(1).strip()

    if m := re.search(r"(на здобуття[^\n]+)", text):
        fm["degree_line"] = m.group(1).strip()
    if m := re.search(r"(зі спеціальності[^\n]+)", text):
        fm["specialty_line"] = m.group(1).strip()

    # team table
    fm["team_rows"] = re.findall(
        r"^\| (\d) \| (.+?) \| (.+?) \| (.+?) \|$", text, re.M
    )

    if m := re.search(r"\*\*Автор звіту:\*\* (.+)", text):
        fm["author"] = m.group(1).strip()
    if m := re.search(r"\*\*Керівник:\*\* (.+)", text):
        fm["supervisor"] = m.group(1).strip()
    if m := re.search(r"^(Одеса – \d{4})$", text, re.M):
        fm["city_year"] = m.group(1).strip()

    body_start = text.find("## АНОТАЦІЯ")
    body = text[body_start:] if body_start >= 0 else text
    return fm, body


def render_front_page(fm: dict) -> str:
    rows = "".join(
        f"<tr><td>{n}</td><td>{name}</td><td>{role}</td><td>{group}</td></tr>"
        for n, name, role, group in fm.get("team_rows", [])
    )
    return f"""
<section class="frontpage">
  <header class="frontpage-header">
    <p>{fm.get('institution_line1', '')}</p>
    <p class="institution">{fm.get('institution_line2', '')}</p>
    <p>{fm.get('department', '')}</p>
  </header>
  <div class="frontpage-mid">
    <p class="work-type">випускна кваліфікаційна робота бакалавра</p>
    <p class="project-title"><b>{fm.get('project_title', '')}</b></p>
    <p>{fm.get('degree_line', '')}</p>
    <p>{fm.get('specialty_line', '')}</p>
  </div>
  <p class="team-caption">Виконавці проєкту:</p>
  <table class="team-table">
    <thead>
      <tr><th>№</th><th>П.І.Б.</th><th>Ролі</th><th>Група</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <p class="author-line">Автор звіту: {fm.get('author', '')}</p>
  <table class="supervisor-table">
    <tr><td>Керівник</td><td>{fm.get('supervisor', '')}</td></tr>
  </table>
  <p class="city-year">{fm.get('city_year', '')}</p>
</section>
""".strip()


CSS_TEXT = """
@page {
  size: A4;
  margin: 25mm 20mm 25mm 25mm;
  @bottom-right {
    content: counter(page);
    font-family: "Liberation Serif", "DejaVu Serif", serif;
    font-size: 10pt;
    color: #222;
  }
}
@page :first {
  @bottom-right { content: ""; }
}
html { font-size: 12pt; }
body {
  font-family: "Liberation Serif", "DejaVu Serif", serif;
  font-size: 12pt;
  line-height: 1.45;
  color: #111;
  text-align: justify;
  hyphens: auto;
}
p { margin: 0 0 0.55em 0; text-indent: 1.25cm; }
ul, ol { margin: 0.4em 0 0.8em 1.25cm; padding-left: 0; }
ul { list-style: none; }
ul > li { position: relative; padding-left: 1em; margin-bottom: 0.2em; }
ul > li::before {
  content: "●";
  position: absolute;
  left: 0;
  color: #111;
  font-size: 0.85em;
  top: 0.05em;
}
ol > li { margin-bottom: 0.2em; }
li > p { text-indent: 0; margin: 0; }
strong, b { font-weight: 700; }
em, i { font-style: italic; }
code {
  font-family: "Liberation Mono", "DejaVu Sans Mono", monospace;
  font-size: 0.9em;
  background: #f3f3f3;
  padding: 0 0.15em;
  border-radius: 2px;
}
a { color: #1a4a8a; text-decoration: none; word-break: break-all; }
h1, h2, h3 {
  font-weight: 700;
  text-align: center;
  page-break-after: avoid;
  text-transform: uppercase;
}
h1 { font-size: 14pt; margin: 0 0 1em 0; page-break-before: always; }
h2 {
  font-size: 13pt;
  margin: 1.4em 0 0.7em 0;
  page-break-before: always;
}
h3 {
  font-size: 12pt;
  margin: 1em 0 0.5em 0;
  text-transform: none;
  text-align: left;
}
h2 + p, h3 + p { text-indent: 0; }
table { border-collapse: collapse; margin: 0.6em auto; }
table.team-table, table.supervisor-table {
  width: 75%;
  font-size: 11pt;
}
table.team-table th, table.team-table td,
table.supervisor-table td {
  border: 1px solid #111;
  padding: 4px 8px;
  text-align: left;
}
table.team-table th { font-weight: 700; }

/* ---- front page ---------------------------------------------------- */
section.frontpage {
  page-break-after: always;
  text-align: center;
  height: 100%;
}
section.frontpage p { text-indent: 0; margin: 0.25em 0; }
.frontpage-header { margin: 30mm 0 30mm 0; }
.frontpage-header .institution { font-weight: 700; font-size: 13pt; }
.frontpage-mid { margin: 0 0 25mm 0; }
.frontpage-mid .work-type { margin-bottom: 1em; }
.frontpage-mid .project-title { font-size: 13pt; margin: 0.6em 0 1em 0; }
.team-caption { margin: 0 0 0.5em 0; font-weight: 400; }
.author-line { margin: 12mm 0 0 0; font-weight: 700; }
.supervisor-table { width: 75%; margin: 8mm auto; }
.city-year { margin: 25mm 0 0 0; }

/* avoid orphans / widows */
p, li { orphans: 3; widows: 3; }
"""


# Markdown's default produces <li><p>… for loose lists; tighten paragraph
# indent inside list items so the bullet hangs cleanly.
def md_to_html(body: str) -> str:
    extensions = ["extra", "sane_lists"]
    return md.markdown(body, extensions=extensions, output_format="html5")


def build_html(source_md: Path) -> str:
    text = source_md.read_text(encoding="utf-8")
    fm, body = parse_front_matter(text)
    front = render_front_page(fm)
    body_html = md_to_html(body)
    title = fm.get("project_title", source_md.stem)
    return f"""<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>{title}</title>
</head>
<body>
{front}
{body_html}
</body>
</html>"""


def render(source_md: Path, out_pdf: Path) -> None:
    html = build_html(source_md)
    HTML(string=html, base_url=str(source_md.parent)).write_pdf(
        target=str(out_pdf),
        stylesheets=[CSS(string=CSS_TEXT)],
    )
    print(f"wrote {out_pdf.name} ({out_pdf.stat().st_size // 1024} KB)")


def main(argv):
    if argv:
        sources = [Path(p) for p in argv]
    else:
        sources = sorted(DOCS.glob("bachelor-report-*.md"))
    for md_path in sources:
        out = md_path.with_suffix(".pdf")
        render(md_path, out)


if __name__ == "__main__":
    main(sys.argv[1:])
