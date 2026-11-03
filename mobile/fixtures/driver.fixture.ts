import { test as base } from '@playwright/test';
import path from 'node:path';
import { remote } from 'webdriverio';

type Driver = Awaited<ReturnType<typeof remote>>;

export const test = base.extend<{ driver: Driver }>({
  driver: async ({}, use, testInfo) => {
    const driver = await remote({
      hostname: '127.0.0.1',
      port: 4723,
      logLevel: 'warn',
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.resolve(__dirname, '..', 'apps', 'my-demo-app.apk'),
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 240,
        'appium:uiautomator2ServerInstallTimeout': 120_000,
        'appium:adbExecTimeout': 120_000,
      },
    });

    await use(driver);

    // Spike: anexa sempre, para mapearmos os locators do app a partir da CI.
    await testInfo.attach('screenshot', {
      body: Buffer.from(await driver.takeScreenshot(), 'base64'),
      contentType: 'image/png',
    });
    await testInfo.attach('page-source.xml', {
      body: await driver.getPageSource(),
      contentType: 'application/xml',
    });
    await driver.deleteSession();
  },
});

export { expect } from '@playwright/test';
