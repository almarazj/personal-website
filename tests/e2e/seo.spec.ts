import { expect, test } from '@playwright/test';

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!));

test('robots.txt points crawlers to a sitemap that lists every page by its canonical URL', async ({ request, page }) => {
  const robots = await (await request.get('/robots.txt')).text();
  const index = new URL(robots.match(/^Sitemap: (\S+)$/m)![1]!);

  const sitemaps = locs(await (await request.get(index.pathname)).text());
  const pages = (await Promise.all(sitemaps.map(async (s) => locs(await (await request.get(s.pathname)).text())))).flat();
  expect(pages.map((u) => u.pathname)).toContain('/');

  for (const url of pages) {
    await page.goto(url.pathname);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url.href);
  }
});
