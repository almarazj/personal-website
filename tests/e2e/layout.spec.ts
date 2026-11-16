import { expect, test } from '@playwright/test';

// Tests never hardcode personal content: they check structure, so content/ can change freely.

test('page has a title, description and a canonical URL on the site origin', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/[^/]+\/$/);
});

test('header name links home and lines up with the page frame', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  const name = page.getByRole('banner').getByRole('link').first();
  await expect(name).toHaveAttribute('href', '/');
  const frameLeft = (1280 - 1040) / 2;
  expect((await name.boundingBox())!.x).toBe(frameLeft);
  const icon = (await page.locator('.theme-toggle .moon').boundingBox())!;
  expect(icon.x + icon.width).toBe(frameLeft + 1040);
});

test('no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('footer links out and stamps the commit the page was built from', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('p').first()).toHaveText(/^© \d{4} \S/);
  expect(await footer.locator('a[href^="https://"]').count()).toBeGreaterThan(1);
  await expect(footer.getByTitle('Commit this page was built from')).toHaveAttribute(
    'href',
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/commit\/[0-9a-f]{40}$/,
  );
});
