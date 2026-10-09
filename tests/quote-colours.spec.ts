import { expect, test } from "@playwright/test";

test("quote section uses the primary surface", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const quote = page.locator("#quote");
  await expect(quote).toHaveCSS("background-color", "rgb(196, 241, 58)");
  await expect(quote.locator("[data-quote-colour]")).toHaveCSS("background-color", "rgb(196, 241, 58)");
});
