import { defineConfig } from '@playwright/test';

export const SERVEREST_URL = process.env.SERVEREST_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/allure-results', suiteTitle: false }],
  ],
  outputDir: 'reports/test-results',
  use: {
    baseURL: SERVEREST_URL,
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
