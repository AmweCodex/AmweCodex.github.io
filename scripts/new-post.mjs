#!/usr/bin/env node
/*
  scripts/new-post.mjs
  ============================================================================
  WHAT THIS IS FOR
  ----------------------------------------------------------------------------
  Run this from your terminal BEFORE you start writing a new blog post. It
  asks you a few quick questions (title, topic, tags, summary) and then
  creates a ready-to-edit .md file in src/content/blog/, with the
  frontmatter template already filled in for you — plus a matching SVG
  cover image (same circuit-board style as your existing covers, labelled
  "RUNG 00N" to match the site's ladder-logic theme) — so you never have
  to remember the exact field names, hunt for a cover image, or copy-paste
  an old post as a starting point again.

  HOW TO RUN IT
  ----------------------------------------------------------------------------
  From the project root, in your terminal:

      npm run new:blog

  It will ask you questions one at a time. Answer them, press Enter after
  each one, and a new file appears in src/content/blog/ when you're done.

  HOW IT WORKS (brief, for your own learning)
  ----------------------------------------------------------------------------
  - `readline` is a built-in Node module for reading terminal input line by
    line — no extra packages needed.
  - We turn your title into a "slug" (a URL-safe, lowercase-with-hyphens
    version) for the filename, e.g. "My New Post!" -> "my-new-post".
  - We refuse to overwrite a file that already exists, so running this
    twice by accident can't destroy a post you've already written.
  ============================================================================
*/

import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { generateCoverSvg, nextRungLabel } from './lib/generate-cover-svg.mjs';

const BLOG_DIR = new URL('../src/content/blog/', import.meta.url);
const COVERS_DIR = new URL('../public/images/blog/', import.meta.url);

/** Turns "My Great Title!" into "my-great-title" for use as a filename. */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop anything that isn't a letter/number/space/hyphen
    .replace(/\s+/g, '-') // spaces -> hyphens
    .replace(/-+/g, '-'); // collapse repeated hyphens
}

/** Today's date as YYYY-MM-DD, which is exactly what the `date:` field wants. */
function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\nLet's set up your new blog post.\n");

  const title = await rl.question('Post title: ');
  const category = await rl.question(
    'Topic/category (e.g. PLC, Electronics, Career): '
  );
  const tagsInput = await rl.question(
    'Tags, comma-separated (e.g. PLC, Timers, Fundamentals): '
  );
  const summary = await rl.question('One-sentence summary: ');

  rl.close();

  if (!title.trim()) {
    console.error('\nA title is needed — nothing was created.');
    process.exit(1);
  }

  const slug = slugify(title);
  const categoryFolder = category.trim();
  const tags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  // Build the frontmatter + a starter body, in the same shape as your
  // existing posts, so every post stays consistent without you having to
  // remember the format each time.
  const fileContent = `---
title: "${title.trim()}"
category: "${categoryFolder || 'PLC'}"
summary: "${summary.trim()}"
cover: "/images/blog/${slug}.svg"
tags: [${tags.map((tag) => `"${tag}"`).join(', ')}]
date: ${todayISODate()}
draft: true
---

Write your post here. Remove \`draft: true\` above once it's ready to go
live — while it's set to \`true\`, this post is hidden from /blog and the
homepage, so you can save your work-in-progress safely.
`;
  const targetDir = new URL(`${categoryFolder}/`, BLOG_DIR);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  const filePath = new URL(`${slug}.md`, targetDir);

  if (existsSync(filePath)) {
    console.error(`\nsrc/content/blog/${categoryFolder}/${slug}.md already exists — nothing was overwritten.`);
    process.exit(1);
  }

  // Count existing posts BEFORE writing the new one, so the "RUNG 00N"
  // number below is correct — e.g. with 3 existing posts already on
  // disk, this new one becomes RUNG 004. (Counting AFTER the write would
  // include the new file itself and number it one too high.)
  const existingPostCount = readdirSync(BLOG_DIR).filter((file) => file.endsWith('.md')).length;

  writeFileSync(filePath, fileContent, 'utf8');
  console.log(`\nCreated src/content/blog/${categoryFolder}/${slug}.md — open it and start writing.`);

  // ---- Cover image ---------------------------------------------------
  // "RUNG 00N" matches the ladder-logic theme used across the site —
  // this keeps the label synced automatically instead of you having to
  // pick a number yourself.
  const label = nextRungLabel(existingPostCount);
  const svgContent = generateCoverSvg(label, slug);

  if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });
  const coverPath = new URL(`${slug}.svg`, COVERS_DIR);

  if (existsSync(coverPath)) {
    console.log(`public/images/blog/${slug}.svg already exists — left it as-is.`);
  } else {
    writeFileSync(coverPath, svgContent, 'utf8');
    console.log(`Created public/images/blog/${slug}.svg (labelled "${label}") to match.`);
  }
}



main();
