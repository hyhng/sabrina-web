import { expect, test } from '@playwright/test';

test.describe('grid and filter', () => {
  test('shows every project without JavaScript having to run', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.offset-grid__item')).toHaveCount(9);
    await expect(page.getByRole('link', { name: /Wool/ })).toBeVisible();
  });

  test('narrows to a category and says so in the URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Art', exact: true }).click();

    await expect(page).toHaveURL(/\?filter=art$/);
    await expect(page.getByRole('button', { name: 'Art', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Six commercial tiles stay in the DOM so they can fade. They are
    // transparent rather than removed, so they still count as visible — what
    // matters is that inert takes them out of reach.
    await expect(page.locator('.offset-grid__item[data-hidden="true"]')).toHaveCount(6);
    await expect(page.locator('.offset-grid__item[data-hidden="true"][inert]')).toHaveCount(6);
    await expect(page.locator('.offset-grid__item[data-hidden="true"]').first()).toHaveCSS(
      'opacity',
      '0',
    );
  });

  test('arriving on a filtered URL shows that category', async ({ page }) => {
    await page.goto('/?filter=commercial');
    await expect(page.locator('.offset-grid__item[data-hidden="true"]')).toHaveCount(3);
  });

  test('falls back to All rather than an empty page', async ({ page }) => {
    await page.goto('/?filter=nonsense');
    await expect(page.locator('.offset-grid__item[data-hidden="true"]')).toHaveCount(0);
  });

  test('Back leaves the page instead of undoing filter clicks', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Art', exact: true }).click();
    await page.getByRole('button', { name: 'Commercial' }).click();
    await expect(page).toHaveURL(/\?filter=commercial$/);

    // replaceState, so there is nothing in history to step back through.
    await page.goBack();
    await expect(page).not.toHaveURL(/\?filter=/);
  });
});
