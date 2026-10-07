import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`full double flip and splash precede heading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000');
    const hero = page.locator('#hero');
    await expect(hero).toHaveAttribute('data-model-ready', 'true');
    for (const distance of [3.74, 3.95, 4.2, 4.4, 3.95, 3.74]) {
      await page.evaluate(d => window.scrollTo(0, d * innerHeight), distance);
      await expect(hero).toHaveAttribute('data-flip-degrees', '720.00');
      await expect(page.locator('[data-work-heading]')).not.toHaveAttribute('data-locked', 'true');
      if (distance === 3.74) {
        await expect.poll(() => page.locator('#case-studies').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(594, 0);
      }
      if (distance === 3.74) {
        await expect.poll(async () => Math.abs(Number(await hero.getAttribute('data-foot-screen-y')) - 594)).toBeLessThan(5);
      }
      if (distance === 3.95) await expect(page.locator('[data-hero-splash]')).toHaveCSS('opacity', '1');
      if (distance === 4.4) await expect(page.locator('[data-hero-splash]')).toHaveCSS('opacity', '0');
    }
    await page.evaluate(() => window.scrollTo(0, innerHeight * 4.4 + 1));
    await expect(page.locator('[data-work-heading]')).toHaveAttribute('data-state', 'animating');
    await expect(page.locator('[data-work-heading]')).not.toHaveAttribute('data-locked', 'true');
    await page.evaluate(() => window.scrollTo(0, innerHeight * 5.3 + 1));
    await expect(page.locator('[data-work-heading]')).toHaveAttribute('data-state', 'cases');
  });
}
