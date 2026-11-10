# AmweCodex portfolio (Astro)

Static portfolio and blog for Musawandile Shamase, deployed to GitHub Pages
at https://amwecodex.github.io/ on every push to `main`.

## Project conventions

- **Content is Markdown.** Blog posts, projects and certificates are `.md`
  files in `src/content/`, grouped in a folder per category. For the blog the
  folders are listed in `src/data/blog_categories.mjs`:
  `PLC_LAB/Level_1_Fundamentals`, `PLC_LAB/Level_2_Intermediate`,
  `PLC_LAB/Level_3_Industrial_And_Capstone` and `PLC_BASICS`. The site groups
  by the `category:` line in the frontmatter (which must match the label in
  that file, e.g. `[ PLC-LAB ] Level 1 - Fundamentals`).
- **Names use underscores.** Never hyphens or spaces in file and folder names
  (`1_motor_startstop_with_sealin.md`, `Motor_StartStop_with_SealIn/`,
  `io_map.svg`). Page addresses on the site are still hyphenated; the
  conversion happens in `src/content.config.ts` (`pageId`).
- **Level posts are numbered.** Files in a PLC_LAB level start with the problem
  number (`1_`, `2_`, ...) so the folder stays in order. The number is not
  part of the page address.
- **Images follow one layout.** Every post or project keeps ALL its images
  in its own folder, mirrored on the content folders:
  `public/images/<blog|projects>/<Category folder>/<Title_Folder>/`, e.g.
  `public/images/blog/PLC_LAB/Level_1_Fundamentals/Box_Counter/`. The cover is
  `cover.png` or `cover.jpg` in that folder. Markdown refers to images with a
  full path starting with a slash, e.g.
  `/images/blog/PLC_BASICS/PLC_Timers/ton_timing.svg`, never `./file`.
- **Covers are JPG or PNG**, never WebP or SVG, because LinkedIn skips
  those in link previews. Keep covers around 1200 px wide.
- **Create new content with the scripts**, which follow the rules above:
  `npm run new:blog` (pick the level and the post lands in the right folder),
  `npm run new:project`, `npm run new:certificate`. New items start as
  `draft: true`.
- **Page furniture.** A reading-progress bar (`ScrollProgress.astro`) and a
  back-to-top button (`BackToTop.astro`) are added to every page by
  `Layout.astro`.
- **Spelling:** simple South African English.
- **Line endings:** LF (see `.gitattributes` and `.editorconfig`).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
