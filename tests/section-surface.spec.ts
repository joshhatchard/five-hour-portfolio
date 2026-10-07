import { expect, test } from "@playwright/test";

test("shared surface fades cleanly between post-dive section colours", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const surface = page.locator("[data-work-surface]");
  const creative = page.locator("#creative");
  const start = await creative.evaluate((section) => section.getBoundingClientRect().top + scrollY - innerHeight * 0.55);

  await page.evaluate((position) => {
    window.scrollTo(0, position + innerHeight * 0.1);
    window.dispatchEvent(new Event("scroll"));
  }, start);
  const early = await surface.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.evaluate((position) => {
    window.scrollTo(0, position + innerHeight * 0.3 + 1);
    window.dispatchEvent(new Event("scroll"));
  }, start);
  await expect.poll(() => surface.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(early);
  await expect(surface).toHaveCSS("background-color", "rgb(250, 249, 243)");
});
