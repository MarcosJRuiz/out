// TEMPORÁRIO: mapeia as telas do app na CI (sem Android local) para escrever os testes com locators reais.
import { test } from '../fixtures/driver.fixture';

test('reconhecimento das telas do My Demo App', async ({ driver }, testInfo) => {
  test.setTimeout(600_000);

  const registrar = async (etapa: string) => {
    await driver.pause(1_500); // deixa a tela estabilizar antes de capturar
    await testInfo.attach(`${etapa}.xml`, {
      body: await driver.getPageSource(),
      contentType: 'application/xml',
    });
    await testInfo.attach(`${etapa}.png`, {
      body: Buffer.from(await driver.takeScreenshot(), 'base64'),
      contentType: 'image/png',
    });
  };
  const anotar = (seletor: string, erro: unknown) =>
    testInfo.annotations.push({
      type: 'nao-encontrado',
      description: `${seletor}: ${String(erro).slice(0, 200)}`,
    });
  const tocar = async (seletor: string, indice = 0) => {
    try {
      const el = (await driver.$$(seletor))[indice];
      await el.waitForDisplayed({ timeout: 15_000 });
      await el.click();
    } catch (erro) {
      anotar(seletor, erro);
    }
  };
  const digitar = async (seletor: string, texto: string) => {
    try {
      await driver.$(seletor).setValue(texto);
    } catch (erro) {
      anotar(seletor, erro);
    }
  };

  await driver.$('~products screen').waitForDisplayed({ timeout: 60_000 });

  // Login com senha incorreta e com senha vazia
  await tocar('~open menu');
  await tocar('~menu item log in');
  await digitar('~Username input field', 'bob@example.com');
  await digitar('~Password input field', 'senha-errada');
  await tocar('~Login button');
  await registrar('01-login-senha-incorreta');
  await driver.$('~Password input field').clearValue();
  await tocar('~Login button');
  await registrar('02-login-senha-vazia');
  await digitar('~Password input field', '10203040');
  await tocar('~Login button');
  await registrar('03-apos-login');

  // Produto → carrinho → checkout
  await tocar('~store item', 0);
  await registrar('04-detalhe-produto');
  await tocar('~Add To Cart button');
  await registrar('05-apos-adicionar');
  await tocar('~cart badge');
  await registrar('06-carrinho');
  await tocar('~Proceed To Checkout button');
  await registrar('07-endereco');
  await tocar('~To Payment button');
  await registrar('08-endereco-campos-vazios');
});
