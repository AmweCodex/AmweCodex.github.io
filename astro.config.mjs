// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://amwecodex.github.io',
  integrations: [sitemap()],
  redirects: {
    '/blog/plc_lab/motor-start-stop-with-seal-in': '/blog/plc-lab/motor-start-stop-with-seal-in',
  }
});
