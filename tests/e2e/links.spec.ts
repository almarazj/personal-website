import { expect, test } from '@playwright/test';

test('external links open in a new tab and say so to screen readers; internal ones stay', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a[href]');
  for (const link of await links.all()) {
    const href = (await link.getAttribute('href'))!;
    if (/^https?:/.test(href)) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAccessibleName(/\(opens in a new tab\)$/);
    } else {
      await expect(link).not.toHaveAttribute('target');
    }
  }
});

test('the new tab note is never visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).not.toContainText('opens in a new tab');
  const after = await page
    .locator('footer a[target="_blank"]')
    .first()
    .evaluate((a) => getComputedStyle(a, '::after').width);
  expect(['0px', 'auto']).toContain(after);
});
