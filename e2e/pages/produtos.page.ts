import { expect, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export type ProdutoDaVitrine = { id: string; nome: string; preco: string };

export class ProdutosPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  acessar() {
    return this.abrir('/products');
  }

  private cartao(idProduto: string) {
    return this.page
      .locator('.productinfo')
      .filter({ has: this.page.locator(`[data-product-id="${idProduto}"]`) });
  }

  /**
   * Adiciona ao carrinho e devolve nome e preço exibidos na vitrine.
   * Espera a resposta de "add_to_cart": clicar antes do JavaScript da página carregar não adiciona o item.
   */
  async adicionarAoCarrinho(idProduto: string): Promise<ProdutoDaVitrine> {
    await this.page.waitForLoadState('load');
    const cartao = this.cartao(idProduto);
    const produto = {
      id: idProduto,
      nome: (await cartao.locator('p').innerText()).trim(),
      preco: (await cartao.locator('h2').innerText()).trim(),
    };

    const adicionado = this.page.waitForResponse((r) => r.url().includes(`/add_to_cart/${idProduto}`));
    await cartao.locator('a.add-to-cart').click();
    await adicionado;

    const modal = this.page.locator('#cartModal');
    await expect(modal).toContainText('Your product has been added to cart.');
    await modal.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(modal).toBeHidden();
    return produto;
  }
}
