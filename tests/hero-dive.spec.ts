import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]] as const) {
  test(`hero dive ${name}: poses, landing and reverse scroll`, async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:3000');
    const hero = page.locator('#hero');
    await expect(hero).toHaveAttribute('data-model-ready', 'true');
    await expect(hero).toHaveAttribute('data-dive', 'true');
    await expect(hero).toHaveAttribute('data-model-facing', 'left');
    await expect(hero.locator('[data-hero-world] > g').last()).toHaveCSS('visibility', 'hidden');
    await mkdir('/tmp/hero-dive', { recursive: true });
    const seek = async (progress: number) => {
      await hero.evaluate((element, p) => {
        const rect = element.getBoundingClientRect();
        window.scrollTo(0, rect.top + window.scrollY + rect.height * p);
      }, progress);
      await page.waitForTimeout(450);
    };
    let initial = '';
    const forward = new Map<number, string>();
    for (const progress of [0, 0.1, 0.14, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1]) {
      await seek(progress);
      const info = await hero.evaluate(element => ({ headScreenY: (element as HTMLElement).dataset.headScreenY, cameraZoom: (element as HTMLElement).dataset.cameraZoom, diverX: (element as HTMLElement).dataset.diverX, waterline: document.querySelector('#case-studies')!.getBoundingClientRect().top }));
      console.log(name, progress, JSON.stringify(info));
      if (progress === 0) initial = info.headScreenY!;
      forward.set(progress, JSON.stringify(await hero.evaluate(element => ({ ...((element as HTMLElement).dataset) }))));
      expect(Number(await hero.getAttribute('data-run-stride'))).toBe(0);
      expect(Number(await hero.getAttribute('data-arm-stride'))).toBe(0);
      expect(Number(await hero.getAttribute('data-twist-degrees'))).toBe(0);
      if (progress === 0.2 || progress === 0.25) {
        const fill = await hero.locator('[data-hero-fill]').boundingBox();
        expect(fill!.width).toBeCloseTo(width, 0);
        expect(fill!.height).toBeCloseTo(height, 0);
        expect(fill!.x).toBeCloseTo(0, 0);
        expect(fill!.y).toBeCloseTo(0, 0);
      }
      if (progress === 0.85) {
        const footY = Number(await hero.getAttribute('data-foot-screen-y'));
        expect(footY).toBeGreaterThan(Number(info.headScreenY) + height * 0.06);
        expect(Math.abs(footY - info.waterline)).toBeLessThan(height * 0.04);
        expect(Math.abs(info.waterline / height - 0.66)).toBeLessThan(0.02);
        expect(Number(info.cameraZoom)).toBe(1);
        expect(Math.abs(Number(info.diverX) - width / 2)).toBeLessThan(5);
      }
      await page.screenshot({ path: `/tmp/hero-dive/${name}-${progress}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    for (const progress of [0.85, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.14, 0.1, 0]) {
      await seek(progress);
      expect(JSON.stringify(await hero.evaluate(element => ({ ...((element as HTMLElement).dataset) })))).toBe(forward.get(progress));
    }
    await page.screenshot({ path: `/tmp/hero-dive/${name}-reverse.png` });
    expect(await hero.getAttribute('data-head-screen-y')).toBe(initial);
    await expect(hero).toHaveAttribute('data-twist-degrees', '0.00');
    await page.getByRole('link', { name: 'See my work' }).click();
    await expect.poll(() => page.locator('#case-studies').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(5);
    await expect(hero).toHaveAttribute('data-dive-progress', '1.0000');
    expect(errors).toEqual([]);
  });
}

test('hero reduced motion remains a normal static section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000');
  const hero = page.locator('#hero');
  await expect(hero).not.toHaveAttribute('data-dive', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(hero).toHaveAttribute('data-model-ready', 'true');
  await expect(hero).toHaveAttribute('data-model-facing', 'left');
  await expect(hero.locator('[data-hero-world] > g').last()).toHaveCSS('visibility', 'hidden');
  await page.screenshot({ path: '/tmp/hero-dive/reduced-3d.png' });
  await expect(page.locator('#hero h1')).toContainText('FULL SEND');
});

test('failed hero model leaves the SVG and normal page flow', async ({ page }) => {
  await page.route('**/models/stickman.glb', route => route.abort());
  await page.goto('http://localhost:3000');
  const hero = page.locator('#hero');
  await expect(hero).toHaveAttribute('data-model-failed', 'true');
  await expect(hero).not.toHaveAttribute('data-dive', 'true');
  expect(await hero.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(1200);
  await expect(page.getByRole('link', { name: 'See my work' })).toBeVisible();
});

test('resizing during the dive recomputes the landing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  const hero = page.locator('#hero');
  await expect(hero).toHaveAttribute('data-model-ready', 'true');
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await hero.evaluate(element => {
    const rect = element.getBoundingClientRect();
    window.scrollTo(0, rect.top + window.scrollY + rect.height * 0.85);
  });
  await expect(hero).toHaveAttribute('data-camera-zoom', '1.000');
  await expect.poll(async () => Number(await hero.getAttribute('data-diver-x'))).toBeCloseTo(195, 0);
  expect(await page.locator('#case-studies').evaluate(element => element.getBoundingClientRect().top / window.innerHeight)).toBeCloseTo(0.66, 2);
});

 test('motion preference changes retain the model and restore the dive', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const hero = page.locator('#hero');
  await expect(hero).toHaveAttribute('data-model-ready', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).not.toHaveAttribute('data-dive', 'true');
  await expect(hero).toHaveAttribute('data-model-ready', 'true');
  await expect(hero.locator('[data-hero-world] > g').last()).toHaveCSS('visibility', 'hidden');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(hero).toHaveAttribute('data-dive', 'true');
  await expect(hero).toHaveAttribute('data-model-ready', 'true');
});
