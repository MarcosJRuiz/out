import type { Driver } from '../fixtures/driver.fixture';

const ESPERA_PADRAO = 20_000;

/** Base dos Screen Objects: locators nativos por accessibility id (content-desc), sem XPath. */
export abstract class BaseScreen {
  constructor(protected readonly driver: Driver) {}

  protected elemento(accessibilityId: string) {
    return this.driver.$(`~${accessibilityId}`);
  }

  protected elementos(accessibilityId: string) {
    return this.driver.$$(`~${accessibilityId}`);
  }

  /** Texto do primeiro TextView dentro de um container identificado por accessibility id. */
  protected async textoDe(accessibilityId: string) {
    const container = this.elemento(accessibilityId);
    await container.waitForDisplayed({ timeout: ESPERA_PADRAO });
    const textos = await container.$$('android.widget.TextView');
    return textos.length > 0 ? (await textos[0].getText()).trim() : (await container.getText()).trim();
  }

  /** Rola a tela até o elemento ficar visível (campos abaixo da dobra só existem na árvore depois disso). */
  protected rolarAte(accessibilityId: string) {
    return this.driver.$(
      `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().description("${accessibilityId}"))`,
    );
  }

  protected async tocar(accessibilityId: string) {
    const el = this.elemento(accessibilityId);
    await el.waitForDisplayed({ timeout: ESPERA_PADRAO });
    await el.click();
  }

  protected async preencherCampo(accessibilityId: string, valor: string) {
    const campo = await this.rolarAte(accessibilityId);
    await campo.waitForDisplayed({ timeout: ESPERA_PADRAO });
    await campo.clearValue();
    if (valor) await campo.setValue(valor);
  }

  protected async aguardar(accessibilityId: string) {
    await this.elemento(accessibilityId).waitForDisplayed({ timeout: ESPERA_PADRAO });
  }

  protected async visivel(accessibilityId: string) {
    return this.elemento(accessibilityId).isDisplayed();
  }
}
