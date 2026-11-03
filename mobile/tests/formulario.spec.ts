import { expect, test } from '../fixtures/driver.fixture';
import type { Endereco } from '../screens/endereco.screen';
import { USUARIOS } from '../screens/login.screen';

const ENDERECO: Endereco = {
  nomeCompleto: 'Maria QA da Silva',
  endereco1: 'Rua das Automações, 100',
  endereco2: 'Apto 42',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01310100',
  pais: 'Brasil',
};

test.describe('Tarefa 2 — formulário de endereço de entrega', () => {
  test.beforeEach(async ({ catalogo, menu, login, produto, carrinho, endereco }) => {
    await menu.abrirLogin();
    await login.entrar(USUARIOS.valido.usuario, USUARIOS.valido.senha);
    await catalogo.aguardarExibicao();
    await catalogo.abrirProduto(0);
    await produto.adicionarAoCarrinho();
    await catalogo.abrirCarrinho();
    await carrinho.aguardarExibicao();
    await carrinho.finalizarCompra();
    await endereco.aguardarExibicao();
  });

  test(
    'preenche e envia o endereço e segue para o pagamento',
    { tag: '@smoke' },
    async ({ endereco, pagamento, evidencia }) => {
      await endereco.preencher(ENDERECO);
      await evidencia('formulario-preenchido');

      await endereco.irParaPagamento();

      await pagamento.aguardarExibicao();
      await evidencia('tela-de-pagamento');
    },
  );

  test(
    'valida os campos obrigatórios ao enviar o formulário vazio',
    { tag: '@negative' },
    async ({ endereco, evidencia }) => {
      await endereco.preencher({ nomeCompleto: '', endereco1: '', cidade: '', cep: '', pais: '' });
      await endereco.irParaPagamento();

      await expect.poll(() => endereco.erroDe('nomeCompleto')).toBe('Please provide your full name.');
      expect(await endereco.erroDe('endereco1')).toBe('Please provide your address.');
      await evidencia('erros-do-formulario');
      expect(await endereco.erroDe('cidade')).toBe('Please provide your city.');
      expect(await endereco.erroDe('cep')).toBe('Please provide your zip code.');
      expect(await endereco.erroDe('pais')).toBe('Please provide your country.');
      await evidencia('erros-do-formulario-final');

      // Campos opcionais não exibem erro.
      expect(await endereco.erroDe('endereco2')).toBe('');
    },
  );
});
