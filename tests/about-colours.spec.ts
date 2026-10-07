import { expect, test } from "@playwright/test";

test("WHO DIS clears as the About card takes over", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const about = page.locator("#about");
  const grid = about.locator("[data-about-wipe]");
  await expect(grid).toHaveCSS("background-color", "rgb(17, 18, 13)");
  await expect(about.locator("p").first()).toHaveCSS("color", "rgb(213, 250, 72)");

  const gridStart = await grid.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((position) => {
    window.scrollTo(0, position - window.innerHeight * 0.4);
    window.dispatchEvent(new Event("scroll"));
  }, gridStart);
  await expect.poll(() => page.locator("[data-work-heading]").evaluate((element) => Number(getComputedStyle(element).opacity))).toBeLessThan(0.1);

});
