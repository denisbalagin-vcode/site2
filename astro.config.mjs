// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages ? 'https://denisbalagin-vcode.github.io' : 'https://formit.pro',
  base: isGitHubPages ? '/site' : '/',
  integrations: [preact(), sitemap()],
});