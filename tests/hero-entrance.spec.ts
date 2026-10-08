import { test, expect } from '@playwright/test';

for (const width of [390, 768, 1440]) {
  test(`entrance completes and Full Send survives the dive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000');
    const hero = page.locator('#hero');
    await expect(hero).toHaveAttribute('data-model-ready', 'true');
    // The loader's exit exposes the page before its ready signal. Neither
    // element should flash in that gap and then disappear for its delay.
    await page.waitForFunction(() => document.querySelector('[aria-label="Loading portfolio"]')?.getAttribute('data-leaving') === 'true');
    expect(await page.evaluate(() => ['.navbar', '[data-warp-canvas]'].every(selector => {
      const style = getComputedStyle(document.querySelector(selector)!);
      return style.opacity === '0' && style.visibility === 'hidden';
    }))).toBe(true);
    await expect(page.locator('[aria-label="Loading portfolio"]')).toHaveCount(0);
    await expect(hero).toHaveAttribute('data-hero-intro', 'true');
    expect(await hero.evaluate(el => el.getAnimations({ subtree: true }).some(a => a.playState === 'running'))).toBe(true);
    await expect(hero).toHaveAttribute('data-hero-entered', 'true');
    await page.waitForTimeout(1500);
    expect(await hero.locator('h1').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, innerHeight * 4.4 * 0.35));
    await expect.poll(async () => Number(await hero.getAttribute('data-dive-progress'))).toBeGreaterThan(0.3);
    const label = hero.locator('[data-hero-send]');
    await expect(label).toBeVisible();
    expect(await label.evaluate(el => {
      let node: Element | null = el;
      while (node && node.id !== 'hero') {
        const style = getComputedStyle(node);
        if (Number(style.opacity) === 0 || style.visibility === 'hidden' || style.overflow === 'hidden') return false;
        node = node.parentElement;
      }
      const box = el.getBoundingClientRect();
      return box.top >= 0 && box.bottom < innerHeight && box.width > innerWidth * 0.8;
    })).toBe(true);
    await page.screenshot({ path: `/tmp/hero-fixed-${width}.png` });
  });
}

test('scrolling during loading and immediately after loading keeps the dive usable', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('#hero')).toHaveAttribute('data-dive', 'true');
  await expect(page.locator('[aria-label="Loading portfolio"]')).toBeVisible();
  await page.mouse.wheel(0, 1000);
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('[aria-label="Loading portfolio"]')).toHaveCount(0);
  await page.mouse.wheel(0, 700);
  const hero = page.locator('#hero');
  await expect(hero).toHaveAttribute('data-hero-intro-skipped', 'true');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(hero).toHaveAttribute('data-hero-entered', 'true');
  await expect(hero.locator('[data-hero-send]')).toBeVisible();
  await page.mouse.wheel(0, 700);
  await expect.poll(async () => Number(await hero.getAttribute('data-dive-progress'))).toBeGreaterThan(0.3);
  const box = await hero.locator('[data-hero-send]').boundingBox();
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.width).toBeGreaterThan(1000);
});

test('particles render without further mouse movement after the lime expands', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('#hero')).toHaveAttribute('data-dive', 'true');
  await page.mouse.move(1200, 650);
  await expect(page.locator('#hero')).toHaveAttribute('data-hero-entrance-complete', 'true', { timeout: 10000 });
  for (const progress of [0.3, 0.45, 0.6]) {
    await page.evaluate(p => window.scrollTo(0, innerHeight * 4.4 * p), progress);
    await expect.poll(async () => Number(await page.locator('#hero').getAttribute('data-dive-progress'))).toBeCloseTo(progress, 2);
    await expect(page.locator('[data-hero-particles]')).toHaveCSS('opacity', '1');
    const visiblePixels = await page.locator('[data-hero-particles] canvas').evaluate(canvas => new Promise<number>(resolve => {
      requestAnimationFrame(() => {
        const copy = document.createElement('canvas');
        copy.width = (canvas as HTMLCanvasElement).width;
        copy.height = (canvas as HTMLCanvasElement).height;
        const ctx = copy.getContext('2d')!;
        ctx.drawImage(canvas as HTMLCanvasElement, 0, 0);
        const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
        let count = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 128) count++;
        resolve(count);
      });
    }));
    expect(visiblePixels).toBeGreaterThan(100);
  }
});
