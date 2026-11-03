import { Given } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { criarContaViaApi, novaConta } from '../support/conta';
import type { E2EWorld } from '../support/world';

Given('que tenho uma conta cadastrada', async function (this: E2EWorld) {
  this.conta = novaConta();
  await criarContaViaApi(this.conta);
});

Given('que tenho uma conta cadastrada sem endereço de entrega', async function (this: E2EWorld) {
  this.conta = novaConta({ endereco: '', cidade: '', estado: '', cep: '' });
  await criarContaViaApi(this.conta);
});

Given('que estou na página de login', async function (this: E2EWorld) {
  await this.login.acessar();
});

Given('que estou logado', async function (this: E2EWorld) {
  await this.login.acessar();
  await this.login.entrar(this.contaAtual.email, this.contaAtual.senha);
  await expect(this.header.usuarioLogado).toContainText(this.contaAtual.nome);
});

Given('que não estou logado', async function (this: E2EWorld) {
  await this.produtos.acessar();
  await expect(this.header.usuarioLogado).toHaveCount(0);
});
