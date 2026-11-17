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

test('every page shares a 1200x630 PNG card', async ({ page, request }) => {
  await page.goto('/');
  const og = (name: string) => page.locator(`meta[property="og:${name}"]`).getAttribute('content');
  const image = new URL((await og('image'))!);
  expect([await og('image:width'), await og('image:height')]).toEqual(['1200', '630']);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image.href);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', (await og('title'))!);

  const res = await request.get(image.pathname);
  expect(res.headers()['content-type']).toBe('image/png');
  const png = await res.body();
  // The IHDR chunk holds the width and height as big-endian integers.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
