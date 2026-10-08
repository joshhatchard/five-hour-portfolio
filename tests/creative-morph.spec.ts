import { test, expect } from '@playwright/test';

for (const mobile of [false, true]) {
  test(`scroll-driven shared heading ${mobile ? 'touch' : 'desktop'}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: mobile ? 390 : 1440, height: 900 }, hasTouch: mobile, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3000');
    await expect(page.locator('#hero')).toHaveAttribute('data-model-ready', 'true');
    const heading = page.locator('[data-work-heading]');
    const title = heading.locator('h2');
    await expect(heading).toHaveCount(1);
    await expect(page.locator('#case-studies h2, #creative h2, #about h2')).toHaveCount(0);
    await title.evaluate(el => el.setAttribute('data-original-node', 'true'));
    for (const [selector, state, label, lead] of [
      ['#case-studies', 'cases', 'Big Thrills', 0.55],
      ['#creative', 'creative', 'Hidden Gems', 0.55],
      ['#about', 'about', 'Who’s this?', 0.55],
    ] as const) {
      const start = await page.locator(selector).evaluate((el, sectionLead) => el.getBoundingClientRect().top + scrollY
        - new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 - innerHeight * sectionLead, lead);
      const seek = async (progress: number) => {
        await page.evaluate(y => window.scrollTo(0, y), start + 765 * progress + (progress === 1 ? 1 : 0));
        await expect.poll(async () => Number(await heading.getAttribute('data-progress'))).toBeCloseTo(progress, 2);
      };
      await seek(0.3);
      await expect(heading).toHaveAttribute('data-state', 'animating');
      const glyph = title.locator('[data-glyph]').first();
      const frame = await glyph.getAttribute('style');
      await page.waitForTimeout(250);
      expect(await glyph.getAttribute('style')).toBe(frame);
      await seek(1);
      await expect(heading).toHaveAttribute('data-state', state);
      await expect(title).toHaveAttribute('aria-label', label);
      await seek(0.3);
      expect(await glyph.getAttribute('style')).toBe(frame);
      await expect(heading).not.toHaveAttribute('data-locked', 'true');
      await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
      await seek(1);
      await expect(title).toHaveAttribute('data-original-node', 'true');
    }
      // Native wheel/touch can advance the animation at any point.
      const before = await page.evaluate(() => scrollY);
      if (mobile) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 700 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: 550 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else await page.mouse.wheel(0, 150);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 20);
    await expect(heading).not.toHaveAttribute('data-locked', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(title).toHaveAttribute('aria-label', 'Who’s this?');
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    expect(errors).toEqual([]);
    await context.close();
  });
}
