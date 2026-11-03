import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailLogin: Locator;
  readonly senhaLogin: Locator;
  readonly botaoLogin: Locator;
  readonly erroLogin: Locator;
  readonly nomeCadastro: Locator;
  readonly emailCadastro: Locator;
  readonly botaoCadastro: Locator;
  readonly erroCadastro: Locator;

  constructor(page: Page) {
    super(page);
    this.emailLogin = page.locator('[data-qa="login-email"]');
    this.senhaLogin = page.locator('[data-qa="login-password"]');
    this.botaoLogin = page.locator('[data-qa="login-button"]');
    this.erroLogin = page.locator('form[action="/login"] p');
    this.nomeCadastro = page.locator('[data-qa="signup-name"]');
    this.emailCadastro = page.locator('[data-qa="signup-email"]');
    this.botaoCadastro = page.locator('[data-qa="signup-button"]');
    this.erroCadastro = page.locator('form[action="/signup"] p');
  }

  acessar() {
    return this.abrir('/login');
  }

  async entrar(email: string, senha: string) {
    await this.emailLogin.fill(email);
    await this.senhaLogin.fill(senha);
    await this.botaoLogin.click();
    await this.aguardarSiteDisponivel();
  }

  async iniciarCadastro(nome: string, email: string) {
    await this.nomeCadastro.fill(nome);
    await this.emailCadastro.fill(email);
    await this.botaoCadastro.click();
    await this.aguardarSiteDisponivel();
  }
}
