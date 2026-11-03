import { test as base } from '@playwright/test';
import path from 'node:path';
import { remote } from 'webdriverio';
import { CarrinhoScreen } from '../screens/carrinho.screen';
import { CatalogoScreen } from '../screens/catalogo.screen';
import { EnderecoScreen } from '../screens/endereco.screen';
import { LoginScreen } from '../screens/login.screen';
import { MenuScreen } from '../screens/menu.screen';
import { PagamentoScreen } from '../screens/pagamento.screen';
import { ProdutoScreen } from '../screens/produto.screen';

export type Driver = Awaited<ReturnType<typeof remote>>;

export const APP_PACKAGE = 'com.saucelabs.mydemoapp.rn';

type Telas = {
  catalogo: CatalogoScreen;
  menu: MenuScreen;
  login: LoginScreen;
  produto: ProdutoScreen;
  carrinho: CarrinhoScreen;
  endereco: EnderecoScreen;
  pagamento: PagamentoScreen;
};

export const test = base.extend<
  Telas & { driver: Driver; evidencia: (nome: string) => Promise<void> },
  { sessao: Driver }
>({
  // Uma sessão do Appium por worker: abrir sessão custa ~40 s (instala o servidor UiAutomator2 no emulador).
  sessao: [
    async ({}, use) => {
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
      await driver.deleteSession();
    },
    { scope: 'worker' },
  ],

  // Cada teste começa com o app limpo (sem login e carrinho vazio), na tela de catálogo.
  driver: async ({ sessao }, use, testInfo) => {
    await sessao.execute('mobile: clearApp', { appId: APP_PACKAGE });
    await sessao.execute('mobile: activateApp', { appId: APP_PACKAGE });
    await new CatalogoScreen(sessao).aguardarExibicao();

    await use(sessao);

    await testInfo.attach('tela-final.png', {
      body: Buffer.from(await sessao.takeScreenshot(), 'base64'),
      contentType: 'image/png',
    });
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('page-source.xml', {
        body: await sessao.getPageSource(),
        contentType: 'application/xml',
      });
    }
  },

  // Screenshot nomeado em pontos de validação do teste.
  evidencia: async ({ driver }, use, testInfo) => {
    await use(async (nome: string) => {
      await testInfo.attach(`${nome}.png`, {
        body: Buffer.from(await driver.takeScreenshot(), 'base64'),
        contentType: 'image/png',
      });
    });
  },

  catalogo: async ({ driver }, use) => use(new CatalogoScreen(driver)),
  menu: async ({ driver }, use) => use(new MenuScreen(driver)),
  login: async ({ driver }, use) => use(new LoginScreen(driver)),
  produto: async ({ driver }, use) => use(new ProdutoScreen(driver)),
  carrinho: async ({ driver }, use) => use(new CarrinhoScreen(driver)),
  endereco: async ({ driver }, use) => use(new EnderecoScreen(driver)),
  pagamento: async ({ driver }, use) => use(new PagamentoScreen(driver)),
});

export { expect } from '@playwright/test';
