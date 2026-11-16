import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';
import { externalLinks } from './src/lib/markdown-external-links';

export default defineConfig({
  site: 'https://juanalmaraz.dev',
  markdown: { processor: satteri({ hastPlugins: [externalLinks] }) },
});
