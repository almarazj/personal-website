import { expect, test } from '@playwright/test';

test('work experience lists each role with its period, organization and a loaded logo', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#experience');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Work experience');
  const roles = section.locator('article');
  expect(await roles.count()).toBeGreaterThan(0);
  for (const role of await roles.all()) {
    await expect(role.getByRole('heading', { level: 3 })).toHaveText(/\S/);
    await expect(role.locator('.period')).toHaveText(/^[A-Z][a-z]{2} \d{4} - ([A-Z][a-z]{2} \d{4}|now)$/);
    const logo = role.locator('img.logo');
    if (await logo.count()) {
      await logo.scrollIntoViewIfNeeded();
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
  }
});

test('current roles come first', async ({ page }) => {
  await page.goto('/');
  const periods = await page.locator('#experience .period').allTextContents();
  const current = periods.map((p) => p.endsWith('now'));
  expect(current).toEqual([...current].sort((a, b) => Number(b) - Number(a)));
});

test('the terminal opens a role at its entry', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-terminal] .line').click();
  await page.keyboard.type('cd experience');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');
  const first = (await page.locator('[data-out] .blk').last().innerText()).split(/\s+/)[0];
  await page.keyboard.type(`open ${first}`);
  await page.keyboard.press('Enter');
  await expect(page.locator(`#exp-${first.replace(/\.md$/, '')}`)).toBeInViewport();
});

test('the header gains its border once the hero scrolls under it', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header).not.toHaveAttribute('data-stuck');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.getElementById('experience')!.scrollIntoView());
  await expect(header).toHaveAttribute('data-stuck');
});
