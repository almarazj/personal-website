import { defineHastPlugin } from 'satteri';
import { opensNewTab } from './links';

/** Markdown links follow the same new-tab rule as the rest of the site. */
export const externalLinks = defineHastPlugin({
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !opensNewTab(href)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', 'noopener');
    },
  },
});
