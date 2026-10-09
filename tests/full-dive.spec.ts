import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`full double flip and splash lead into the gallery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000');
    const hero = page.locator('#hero');
    await expect(hero).toHaveAttribute('data-model-ready', 'true');
    for (const distance of [3.74, 3.95, 4.2, 4.4, 3.95, 3.74]) {
      await page.evaluate(d => window.scrollTo(0, d * innerHeight), distance);
      await expect(hero).toHaveAttribute('data-flip-degrees', '720.00');
      if (distance === 3.95) await expect(page.locator('[data-hero-splash]')).toHaveCSS('opacity', '1');
      if (distance === 4.4) await expect(page.locator('[data-hero-splash]')).toHaveCSS('opacity', '0');
    }
    await expect(page.locator('[data-work-heading]')).toHaveCount(0);
    await expect(page.locator('[data-work-surface]')).toHaveCount(0);
  });
}
