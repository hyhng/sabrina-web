import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end against the built static export, served the way Cloudflare Pages
 * will serve it — not against a dev server. The point of these tests is the
 * behaviour that unit tests cannot reach: real clicks, the Back button, the
 * page behind an overlay actually not scrolling.
 *
 * Chromium alone here. The cross-browser pass in docs/SPEC.md 9.4 belongs to
 * F5, with real photographs and a real device to hold.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI === undefined ? 0 : 1,
  reporter: process.env.CI === undefined ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm --filter web serve',
    url: 'http://localhost:4173',
    reuseExistingServer: process.env.CI === undefined,
    timeout: 120_000,
  },
});
