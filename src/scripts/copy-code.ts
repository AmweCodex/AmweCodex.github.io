// src/scripts/copy-code.ts
// ============================================================================
// Adds a small "Copy" button to every code block inside a blog post or
// project write-up. It runs in the browser, after the page has loaded.
//
// What it does, step by step:
//   1. Finds every code block (<pre class="astro-code">).
//   2. Wraps each block in a <div class="code-block"> so the button can sit
//      in the top-right corner.
//   3. When the button is clicked, copies the code to the clipboard and
//      shows "Copied" for a moment.
//
// The styling for .code-block and .copy-btn is at the bottom of
// src/styles/global.css.
// ============================================================================

const blocks = document.querySelectorAll<HTMLPreElement>('pre.astro-code');

blocks.forEach((pre) => {
  // Wrap the <pre> in a positioned container
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  pre.parentNode?.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code to clipboard');
  wrapper.appendChild(button);

  let resetTimer: number | undefined;

  button.addEventListener('click', async () => {
    const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = 'Copied';
      button.setAttribute('data-copied', '');
    } catch {
      // Clipboard can be blocked (for example on plain http). Say so
      // instead of pretending it worked.
      button.textContent = 'Press Ctrl+C';
    }
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      button.textContent = 'Copy';
      button.removeAttribute('data-copied');
    }, 1800);
  });
});
