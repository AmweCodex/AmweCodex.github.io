#!/usr/bin/env node
/*
  scripts/new-post.mjs  ->  npm run new:blog
  ============================================================================
  Creates a new blog post: the markdown file, and its own image folder with
  a cover. You answer a few questions, check the summary, and confirm.

  Creates (names use underscores, never hyphens or spaces):
    src/content/blog/<Category folder>/<number_>title_slug.md
    public/images/blog/<Category folder>/<Title_Folder>/cover.png

  You pick the category from the list in src/data/blog_categories.mjs, for
  example "[ PLC-LAB ] Level 1 - Fundamentals", and the post is created
  inside the matching folder (PLC_LAB/Level_1_Fundamentals) for you.

  The post starts as a draft (hidden from the site) until you change
  `draft: true` to `draft: false`.
  ============================================================================
*/

import { scaffold } from './lib/scaffold.mjs';
import { nextRungLabel } from './lib/generate-cover-svg.mjs';

await scaffold({
  name: 'blog',
  heading: 'New blog post',
  noun: 'post',
  listField: 'tags',
  listQuestion: 'Tags',
  coverLabel: (_title, existingCount) => nextRungLabel(existingCount),
  body: () => '## Introduction\n\n',
});
