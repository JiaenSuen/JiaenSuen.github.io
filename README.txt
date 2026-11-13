JIAEN SUEN — ACADEMIC WEBSITE WITH AUTOMATIC PDF BLOG

The site remains a lightweight HTML/CSS website. The Blog index uses
GitHub Pages' built-in Jekyll support to detect PDF documents automatically.

UPLOAD A NEW ARTICLE (no scripts, JSON, or manual HTML editing)

  1. Open your GitHub Pages repository JiaenSuen/jiaensuen.github.io.
  2. Navigate to blog/posts/.
  3. Choose Add file > Upload files and drag in your PDF.
  4. Choose Commit changes.

After GitHub Pages builds the site, the PDF will be listed automatically:
  https://jiaensuen.github.io/blog/

The article title = PDF filename without .pdf.
PDFs open in a new tab. Renaming or deleting a PDF will automatically
update the list after the next build. Items are sorted by filename (Z to A).
You can upload several PDFs together.

ONE-TIME GITHUB PAGES CONFIGURATION

  Repository > Settings > Pages > Build and deployment:
  Source: Deploy from a branch
  Branch: main (or the repository's current publishing branch)
  Folder: /(root)

This Jekyll-based auto-index requires branch-based GitHub Pages publishing.
Do not add a .nojekyll file; remove any existing one from the publishing
root. If your repository already has a custom GitHub Actions deployment,
that workflow would need to perform the Jekyll build instead.

FILES
  index.html                            Original academic profile
  blog/index.html                       Automatically built /blog/ page
  blog/posts/*.pdf                      Your notes (just upload files)
  _config.yml                           Minimal Jekyll configuration
  css/style.css                         Shared styles
  js/script.js                          Mobile navigation and footer year
  data/picture.jpg                      Portrait

The legacy generate_index.py and posts.json have been removed. There is
no Python installation or manual metadata maintenance required.

LOCAL PREVIEW

Open the deployed GitHub Pages site to see the generated article list.
A plain `python -m http.server` or opening blog/index.html directly
will not evaluate the Jekyll template. To render locally, install Jekyll
and run: jekyll serve
