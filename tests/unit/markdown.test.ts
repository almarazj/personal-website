import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { externalLinks } from '../../src/lib/markdown-external-links';
import { figures } from '../../src/lib/markdown-figures';

const html = (md: string) => (markdownToHtml(md, { hastPlugins: [externalLinks, figures] }) as { html: string }).html.trim();

describe('markdown figures', () => {
  it('turns an image with a title, alone in its paragraph, into a captioned figure', () => {
    expect(html('![A chart](chart.png "What it means")')).toBe(
      '<figure><img src="chart.png" alt="A chart"><figcaption>What it means</figcaption></figure>',
    );
  });
  it('leaves untitled images and images inside text alone', () => {
    expect(html('![A chart](chart.png)')).toBe('<p><img src="chart.png" alt="A chart"></p>');
    expect(html('See ![a chart](chart.png "x") here')).toContain('<p>See <img');
  });
  it('escapes the caption', () => {
    expect(html('![x](a.png "<b>bold</b>")')).toContain('<figcaption>&lt;b&gt;bold&lt;/b&gt;</figcaption>');
  });
});

describe('markdown links', () => {
  it('opens external links and PDFs in a new tab, and leaves site links alone', () => {
    expect(html('[x](https://example.com)')).toContain('<a href="https://example.com" target="_blank" rel="noopener">');
    expect(html('[x](/paper.pdf)')).toContain('target="_blank"');
    expect(html('[x](/projects/a)')).toBe('<p><a href="/projects/a">x</a></p>');
  });
});
