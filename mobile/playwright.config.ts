import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  // Um único emulador: os testes rodam em sequência, reaproveitando a mesma sessão do Appium.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 180_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['allure-playwright', { resultsDir: 'reports/allure-results', suiteTitle: false }],
  ],
  outputDir: 'reports/test-results',
});
