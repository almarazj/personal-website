import { expect, test, type Page } from '@playwright/test';

const pill = (page: Page) => page.locator('[data-spill]');
const button = (page: Page) => page.locator('[data-spill-button]');
const labels = (page: Page) => page.locator('main.page > section.section .section-label').allTextContents();
const scrollTo = (page: Page, id: string) =>
  page.evaluate((id) => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.getElementById(id)!.scrollIntoView();
  }, id);

test('stays out of the way over the hero, then names the section and entry being read', async ({ page }) => {
  await page.goto('/');
  await expect(pill(page)).not.toHaveAttribute('data-on');
  await expect(pill(page)).toHaveCSS('opacity', '0');
  await expect(pill(page)).toHaveCSS('pointer-events', 'none');

  const first = page.locator('main.page > section.section').first();
  const id = (await first.getAttribute('id'))!;
  await scrollTo(page, id);
  await expect(pill(page)).toHaveAttribute('data-on');
  await expect(page.locator('[data-spill-section]')).toHaveText((await labels(page))[0]);

  const entry = first.locator('[data-entry]').first();
  await scrollTo(page, (await entry.getAttribute('id'))!);
  await expect(page.locator('[data-spill-entry]')).toHaveText((await entry.locator('h3').textContent())!.trim());
  await expect(button(page)).toHaveAccessibleName(/^On this page: /);
});

test('its menu lists every section, opens the current one, and jumps', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('main.page > section.section');
  const withEntries = sections.filter({ has: page.locator('[data-entry] ~ [data-entry]') }).first();
  const id = (await withEntries.getAttribute('id'))!;
  await scrollTo(page, id);
  await button(page).click();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'true');

  const menu = page.getByRole('navigation', { name: 'On this page' });
  const tops = menu.locator(':scope > ul > li > a');
  await expect(tops).toHaveText((await labels(page)).map((l) => new RegExp(`^${l}`)));
  await expect(menu.locator(`[data-spill-sub="${id}"]`)).toBeVisible();
  await expect(menu.locator('[data-spill-sub]').filter({ visible: true })).toHaveCount(1);

  const last = withEntries.locator('[data-entry]').last();
  const target = (await last.getAttribute('id'))!;
  await menu.locator(`a[href="#${target}"]`).click();
  await expect(page).toHaveURL(new RegExp(`#${target}$`));
  await expect(menu).toBeHidden();
  await expect(last).toBeInViewport();
});

test('Escape and a click elsewhere close the menu', async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, (await page.locator('main.page > section.section').first().getAttribute('id'))!);
  const menu = page.getByRole('navigation', { name: 'On this page' });
  await button(page).click();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(button(page)).toBeFocused();
  await button(page).click();
  await page.mouse.click(5, 300);
  await expect(menu).toBeHidden();
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 360, height: 740 }]) {
  test(`at the end the page stops at the footer and the pill rests above it (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(pill(page)).toHaveAttribute('data-on');
    const footer = (await page.locator('.site-footer').boundingBox())!;
    expect(Math.abs(footer.y + footer.height - viewport.height)).toBeLessThan(1);
    await expect.poll(async () => (await button(page).boundingBox())!.y + (await button(page).boundingBox())!.height).toBeLessThanOrEqual(footer.y - 15);
  });
}

test('without JavaScript it is not shown', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(pill(page)).toBeHidden();
  await context.close();
});

test.describe('on phones', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('fits the screen, menu included', async ({ page }) => {
    await page.goto('/');
    await scrollTo(page, (await page.locator('main.page > section.section').first().getAttribute('id'))!);
    await expect(pill(page)).toHaveAttribute('data-on');
    await button(page).click();
    for (const el of [button(page), page.locator('[data-spill-menu]')]) {
      const box = (await el.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(16 - 0.5);
      expect(box.x + box.width).toBeLessThanOrEqual(360 - 16 + 0.5);
    }
  });
});
