#!/usr/bin/env python3
"""Regenerate the static blog index from PDF filenames (Python standard library only).

Usage from the website root:
    python blog/generate_index.py

GitHub Pages does not automatically list files in a folder, so run this
whenever you add, rename, or remove PDFs in blog/posts/.
"""
from __future__ import annotations
import html
import json
from pathlib import Path
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
POSTS = ROOT / "posts"
INDEX = ROOT / "index.html"
METADATA = ROOT / "posts.json"
START = "<!-- BLOG_POSTS_START -->"
END = "<!-- BLOG_POSTS_END -->"


def natural_sort_key(path: Path):
    return [(1, int(x)) if x.isdigit() else (0, x.casefold())
            for x in re.split(r"(\d+)", path.stem)]


def build_entry(path: Path, entry: dict) -> str:
    title = html.escape(path.stem)
    src = "posts/" + quote(path.name)
    url = html.escape(src, quote=True)
    topic = html.escape(str(entry.get("category") or "Research Note"))
    pages = entry.get("pages")
    page_text = f"PDF · {int(pages)} pages" if isinstance(pages, int) and pages > 0 else "PDF"
    summary = str(entry.get("description") or "Research note in PDF format.")
    summary = html.escape(summary)
    return f"""          <article class="blog-post">
            <div>
              <p class="blog-post-meta"><span>{topic}</span><span>{page_text}</span></p>
              <h2><a href="{url}" target="_blank" rel="noopener noreferrer">{title}</a></h2>
              <p class="blog-post-summary">{summary}</p>
            </div>
            <div class="blog-post-actions">
              <a class="action-link" href="{url}" target="_blank" rel="noopener noreferrer" aria-label="Read {title} as PDF">Read PDF <span aria-hidden="true">↗</span></a>
            </div>
          </article>"""


def main():
    metadata = json.loads(METADATA.read_text(encoding="utf-8")) if METADATA.exists() else {}
    pdfs = sorted(POSTS.glob("*.pdf"), key=natural_sort_key, reverse=True)
    entries = "\n".join(build_entry(path, metadata.get(path.stem, {})) for path in pdfs)
    if not entries:
        entries = '          <p class="blog-hint">No notes published yet.</p>'
    document = INDEX.read_text(encoding="utf-8")
    assert document.count(START) == 1 and document.count(END) == 1
    left, middle = document.split(START, 1)
    _, right = middle.split(END, 1)
    INDEX.write_text(left + START + "\n" + entries + "\n            " + END + right, encoding="utf-8")
    print(f"Indexed {len(pdfs)} PDF post(s) in {INDEX}")


if __name__ == "__main__":
    main()
