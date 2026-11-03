import type { Locator, Page } from '@playwright/test';

/** Menu superior, presente em todas as páginas. */
export class Header {
  readonly usuarioLogado: Locator;
  readonly linkContato: Locator;
  readonly linkProdutos: Locator;
  readonly linkCarrinho: Locator;
  readonly linkLogin: Locator;

  constructor(page: Page) {
    const menu = page.locator('#header .shop-menu');
    this.usuarioLogado = menu.locator('li', { hasText: 'Logged in as' });
    this.linkContato = menu.getByRole('link', { name: 'Contact us' });
    this.linkProdutos = menu.getByRole('link', { name: 'Products' });
    this.linkCarrinho = menu.getByRole('link', { name: 'Cart' });
    this.linkLogin = menu.getByRole('link', { name: 'Signup / Login' });
  }
}
