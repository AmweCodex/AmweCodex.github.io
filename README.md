# AmweCodex.github.io

Personal portfolio and documenting blog for **Musawandile Shamase** (AmweCodex): engineering projects, and a PLC learning journey written up post by post.

Live site: https://amwecodex.github.io/

## Tech stack

- [Astro](https://astro.build) (static site, content collections)
- Markdown for every post, project and certificate
- Plain CSS (dark and light theme)
- GitHub Pages, deployed by GitHub Actions on every push to `main`

## Run it locally

```bash
npm install
npm run dev       # preview at http://localhost:4321
npm run build     # build the site into dist/
```

Node 22.12 or newer is needed.

## Adding content

Use the scripts. Each one asks a few questions, shows a summary, and creates the files only after you confirm.

```bash
npm run new:blog          # a blog post
npm run new:project       # a project write-up
npm run new:certificate   # a certificate for the About page
```

New posts and projects start as `draft: true` (hidden from the site). Change it to `draft: false` when ready to publish.

## Folder layout

```text
src/content/<blog|projects>/<Category>/<title-slug>.md    the writing
public/images/<blog|projects>/<Category>/<Title-Folder>/  ALL images for that one post
    cover.png                                              the cover (cover.jpg also works)
    ladder-main.png, io-map.svg, ...                       every other image
src/content/certificates/<slug>.md                         one file per certificate
```

In markdown, refer to images with a full path, e.g. `![Timing diagram](/images/blog/PLC/PLC-Timers/ton-timing.svg)`.

Keep covers as JPG or PNG. LinkedIn skips WebP and SVG pictures in link previews.

## What the build produces

- `/sitemap-index.xml`: sitemap, built automatically (listed in `robots.txt`)
- `/rss.xml`: RSS feed of the blog
- `/404.html`: custom "page not found" page

## Contact

Use the links on the website.
