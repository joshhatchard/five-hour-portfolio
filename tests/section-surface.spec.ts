import { expect, test } from "@playwright/test";

test("gallery sections flow without the shared heading surface", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page.locator("[data-work-surface]")).toHaveCount(0);
  await expect(page.locator("[data-work-heading]")).toHaveCount(0);
  await expect(page.locator("#case-studies")).toBeVisible();
  await page.locator("#creative").scrollIntoViewIfNeeded();
  await expect(page.locator("#creative")).toBeVisible();
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator("#about")).toBeVisible();
});
