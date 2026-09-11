/*
  scripts/lib/generate-cover-svg.mjs
  ============================================================================
  Generates a cover image in the SAME visual style as your existing ones
  (compare public/images/projects/cable-fault-detection.svg) — dark navy
  gradient background, a soft teal glow, a scatter of faint circuit-board
  lines and "signal" dots, and a centred monospace label.

  This is shared code used by BOTH scripts/new-post.mjs and
  scripts/new-project.mjs, so the two always look consistent and a fix
  here fixes both at once.
  ============================================================================
*/

// Your exact palette, copied from src/styles/global.css, so a generated
// cover never looks out of place next to a hand-made one.
const BG_START = '#141d2b';
const BG_END = '#1a2331';
const TEAL = '#07e9b4';
const LINE_COLOR = '#4a5466';
const TEXT_COLOR = '#cad2e2';

const WIDTH = 800;
const HEIGHT = 450;

/** Random number between min and max (inclusive-ish), rounded to whole pixels. */
function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/** A handful of short random line segments, echoing PCB trace routing. */
function randomLines(count) {
  let lines = '';
  for (let i = 0; i < count; i++) {
    const vertical = Math.random() > 0.5;
    const x1 = rand(20, WIDTH - 20);
    const y1 = rand(20, HEIGHT - 20);
    const length = rand(80, 220);
    const x2 = vertical ? x1 : Math.min(WIDTH - 20, x1 + length);
    const y2 = vertical ? Math.min(HEIGHT - 20, y1 + length) : y1;
    const opacity = (rand(13, 34) / 100).toFixed(2);
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE_COLOR}" stroke-width="2" opacity="${opacity}" />\n`;
  }
  return lines;
}

/** A handful of small teal "signal" dots scattered over the lines. */
function randomDots(count) {
  let dots = '';
  for (let i = 0; i < count; i++) {
    const cx = rand(20, WIDTH - 20);
    const cy = rand(20, HEIGHT - 20);
    const r = rand(3, 5);
    const opacity = (rand(50, 95) / 100).toFixed(2);
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TEAL}" opacity="${opacity}" />\n`;
  }
  return dots;
}

/**
 * Builds the full SVG markup as a string.
 * @param {string} label - Short, UPPERCASE text shown centred on the cover
 *   (e.g. "RUNG 004" for a blog post, "CABLE FAULT" for a project).
 * @param {string} idSuffix - A unique-ish string (we use the slug) mixed
 *   into the gradient ids, purely so two covers never accidentally share
 *   an id if they're ever inlined together.
 */
export function generateCoverSvg(label, idSuffix) {
  const safeSuffix = idSuffix.replace(/[^a-z0-9]/gi, '');
  const bgGradId = `bgGrad-${safeSuffix}`;
  const glowId = `glow-${safeSuffix}`;

  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${bgGradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG_START}" />
      <stop offset="100%" stop-color="${BG_END}" />
    </linearGradient>
    <radialGradient id="${glowId}" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${TEAL}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${TEAL}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#${bgGradId})" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#${glowId})" />
  ${randomLines(9)}
  ${randomDots(6)}
  <text x="${WIDTH / 2}" y="233" text-anchor="middle" font-family="monospace" font-size="22" fill="${TEXT_COLOR}" opacity="0.55" letter-spacing="2">${label}</text>
</svg>
`;
}

/*
  ---- Label helpers ---------------------------------------------------
  These decide WHAT text goes on the cover, so it "syncs with the topic"
  automatically instead of you having to think one up each time.
------------------------------------------------------------------------- */

/**
 * Blog covers use the site's "RUNG 00N" ladder-logic numbering — matching
 * your existing posts (RUNG 001, RUNG 002...). We work out the next
 * number by counting how many blog posts already exist.
 * @param {number} existingPostCount
 */
export function nextRungLabel(existingPostCount) {
  const number = String(existingPostCount + 1).padStart(3, '0');
  return `RUNG ${number}`;
}

// Generic words that don't carry much meaning on a small cover label —
// stripped out so the label focuses on the distinctive part of the title.
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'system', 'project', 'my',
  'of', 'in', 'on', 'to',
]);

/**
 * Project covers get a short UPPERCASE label pulled from the title, e.g.
 * "Cable Fault Detection System" -> "CABLE FAULT". Filler words are
 * dropped, and it's capped at two words so it fits the canvas cleanly.
 * @param {string} title
 */
export function labelFromTitle(title) {
  const words = title
    .split(/\s+/)
    .filter((word) => word && !FILLER_WORDS.has(word.toLowerCase()));

  const chosen = (words.length > 0 ? words : title.split(/\s+/)).slice(0, 2);
  return chosen.join(' ').toUpperCase();
}
