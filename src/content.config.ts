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

// ---- Projects -------------------------------------------------------------
const projects = defineCollection({
  // `glob` tells Astro: "every .md file ANYWHERE under src/content/projects/
  // (including subfolders, thanks to **) is one entry in this collection."
  // This is what lets you organise projects into folders — e.g.
  // src/content/projects/Engineering/foo.md and
  // src/content/projects/Automation/bar.md — Astro still treats both as
  // one flat "projects" collection; the folder is just for YOUR tidiness.
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
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
    // Path to the cover image, relative to /public — e.g. "/images/projects/foo.svg"
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
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    // Groups this post into a topic section on /blog — e.g. "PLC",
    // "Electronics", "Career". One category per post, so every post has
    // a clear "home" section. Use `tags` below for extra, more specific
    // labels shown as chips on the card (a post can have several tags,
    // but only ONE category).
    category: z.string(),
    // Short summary shown on the BLOG CARD (listing + homepage)
    summary: z.string(),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/certificates' }),
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
    // e.g. "/images/certificates/plc-fundamentals-level-1.jpg"
    image: z.string(),
    // Optional: the provider's public page that proves the certificate is real
    link: z.string().url().optional(),
    // Optional: the PDF copy, relative to /public,
    // e.g. "/certificates/plc-fundamentals-level-1.pdf"
    pdf: z.string().optional(),
    // Optional chips shown on the card, e.g. ["Ladder Logic", "HMI"]
    skills: z.array(z.string()).default([]),
    // Set draft: true to hide a certificate without deleting it
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog, certificates };
