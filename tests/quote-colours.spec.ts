import { expect, test } from "@playwright/test";

test("quote section starts on the About ink surface with a lime animation field", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const quote = page.locator("#quote");
  await expect(quote).toHaveCSS("background-color", "rgb(17, 18, 13)");
  await expect(quote.locator("[data-quote-colour]")).toHaveCSS("background-color", "rgb(213, 250, 72)");
});
