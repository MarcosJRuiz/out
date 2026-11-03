import type { TestInfo } from '@playwright/test';
import type { Driver } from '../fixtures/driver.fixture';

export const APP_PACKAGE = 'com.saucelabs.mydemoapp.rn';

const TENTATIVAS = 3;

/**
 * Emuladores de CI às vezes exibem diálogos do sistema ("System UI isn't responding", "App isn't responding")
 * logo após o boot. Eles ficam sobre o app e escondem a árvore de elementos. Tocar em "Wait" os dispensa.
 */
async function dispensarDialogosDoSistema(driver: Driver) {
  for (const id of ['android:id/aerr_wait', 'android:id/aerr_close']) {
    const botao = await driver.$$(`id=${id}`);
    if (botao.length > 0) {
      await botao[0].click();
      return true;
    }
  }
  return false;
}

async function anexarDiagnostico(driver: Driver, testInfo: TestInfo, tentativa: number) {
  await testInfo.attach(`diagnostico-tentativa-${tentativa}.png`, {
    body: Buffer.from(await driver.takeScreenshot(), 'base64'),
    contentType: 'image/png',
  });
  await testInfo.attach(`diagnostico-tentativa-${tentativa}.xml`, {
    body: await driver.getPageSource(),
    contentType: 'application/xml',
  });
  const logcat = (await driver.getLogs('logcat')) as Array<{ message: string }>;
  await testInfo.attach(`logcat-tentativa-${tentativa}.txt`, {
    body: logcat
      .slice(-400)
      .map((l) => l.message)
      .join('\n'),
    contentType: 'text/plain',
  });
}

/** Deixa o app limpo (sem login e carrinho vazio) e aberto no catálogo, com recuperação de travamentos do emulador. */
export async function abrirAppLimpo(driver: Driver, testInfo: TestInfo) {
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    await dispensarDialogosDoSistema(driver);
    await driver.execute('mobile: clearApp', { appId: APP_PACKAGE });
    await driver.execute('mobile: activateApp', { appId: APP_PACKAGE });
    try {
      await driver.$('~products screen').waitForDisplayed({ timeout: 30_000 });
      return;
    } catch (erro) {
      await anexarDiagnostico(driver, testInfo, tentativa);
      if (tentativa === TENTATIVAS) throw erro;
      await driver.execute('mobile: terminateApp', { appId: APP_PACKAGE });
    }
  }
}
