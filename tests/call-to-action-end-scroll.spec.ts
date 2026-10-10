import { expect, test } from "@playwright/test";

test("extra scrolling at the page end spins the CTA model without trapping scroll", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page.locator("html")).toHaveAttribute("data-portfolio-ready", "true", { timeout: 30000 });
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  const actor = page.locator("[data-cta-actor]");
  await expect(actor).toHaveAttribute("data-model-ready", "true");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY)).toBeLessThanOrEqual(3);
  await expect(actor).toHaveAttribute("data-interactive", "true");
  // Let the scrubbed entry finish before measuring the idle spin.
  await page.waitForTimeout(1000);
  const angle = async () => Number(await actor.getAttribute("data-spin-angle"));
  const first = await angle();
  await page.waitForTimeout(500);
  const idle = (await angle()) - first;
  const bottom = await page.evaluate(() => scrollY);
  const beforeWheel = await angle();
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  expect((await angle()) - beforeWheel).toBeGreaterThan(idle + 0.5);
  expect(Math.abs((await page.evaluate(() => scrollY)) - bottom)).toBeLessThan(3);
  await page.mouse.wheel(0, -450);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(bottom - 100);
  await expect(page.locator("[data-quote-words]")).toHaveCount(2);
});
