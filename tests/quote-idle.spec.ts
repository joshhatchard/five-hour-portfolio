import { expect, test } from '@playwright/test';

test('entry figure spins without input, including after returning from the zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await expect(page.locator('[aria-label="Loading portfolio"]')).toHaveCount(0, { timeout: 30000 });
  const actor = page.locator('[data-quote-actor]');
  await expect(actor).toHaveAttribute('data-model-ready', 'true');
  const entry = await page.locator('#quote').evaluate(el => el.getBoundingClientRect().top + scrollY - 180);

  for (const returnFromZoom of [false, true]) {
    if (returnFromZoom) {
      await page.evaluate(y => window.scrollTo(0, y + 1000), entry);
      await page.waitForTimeout(1000);
      await expect(actor).toHaveAttribute('data-interactive', 'false');
    }
    await page.evaluate(y => window.scrollTo(0, y), entry);
    await expect(actor).toHaveAttribute('data-interactive', 'true');
    await page.waitForTimeout(1000);
    const before = await actor.locator('canvas').screenshot();
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.waitForTimeout(700);
    const after = await actor.locator('canvas').screenshot();
    expect(after.equals(before)).toBe(false);
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
    expect(await actor.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(1);
  }
});
