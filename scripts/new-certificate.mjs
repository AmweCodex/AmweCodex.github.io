#!/usr/bin/env node
/*
  scripts/new-certificate.mjs
  ============================================================================
  WHAT THIS IS FOR
  ----------------------------------------------------------------------------
  Run this when you earn a new certificate. It asks a few questions and
  creates the ready-to-edit .md file in src/content/certificates/, so the
  certificate shows up on the About page by itself.

  HOW TO RUN IT
  ----------------------------------------------------------------------------
  1. Put the files in place first (use the same short name for both):
       public/certificates/<short-name>.pdf         (the PDF copy)
       public/images/certificates/<short-name>.jpg  (a picture of it)
  2. From the project root, run:

       npm run new:certificate

  3. Answer the questions. When it asks for the short name, type the same
     name you used for the files, e.g. plc-fundamentals-level-2.
  ============================================================================
*/

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const CERT_DIR = new URL('../src/content/certificates/', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);

/** Turns "PLC Fundamentals (Level II)" into "plc-fundamentals-level-ii". */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Today's date as YYYY-MM-DD, which is what the `date:` field wants. */
function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\nLet's add a new certificate.\n");

  const title = await rl.question('Certificate title (e.g. PLC Fundamentals (Level II)): ');
  const provider = await rl.question('Issued by (e.g. PLC Dojo): ');
  const date = await rl.question(`Issue date, YYYY-MM-DD (press Enter for today, ${todayISODate()}): `);
  const summary = await rl.question('One or two sentences on what it covers: ');
  const skillsInput = await rl.question('Skills, comma-separated (optional): ');
  const link = await rl.question("Provider's verification link (optional, press Enter to skip): ");
  const shortNameInput = await rl.question(`Short file name (press Enter for "${slugify(title)}"): `);

  rl.close();

  if (!title.trim()) {
    console.error('\nA title is needed — nothing was created.');
    process.exit(1);
  }

  const slug = slugify(shortNameInput) || slugify(title);
  const skills = skillsInput
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  // The PDF is optional, so only point to it if you've already added it.
  const hasPdf = existsSync(new URL(`certificates/${slug}.pdf`, PUBLIC_DIR));
  const hasImage = existsSync(new URL(`images/certificates/${slug}.jpg`, PUBLIC_DIR));

  const lines = [
    '---',
    `title: "${title.trim()}"`,
    `provider: "${provider.trim()}"`,
    `date: ${date.trim() || todayISODate()}`,
    `summary: "${summary.trim()}"`,
    `image: "/images/certificates/${slug}.jpg"`,
    link.trim() ? `link: "${link.trim()}"` : null,
    hasPdf ? `pdf: "/certificates/${slug}.pdf"` : null,
    `skills: [${skills.map((skill) => `"${skill}"`).join(', ')}]`,
    'draft: false',
    '---',
    '',
  ].filter((line) => line !== null);

  if (!existsSync(CERT_DIR)) mkdirSync(CERT_DIR, { recursive: true });
  const filePath = new URL(`${slug}.md`, CERT_DIR);

  // Never overwrite a certificate you already added.
  if (existsSync(filePath)) {
    console.error(`\nsrc/content/certificates/${slug}.md already exists — nothing was overwritten.`);
    process.exit(1);
  }

  writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`\nCreated src/content/certificates/${slug}.md`);

  if (!hasImage) {
    console.log(`Reminder: add the picture at public/images/certificates/${slug}.jpg`);
  }
  if (!hasPdf) {
    console.log(`Tip: add the PDF at public/certificates/${slug}.pdf and a "pdf:" line to the file if you want a View PDF button.`);
  }
}

main();
