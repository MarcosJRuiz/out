import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  readonly enderecoEntrega: Locator;
  readonly comentario: Locator;
  readonly botaoFazerPedido: Locator;

  constructor(page: Page) {
    super(page);
    this.enderecoEntrega = page.locator('#address_delivery');
    this.comentario = page.locator('textarea[name="message"]');
    this.botaoFazerPedido = page.getByRole('link', { name: 'Place Order' });
  }

  async fazerPedido(comentario: string) {
    await this.comentario.fill(comentario);
    await this.botaoFazerPedido.click();
    await this.aguardarSiteDisponivel();
  }
}
