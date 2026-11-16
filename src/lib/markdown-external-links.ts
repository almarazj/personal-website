import { opensNewTab } from './links';

type Ctx = { setProperty(node: unknown, key: string, value: string): void };
type Anchor = { properties?: Record<string, unknown> };

/** A Sätteri hast plugin: Markdown links follow the same new-tab rule as the rest of the site. */
export const externalLinks = () => ({
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node: Anchor, ctx: Ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !opensNewTab(href)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', 'noopener');
    },
  },
});
