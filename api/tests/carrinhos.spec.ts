import { z } from 'zod';
import { expect, test } from '../fixtures/api.fixture';
import {
  cadastroSchema,
  carrinhoSchema,
  listaCarrinhosSchema,
  mensagemSchema,
  produtoSchema,
} from '../schemas';
import { validarResposta } from '../support/assertions';

const itemComErroSchema = mensagemSchema.extend({
  item: z
    .object({
      idProduto: z.string(),
      quantidade: z.number(),
      quantidadeEstoque: z.number().optional(),
      index: z.number(),
    })
    .strict(),
});

test.describe('/carrinhos', () => {
  test(
    'cadastra carrinho, calcula totais e baixa o estoque',
    { tag: '@smoke' },
    async ({ carrinhosApi, produtosApi, massa }) => {
      const admin = await massa.admin();
      const produtoA = await massa.produto(admin, { preco: 100, quantidade: 10 });
      const produtoB = await massa.produto(admin, { preco: 250, quantidade: 10 });
      const cliente = await massa.usuario();

      const { _id } = await validarResposta(
        await carrinhosApi.cadastrar(
          [
            { idProduto: produtoA._id, quantidade: 2 },
            { idProduto: produtoB._id, quantidade: 1 },
          ],
          cliente.token,
        ),
        201,
        cadastroSchema,
      );
      massa.registrarLimpeza(() => carrinhosApi.cancelarCompra(cliente.token));

      const carrinho = await validarResposta(await carrinhosApi.buscarPorId(_id), 200, carrinhoSchema);
      expect(carrinho).toMatchObject({ idUsuario: cliente._id, precoTotal: 450, quantidadeTotal: 3 });

      const estoqueA = await validarResposta(await produtosApi.buscarPorId(produtoA._id), 200, produtoSchema);
      expect(estoqueA.quantidade).toBe(8);
    },
  );

  test('lista carrinhos filtrando por usuário', { tag: '@contract' }, async ({ carrinhosApi, massa }) => {
    const produto = await massa.produto(await massa.admin());
    const cliente = await massa.usuario();
    const idCarrinho = await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 1 }]);

    const corpo = await validarResposta(
      await carrinhosApi.listar({ idUsuario: cliente._id }),
      200,
      listaCarrinhosSchema,
    );

    expect(corpo.quantidade).toBe(1);
    expect(corpo.carrinhos[0]._id).toBe(idCarrinho);
  });

  test('concluir compra remove o carrinho e mantém a baixa do estoque', async ({
    carrinhosApi,
    produtosApi,
    massa,
  }) => {
    const produto = await massa.produto(await massa.admin(), { quantidade: 10 });
    const cliente = await massa.usuario();
    const idCarrinho = await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 3 }]);

    const corpo = await validarResposta(
      await carrinhosApi.concluirCompra(cliente.token),
      200,
      mensagemSchema,
    );
    expect(corpo.message).toBe('Registro excluído com sucesso');

    await validarResposta(await carrinhosApi.buscarPorId(idCarrinho), 400, mensagemSchema);
    const estoque = await validarResposta(await produtosApi.buscarPorId(produto._id), 200, produtoSchema);
    expect(estoque.quantidade).toBe(7);
  });

  test('cancelar compra remove o carrinho e devolve o estoque', async ({
    carrinhosApi,
    produtosApi,
    massa,
  }) => {
    const produto = await massa.produto(await massa.admin(), { quantidade: 10 });
    const cliente = await massa.usuario();
    await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 3 }]);

    const corpo = await validarResposta(
      await carrinhosApi.cancelarCompra(cliente.token),
      200,
      mensagemSchema,
    );
    expect(corpo.message).toBe('Registro excluído com sucesso. Estoque dos produtos reabastecido');

    const estoque = await validarResposta(await produtosApi.buscarPorId(produto._id), 200, produtoSchema);
    expect(estoque.quantidade).toBe(10);
  });

  test.describe('cenários negativos', { tag: '@negative' }, () => {
    test('recusa requisição sem token', async ({ carrinhosApi, massa }) => {
      const produto = await massa.produto(await massa.admin());

      const corpo = await validarResposta(
        await carrinhosApi.cadastrar([{ idProduto: produto._id, quantidade: 1 }]),
        401,
        mensagemSchema,
      );

      expect(corpo.message).toBe(
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
      );
    });

    test('recusa produto inexistente', async ({ carrinhosApi, massa }) => {
      const cliente = await massa.usuario();

      const corpo = await validarResposta(
        await carrinhosApi.cadastrar([{ idProduto: '0000000000000000', quantidade: 1 }], cliente.token),
        400,
        itemComErroSchema,
      );

      expect(corpo).toEqual({
        message: 'Produto não encontrado',
        item: { idProduto: '0000000000000000', quantidade: 1, index: 0 },
      });
    });

    test('recusa quantidade maior que o estoque', async ({ carrinhosApi, massa }) => {
      const produto = await massa.produto(await massa.admin(), { quantidade: 5 });
      const cliente = await massa.usuario();

      const corpo = await validarResposta(
        await carrinhosApi.cadastrar([{ idProduto: produto._id, quantidade: 6 }], cliente.token),
        400,
        itemComErroSchema,
      );

      expect(corpo).toEqual({
        message: 'Produto não possui quantidade suficiente',
        item: { idProduto: produto._id, quantidade: 6, quantidadeEstoque: 5, index: 0 },
      });
    });

    test('recusa segundo carrinho para o mesmo usuário', async ({ carrinhosApi, massa }) => {
      const produto = await massa.produto(await massa.admin());
      const cliente = await massa.usuario();
      await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 1 }]);

      const corpo = await validarResposta(
        await carrinhosApi.cadastrar([{ idProduto: produto._id, quantidade: 1 }], cliente.token),
        400,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Não é permitido ter mais de 1 carrinho');
    });

    test('informa quando não há carrinho para concluir', async ({ carrinhosApi, massa }) => {
      const cliente = await massa.usuario();

      const corpo = await validarResposta(
        await carrinhosApi.concluirCompra(cliente.token),
        200,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Não foi encontrado carrinho para esse usuário');
    });
  });
});
