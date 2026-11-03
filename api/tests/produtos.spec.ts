import { z } from 'zod';
import { expect, test } from '../fixtures/api.fixture';
import { novoProduto } from '../data/factories';
import {
  cadastroSchema,
  errosValidacaoSchema,
  listaProdutosSchema,
  mensagemSchema,
  produtoSchema,
} from '../schemas';
import { validarResposta } from '../support/assertions';

const TOKEN_AUSENTE_OU_INVALIDO =
  'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais';

test.describe('/produtos', () => {
  test.describe('GET', () => {
    test('lista produtos', { tag: ['@smoke', '@contract'] }, async ({ produtosApi, massa }) => {
      await massa.produto(await massa.admin());

      const corpo = await validarResposta(await produtosApi.listar(), 200, listaProdutosSchema);

      expect(corpo.quantidade).toBe(corpo.produtos.length);
      expect(corpo.quantidade).toBeGreaterThan(0);
    });

    test('filtra produtos por nome', async ({ produtosApi, massa }) => {
      const produto = await massa.produto(await massa.admin());

      const corpo = await validarResposta(
        await produtosApi.listar({ nome: produto.nome }),
        200,
        listaProdutosSchema,
      );

      expect(corpo.produtos).toEqual([produto]);
    });

    test('busca produto por id', { tag: '@contract' }, async ({ produtosApi, massa }) => {
      const produto = await massa.produto(await massa.admin());

      const corpo = await validarResposta(await produtosApi.buscarPorId(produto._id), 200, produtoSchema);

      expect(corpo).toEqual(produto);
    });

    test('informa produto não encontrado', { tag: '@negative' }, async ({ produtosApi }) => {
      const corpo = await validarResposta(
        await produtosApi.buscarPorId('0000000000000000'),
        400,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Produto não encontrado');
    });
  });

  test.describe('POST', () => {
    test('administrador cadastra produto', { tag: '@smoke' }, async ({ produtosApi, massa }) => {
      const admin = await massa.admin();
      const dados = novoProduto();

      const { _id } = await validarResposta(
        await produtosApi.cadastrar(dados, admin.token),
        201,
        cadastroSchema,
      );
      massa.registrarLimpeza(() => produtosApi.excluir(_id, admin.token));

      const salvo = await validarResposta(await produtosApi.buscarPorId(_id), 200, produtoSchema);
      expect(salvo).toEqual({ ...dados, _id });
    });

    test.describe('cenários negativos', { tag: '@negative' }, () => {
      test('recusa requisição sem token', async ({ produtosApi }) => {
        const corpo = await validarResposta(await produtosApi.cadastrar(novoProduto()), 401, mensagemSchema);

        expect(corpo.message).toBe(TOKEN_AUSENTE_OU_INVALIDO);
      });

      test('recusa token inválido', async ({ produtosApi }) => {
        const corpo = await validarResposta(
          await produtosApi.cadastrar(novoProduto(), 'Bearer token.invalido.123'),
          401,
          mensagemSchema,
        );

        expect(corpo.message).toBe(TOKEN_AUSENTE_OU_INVALIDO);
      });

      test('recusa usuário que não é administrador', async ({ produtosApi, massa }) => {
        const cliente = await massa.usuario();

        const corpo = await validarResposta(
          await produtosApi.cadastrar(novoProduto(), cliente.token),
          403,
          mensagemSchema,
        );

        expect(corpo.message).toBe('Rota exclusiva para administradores');
      });

      test('recusa nome de produto duplicado', async ({ produtosApi, massa }) => {
        const admin = await massa.admin();
        const existente = await massa.produto(admin);

        const corpo = await validarResposta(
          await produtosApi.cadastrar(novoProduto({ nome: existente.nome }), admin.token),
          400,
          mensagemSchema,
        );

        expect(corpo.message).toBe('Já existe produto com esse nome');
      });

      test('recusa preço e quantidade inválidos', async ({ produtosApi, massa }) => {
        const admin = await massa.admin();

        const corpo = await validarResposta(
          await produtosApi.cadastrar(novoProduto({ preco: -1, quantidade: -1 }), admin.token),
          400,
          errosValidacaoSchema,
        );

        expect(corpo).toEqual({
          preco: 'preco deve ser um número positivo',
          quantidade: 'quantidade deve ser maior ou igual a 0',
        });
      });

      test('exige todos os campos obrigatórios', async ({ produtosApi, massa }) => {
        const admin = await massa.admin();

        const corpo = await validarResposta(
          await produtosApi.cadastrar({}, admin.token),
          400,
          errosValidacaoSchema,
        );

        expect(Object.keys(corpo).sort()).toEqual(['descricao', 'nome', 'preco', 'quantidade']);
      });
    });
  });

  test.describe('PUT', () => {
    test('administrador altera produto', { tag: '@smoke' }, async ({ produtosApi, massa }) => {
      const admin = await massa.admin();
      const produto = await massa.produto(admin);
      const alteracao = novoProduto({ nome: produto.nome });

      const corpo = await validarResposta(
        await produtosApi.atualizar(produto._id, alteracao, admin.token),
        200,
        mensagemSchema,
      );
      expect(corpo.message).toBe('Registro alterado com sucesso');

      const salvo = await validarResposta(await produtosApi.buscarPorId(produto._id), 200, produtoSchema);
      expect(salvo).toEqual({ ...alteracao, _id: produto._id });
    });

    test.describe('cenários negativos', { tag: '@negative' }, () => {
      test('recusa requisição sem token', async ({ produtosApi, massa }) => {
        const produto = await massa.produto(await massa.admin());

        const corpo = await validarResposta(
          await produtosApi.atualizar(produto._id, novoProduto()),
          401,
          mensagemSchema,
        );

        expect(corpo.message).toBe(TOKEN_AUSENTE_OU_INVALIDO);
      });

      test('recusa usuário que não é administrador', async ({ produtosApi, massa }) => {
        const produto = await massa.produto(await massa.admin());
        const cliente = await massa.usuario();

        const corpo = await validarResposta(
          await produtosApi.atualizar(produto._id, novoProduto(), cliente.token),
          403,
          mensagemSchema,
        );

        expect(corpo.message).toBe('Rota exclusiva para administradores');
      });
    });
  });

  test.describe('DELETE', () => {
    test('administrador exclui produto', { tag: '@smoke' }, async ({ produtosApi, massa }) => {
      const admin = await massa.admin();
      const produto = await massa.produto(admin);

      const corpo = await validarResposta(
        await produtosApi.excluir(produto._id, admin.token),
        200,
        mensagemSchema,
      );
      expect(corpo.message).toBe('Registro excluído com sucesso');

      await validarResposta(await produtosApi.buscarPorId(produto._id), 400, mensagemSchema);
    });

    test.describe('cenários negativos', { tag: '@negative' }, () => {
      test('recusa requisição sem token', async ({ produtosApi, massa }) => {
        const produto = await massa.produto(await massa.admin());

        const corpo = await validarResposta(await produtosApi.excluir(produto._id), 401, mensagemSchema);

        expect(corpo.message).toBe(TOKEN_AUSENTE_OU_INVALIDO);
      });

      test('impede excluir produto que está em carrinho', async ({ produtosApi, massa }) => {
        const admin = await massa.admin();
        const produto = await massa.produto(admin);
        const cliente = await massa.usuario();
        const idCarrinho = await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 1 }]);

        const corpo = await validarResposta(
          await produtosApi.excluir(produto._id, admin.token),
          400,
          mensagemSchema.extend({ idCarrinhos: z.array(z.string()) }),
        );

        expect(corpo).toEqual({
          message: 'Não é permitido excluir produto que faz parte de carrinho',
          idCarrinhos: [idCarrinho],
        });
      });
    });
  });
});
