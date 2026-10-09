import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:3000";

test("Case Studies artwork joins the shared scroll warp and restores for reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  await expect(page.locator('[aria-label="Loading portfolio"]')).toHaveCount(0, { timeout: 30000 });
  const images = page.locator("#case-studies img");
  await expect(images).toHaveCount(3);
  await images.first().scrollIntoViewIfNeeded();
  await expect(images.first()).toHaveCSS("opacity", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(images.first()).toHaveCSS("opacity", "1");
});

test("Hidden Gems cards drift at different scroll-parallax speeds", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  await expect(page.locator('[aria-label="Loading portfolio"]')).toHaveCount(0, { timeout: 30000 });
  const cards = page.locator("#creative [data-parallax-card]");
  await expect(cards).toHaveCount(6);
  await cards.first().scrollIntoViewIfNeeded();
  const before = await cards.evaluateAll((elements) => elements.map((card) => getComputedStyle(card).transform));
  await page.mouse.wheel(0, 320);
  await expect.poll(() => cards.evaluateAll((elements) => elements.map((card) => getComputedStyle(card).transform))).not.toEqual(before);
  const after = await cards.evaluateAll((elements) => elements.map((card) => getComputedStyle(card).transform));
  expect(new Set(after).size).toBeGreaterThan(1);
});

test("desktop replaces visible media with one canvas and restores flat artwork", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const images = page.locator("#creative img");
  await expect(images).toHaveCount(6);
  await expect(page.locator("canvas")).toHaveCount(1);
  await images.first().scrollIntoViewIfNeeded();
  await expect(images.first()).toHaveCSS("opacity", "0");
  await page.waitForTimeout(1000);
  const restingImage = await page.screenshot({ path: "/tmp/warp-grid-rest.png" });
  const bounds = await images.first().boundingBox();
  expect(bounds).not.toBeNull();
  const pixels = await page.evaluate(async ({ screenshot, box }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${screenshot}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return [2, box.width - 3].map((x) => Array.from(context.getImageData(Math.round(box.x + x), Math.round(box.y + 12), 1, 1).data).slice(0, 3));
  }, { screenshot: restingImage.toString("base64"), box: bounds! });
  // Both edges of the flat GPU plane align with the DOM image and its colour.
  for (const pixel of pixels) {
    [193, 203, 237].forEach((channel, index) => expect(Math.abs(pixel[index] - channel)).toBeLessThanOrEqual(2));
  }
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(100);
  await page.screenshot({ path: "/tmp/warp-grid-motion.png" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/warp-grid-settled.png" });
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
  // Reduced motion restores DOM gallery images, while the static hero retains its canvas.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(images.first()).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("canvas")).toHaveCount(1);
  await images.first().scrollIntoViewIfNeeded();
  await expect(images.first()).toHaveCSS("opacity", "0");
  await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(images.first()).toHaveCSS("opacity", "1");
});

test("mobile renders the warp during native touch scrolling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL);
  const images = page.locator("#creative img");
  await images.first().scrollIntoViewIfNeeded();
  await expect(images).toHaveCount(6);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(images.first()).toHaveCSS("opacity", "0");
  const boxes = await images.evaluateAll(elements => elements.map(image => ({ left: image.getBoundingClientRect().left, top: image.getBoundingClientRect().top })));
  expect(new Set(boxes.map(box => box.left)).size).toBe(2);
  expect(new Set(boxes.map(box => box.top)).size).toBeGreaterThanOrEqual(3);
  const before = await page.evaluate(() => window.scrollY);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 650, yDistance: -180, gestureSourceType: 'touch', speed: 600 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50);
  await page.screenshot({ path: '/tmp/creative-mobile-warp.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});

test("reduced motion keeps the static hero canvas and visible gallery media", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(baseURL);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("#creative img").first()).toHaveCSS("opacity", "1");
});

test("About shares Creative's canvas and falls back cleanly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const creative = page.locator("#creative img").first();
  await creative.scrollIntoViewIfNeeded();
  await expect(creative).toHaveCSS("opacity", "0");
  const canvas = await page.locator("canvas").elementHandle();
  const portrait = page.locator("#about img");
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toHaveCSS("opacity", "0");
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await canvas!.evaluate((element) => element === document.querySelector("canvas"))).toBe(true);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/about-desktop.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(portrait).toHaveCSS("opacity", "1");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await portrait.scrollIntoViewIfNeeded();
  const photo = await portrait.boundingBox();
  const bio = await page.locator("#about p").first().boundingBox();
  expect(bio!.y).toBeGreaterThan(photo!.y + photo!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("quote sequence contains the figure, quotes, and contact prompt", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const quote = page.locator("#quote");
  await quote.scrollIntoViewIfNeeded();
  await expect(quote).toHaveAttribute("data-animated", "true");
  await expect(quote.locator("[data-quote-actor]")).toHaveCount(1);
  await expect(quote.locator("[data-quote-words]")).toHaveCount(2);
  await expect(quote.locator("[data-quote-cta]")).toHaveCount(1);
});

test("quote section fits the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL);
  const section = page.locator('#quote');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator("[data-quote-words]")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
