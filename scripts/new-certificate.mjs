#!/usr/bin/env node
/*
  scripts/new-certificate.mjs  ->  npm run new:certificate
  ============================================================================
  Run this when you earn a new certificate. It creates the markdown file in
  src/content/certificates/, and the certificate then shows up on the About
  page by itself.

  Before you run it, put your files in place. Use the title as a "slug"
  (lowercase with hyphens) for both file names, e.g. plc-fundamentals-level-2:

    public/certificates/<slug>.pdf          the PDF copy (optional)
    public/images/certificates/<slug>.jpg   a picture of the certificate
  ============================================================================
*/

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { CancelledError, createPrompter } from './lib/prompts.mjs';
import { slugify, splitList, todayISODate, yamlList } from './lib/naming.mjs';

const CERT_DIR = new URL('../src/content/certificates/', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);

const prompt = createPrompter();

try {
  prompt.heading('New certificate');

  prompt.section('Required');
  const title = await prompt.askRequired('Title', { hint: 'e.g. PLC Fundamentals (Level II)' });
  const provider = await prompt.askRequired('Issued by', { hint: 'e.g. PLC Dojo' });
  const date = await prompt.ask('Issue date', {
    fallback: todayISODate(),
    validate: (answer) =>
      /^\d{4}-\d{2}-\d{2}$/.test(answer) ? null : 'Please use the format YYYY-MM-DD.',
  });
  const summary = await prompt.askRequired('Summary', { hint: 'what it covers, one or two sentences' });

  prompt.section('Optional (press Enter to skip)');
  const skills = splitList(await prompt.ask('Skills', { hint: 'comma-separated' }));
  const link = await prompt.ask('Verification link', { hint: "the provider's web page" });

  // ---- Work out names once ----------------------------------------------
  const slug = slugify(title);
  const markdownUrl = new URL(`${slug}.md`, CERT_DIR);
  const hasPdf = existsSync(new URL(`certificates/${slug}.pdf`, PUBLIC_DIR));
  const hasImage = existsSync(new URL(`images/certificates/${slug}.jpg`, PUBLIC_DIR));

  if (existsSync(markdownUrl)) {
    console.error(`\nsrc/content/certificates/${slug}.md already exists. Nothing was changed.`);
  } else {
    const confirmed = await prompt.confirm([
      ['Title', title],
      ['Issued by', provider],
      ['Date', date],
      ['Markdown file', `src/content/certificates/${slug}.md`],
      ['Picture', `public/images/certificates/${slug}.jpg  (${hasImage ? 'found' : 'not added yet'})`],
      ['PDF', `public/certificates/${slug}.pdf  (${hasPdf ? 'found' : 'not added yet'})`],
    ]);

    if (!confirmed) {
      console.log('\nCancelled. Nothing was created.\n');
    } else {
      const lines = [
        '---',
        `title: ${JSON.stringify(title)}`,
        `provider: ${JSON.stringify(provider)}`,
        `date: ${date}`,
        `summary: ${JSON.stringify(summary)}`,
        `image: "/images/certificates/${slug}.jpg"`,
        link ? `link: ${JSON.stringify(link)}` : null,
        hasPdf ? `pdf: "/certificates/${slug}.pdf"` : null,
        `skills: ${yamlList(skills)}`,
        'draft: false',
        '---',
        '',
      ].filter((line) => line !== null);

      mkdirSync(CERT_DIR, { recursive: true });
      writeFileSync(markdownUrl, lines.join('\n'), 'utf8');
      console.log('');
      prompt.done('Created', `src/content/certificates/${slug}.md`);

      const steps = [];
      if (!hasImage) steps.push(`Add the picture at public/images/certificates/${slug}.jpg`);
      if (!hasPdf) {
        steps.push(`Optional: add the PDF at public/certificates/${slug}.pdf, then add this line to the markdown file: pdf: "/certificates/${slug}.pdf"`);
      }
      steps.push('Run "npm run dev" and check the About page');
      prompt.nextSteps(steps);
    }
  }
} catch (error) {
  if (error instanceof CancelledError) console.log('\n\nCancelled. Nothing was created.\n');
  else throw error;
} finally {
  prompt.close();
}
