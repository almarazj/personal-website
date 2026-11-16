import { devices, expect, type Page, test } from '@playwright/test';

const terminal = (page: Page) => page.locator('[data-terminal]');
const out = (page: Page) => page.locator('[data-out]');
const input = (page: Page) => page.locator('[data-in]');
const PROMPT = /^\w+@ubuntu:~\$/;

async function focusPrompt(page: Page) {
  await terminal(page).locator('.line').click();
  await expect(input(page)).toBeFocused();
}

async function runCommand(page: Page, line: string) {
  await focusPrompt(page);
  await page.keyboard.type(line);
  await page.keyboard.press('Enter');
}

test('the hero opens straight on neofetch, with a heading for screen readers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/\S/);
  await expect(out(page).locator('> *')).toHaveCount(2);
  await expect(out(page).locator('.echo').first()).toHaveText(/^\w+@ubuntu:~\$ neofetch$/);
  await expect(out(page)).toContainText(/Role: \S/);
  await expect(out(page)).toContainText(/Based: .+ · \d{2}:\d{2} \(GMT[+-]?\d*\)/);
  await expect(terminal(page).locator('.line')).toContainText(PROMPT);
});

test('without JavaScript neofetch still reads as a finished screen', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(out(page)).toContainText(/Role: \S/);
  await expect(out(page)).toContainText('type help to look around');
  await context.close();
});

test('commands read the content and help lists them', async ({ page }) => {
  await page.goto('/');
  await runCommand(page, 'help');
  await expect(out(page).locator('.blk').last()).toContainText('Commands');
  await runCommand(page, 'cat about.md');
  await expect(out(page).locator('.blk').last()).toContainText('# About');
  await runCommand(page, 'git log');
  await expect(out(page).locator('.blk').last()).toContainText(/commit [0-9a-f]{40}/);
});

test('line editing: completion, suggestions, history and shortcuts', async ({ page }) => {
  await page.goto('/');
  await focusPrompt(page);

  await page.keyboard.type('cat ab');
  await page.keyboard.press('Tab');
  await expect(input(page)).toHaveValue('cat about.md ');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');
  await expect(out(page).locator('.blk').last()).toHaveText('about.md');

  await page.keyboard.press('ArrowUp');
  await expect(input(page)).toHaveValue('ls');
  await page.keyboard.press('ArrowUp');
  await expect(input(page)).toHaveValue('cat about.md');

  await page.keyboard.press('Control+c');
  await expect(input(page)).toHaveValue('');
  await expect(out(page).locator('.echo').last()).toContainText('cat about.md^C');

  await page.keyboard.type('neo');
  await expect(terminal(page).locator('.line')).toContainText('neofetch');
  await page.keyboard.press('ArrowRight');
  await expect(input(page)).toHaveValue('neofetch');

  await page.keyboard.press('Control+l');
  await expect(out(page).locator('> *')).toHaveCount(0);
});

test('history survives a reload', async ({ page }) => {
  await page.goto('/');
  await runCommand(page, 'whoami');
  await page.reload();
  await focusPrompt(page);
  await page.keyboard.press('ArrowUp');
  await expect(input(page)).toHaveValue('whoami');
});

test('Tab on an empty prompt moves focus on, so the terminal never traps the keyboard', async ({ page }) => {
  await page.goto('/');
  await focusPrompt(page);
  await page.keyboard.press('Tab');
  await expect(input(page)).not.toBeFocused();
});

test('the art spins, and holds still under reduced motion', async ({ page }) => {
  const art = page.locator('[data-terminal] .nf-art').last();

  await page.clock.install();
  await page.goto('/');
  const rest = await art.textContent();
  await page.clock.runFor(1_000);
  await expect(art).not.toHaveText(rest!);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const still = await art.textContent();
  await page.clock.runFor(1_000);
  await expect(art).toHaveText(still!);
});

test.describe('on a phone', () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['Pixel 7'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test('a swipe that starts on the terminal scrolls the page', async ({ page, context }) => {
    await page.goto('/');
    const box = (await terminal(page).boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const x = box.x + box.width / 2;
    const y0 = box.y + box.height - 40;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - i * 20 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    // The page is short for now, so any movement shows the swipe reached it instead of the terminal.
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
