import { setDefaultTimeout, setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { BrowserContext, Page } from '@playwright/test';
import { CarrinhoPage } from '../pages/carrinho.page';
import { CheckoutPage } from '../pages/checkout.page';
import { ContatoPage } from '../pages/contato.page';
import { Header } from '../pages/header.component';
import { LoginPage } from '../pages/login.page';
import { PagamentoPage } from '../pages/pagamento.page';
import { ProdutosPage, type ProdutoDaVitrine } from '../pages/produtos.page';
import type { Conta } from './conta';

setDefaultTimeout(60_000);

/** Estado de cada cenário: navegador isolado, Page Objects e dados criados durante o cenário. */
export class E2EWorld extends World {
  context!: BrowserContext;
  page!: Page;

  conta?: Conta;
  produtosAdicionados: ProdutoDaVitrine[] = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  get header() {
    return new Header(this.page);
  }
  get login() {
    return new LoginPage(this.page);
  }
  get contato() {
    return new ContatoPage(this.page);
  }
  get produtos() {
    return new ProdutosPage(this.page);
  }
  get carrinho() {
    return new CarrinhoPage(this.page);
  }
  get checkout() {
    return new CheckoutPage(this.page);
  }
  get pagamento() {
    return new PagamentoPage(this.page);
  }

  /** Conta do cenário; falha com mensagem clara se o passo de pré-condição não foi executado. */
  get contaAtual(): Conta {
    if (!this.conta)
      throw new Error('Nenhuma conta criada neste cenário (falta o passo "Dado que tenho uma conta...")');
    return this.conta;
  }
}

setWorldConstructor(E2EWorld);
