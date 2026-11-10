// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://amwecodex.github.io',
  integrations: [sitemap()],
  // Old addresses that were shared before the posts moved into level folders
  redirects: {
    '/blog/plc_lab/motor-start-stop-with-seal-in': '/blog/plc-lab/level-1-fundamentals/motor-startstop-with-sealin',
    '/blog/plc-lab/motor-start-stop-with-seal-in': '/blog/plc-lab/level-1-fundamentals/motor-startstop-with-sealin',
  },
});
