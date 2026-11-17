import { expect, test } from '@playwright/test';

test('external links and PDFs open in a new tab and say so to screen readers; pages stay', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a[href]');
  for (const link of await links.all()) {
    const href = (await link.getAttribute('href'))!;
    if (/^https?:/.test(href) || href.endsWith('.pdf')) {
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

test('/resume.pdf serves a PDF', async ({ request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/pdf');
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
