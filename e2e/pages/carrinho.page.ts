import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export type LinhaDoCarrinho = { nome: string; preco: string; quantidade: string; total: string };

export class CarrinhoPage extends BasePage {
  readonly carrinhoVazio: Locator;
  readonly botaoFinalizar: Locator;
  readonly modalLoginObrigatorio: Locator;

  constructor(page: Page) {
    super(page);
    this.carrinhoVazio = page.locator('#empty_cart');
    this.botaoFinalizar = page.getByText('Proceed To Checkout');
    this.modalLoginObrigatorio = page.locator('#checkoutModal');
  }

  acessar() {
    return this.abrir('/view_cart');
  }

  async linhas(): Promise<LinhaDoCarrinho[]> {
    const linhas = this.page.locator('#cart_info_table tbody tr');
    const resultado: LinhaDoCarrinho[] = [];
    for (const linha of await linhas.all()) {
      resultado.push({
        nome: (await linha.locator('.cart_description h4').innerText()).trim(),
        preco: (await linha.locator('.cart_price').innerText()).trim(),
        quantidade: (await linha.locator('.cart_quantity').innerText()).trim(),
        total: (await linha.locator('.cart_total').innerText()).trim(),
      });
    }
    return resultado;
  }

  async finalizar() {
    await this.botaoFinalizar.click();
    await this.aguardarSiteDisponivel();
  }
}
