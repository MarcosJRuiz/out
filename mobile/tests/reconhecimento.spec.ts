// TEMPORÁRIO: mapeia as telas do app na CI (sem Android local) para escrever os testes com locators reais.
import { test } from '../fixtures/driver.fixture';

test('reconhecimento das telas do My Demo App', async ({ driver }, testInfo) => {
  test.setTimeout(600_000);

  const registrar = async (etapa: string) => {
    await testInfo.attach(`${etapa}.xml`, {
      body: await driver.getPageSource(),
      contentType: 'application/xml',
    });
    await testInfo.attach(`${etapa}.png`, {
      body: Buffer.from(await driver.takeScreenshot(), 'base64'),
      contentType: 'image/png',
    });
  };
  const tocar = async (seletor: string) => {
    try {
      const el = await driver.$(seletor);
      await el.waitForDisplayed({ timeout: 15_000 });
      await el.click();
      return true;
    } catch (erro) {
      testInfo.annotations.push({
        type: 'nao-encontrado',
        description: `${seletor}: ${String(erro).slice(0, 200)}`,
      });
      return false;
    }
  };
  const digitar = async (seletor: string, texto: string) => {
    try {
      await (await driver.$(seletor)).setValue(texto);
    } catch (erro) {
      testInfo.annotations.push({
        type: 'nao-encontrado',
        description: `${seletor}: ${String(erro).slice(0, 200)}`,
      });
    }
  };

  await (await driver.$('~products screen')).waitForDisplayed({ timeout: 60_000 });
  await registrar('01-catalogo');

  await tocar('~open menu');
  await registrar('02-menu');

  await tocar('~menu item log in');
  await registrar('03-login');

  await tocar('~Login button');
  await registrar('04-login-campos-vazios');

  await digitar('~Username input field', 'alice@example.com');
  await digitar('~Password input field', '10203040');
  await tocar('~Login button');
  await registrar('05-login-usuario-bloqueado');

  await digitar('~Username input field', 'bob@example.com');
  await digitar('~Password input field', '10203040');
  await tocar('~Login button');
  await registrar('06-apos-login');

  await tocar('~store item');
  await registrar('07-detalhe-produto');

  await tocar('~Add To Cart button');
  await registrar('08-adicionado');

  await tocar('~cart badge');
  await registrar('09-carrinho');

  await tocar('~Proceed To Checkout button');
  await registrar('10-checkout-endereco');

  await tocar('~To Payment button');
  await registrar('11-endereco-campos-vazios');

  await tocar('~open menu');
  await registrar('12-menu-logado');
});
