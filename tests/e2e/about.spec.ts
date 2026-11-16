import { expect, test } from '@playwright/test';

test('about has a bio and quick questions, each with an answer and its detail', async ({ page }) => {
  await page.goto('/');
  const about = page.locator('#about');
  await expect(about.getByRole('heading', { level: 2 })).toHaveText('About');
  await expect(about.locator('.bio p').first()).toHaveText(/\S/);
  const rows = about.locator('.qa .row');
  for (const row of await rows.all()) {
    await expect(row.locator('dt')).toHaveText(/\S/);
    await expect(row.locator('.answer')).toHaveText(/\S/);
    await expect(row.locator('.answer svg')).toHaveCount(1);
  }
});

test('the terminal opens about.md at the section', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-terminal] .line').click();
  await page.keyboard.type('open about.md');
  await page.keyboard.press('Enter');
  await expect(page.locator('#about')).toBeInViewport();
});

test('the photo stack cycles with the button, the keyboard and a tap, announcing each photo', async ({ page }) => {
  await page.goto('/');
  const stack = page.locator('[data-photo-stack]');
  if (!(await stack.count())) return;
  const counter = stack.locator('[data-photo-counter]');
  const total = Number((await counter.textContent())!.split('/')[1]);
  const top = () => stack.locator('.polaroid:not([aria-hidden])');
  await expect(counter).toHaveText(`1 / ${total}`);
  for (const p of await stack.locator('.polaroid img').all()) await expect(p).toHaveAttribute('alt', /\S/);

  await stack.getByRole('button', { name: 'Next photo' }).click();
  await expect(counter).toHaveText(`2 / ${total}`);
  await expect(stack.locator('[data-photo-status]')).toContainText(`Photo 2 of ${total}`);

  await stack.locator('[data-stack]').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(counter).toHaveText(`1 / ${total}`);

  await top().click();
  await expect(counter).toHaveText(`2 / ${total}`);
  await expect(top()).toHaveCount(1);
});
