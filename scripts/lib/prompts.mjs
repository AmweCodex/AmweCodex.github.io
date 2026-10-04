/*
  scripts/lib/prompts.mjs
  ============================================================================
  The question-and-answer part of the scripts, kept in one place so every
  script looks and behaves the same way.

  Why not just use readline's question()? When answers are pasted or piped
  in, question() can lose lines. This version keeps every line in a queue,
  so nothing is lost. Press Ctrl+C at any point to cancel; nothing is
  created until you confirm at the end.
  ============================================================================
*/

import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const LINE = '-'.repeat(60);

/** Thrown when the user cancels (Ctrl+C or end of input). */
export class CancelledError extends Error {}

export function createPrompter() {
  const rl = createInterface({ input: stdin, output: stdout });
  const queue = []; // lines typed before we asked for them
  const waiting = []; // questions waiting for a line
  let closed = false;

  rl.on('line', (line) => {
    const resolve = waiting.shift();
    if (resolve) resolve(line);
    else queue.push(line);
  });
  rl.on('close', () => {
    closed = true;
    waiting.splice(0).forEach((resolve) => resolve(null));
  });
  rl.on('SIGINT', () => rl.close());

  /** Asks one question and returns the trimmed answer. */
  function readLine(prompt) {
    rl.setPrompt(prompt);
    rl.prompt();
    const line = queue.length > 0 ? queue.shift() : closed ? null : undefined;
    const pending =
      line !== undefined ? Promise.resolve(line) : new Promise((resolve) => waiting.push(resolve));
    return pending.then((answer) => {
      if (answer === null) throw new CancelledError();
      return answer.trim();
    });
  }

  return {
    /** Prints the title block at the top of a script. */
    heading(text) {
      console.log(`\n${text.toUpperCase()}\n${LINE}`);
    },

    /** Prints a smaller heading between groups of questions. */
    section(text) {
      console.log(`\n${text}`);
    },

    /**
     * Free-text question.
     * @param {string} label       What to ask, e.g. "Title".
     * @param {object} [options]
     * @param {string} [options.hint]       Shown in brackets, e.g. "optional".
     * @param {string} [options.fallback]   Used when the answer is empty.
     * @param {(answer: string) => string|null} [options.validate]
     *        Return an error message to ask again, or null when the answer is fine.
     */
    async ask(label, { hint, fallback, validate } = {}) {
      const shownHint = hint ? ` (${hint})` : fallback ? ` (Enter for ${fallback})` : '';
      for (;;) {
        const answer = (await readLine(`  ${label}${shownHint}: `)) || fallback || '';
        const problem = validate ? validate(answer) : null;
        if (!problem) return answer;
        console.log(`  ${problem}`);
      }
    },

    /** Question that must not be left empty. */
    askRequired(label, options = {}) {
      return this.ask(label, {
        ...options,
        validate: (answer) =>
          (!answer ? `${label} is required.` : null) || options.validate?.(answer) || null,
      });
    },

    /**
     * Lists the existing categories and lets the user pick one by number,
     * or type a brand-new category name.
     * @param {string[]} existing  Category names already in use.
     */
    async chooseCategory(existing) {
      this.section('Category');
      existing.forEach((name, index) => console.log(`    ${index + 1}) ${name}`));
      console.log(`    ${existing.length + 1}) Create a new category`);

      for (;;) {
        const answer = await readLine('  Choose a number, or type a category name: ');
        if (answer === '') {
          console.log('  Please choose a number or type a name.');
          continue;
        }
        const number = Number(answer);
        if (!Number.isInteger(number)) return answer; // typed a name directly
        if (number >= 1 && number <= existing.length) return existing[number - 1];
        if (number === existing.length + 1) return this.askRequired('New category name');
        console.log('  That number is not in the list.');
      }
    },

    /** Prints the summary table, then asks "Create these files?". */
    async confirm(rows) {
      console.log(`\n${LINE}\nPlease check these details`);
      const width = Math.max(...rows.map(([name]) => name.length));
      rows.forEach(([name, value]) => console.log(`  ${name.padEnd(width)}  ${value}`));
      console.log(LINE);
      const answer = (await readLine('  Create these files? (Y/n): ')).toLowerCase();
      return answer === '' || answer === 'y' || answer === 'yes';
    },

    /** Prints a line such as "Created  src/content/...". */
    done(action, path) {
      console.log(`  ${action.padEnd(8)} ${path}`);
    },

    /** Prints the "what to do next" list. */
    nextSteps(steps) {
      console.log('\nNext steps');
      steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
      console.log('');
    },

    close() {
      rl.close();
    },
  };
}
