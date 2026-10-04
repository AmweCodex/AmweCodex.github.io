/*
  scripts/lib/scaffold.mjs
  ============================================================================
  The shared engine behind `npm run new:blog` and `npm run new:project`.
  Both scripts only describe WHAT they create; this file does the asking,
  checking and writing, so the two always behave the same way.

  Everything for one post or project lives in its own folder, and both the
  markdown and the images are grouped by category:

    src/content/<kind>/<Category>/<title-slug>.md
    public/images/<kind>/<Category>/<Title-Folder>/cover.png
    public/images/<kind>/<Category>/<Title-Folder>/...every other image
  ============================================================================
*/

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CancelledError, createPrompter } from './prompts.mjs';
import { categoryFolder, folderName, slugify, splitList, todayISODate, yamlList } from './naming.mjs';
import { generateCoverSvg, saveCover } from './generate-cover-svg.mjs';

const ROOT = new URL('../../', import.meta.url);

/** Folders inside `dir` (one per category). */
function subfolders(dir) {
  return existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    : [];
}

/** Every .md file under `dir`, including sub-folders. */
function markdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    return entry.isDirectory() ? markdownFiles(child) : entry.name.endsWith('.md') ? [child] : [];
  });
}

/**
 * The categories already in use, as shown on the site ("PLC LAB", not the
 * folder name "PLC-LAB"). Read from the `category:` line of the first file
 * in each folder; falls back to the folder name.
 */
function existingCategories(contentDir) {
  return subfolders(contentDir).map((folder) => {
    const [first] = markdownFiles(new URL(`${folder.name}/`, contentDir));
    const match = first && readFileSync(first, 'utf8').match(/^category:\s*"?([^"\r\n]+)"?/m);
    return match ? match[1].trim() : folder.name.replace(/-/g, ' ');
  });
}

const relative = (url) => fileURLToPath(url).replace(fileURLToPath(ROOT), '').replace(/\\/g, '/');

/**
 * @param {object} kind
 * @param {'blog'|'projects'} kind.name
 * @param {string} kind.heading        e.g. "New blog post"
 * @param {string} kind.noun           e.g. "post"
 * @param {string} kind.listField      "tags" for blog, "stack" for projects
 * @param {string} kind.listQuestion   The question shown for that list
 * @param {(title: string, existingCount: number) => string} kind.coverLabel
 * @param {(context: object) => string} kind.body   Starter text under the frontmatter
 */
export async function scaffold(kind) {
  const contentDir = new URL(`src/content/${kind.name}/`, ROOT);
  const imagesDir = new URL(`public/images/${kind.name}/`, ROOT);
  const prompt = createPrompter();

  try {
    prompt.heading(kind.heading);

    // ---- Questions ---------------------------------------------------------
    prompt.section('Required');
    const title = await prompt.askRequired('Title');
    const category = await prompt.chooseCategory(existingCategories(contentDir));
    prompt.section('Optional (press Enter to skip)');
    const list = splitList(await prompt.ask(kind.listQuestion, { hint: 'comma-separated' }));
    const summary = await prompt.ask('Summary', { hint: 'one sentence' });

    // ---- Work out every name once ---------------------------------------
    const slug = slugify(title);
    const catFolder = categoryFolder(category);
    const imageFolder = folderName(title);
    if (!slug || !catFolder || !imageFolder) {
      console.error('\nThe title and category must contain letters or numbers. Nothing was created.');
      return;
    }

    const markdownUrl = new URL(`${catFolder}/${slug}.md`, contentDir);
    const imageFolderUrl = new URL(`${catFolder}/${imageFolder}/`, imagesDir);
    const imageWebPath = `/images/${kind.name}/${catFolder}/${imageFolder}`;

    // Never overwrite anything that already exists.
    for (const url of [markdownUrl, imageFolderUrl]) {
      if (existsSync(url)) {
        console.error(`\n${relative(url)} already exists. Nothing was changed.`);
        return;
      }
    }

    // ---- Confirm -----------------------------------------------------------
    const confirmed = await prompt.confirm([
      ['Title', title],
      ['Category', category],
      ['Markdown file', relative(markdownUrl)],
      ['Image folder', relative(imageFolderUrl)],
    ]);
    if (!confirmed) {
      console.log('\nCancelled. Nothing was created.\n');
      return;
    }

    // ---- Create ------------------------------------------------------------
    console.log('');
    mkdirSync(imageFolderUrl, { recursive: true });

    // Count BEFORE writing, so the new post gets the next number.
    const existingCount = markdownFiles(contentDir).length;
    const svg = generateCoverSvg(kind.coverLabel(title, existingCount), slug);
    const coverFile = await saveCover(svg, imageFolderUrl);
    prompt.done('Created', `${relative(imageFolderUrl)}${coverFile}`);

    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `category: ${JSON.stringify(category)}`,
      `summary: ${JSON.stringify(summary)}`,
      `cover: ${JSON.stringify(`${imageWebPath}/${coverFile}`)}`,
      `${kind.listField}: ${yamlList(list)}`,
      `date: ${todayISODate()}`,
      'draft: true',
      '---',
      '',
    ].join('\n');

    mkdirSync(new URL('./', markdownUrl), { recursive: true });
    writeFileSync(markdownUrl, `${frontmatter}\n${kind.body({ title })}`, 'utf8');
    prompt.done('Created', relative(markdownUrl));

    // ---- Next steps ----------------------------------------------------------
    prompt.nextSteps([
      `Put every image for this ${kind.noun} in ${relative(imageFolderUrl)}`,
      `Refer to them as ${imageWebPath}/<file-name> (always start with a slash)`,
      `Write the ${kind.noun} in ${relative(markdownUrl)}`,
      'Change "draft: true" to "draft: false" when it is ready to publish',
      'Run "npm run dev" to preview it',
    ]);
  } catch (error) {
    if (error instanceof CancelledError) {
      console.log('\n\nCancelled. Nothing was created.\n');
      return;
    }
    throw error;
  } finally {
    prompt.close();
  }
}
