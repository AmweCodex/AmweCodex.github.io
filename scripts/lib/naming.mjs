/*
  scripts/lib/naming.mjs
  ============================================================================
  Turns the words you type into the names used on disk. Every script uses
  these same functions, so a post's markdown file, image folder and
  frontmatter paths can never drift apart.

  One rule everywhere: words are joined with an underscore (_), never a
  hyphen or a space.

    Title     "Analog Tank - Pump Control"
    File      analog_tank_pump_control.md          (slugify)
    Folder    Analog_Tank_Pump_Control             (folderName)

    Category  "Web Development"
    Folder    Web_Development                      (categoryFolder)
  ============================================================================
*/

/** "My Great Title!" -> "my_great_title". Used for markdown file names. */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '') // drop punctuation
    .replace(/[\s-]+/g, '_') // spaces and hyphens -> underscores
    .replace(/_+/g, '_') // collapse repeated underscores
    .replace(/^_|_$/g, ''); // no underscore at either end
}

/**
 * "Analog Tank - Pump Control" -> "Analog_Tank_Pump_Control".
 * Same words as the title, separated by underscores, capital letters kept.
 * Used for the folder that holds every image of one post or project.
 */
export function folderName(text) {
  return text
    .trim()
    .replace(/[^A-Za-z0-9\s_-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** "Web Development" -> "Web_Development". */
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
