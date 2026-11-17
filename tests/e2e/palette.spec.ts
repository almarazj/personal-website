import { expect, test, type Page } from '@playwright/test';

const modal = (page: Page) => page.getByRole('dialog', { name: 'Search or jump to' });

test('/ and Ctrl+K open the palette, Esc closes and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(modal(page)).toBeVisible();
  await expect(page.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal(page)).toBeHidden();

  await page.keyboard.press('Control+k');
  await expect(modal(page)).toBeVisible();
  await page.keyboard.press('Escape');

  const opener = page.locator('[data-palette-open]');
  await opener.focus();
  await opener.click();
  await expect(modal(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('every result targets a page of the site, a PDF or an https link', async ({ request }) => {
  const index = (await (await request.get('/search-index.json')).json()) as { target: string }[];
  expect(index.length).toBeGreaterThan(0);
  for (const { target } of index) expect(target).toMatch(/^(\/[^/]|https:\/\/|action:(theme|top)$)/);
});

test('typing a project title then Enter opens its page', async ({ page }) => {
  await page.goto('/');
  const title = (await page.locator('#projects .card h3').first().textContent())!.trim();
  await page.keyboard.press('/');
  await page.keyboard.type(title);
  await expect(page.getByRole('option').first()).toContainText(title);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test('results show their shortcut keys and the cheat sheet is visible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  const row = page.getByRole('option', { name: /Work experience/ }).first();
  await expect(row.locator('kbd')).toHaveText(['g', 'e']);
  await expect(modal(page).getByText('next / prev section')).toBeVisible();
  // One line on desktop.
  expect((await modal(page).locator('.cheat').boundingBox())!.height).toBeLessThan(45);
});

test('g e jumps, t toggles theme, keys are ignored inside the field', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('g');
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#experience$/);
  await page.keyboard.press('t');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await page.keyboard.press('/');
  await page.keyboard.type('t');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect(page.getByRole('combobox')).toHaveValue('t');
});

test('j and k step through the sections', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main section.section').evaluateAll((s) => s.map((x) => x.id));
  // Sections stop at their 72px scroll margin, below the sticky header.
  const top = (id: string) => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
  await page.keyboard.press('j');
  await expect.poll(() => top(ids[0])).toBe(72);
  await page.keyboard.press('j');
  await expect.poll(() => top(ids[1])).toBe(72);
  await page.keyboard.press('k');
  await expect.poll(() => top(ids[0])).toBe(72);
});

test('a javascript: target in the index does nothing', async ({ page }) => {
  await page.route('**/search-index.json', (r) =>
    r.fulfill({ json: [{ group: 'Links', label: 'Evil', hint: '', target: 'javascript:window.__pwned=1' }] }),
  );
  await page.goto('/');
  await page.keyboard.press('/');
  await page.getByRole('option', { name: /Evil/ }).click();
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await expect(page).toHaveURL(/\/$/);
});

test('a failed index load keeps its error message', async ({ page }) => {
  await page.route('**/search-index.json', (r) => r.fulfill({ status: 500 }));
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(page.getByText('Search is unavailable right now.')).toBeVisible();
  await page.keyboard.type('x');
  await expect(page.getByText('Search is unavailable right now.')).toBeVisible();
});

// Animations running on the panel and inside it.
const moving = (page: Page) => modal(page).evaluate((d) => d.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length);

test('animates in and out, not under reduced motion, with no back arrow on desktop', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  expect(await moving(page)).toBeGreaterThan(0);
  await expect(modal(page).getByRole('button', { name: 'Close search' })).toBeHidden();
  await page.keyboard.press('Escape');
  // Still on screen while it animates out, then gone.
  await expect(modal(page)).toHaveAttribute('data-closing');
  await expect(modal(page)).toBeHidden();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('/');
  await expect(modal(page)).toBeVisible();
  expect(await moving(page)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(modal(page)).toBeHidden();
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens a sheet anchored to the top, with filter chips', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search or jump to' }).click();
    const sheet = modal(page);
    await expect(sheet).toBeVisible();
    await sheet.evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)));
    const box = (await sheet.boundingBox())!;
    expect(box.y).toBe(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844 - 48);
    expect(box.width).toBe(390);
    const chips = sheet.getByRole('group', { name: 'Filter by group' });
    await chips.getByRole('button', { name: 'Projects' }).click();
    await expect(chips.getByRole('button', { name: 'Projects' })).toHaveAttribute('aria-pressed', 'true');
    const groups = await sheet.locator('.group-label').allTextContents();
    expect(groups).toEqual(['Projects']);
  });

  test('a back arrow left of the field closes it and returns focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Search or jump to' });
    await trigger.click();
    const sheet = modal(page);
    const back = sheet.getByRole('button', { name: 'Close search' });
    const [arrow, field] = [(await back.boundingBox())!, (await sheet.getByRole('combobox').boundingBox())!];
    expect(arrow.x + arrow.width).toBeLessThanOrEqual(field.x);
    await back.click();
    await expect(sheet).toHaveAttribute('data-closing');
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keeps to the space left above the on-screen keyboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search or jump to' }).click();
    const sheet = modal(page);
    await expect(sheet.getByRole('combobox')).toBeFocused();
    // A shorter viewport stands in for the keyboard: both shrink the visual viewport.
    await page.setViewportSize({ width: 390, height: 420 });
    await expect.poll(async () => (await sheet.boundingBox())!.height).toBeLessThanOrEqual(420 - 48);
    await expect(sheet.getByRole('combobox')).toBeInViewport();
  });
});

test('opened before the index arrives, the panel appears with its rows', async ({ page }) => {
  await page.route('**/search-index.json', async (r) => {
    await new Promise((done) => setTimeout(done, 150));
    await r.continue();
  });
  // Count the rows at the instant the open dialog stops being hidden, which is when the entrance animation starts.
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      for (const { target } of records) {
        const d = target as HTMLDialogElement;
        if (d.open && !d.hasAttribute('data-opening') && !('rowsAtOpen' in window))
          Object.assign(window, { rowsAtOpen: d.querySelectorAll('[role="option"]').length });
      }
    }).observe(document, { subtree: true, attributeFilter: ['open', 'data-opening'] });
  });
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(modal(page)).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { rowsAtOpen?: number }).rowsAtOpen)).toBeGreaterThan(0);
});

test('keys typed right after / land in the field while the index is still loading', async ({ page }) => {
  await page.route('**/search-index.json', async (r) => {
    await new Promise((done) => setTimeout(done, 250));
    await r.continue();
  });
  await page.goto('/');
  const mode = await page.locator('html').getAttribute('data-mode');
  await page.keyboard.press('/');
  await page.keyboard.type('tt');
  await expect(page.getByRole('combobox')).toHaveValue('tt');
  expect(await page.locator('html').getAttribute('data-mode')).toBe(mode);
});
