import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ContatoPage extends BasePage {
  readonly titulo: Locator;
  readonly nome: Locator;
  readonly email: Locator;
  readonly assunto: Locator;
  readonly mensagem: Locator;
  readonly anexo: Locator;
  readonly botaoEnviar: Locator;

  constructor(page: Page) {
    super(page);
    this.titulo = page.getByRole('heading', { name: 'Get In Touch' });
    this.nome = page.locator('[data-qa="name"]');
    this.email = page.locator('[data-qa="email"]');
    this.assunto = page.locator('[data-qa="subject"]');
    this.mensagem = page.locator('[data-qa="message"]');
    this.anexo = page.locator('input[name="upload_file"]');
    this.botaoEnviar = page.locator('[data-qa="submit-button"]');
  }

  /** Campos que compõem o formulário, para validar que ele foi carregado por completo. */
  campos() {
    return [this.nome, this.email, this.assunto, this.mensagem, this.anexo, this.botaoEnviar];
  }
}
