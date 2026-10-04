# AmweCodex portfolio (Astro)

Static portfolio and blog for Musawandile Shamase, deployed to GitHub Pages
at https://amwecodex.github.io/ on every push to `main`.

## Project conventions

- **Content is Markdown.** Blog posts, projects and certificates are `.md`
  files in `src/content/`, grouped in a folder per category (`PLC`,
  `PLC-LAB`, `Web-Development`). The folder only keeps files tidy; the site
  groups by the `category:` line in the frontmatter.
- **Images follow one layout.** Every post or project keeps ALL its images
  in its own folder, grouped by the same category:
  `public/images/<blog|projects>/<Category>/<Title-Folder>/` (the folder
  name is the title with hyphens). The cover is `cover.png` or `cover.jpg`
  in that folder. Markdown refers to images with a full path starting with a
  slash, e.g. `/images/blog/PLC/PLC-Timers/ton-timing.svg`, never `./file`.
- **Covers are JPG or PNG**, never WebP or SVG, because LinkedIn skips
  those in link previews. Keep covers around 1200 px wide.
- **Create new content with the scripts**, which follow the rules above:
  `npm run new:blog`, `npm run new:project`, `npm run new:certificate`.
  New items start as `draft: true`.
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
