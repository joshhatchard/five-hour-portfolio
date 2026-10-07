import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`velocity marks appear only through the flip at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://localhost:3000");
    const hero = page.locator("#hero");
    await expect(hero).toHaveAttribute("data-model-ready", "true");

    await page.evaluate(() => window.scrollTo(0, innerHeight * 4.4 * 0.44));
    await expect(hero).toHaveAttribute("data-velocity-effects", "true");

    await page.evaluate(() => window.scrollTo(0, innerHeight * 4.4 * 0.9));
    await expect(hero).toHaveAttribute("data-velocity-effects", "false");
  });
}
