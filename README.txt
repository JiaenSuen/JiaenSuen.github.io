JIAEN SUEN — ACADEMIC RESEARCH WEBSITE

Design direction
  Minimal academic personal website with a bright warm-white palette.
  The previous interactive research map has been removed in favor of a concise research-interest section.

Structure
  index.html
  css/style.css
  js/script.js
  data/picture.jpg

Run locally
  Open index.html directly in a browser, or serve the directory with any static HTTP server.

  Python example:
    python -m http.server 8000

  Then open:
    http://localhost:8000

Updating publication / project links
  Paper and GitHub links currently use placeholder anchors with aria-disabled="true".
  Replace href="#" with the real URL, remove aria-disabled="true", and remove the is-placeholder class.

Content layout
  Profile / affiliation
  Research interests
  Journal papers (ongoing)
  Conference papers
  Selected projects
  Education
