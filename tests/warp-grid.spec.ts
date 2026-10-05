import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:3000";

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
  expect(new Set(boxes.map(box => box.top)).size).toBe(3);
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

test("quote reveals two thoughts and settles above its merged CTA", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const quote = page.locator("#quote");
  await expect(quote).toHaveAttribute("data-animated", "true");
  const seek = async (progress: number) => {
    await quote.evaluate((element, value) => {
      const box = element.getBoundingClientRect();
      window.scrollTo(0, box.top + window.scrollY + (box.height - window.innerHeight) * value);
    }, progress);
    await page.waitForTimeout(800);
  };
  await seek(0);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "0");
  const initial = await page.locator('[data-quote-actor]').evaluate((element) => getComputedStyle(element).transform);
  await page.screenshot({ path: "/tmp/quote-start.png" });
  await seek(0.15);
  const spinning = await page.locator('[data-quote-actor]').evaluate((element) => getComputedStyle(element).transform);
  expect(spinning).not.toBe(initial);
  await page.screenshot({ path: "/tmp/quote-middle.png" });
  await seek(0.4);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "1");
  const fill = await page.locator('[data-quote-colour]').boundingBox();
  expect(fill!.x).toBeLessThan(0);
  expect(fill!.y).toBeLessThan(0);
  expect(fill!.width + fill!.x).toBeGreaterThan(1440);
  expect(fill!.height + fill!.y).toBeGreaterThan(900);
  await page.screenshot({ path: "/tmp/quote-end.png" });
  await seek(0.65);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-quote-words]').nth(1)).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "/tmp/quote-second.png" });
  await seek(1);
  await expect(page.locator('[data-quote-words]').nth(1)).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-quote-actor]')).toHaveCSS("opacity", "1");
  const finalScale = await page.locator('[data-quote-actor]').evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return Math.hypot(matrix.m11, matrix.m12, matrix.m13);
  });
  expect(finalScale).toBeCloseTo(1, 2);
  await page.screenshot({ path: "/tmp/quote-shrink.png" });
  // The CTA finishes appearing without scrolling; the stage releases immediately.
  const restingScroll = await page.evaluate(() => window.scrollY);
  await expect(page.locator('[data-quote-cta]')).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => window.scrollY)).toBe(restingScroll);
  const stageBefore = await page.locator('[data-quote-stage]').boundingBox();
  await page.evaluate(() => window.scrollBy(0, 40));
  await page.waitForTimeout(400);
  const stageAfter = await page.locator('[data-quote-stage]').boundingBox();
  expect(stageAfter!.y).toBeLessThan(stageBefore!.y - 25);
  await expect(page.locator('[data-quote-cta]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-quote-cta] a')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', 'mailto:joshualhatcchard@gmail.com');
  await expect(page.locator('[data-quote-cta] a').nth(1)).toHaveAttribute('aria-disabled', 'true');
  const actorBox = await page.locator('[data-quote-actor]').boundingBox();
  const headingBox = await page.locator('#cta-heading').boundingBox();
  expect(actorBox!.y + actorBox!.height).toBeLessThan(headingBox!.y);
  await seek(0);
  await page.getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page.locator('[data-quote-cta]')).toHaveCSS("opacity", "1");
  await seek(0);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-quote-actor]')).toHaveCSS("opacity", "1");
  // Quote choreography remains active even when other sections reduce motion.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(quote).toHaveAttribute("data-animated", "true");
  await seek(0);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-quote-actor]')).toHaveCSS("display", "block");
  await seek(0.4);
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS("opacity", "1");
  await seek(0.65);
  await expect(page.locator('[data-quote-words]').nth(1)).toHaveCSS("opacity", "1");
  await seek(1);
  await expect(page.locator('[data-quote-cta]')).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});

test("quote animates on a fresh mobile load with reduced motion enabled", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(baseURL);
  const section = page.locator('#quote');
  await expect(section).toHaveAttribute('data-animated', 'true');
  for (const [progress, selector] of [
    [0, '[data-quote-actor]'],
    [0.4, '[data-quote-words]'],
    [1, '[data-quote-cta]'],
  ] as const) {
    await section.evaluate((element, value) => {
      const rect = element.getBoundingClientRect();
      window.scrollTo(0, rect.top + window.scrollY + (rect.height - window.innerHeight) * value);
    }, progress);
    if (progress === 0.4) {
      await expect(page.locator('[data-quote-words]').first()).toHaveCSS('opacity', '1');
    } else {
      await expect(page.locator(selector)).toHaveCSS('opacity', '1');
    }
  }
  await expect(page.locator('[data-quote-words]').first()).toHaveCSS('opacity', '0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
