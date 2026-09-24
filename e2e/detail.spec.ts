import { expect, test } from '@playwright/test';

test.describe('project detail', () => {
  test('opens from a tile and closes with Back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Wool/ }).click();

    await expect(page).toHaveURL(/\/work\/wool-ss26-campaign\/$/);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading')).toHaveText('Wool — SS26 Campaign');

    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test('opens straight from its own URL', async ({ page }) => {
    await page.goto('/work/fog/');
    await expect(page.getByRole('dialog')).toBeVisible();
    // The grid is behind it, prerendered, not fetched.
    await expect(page.locator('.offset-grid__item')).toHaveCount(9);
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/work/fog/');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('stops the page behind it from scrolling, and puts it back', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.scrollTo(0, 600);
    });
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(0);

    // dispatchEvent rather than click: Playwright scrolls a target into view
    // before clicking it, which would move the page we are trying to measure.
    await page.getByRole('link', { name: /Wool/ }).dispatchEvent('click');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('position', 'fixed');
    // Pinned at the offset it was scrolled to, so the page does not jump.
    await expect(page.locator('body')).toHaveCSS('top', `-${String(before)}px`);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('puts the page back where it was when closed with Back', async ({ page }) => {
    // The path where the browser would otherwise restore its own remembered
    // scroll position, recorded while the body was pinned.
    await page.goto('/');
    await page.evaluate(() => {
      window.scrollTo(0, 600);
    });
    const before = await page.evaluate(() => window.scrollY);

    await page.getByRole('link', { name: /Wool/ }).dispatchEvent('click');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('hands focus back to the tile it came from', async ({ page }) => {
    await page.goto('/');
    const tile = page.getByRole('link', { name: /Wool/ });
    await tile.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(tile).toBeFocused();
  });
});

test.describe('carousel', () => {
  test.skip(({ isMobile }) => isMobile === true, 'arrows are hidden without hover');

  test('pages forward and does not wrap', async ({ page }) => {
    await page.goto('/work/wool-ss26-campaign/');
    const dialog = page.getByRole('dialog');

    // Four photos: no way back from the first.
    await expect(dialog.getByRole('button', { name: 'Previous photo' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Next photo' })).toHaveCount(1);

    await dialog.getByRole('button', { name: 'Next photo' }).click();
    await expect(dialog.getByRole('button', { name: 'Previous photo' })).toHaveCount(1);

    await dialog.getByRole('button', { name: 'Next photo' }).click();
    await dialog.getByRole('button', { name: 'Next photo' }).click();
    // On the last one, no way forward — the only sign the series has ended.
    await expect(dialog.getByRole('button', { name: 'Next photo' })).toHaveCount(0);
  });

  test('pages with the arrow keys', async ({ page }) => {
    await page.goto('/work/wool-ss26-campaign/');
    const dialog = page.getByRole('dialog');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('button', { name: 'Previous photo' })).toHaveCount(1);
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.getByRole('button', { name: 'Previous photo' })).toHaveCount(0);
  });

  test('offers no arrows for a single photo', async ({ page }) => {
    await page.goto('/work/fog/');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /photo$/ })).toHaveCount(0);
  });
});
