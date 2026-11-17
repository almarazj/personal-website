import { expect, test } from '@playwright/test';

const cards = (page: import('@playwright/test').Page) => page.locator('#projects .card');

test('each project card has a cover, its year and context, and links to its page', async ({ page }) => {
  await page.goto('/');
  expect(await cards(page).count()).toBeGreaterThan(0);
  for (const card of await cards(page).all()) {
    await expect(card.locator('.cover img, .cover svg')).toHaveCount(1);
    await expect(card.locator('.year')).toHaveText(/^\d{4}$/);
    // By selector: role queries skip the cards folded away behind "Show more".
    await expect(card.locator('h3 a')).toHaveAttribute('href', /^\/projects\/[\w-]+$/);
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

test.describe('limited to a row on wide screens', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  const shown = (page: import('@playwright/test').Page) =>
    page.locator('#projects .card:not([hidden]):not([data-peek])').filter({ visible: true });

  test('shows the first rows, previews the next, and reveals more per click until it can collapse', async ({ page }) => {
    await page.goto('/');
    const grid = page.locator('#project-grid');
    const { rows, step } = JSON.parse((await grid.getAttribute('data-reveal'))!) as { rows: number; step: number };
    const total = await cards(page).count();
    const cols = await grid.evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
    const first = Math.min(total, rows * cols);
    test.skip(total <= first, 'everything fits in the first rows');
    await expect(shown(page)).toHaveCount(first);
    const peek = page.locator('#projects .card[data-peek]');
    await expect(peek).toHaveCount(Math.min(cols, total - first));
    expect(await peek.first().evaluate((el) => (el as HTMLElement).inert)).toBe(true);

    const button = page.locator('[data-reveal-button]');
    let open = first;
    while (open < total) {
      await expect(button).toHaveText(`Show more (${total - open} left)`);
      await button.click();
      open = Math.min(total, open + step * cols);
      await expect(shown(page)).toHaveCount(open);
    }
    await expect(button).toHaveText('Show less');
    await button.scrollIntoViewIfNeeded();
    const top = await button.evaluate((b) => b.getBoundingClientRect().top);
    await button.click();
    await expect(shown(page)).toHaveCount(first);
    // The button stays put on screen while the grid folds above it.
    expect(Math.abs((await button.evaluate((b) => b.getBoundingClientRect().top)) - top)).toBeLessThan(1);
  });

  test('opening and folding move the grid edge over whole cards, with the button held in place while folding', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('[data-reveal-button]');
    test.skip(!(await button.isVisible()), 'everything fits in the first rows');
    // Every frame of a click: the grid height, where the button sits, and how far each shown card is from its height at rest.
    const sample = () =>
      page.evaluate(
        () =>
          new Promise<{ grid: number; button: number; squeeze: number }[]>((resolve) => {
            const grid = document.getElementById('project-grid')!;
            const b = document.querySelector<HTMLElement>('[data-reveal-button]')!;
            const heights = () =>
              new Map([...grid.querySelectorAll<HTMLElement>('.card:not([hidden]):not([data-peek])')].map((c) => [c, c.offsetHeight]));
            const before = heights();
            const frames: { grid: number; button: number; seen: Map<HTMLElement, number> }[] = [];
            const tick = () => {
              frames.push({ grid: grid.offsetHeight, button: b.getBoundingClientRect().top, seen: heights() });
              if (frames.length < 30) return requestAnimationFrame(tick);
              const after = heights();
              resolve(
                frames.map(({ grid, button, seen }) => ({
                  grid,
                  button,
                  squeeze: Math.max(0, ...[...seen].map(([c, h]) => Math.abs(h - (before.get(c) ?? after.get(c) ?? h)))),
                })),
              );
            };
            b.click();
            requestAnimationFrame(tick);
          }),
      );
    const check = (frames: Awaited<ReturnType<typeof sample>>) => {
      expect(new Set(frames.map((f) => f.grid)).size).toBeGreaterThan(2);
      expect(Math.max(...frames.map((f) => f.squeeze))).toBe(0);
    };
    while ((await button.textContent()) !== 'Show less') check(await sample());
    await button.scrollIntoViewIfNeeded();
    const folding = await sample();
    check(folding);
    for (const f of folding) expect(Math.abs(f.button - folding[0].button)).toBeLessThan(1);
  });

  test('a link to a hidden card opens enough rows to show it', async ({ page }) => {
    await page.goto('/');
    const last = page.locator('#projects .card').last();
    const id = (await last.getAttribute('id'))!;
    await page.goto(`/#${id}`);
    await expect(last).not.toHaveAttribute('data-peek');
    await expect(last).toBeVisible();
    await expect(last).toBeInViewport();
  });

  test('without JavaScript every project is shown', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(cards(page).filter({ visible: true })).toHaveCount(await cards(page).count());
    await expect(page.locator('[data-reveal-more]')).toBeHidden();
    await context.close();
  });
});

test.describe('a carousel on phones', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('every project sits in one row that scrolls sideways, without widening the page', async ({ page }) => {
    await page.goto('/');
    await expect(cards(page).filter({ visible: true })).toHaveCount(await cards(page).count());
    await expect(page.locator('[data-reveal-more]')).toBeHidden();
    const grid = page.locator('#project-grid');
    const [scrollW, clientW] = await grid.evaluate((g) => [g.scrollWidth, g.clientWidth]);
    expect(scrollW).toBeGreaterThan(clientW);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const tops = await cards(page).evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });
});
