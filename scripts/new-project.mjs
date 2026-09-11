#!/usr/bin/env node
/*
  scripts/new-project.mjs
  ============================================================================
  Same idea as scripts/new-post.mjs (read that file's comments first if
  you haven't) — this one scaffolds a new PROJECT .md file instead of a
  blog post, plus a matching SVG cover labelled from the project title.

  HOW TO RUN IT
  ----------------------------------------------------------------------------
      npm run new:project

  It asks for the project title, category, tech stack, and summary, then
  creates the file at:

      src/content/projects/<category>/<slug>.md

  Putting it inside a folder named after the category is what keeps your
  files organised on disk — e.g. all "Engineering" projects sit together
  in src/content/projects/Engineering/. The website itself doesn't care
  which folder a file is in though; it groups projects using the
  `category:` field in the frontmatter, which this script fills in to
  match the folder automatically, so the two always stay in sync.
  ============================================================================
*/

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { generateCoverSvg, labelFromTitle } from './lib/generate-cover-svg.mjs';

const PROJECTS_DIR = new URL('../src/content/projects/', import.meta.url);
const COVERS_DIR = new URL('../public/images/projects/', import.meta.url);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\nLet's set up your new project.\n");

  const title = await rl.question('Project title: ');
  const category = await rl.question(
    'Category / folder (e.g. Engineering, Automation): '
  );
  const stackInput = await rl.question(
    'Tech stack, comma-separated (e.g. Arduino, C++, Sensors): '
  );
  const summary = await rl.question('One-sentence summary: ');

  rl.close();

  if (!title.trim() || !category.trim()) {
    console.error('\nA title and category are both needed — nothing was created.');
    process.exit(1);
  }

  const slug = slugify(title);
  const categoryFolder = category.trim();
  const stack = stackInput
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const fileContent = `---
title: "${title.trim()}"
category: "${categoryFolder}"
summary: "${summary.trim()}"
cover: "/images/projects/${slug}.svg"
stack: [${stack.map((item) => `"${item}"`).join(', ')}]
date: ${todayISODate()}
draft: true
---

## Overview

Write a short overview of the project here — what it does and why you
built it. Remove \`draft: true\` above once it's ready to go live — while
it's set to \`true\`, this project is hidden from /projects and the
homepage, so you can save your work-in-progress safely.

## How it works

## What I learned
`;

  const targetDir = new URL(`${categoryFolder}/`, PROJECTS_DIR);
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

  const filePath = new URL(`${slug}.md`, targetDir);

  if (existsSync(filePath)) {
    console.error(
      `\nsrc/content/projects/${categoryFolder}/${slug}.md already exists — nothing was overwritten.`
    );
    process.exit(1);
  }

  writeFileSync(filePath, fileContent, 'utf8');
  console.log(`\nCreated src/content/projects/${categoryFolder}/${slug}.md — open it and start writing.`);

  // ---- Cover image ---------------------------------------------------
  // Label is pulled straight from the title (e.g. "Cable Fault Detection
  // System" -> "CABLE FAULT") so it automatically relates to the topic —
  // see labelFromTitle() in lib/generate-cover-svg.mjs if you want to
  // tweak how it picks the words.
  const label = labelFromTitle(title.trim());
  const svgContent = generateCoverSvg(label, slug);

  if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });
  const coverPath = new URL(`${slug}.svg`, COVERS_DIR);

  if (existsSync(coverPath)) {
    console.log(`public/images/projects/${slug}.svg already exists — left it as-is.`);
  } else {
    writeFileSync(coverPath, svgContent, 'utf8');
    console.log(`Created public/images/projects/${slug}.svg (labelled "${label}") to match.`);
  }
}

main();
