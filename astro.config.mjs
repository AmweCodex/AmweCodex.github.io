// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The live address of the site. Astro needs this to build the sitemap
  // and the full links used in social previews (Open Graph tags).
  // If you move to your own domain, change it here and nowhere else.
  site: 'https://amwecodex.github.io',

  integrations: [sitemap()],

  // Old addresses that have moved. The PLC_LAB folder was renamed to
  // PLC-LAB, so the Motor Start-Stop post changed address. Anyone with the
  // old link is sent to the new one.
  redirects: {
    '/blog/plc_lab/motor-start-stop-with-seal-in': '/blog/plc-lab/motor-start-stop-with-seal-in',
  },

  markdown: {
    shikiConfig: {
      // Two colour themes for code blocks: one for dark mode, one for light.
      // "night-owl" is a deep navy theme that sits well on your palette.
      // `defaultColor: false` means we pick the colours ourselves in
      // global.css (so they follow the site's theme toggle).
      themes: {
        light: 'night-owl-light',
        dark: 'night-owl',
      },
      defaultColor: false,
    },
  },
});
