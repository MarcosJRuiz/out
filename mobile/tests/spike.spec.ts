import { test, expect } from '../fixtures/driver.fixture';

test('spike: app abre no catálogo de produtos', async ({ driver }) => {
  const titulo = await driver.$('android=new UiSelector().text("Products")');
  await titulo.waitForDisplayed({ timeout: 60_000 });

  expect(await titulo.isDisplayed()).toBe(true);
});
