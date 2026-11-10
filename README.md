# AmweCodex.github.io

Personal portfolio and documenting blog for **Musawandile Shamase** (AmweCodex): engineering projects, and a PLC learning journey written up post by post.

Live site: https://amwecodex.github.io/

## Tech stack

- [Astro](https://astro.build) (static site, content collections)
- Markdown for every post, project and certificate
- Plain CSS (dark and light theme), reading-progress bar and back-to-top button on every page
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
npm run new:blog          # a blog post: pick the level, the file goes in the right folder
npm run new:project       # a project write-up
npm run new:certificate   # a certificate for the About page
```

New posts and projects start as `draft: true` (hidden from the site). Change it to `draft: false` when ready to publish.

The blog categories and their order live in `src/data/blog_categories.mjs`. Add a line there to add a new level or section.

## Folder layout

All names use underscores (no hyphens, no spaces).

```text
src/content/blog/PLC_LAB/Level_1_Fundamentals/1_motor_startstop_with_sealin.md
src/content/blog/PLC_LAB/Level_2_Intermediate/
src/content/blog/PLC_LAB/Level_3_Industrial_And_Capstone/
src/content/blog/PLC_BASICS/plc_timers.md
src/content/projects/<Category_Folder>/<title_slug>.md
src/content/certificates/<slug>.md

public/images/blog/PLC_LAB/Level_1_Fundamentals/Motor_StartStop_with_SealIn/
    cover.png, MAIN.png, io_map.svg, ...                   ALL images for that one post
```

In markdown, refer to images with a full path, e.g. `![Timing diagram](/images/blog/PLC_BASICS/PLC_Timers/ton_timing.svg)`.

Keep covers as JPG or PNG. LinkedIn skips WebP and SVG pictures in link previews.

## What the build produces

- `/sitemap-index.xml`: sitemap, built automatically (listed in `robots.txt`)
- `/rss.xml`: RSS feed of the blog
- `/404.html`: custom "page not found" page

## Contact

Use the links on the website.
