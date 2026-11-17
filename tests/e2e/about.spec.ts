import { expect, test, type Page } from '@playwright/test';

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

const note = (page: Page) => page.locator('[data-about-note]');
const written = async (page: Page) => Number(await note(page).getAttribute('data-written')) / Number(await note(page).getAttribute('data-total'));
/** Scrolls, instantly, to `fraction` of the way along the About track, plus `past` pixels. */
const scrollTrack = (page: Page, fraction: number, past = 0) =>
  page.evaluate(
    ([fraction, past]) => {
      document.documentElement.style.scrollBehavior = 'auto';
      const track = document.querySelector<HTMLElement>('[data-about-track]')!;
      const extra = track.offsetHeight - document.querySelector<HTMLElement>('[data-about-stage]')!.offsetHeight;
      scrollTo(0, track.getBoundingClientRect().top + scrollY - 72 + extra * fraction + past);
    },
    [fraction, past],
  );
const stageTop = async (page: Page) => (await page.locator('[data-about-stage]').boundingBox())!.y;

test.describe('the note on wide screens', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('arrives blank, stays pinned while the scroll writes it, then lets the page go on', async ({ page }) => {
    await page.goto('/');
    await scrollTrack(page, 0);
    await expect.poll(() => written(page)).toBe(0);
    await expect(note(page)).toBeInViewport({ ratio: 1 });

    await scrollTrack(page, 0.5);
    await expect.poll(() => written(page)).toBeGreaterThan(0.3);
    expect(await written(page)).toBeLessThan(0.7);
    expect(await stageTop(page)).toBeCloseTo(72, 0);
    await expect(note(page).locator('a').first()).not.toHaveAttribute('data-written');

    await scrollTrack(page, 1);
    await expect.poll(() => written(page)).toBe(1);
    expect(await stageTop(page)).toBeCloseTo(72, 0);
    await expect(note(page).locator('a').first()).toHaveAttribute('data-written');

    await scrollTrack(page, 1, 200);
    await expect.poll(() => stageTop(page)).toBeLessThan(72);
  });

  test('a jump to the section lands with the note written', async ({ page }) => {
    await page.goto('/#about');
    await expect.poll(() => written(page)).toBe(1);
    expect(await stageTop(page)).toBeCloseTo(72, 0);
  });
});

test('on phones the page scrolls on and the note writes as it passes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const [track, stage] = await Promise.all(['[data-about-track]', '[data-about-stage]'].map((s) => page.locator(s).evaluate((el: HTMLElement) => el.offsetHeight)));
  expect(track).toBe(stage);
  await note(page).evaluate((el) => {
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.2);
  });
  await expect.poll(() => written(page)).toBe(1);
});

test('under reduced motion the note is written from the start and nothing is pinned', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect.poll(() => written(page)).toBe(1);
  const [track, stage] = await Promise.all(['[data-about-track]', '[data-about-stage]'].map((s) => page.locator(s).evaluate((el: HTMLElement) => el.offsetHeight)));
  expect(track).toBe(stage);
  await context.close();
});
