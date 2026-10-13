import { expect, test } from '@playwright/test';

test.describe('grid and filter', () => {
  test('shows every project without JavaScript having to run', async ({ page }) => {
    await page.goto('/');
    // Two arrangements in the HTML (two columns and three); one is shown.
    await expect(page.locator('.offset-grid__item:visible')).toHaveCount(9);
    await expect(page.getByRole('link', { name: /Wool/ })).toBeVisible();
  });

  test('narrows to a category and says so in the URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Documentary', exact: true }).click();

    await expect(page).toHaveURL(/\?filter=art$/);
    await expect(page.getByRole('button', { name: 'Documentary', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // The grid is laid out afresh with the three art projects alone.
    await expect(page.locator('.offset-grid__item:visible')).toHaveCount(3);
  });

  test('arriving on a filtered URL shows that category', async ({ page }) => {
    await page.goto('/?filter=commercial');
    await expect(page.locator('.offset-grid__item:visible')).toHaveCount(6);
  });

  test('falls back to All rather than an empty page', async ({ page }) => {
    await page.goto('/?filter=nonsense');
    await expect(page.locator('.offset-grid__item:visible')).toHaveCount(9);
  });

  test('Back leaves the page instead of undoing filter clicks', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Documentary', exact: true }).click();
    await page.getByRole('button', { name: 'Commercial' }).click();
    await expect(page).toHaveURL(/\?filter=commercial$/);

    // replaceState, so there is nothing in history to step back through.
    await page.goBack();
    await expect(page).not.toHaveURL(/\?filter=/);
  });

  test('a title that wraps pushes the next tile down instead of running under it', async ({
    page,
  }) => {
    await page.goto('/');
    // Make one title long enough to wrap at any width, then compare boxes.
    const overlaps = await page.evaluate(() => {
      const columns = [...document.querySelectorAll('.offset-grid__column')].filter(
        (column) => column.getClientRects().length > 0,
      );
      const column = columns.find((candidate) => candidate.children.length > 1);
      if (column === undefined) return 'no column with two tiles';
      const title = column.children[0]?.querySelector('a > span > span:last-child');
      if (!(title instanceof HTMLElement)) return 'no title';
      const before = column.children[1]?.getBoundingClientRect().top ?? 0;
      title.textContent = 'A title long enough that it has to wrap onto several lines here';
      const caption = title.getBoundingClientRect();
      const next = column.children[1]?.getBoundingClientRect().top ?? 0;
      return { wrapped: caption.height > 30, moved: next > before, clear: next >= caption.bottom };
    });
    expect(overlaps).toEqual({ wrapped: true, moved: true, clear: true });
  });

  test('on a very large monitor the footer sits at the bottom and the edges line up', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a desktop-monitor case');
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto('/?filter=art');
    // The filter in the address is applied once the page is interactive; until
    // then all nine projects are there and the page is taller than the window.
    // Measuring before that failed in WebKit and on CI's slower machine.
    await expect(page.locator('.offset-grid__item:visible')).toHaveCount(3);
    const box = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
      const grid = rect('.offset-grid');
      const tile = [...document.querySelectorAll('.offset-grid__item')]
        .find((item) => item.getClientRects().length > 0)
        ?.getBoundingClientRect();
      return {
        footerBottom: Math.round(rect('footer')?.bottom ?? 0),
        window: window.innerHeight,
        scrolls: document.documentElement.scrollHeight > window.innerHeight,
        name: Math.round(rect('header a')?.left ?? 0),
        copyright: Math.round(rect('footer p')?.left ?? 0),
        firstTile: Math.round(tile?.left ?? 0),
        gridWidth: Math.round(grid?.width ?? 0),
      };
    });
    // Three projects do not fill a 4K window: no blank paper under the footer,
    // and nothing to scroll into.
    expect(box.footerBottom).toBe(box.window);
    expect(box.scrolls).toBe(false);
    // The name, the first tile and the copyright share one left edge.
    expect(box.gridWidth).toBe(1680);
    expect(box.name).toBe(box.firstTile);
    expect(box.copyright).toBe(box.firstTile);
  });
});
