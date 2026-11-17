import { expect, test, type Page } from '@playwright/test';

const pill = (page: Page) => page.locator('[data-spill]');
const button = (page: Page) => page.locator('[data-spill-button]');
const labels = (page: Page) => page.locator('main.page > section.section .section-label').allTextContents();
const scrollTo = (page: Page, id: string) =>
  page.evaluate((id) => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.getElementById(id)!.scrollIntoView();
  }, id);

test('stays out of the way over the hero, then names the section being read', async ({ page }) => {
  await page.goto('/');
  await expect(pill(page)).not.toHaveAttribute('data-on');
  await expect(pill(page)).toHaveCSS('opacity', '0');
  await expect(pill(page)).toHaveCSS('pointer-events', 'none');

  const first = page.locator('main.page > section.section').first();
  const id = (await first.getAttribute('id'))!;
  await scrollTo(page, id);
  await expect(pill(page)).toHaveAttribute('data-on');
  const label = (await labels(page))[0];
  await expect(page.locator('[data-spill-section]')).toHaveText(label);
  await expect(button(page)).toHaveAccessibleName(`On this page: ${label}`);

  // Puts the reading line (30% down the space under the header) just inside the section's last entry, however tall it is.
  await first.locator('[data-entry]').last().evaluate((el) => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (56 + (innerHeight - 56) * 0.3) + 1);
  });
  await expect(page.locator('[data-spill-section]')).toHaveText(label);
});

test('its menu lists only the sections, marks the current one, and jumps', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('main.page > section.section');
  await scrollTo(page, (await sections.first().getAttribute('id'))!);
  await button(page).click();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'true');

  const menu = page.getByRole('navigation', { name: 'On this page' });
  await expect(menu.locator('a')).toHaveText((await labels(page)).map((l) => new RegExp(`^${l}`)));
  await expect(menu.locator('a[data-current]')).toHaveCount(1);
  await expect(menu.locator('a').first()).toHaveAttribute('data-current');

  const last = sections.last();
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
