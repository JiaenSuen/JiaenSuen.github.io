JIAEN SUEN — ACADEMIC RESEARCH WEBSITE

This is a static HTML/CSS/JS website suitable for GitHub Pages.

Site structure
  index.html                    Main academic profile
  blog/index.html               Blog page at /blog/
  blog/posts/                   PDF articles (filenames become article titles)
  blog/posts.json               Optional article descriptions, categories, page counts
  blog/generate_index.py        Rebuild the blog index from PDF files
  css/style.css                 Shared styles
  js/script.js                  Mobile navigation / footer year
  data/picture.jpg              Profile portrait

Preview locally
  python -m http.server 8000
  Open http://localhost:8000/ and http://localhost:8000/blog/

Publish on GitHub Pages
  Upload the *contents* of this ZIP to the root of JiaenSuen's
  GitHub Pages repository, preserving the folder structure.
  The blog will be available at https://jiaensuen.github.io/blog/
  once GitHub Pages has deployed the new site.

Add a new PDF blog article
  1. Copy the PDF into blog/posts/. Example: My New Note.pdf
  2. Optional: add an entry with key "My New Note" to blog/posts.json
     to set a category, short description, and number of pages.
  3. From the website root, run: python blog/generate_index.py
  4. Upload/commit the new PDF and updated blog/index.html.

The article title automatically comes from the PDF filename without
its .pdf extension. On the blog page, PDF links open in a new tab.
No LaTeX rendering pipeline or third-party dependencies are required.

GitHub Pages is a static host and cannot automatically discover PDF
files in a folder. Running generate_index.py refreshes the listing.

Updating publication / project links
  Unavailable links use href="#" with aria-disabled="true" and class
  "is-placeholder". Replace the URL and remove these attributes.
