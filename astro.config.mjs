import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { externalLinks } from './src/lib/markdown-external-links';
import { figures } from './src/lib/markdown-figures';

export default defineConfig({
  site: 'https://juanalmaraz.dev',
  integrations: [sitemap()],
  markdown: { processor: satteri({ hastPlugins: [externalLinks, figures] }) },
});
