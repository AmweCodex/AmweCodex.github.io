#!/usr/bin/env node
/*
  scripts/new-project.mjs  ->  npm run new:project
  ============================================================================
  Creates a new project write-up: the markdown file, and its own image
  folder with a cover. Works exactly like new-post.mjs.

  Creates:
    src/content/projects/<Category>/<title-slug>.md
    public/images/projects/<Category>/<Title-Folder>/cover.png

  The project starts as a draft (hidden from the site) until you change
  `draft: true` to `draft: false`.
  ============================================================================
*/

import { scaffold } from './lib/scaffold.mjs';
import { labelFromTitle } from './lib/generate-cover-svg.mjs';

await scaffold({
  name: 'projects',
  heading: 'New project',
  noun: 'project',
  listField: 'stack',
  listQuestion: 'Tech stack',
  coverLabel: (title) => labelFromTitle(title),
  body: () => '## Overview\n\n## How it works\n\n## What I learned\n',
});
