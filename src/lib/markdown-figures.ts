import { defineHastPlugin } from 'satteri';

/**
 * An image alone in its paragraph, with a title, becomes a figure with that title as caption:
 * `![What it shows](./images/x.png "What it means")`.
 */
export const figures = defineHastPlugin({
  name: 'figures',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      const img = kids[0];
      if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return;
      const { title, ...properties } = img.properties ?? {};
      if (typeof title !== 'string' || !title.trim()) return;
      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [
          { ...img, properties },
          { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: title }] },
        ],
      });
    },
  },
});
