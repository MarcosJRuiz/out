import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { Cartao } from '../pages/pagamento.page';
import { validade } from '../support/validacao-html5';
import type { E2EWorld } from '../support/world';

const CARTAO_VALIDO: Cartao = {
  nome: 'QA Teste',
  numero: '4111111111111111',
  cvc: '123',
  mes: '12',
  ano: '2030',
};

async function adicionarProdutos(world: E2EWorld, ids: string[]) {
  await world.produtos.acessar();
  for (const id of ids) {
    world.produtosAdicionados.push(await world.produtos.adicionarAoCarrinho(id));
  }
}

async function seguirParaCheckout(world: E2EWorld) {
  await world.carrinho.acessar();
  await world.carrinho.finalizar();
}

When('adiciono os produtos {string} ao carrinho', async function (this: E2EWorld, id: string) {
  await adicionarProdutos(this, [id]);
});

When(
  'adiciono os produtos {string} e {string} ao carrinho',
  async function (this: E2EWorld, a: string, b: string) {
    await adicionarProdutos(this, [a, b]);
  },
);

Given(
  'que adicionei os produtos {string} ao carrinho e cheguei ao pagamento',
  async function (this: E2EWorld, id: string) {
    await adicionarProdutos(this, [id]);
    await seguirParaCheckout(this);
    await this.checkout.fazerPedido('Pedido de teste automatizado');
    await expect(this.page).toHaveURL(/\/payment$/);
  },
);

When('sigo para o checkout', async function (this: E2EWorld) {
  await seguirParaCheckout(this);
});

When('tento seguir para o checkout', async function (this: E2EWorld) {
  await seguirParaCheckout(this);
});

When('acesso o carrinho sem ter adicionado produtos', async function (this: E2EWorld) {
  await this.carrinho.acessar();
});

When('confirmo o pedido com o comentário {string}', async function (this: E2EWorld, comentario: string) {
  await this.checkout.fazerPedido(comentario);
});

When('pago com um cartão válido', async function (this: E2EWorld) {
  await this.pagamento.pagar(CARTAO_VALIDO);
});

When('tento pagar sem preencher os dados do cartão', async function (this: E2EWorld) {
  await this.pagamento.pagar({});
});

When('pago com o cartão inválido:', async function (this: E2EWorld, tabela: DataTable) {
  const [cartao] = tabela.hashes() as Cartao[];
  await this.pagamento.pagar(cartao);
});

Then(
  'o carrinho exibe os produtos com nome, preço, quantidade e total corretos',
  async function (this: E2EWorld) {
    await this.carrinho.acessar();
    const esperado = this.produtosAdicionados.map((p) => ({
      nome: p.nome,
      preco: p.preco,
      quantidade: '1',
      total: p.preco,
    }));
    expect(await this.carrinho.linhas()).toEqual(esperado);
  },
);

Then('o endereço de entrega exibido é o da minha conta', async function (this: E2EWorld) {
  const conta = this.contaAtual;
  const endereco = this.checkout.enderecoEntrega;
  await expect(this.page).toHaveURL(/\/checkout$/);
  for (const trecho of [
    `${conta.primeiroNome} ${conta.sobrenome}`,
    conta.endereco,
    `${conta.cidade} ${conta.estado} ${conta.cep}`,
    conta.pais,
    conta.celular,
  ]) {
    await expect(endereco).toContainText(trecho);
  }
});

Then('vejo a confirmação do pedido', async function (this: E2EWorld) {
  await expect(this.page).toHaveURL(/\/payment_done\/\d+$/);
  await expect(this.pagamento.pedidoConfirmado).toHaveText('Order Placed!');
  await expect(this.pagamento.mensagemConfirmacao).toBeVisible();
});

Then('sou informado de que preciso entrar na conta para finalizar a compra', async function (this: E2EWorld) {
  const modal = this.carrinho.modalLoginObrigatorio;
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Register / Login account to proceed on checkout.');
  await expect(this.page).toHaveURL(/\/view_cart$/);
});

Then('vejo que o carrinho está vazio', async function (this: E2EWorld) {
  await expect(this.carrinho.carrinhoVazio).toContainText('Cart is empty!');
});

Then('não é possível seguir para o checkout', async function (this: E2EWorld) {
  await expect(this.carrinho.botaoFinalizar).toHaveCount(0);
});

Then(
  'o navegador bloqueia o pagamento indicando os dados do cartão como obrigatórios',
  async function (this: E2EWorld) {
    await expect(this.page).toHaveURL(/\/payment$/);
    for (const campo of [
      this.pagamento.nomeNoCartao,
      this.pagamento.numeroDoCartao,
      this.pagamento.cvc,
      this.pagamento.mesValidade,
      this.pagamento.anoValidade,
    ]) {
      expect(await validade(campo)).toMatchObject({ valido: false, obrigatorioVazio: true });
    }
  },
);

Then('o pagamento é recusado', async function (this: E2EWorld) {
  await expect(this.page, 'o site deveria permanecer no pagamento e recusar o cartão').toHaveURL(
    /\/payment$/,
  );
});

Then('o pedido não é confirmado', async function (this: E2EWorld) {
  await expect(this.pagamento.pedidoConfirmado).toHaveCount(0);
  await expect(this.page).not.toHaveURL(/\/payment_done\//);
});

Then('a compra é bloqueada por endereço de entrega incompleto', async function (this: E2EWorld) {
  await expect(this.page).toHaveURL(/\/checkout$/);
  await this.checkout.fazerPedido('Tentativa sem endereço');
  await expect(
    this.page,
    'o site não deveria permitir seguir para o pagamento sem endereço de entrega',
  ).not.toHaveURL(/\/payment$/);
});
