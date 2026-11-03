import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export type Cartao = { nome: string; numero: string; cvc: string; mes: string; ano: string };

export class PagamentoPage extends BasePage {
  readonly nomeNoCartao: Locator;
  readonly numeroDoCartao: Locator;
  readonly cvc: Locator;
  readonly mesValidade: Locator;
  readonly anoValidade: Locator;
  readonly botaoPagar: Locator;
  readonly pedidoConfirmado: Locator;
  readonly mensagemConfirmacao: Locator;

  constructor(page: Page) {
    super(page);
    this.nomeNoCartao = page.locator('[data-qa="name-on-card"]');
    this.numeroDoCartao = page.locator('[data-qa="card-number"]');
    this.cvc = page.locator('[data-qa="cvc"]');
    this.mesValidade = page.locator('[data-qa="expiry-month"]');
    this.anoValidade = page.locator('[data-qa="expiry-year"]');
    this.botaoPagar = page.locator('[data-qa="pay-button"]');
    this.pedidoConfirmado = page.locator('[data-qa="order-placed"]');
    this.mensagemConfirmacao = page.getByText('Congratulations! Your order has been confirmed!');
  }

  async pagar(cartao: Partial<Cartao>) {
    if (cartao.nome !== undefined) await this.nomeNoCartao.fill(cartao.nome);
    if (cartao.numero !== undefined) await this.numeroDoCartao.fill(cartao.numero);
    if (cartao.cvc !== undefined) await this.cvc.fill(cartao.cvc);
    if (cartao.mes !== undefined) await this.mesValidade.fill(cartao.mes);
    if (cartao.ano !== undefined) await this.anoValidade.fill(cartao.ano);
    await this.botaoPagar.click();
    await this.aguardarSiteDisponivel();
  }
}
