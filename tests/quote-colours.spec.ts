import { expect, test } from "@playwright/test";

test("quote section continues the About ink background with a lime animation field", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const quote = page.locator("#quote");
  const field = quote.locator("[data-quote-colour]");
  await expect(quote).toHaveCSS("background-color", "rgb(17, 18, 13)");
  await expect(field).toHaveCSS("background-color", "rgb(213, 250, 72)");
});
