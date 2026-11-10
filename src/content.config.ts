// src/content.config.ts
// ============================================================================
// This file defines your three "content collections": projects, blog and certificates.
// A collection is just a folder of markdown files (src/content/projects/ and
// src/content/blog/) that all share the same frontmatter shape.
//
// WHY THIS MATTERS FOR YOU: once a collection is defined here, adding a new
// project or blog post is just adding a new .md file to the folder — you
// never touch any .astro/HTML code. The listing pages and homepage preview
// automatically pick it up.
//
// `schema` below is the checklist every markdown file's frontmatter (the
// ---fenced block at the top of the file) must satisfy. If you forget a
// required field, Astro will show you a clear error when you run the site,
// instead of silently breaking.
// ============================================================================

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---- Page addresses (URLs) -------------------------------------------------
// Files and folders use underscores (1_motor_start.md, Level_1_Fundamentals/),
// but the address in the browser uses hyphens, which search engines read as
// word breaks:
//   PLC_LAB/Level_1_Fundamentals/1_motor_startstop.md
//   ->  /blog/plc-lab/level-1-fundamentals/motor-startstop
// A leading problem number ("1_") is dropped from the address.
// To keep underscores in addresses instead, change this function to
// `return entry.replace(/\.md$/, '').toLowerCase();`
function pageId({ entry }: { entry: string }) {
  const parts = entry.replace(/\.md$/, '').split('/');
  return parts
    .map((part, index) => {
      const clean = part.toLowerCase().replace(/[_\s]+/g, '-');
      return index === parts.length - 1 ? clean.replace(/^\d+-/, '') : clean;
    })
    .join('/');
}

// ---- Projects -------------------------------------------------------------
const projects = defineCollection({
  // `glob` tells Astro: "every .md file ANYWHERE under src/content/projects/
  // (including subfolders, thanks to **) is one entry in this collection."
  // This is what lets you organise projects into folders — e.g.
  // src/content/projects/Engineering/foo.md and
  // src/content/projects/Automation/bar.md — Astro still treats both as
  // one flat "projects" collection; the folder is just for YOUR tidiness.
  loader: glob({ pattern: '**/*.md', base: './src/content/projects', generateId: pageId }),
  schema: z.object({
    title: z.string(),
    // Groups this project on the /projects page — e.g. "Engineering",
    // "Automation", "Electronics". This is what actually drives the
    // separated sections on the website (NOT the folder name) — the
    // folder is just how the files sit on your disk. This field was
    // missing from the schema before, which is why category filtering
    // wasn't working: your .md files already had `category:` in their
    // frontmatter, but Astro was silently dropping it because it wasn't
    // declared here.
    category: z.string(),
    // Short 1-2 sentence blurb shown on the PROJECT CARD (listing + homepage)
    summary: z.string(),
    // Path to the cover image, relative to /public. Every project keeps ALL its
    // images in its own folder, grouped by category, with the cover called
    // "cover" — e.g. "/images/projects/Web_Development/My_Project/cover.png".
    // (`npm run new:project` creates the folder and the cover for you.)
    cover: z.string(),
    // Tech-stack chips shown on the card, e.g. ["Arduino", "C++"]
    stack: z.array(z.string()).default([]),
    date: z.coerce.date(),
    // Set draft: true on a project to hide it from listings without deleting it
    draft: z.boolean().default(false),
  }),
});

// ---- Blog -------------------------------------------------------------
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: pageId }),
  schema: z.object({
    title: z.string(),
    // Groups this post into a section on /blog. Use the exact label from
    // src/data/blog_categories.mjs, e.g. "[ PLC-LAB ] Level 1 - Fundamentals"
    // (`npm run new:blog` fills it in for you). One category per post. Use `tags` below for extra, more specific
    // labels shown as chips on the card (a post can have several tags,
    // but only ONE category).
    category: z.string(),
    // Short summary shown on the BLOG CARD (listing + homepage)
    summary: z.string(),
    // Same rule as projects: "/images/blog/<Category-Folder>/<Post_Folder>/cover.png".
    // Use JPG or PNG for covers, because LinkedIn skips WebP and SVG previews.
    cover: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

// ---- Certificates ---------------------------------------------------------
// One .md file per certificate in src/content/certificates/. The About page
// reads this collection and draws a card for each one, newest first, so
// adding a certificate never means touching any .astro code.
const certificates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/certificates', generateId: pageId }),
  schema: z.object({
    // Name of the certificate, e.g. "PLC Fundamentals (Level I)"
    title: z.string(),
    // Who issued it, e.g. "PLC Dojo"
    provider: z.string(),
    // Date it was issued (YYYY-MM-DD)
    date: z.coerce.date(),
    // One or two sentences on what the certificate covers
    summary: z.string(),
    // Picture of the certificate, relative to /public,
    // e.g. "/images/certificates/plc_fundamentals_level_1.jpg"
    image: z.string(),
    // Optional: the provider's public page that proves the certificate is real
    link: z.string().url().optional(),
    // Optional: the PDF copy, relative to /public,
    // e.g. "/certificates/plc_fundamentals_level_1.pdf"
    pdf: z.string().optional(),
    // Optional chips shown on the card, e.g. ["Ladder Logic", "HMI"]
    skills: z.array(z.string()).default([]),
    // Set draft: true to hide a certificate without deleting it
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog, certificates };
