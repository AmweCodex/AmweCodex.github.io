/*
  scripts/lib/naming.mjs
  ============================================================================
  Turns the words you type into the names used on disk. Every script uses
  these same functions, so a post's markdown file, image folder and
  frontmatter paths can never drift apart.

    Title     "Analog Tank - Pump Control"
    File      analog-tank-pump-control.md          (slugify)
    Folder    Analog-Tank-Pump-Control             (folderName)

    Category  "PLC LAB"
    Folder    PLC-LAB                              (categoryFolder)
  ============================================================================
*/

/** "My Great Title!" -> "my-great-title". Used for markdown file names. */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop punctuation
    .replace(/\s+/g, '-') // spaces -> hyphens
    .replace(/-+/g, '-') // collapse repeated hyphens
    .replace(/^-|-$/g, ''); // no hyphen at either end
}

/**
 * "Analog Tank - Pump Control" -> "Analog-Tank-Pump-Control".
 * Same words as the title, separated by hyphens, capital letters kept.
 * Used for the folder that holds every image of one post or project.
 */
export function folderName(text) {
  return text
    .trim()
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "PLC LAB" -> "PLC-LAB", "Web Development" -> "Web-Development". */
export function categoryFolder(label) {
  return folderName(label);
}

/** Today's date as YYYY-MM-DD, which is what the `date:` field wants. */
export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

/** Splits "a, b, c" into ["a", "b", "c"], dropping empty items. */
export function splitList(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** ["a", "b"] -> `["a", "b"]` (one tidy line of YAML). */
export function yamlList(items) {
  return `[${items.map((item) => JSON.stringify(item)).join(', ')}]`;
}
