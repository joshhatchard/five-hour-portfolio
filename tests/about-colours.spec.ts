import { expect, test } from "@playwright/test";

test("About card keeps its dark surface and lime label", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const about = page.locator("#about");
  const grid = about.locator("[data-about-wipe]");
  await expect(grid).toHaveCSS("background-color", "rgb(17, 18, 13)");
  await expect(about.locator("p").first()).toHaveCSS("color", "rgb(213, 250, 72)");

  await about.scrollIntoViewIfNeeded();
  await expect(page.locator("[data-work-heading]")).toHaveCount(0);
});
