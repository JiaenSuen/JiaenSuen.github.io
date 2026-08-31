JIAEN SUEN — ACADEMIC RESEARCH WEBSITE

Structure
  index.html
  css/style.css
  css/research-map.css
  js/script.js
  js/research-map.js
  data/research-map.json

Run locally
  Because the research map loads JSON with fetch(), serve the directory through a static HTTP server instead of opening index.html with file://.

  Python example:
    python -m http.server 8000

  Then open:
    http://localhost:8000

Updating the research map
  Edit data/research-map.json. Node positions, labels, status, abstracts, domains, and links are data-driven.

Updating the site
  General layout/content: index.html
  Main site visual system: css/style.css
  Map-specific presentation: css/research-map.css
  Navigation behavior: js/script.js
  Map interaction/rendering: js/research-map.js
