import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { validade } from '../support/validacao-html5';
import type { E2EWorld } from '../support/world';

When('faço login com as credenciais da minha conta', async function (this: E2EWorld) {
  await this.login.entrar(this.contaAtual.email, this.contaAtual.senha);
});

When('faço login com o meu e-mail e a senha {string}', async function (this: E2EWorld, senha: string) {
  await this.login.entrar(this.contaAtual.email, senha);
});

When(
  'faço login com o e-mail {string} e a senha {string}',
  async function (this: E2EWorld, email: string, senha: string) {
    await this.login.entrar(email, senha);
  },
);

When('tento fazer login deixando o campo {string} em branco', async function (this: E2EWorld, campo: string) {
  const email = campo === 'email' ? '' : this.contaAtual.email;
  const senha = campo === 'senha' ? '' : this.contaAtual.senha;
  await this.login.entrar(email, senha);
});

When('acesso a página de contato pelo menu', async function (this: E2EWorld) {
  await this.header.linkContato.click();
  await this.contato.aguardarSiteDisponivel();
});

When('tento iniciar um cadastro com o e-mail da minha conta', async function (this: E2EWorld) {
  await this.login.iniciarCadastro('Outro Nome', this.contaAtual.email);
});

Then('vejo que estou logado com o meu nome', async function (this: E2EWorld) {
  await expect(this.header.usuarioLogado).toHaveText(`Logged in as ${this.contaAtual.nome}`);
});

Then('continuo logado com o meu nome', async function (this: E2EWorld) {
  await expect(this.header.usuarioLogado).toHaveText(`Logged in as ${this.contaAtual.nome}`);
});

Then('o formulário de contato é exibido por completo', async function (this: E2EWorld) {
  await expect(this.page).toHaveURL(/\/contact_us$/);
  await expect(this.page).toHaveTitle('Automation Exercise - Contact Us');
  await expect(this.contato.titulo).toBeVisible();
  for (const campo of this.contato.campos()) {
    await expect(campo).toBeVisible();
  }
});

Then('vejo a mensagem de login inválido {string}', async function (this: E2EWorld, mensagem: string) {
  await expect(this.login.erroLogin).toHaveText(mensagem);
});

Then('vejo a mensagem de cadastro inválido {string}', async function (this: E2EWorld, mensagem: string) {
  await expect(this.login.erroCadastro).toHaveText(mensagem);
});

Then('não estou logado', async function (this: E2EWorld) {
  await expect(this.page).toHaveURL(/\/login$/);
  await expect(this.header.usuarioLogado).toHaveCount(0);
});

Then(
  'o navegador bloqueia o envio indicando o campo {string} como obrigatório',
  async function (this: E2EWorld, campo: string) {
    const elemento = campo === 'email' ? this.login.emailLogin : this.login.senhaLogin;
    expect(await validade(elemento)).toMatchObject({ valido: false, obrigatorioVazio: true });
  },
);

Then('o navegador bloqueia o envio indicando o e-mail como inválido', async function (this: E2EWorld) {
  expect(await validade(this.login.emailLogin)).toMatchObject({ valido: false, formatoInvalido: true });
});
