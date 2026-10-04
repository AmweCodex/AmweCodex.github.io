#!/usr/bin/env node
/*
  scripts/new-post.mjs  ->  npm run new:blog
  ============================================================================
  Creates a new blog post: the markdown file, and its own image folder with
  a cover. You answer a few questions, check the summary, and confirm.

  Creates:
    src/content/blog/<Category>/<title-slug>.md
    public/images/blog/<Category>/<Title-Folder>/cover.png

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
