/*
  scripts/lib/generate-cover-svg.mjs
  ============================================================================
  Generates a cover image in the same style as the site: dark navy gradient,
  a soft teal glow, faint circuit-board lines, teal "signal" dots and a
  centred monospace label.

  Used by new-post.mjs and new-project.mjs, so a fix here fixes both.

  saveCover() writes the cover as cover.png. LinkedIn and some other sites
  skip SVG pictures in link previews, so a PNG is the safe choice. If the
  `sharp` image tool is not installed, it falls back to cover.svg.
  ============================================================================
*/

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The site palette, copied from src/styles/global.css.
const BG_START = '#141d2b';
const BG_END = '#1a2331';
const TEAL = '#07e9b4';
const LINE_COLOR = '#4a5466';
const TEXT_COLOR = '#cad2e2';

const WIDTH = 800;
const HEIGHT = 450;

/** Random whole number between min and max. */
function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/** A handful of short random line segments, like circuit-board traces. */
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

/** A handful of small teal "signal" dots. */
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
 * Builds the SVG markup as a string.
 * @param {string} label     Short UPPERCASE text shown in the middle.
 * @param {string} idSuffix  Any unique text (we use the slug), added to the
 *                           gradient ids so two covers never share an id.
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

/**
 * Saves the cover into `folderUrl` and returns the file name it used
 * ("cover.png", or "cover.svg" if PNG conversion is not possible).
 * @param {string} svg        The markup from generateCoverSvg().
 * @param {URL} folderUrl     The post's own image folder (must end in "/").
 */
export async function saveCover(svg, folderUrl) {
  try {
    const { default: sharp } = await import('sharp');
    await sharp(Buffer.from(svg), { density: 192 })
      .resize({ width: 1200 })
      .png({ compressionLevel: 9 })
      .toFile(fileURLToPath(new URL('cover.png', folderUrl)));
    return 'cover.png';
  } catch {
    writeFileSync(new URL('cover.svg', folderUrl), svg, 'utf8');
    return 'cover.svg';
  }
}

/*
  ---- Label helpers --------------------------------------------------------
  These decide what text goes on the cover.
------------------------------------------------------------------------- */

/** Blog covers use "RUNG 00N", matching the ladder-logic theme. */
export function nextRungLabel(existingPostCount) {
  return `RUNG ${String(existingPostCount + 1).padStart(3, '0')}`;
}

// Words that add little on a small label, so they are skipped.
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'system', 'project', 'my', 'of', 'in', 'on', 'to',
]);

/**
 * Project covers get a short label from the title, e.g.
 * "Cable Fault Detection System" -> "CABLE FAULT" (two words at most).
 */
export function labelFromTitle(title) {
  const words = title.split(/\s+/).filter((word) => word && !FILLER_WORDS.has(word.toLowerCase()));
  const chosen = (words.length > 0 ? words : title.split(/\s+/)).slice(0, 2);
  return chosen.join(' ').toUpperCase();
}
