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
