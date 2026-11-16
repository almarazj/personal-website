import { expect, test } from '@playwright/test';

test('education lists each degree with its years and the certificates in one row', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#education');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Education');
  const degrees = section.locator('article');
  expect(await degrees.count()).toBeGreaterThan(0);
  for (const degree of await degrees.all()) {
    await expect(degree.getByRole('heading', { level: 3 })).toHaveText(/\S/);
    await expect(degree.locator('.period')).toHaveText(/^\d{4} - (\d{4}|now)$/);
  }
  const certs = section.locator('#edu-certs');
  await expect(certs.getByRole('heading', { level: 3 })).toHaveText('Certs');
  expect(await certs.locator('li').count()).toBeGreaterThan(0);
});

test('the certs label lines up with the degree logos', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const logo = (await page.locator('#education article .logo').first().boundingBox())!;
  const label = (await page.locator('#edu-certs .key').boundingBox())!;
  expect(label.x).toBe(logo.x);
});
