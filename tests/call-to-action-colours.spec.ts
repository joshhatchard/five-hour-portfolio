import { expect, test } from "@playwright/test";

test("call-to-action section uses the primary surface", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const cta = page.locator("#call-to-action");
  await expect(cta).toHaveCSS("background-color", "rgb(196, 241, 58)");
  await expect(cta.locator("[data-cta-colour]")).toHaveCSS("background-color", "rgb(196, 241, 58)");
});
