import { expect, test } from '@playwright/test';

const cards = (page: import('@playwright/test').Page) => page.locator('#projects .card');

test('each project card has a cover, its year and context, and links to its page', async ({ page }) => {
  await page.goto('/');
  expect(await cards(page).count()).toBeGreaterThan(0);
  for (const card of await cards(page).all()) {
    await expect(card.locator('.cover img, .cover svg')).toHaveCount(1);
    await expect(card.locator('.year')).toHaveText(/^\d{4}$/);
    await expect(card.getByRole('heading', { level: 3 }).getByRole('link')).toHaveAttribute('href', /^\/projects\/[\w-]+$/);
  }
});

test('the domain filter works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const total = await cards(page).count();
  const tags = page.locator('#projects .filter label.tag');
  const second = tags.nth(1);
  const n = Number(await second.locator('small').textContent());
  await second.click();
  await expect(cards(page).filter({ visible: true })).toHaveCount(n);
  await tags.first().click();
  await expect(cards(page).filter({ visible: true })).toHaveCount(total);
  await context.close();
});

test('a card opens its project page, which links back and on to the next one', async ({ page }) => {
  await page.goto('/');
  const first = cards(page).first();
  const title = (await first.getByRole('heading', { level: 3 }).textContent())!.trim();
  await first.click();
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page).toHaveTitle(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · `));
  const next = page.getByRole('navigation', { name: 'More projects' }).locator('a[rel="next"]');
  const nextUrl = await next.getAttribute('href');
  await next.click();
  await expect(page).toHaveURL(nextUrl!);
  await page.getByRole('link', { name: '← Projects' }).click();
  await expect(page).toHaveURL(/\/#proj-[\w-]+$/);
});

test('project covers load on their pages, and confidential work says so', async ({ page }) => {
  await page.goto('/');
  const list = await cards(page).evaluateAll((cs) =>
    cs.map((c) => ({ href: c.querySelector('h3 a')!.getAttribute('href')!, confidential: c.querySelector('.meta')!.textContent!.includes('confidential') })),
  );
  for (const { href, confidential } of list) {
    await page.goto(href);
    const img = page.locator('figure > .hero img');
    if (await img.count()) await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.note')).toHaveCount(confidential ? 1 : 0);
  }
});

test('an unknown project is a 404', async ({ page }) => {
  expect((await page.goto('/projects/no-such-project'))?.status()).toBe(404);
});

test('the live dot pulses, and holds still under reduced motion', async ({ page }) => {
  const animation = () => page.locator('#projects .live-dot').first().evaluate((el) => getComputedStyle(el).animationName);
  await page.goto('/');
  if (!(await page.locator('#projects .live').count())) return;
  expect(await animation()).toBe('live-ripple');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await animation()).toBe('none');
});
