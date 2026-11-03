import { z } from 'zod';
import { expect, test } from '../fixtures/api.fixture';
import { novoUsuario } from '../data/factories';
import {
  cadastroSchema,
  errosValidacaoSchema,
  listaUsuariosSchema,
  mensagemSchema,
  usuarioSchema,
} from '../schemas';
import { validarResposta } from '../support/assertions';

test.describe('/usuarios', () => {
  test.describe('GET', () => {
    test('lista usuários', { tag: ['@smoke', '@contract'] }, async ({ usuariosApi, massa }) => {
      await massa.usuario();

      const corpo = await validarResposta(await usuariosApi.listar(), 200, listaUsuariosSchema);

      expect(corpo.quantidade).toBe(corpo.usuarios.length);
      expect(corpo.quantidade).toBeGreaterThan(0);
    });

    test('filtra usuários por e-mail', async ({ usuariosApi, massa }) => {
      const usuario = await massa.usuario();

      const corpo = await validarResposta(
        await usuariosApi.listar({ email: usuario.email }),
        200,
        listaUsuariosSchema,
      );

      expect(corpo.quantidade).toBe(1);
      expect(corpo.usuarios[0]).toMatchObject({ _id: usuario._id, email: usuario.email });
    });

    test('busca usuário por id', { tag: '@contract' }, async ({ usuariosApi, massa }) => {
      const usuario = await massa.usuario();

      const corpo = await validarResposta(await usuariosApi.buscarPorId(usuario._id), 200, usuarioSchema);

      expect(corpo).toEqual({
        nome: usuario.nome,
        email: usuario.email,
        password: usuario.password,
        administrador: usuario.administrador,
        _id: usuario._id,
      });
    });

    test('informa usuário não encontrado', { tag: '@negative' }, async ({ usuariosApi }) => {
      const corpo = await validarResposta(
        await usuariosApi.buscarPorId('0000000000000000'),
        400,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Usuário não encontrado');
    });
  });

  test.describe('POST', () => {
    test('cadastra usuário e persiste os dados', { tag: '@smoke' }, async ({ usuariosApi, massa }) => {
      const dados = novoUsuario();

      const { _id } = await validarResposta(await usuariosApi.cadastrar(dados), 201, cadastroSchema);
      massa.registrarLimpeza(() => usuariosApi.excluir(_id));

      const salvo = await validarResposta(await usuariosApi.buscarPorId(_id), 200, usuarioSchema);
      expect(salvo).toEqual({ ...dados, _id });
    });

    test.describe('cenários negativos', { tag: '@negative' }, () => {
      test('recusa e-mail já cadastrado', async ({ usuariosApi, massa }) => {
        const existente = await massa.usuario();

        const corpo = await validarResposta(
          await usuariosApi.cadastrar(novoUsuario({ email: existente.email })),
          400,
          mensagemSchema,
        );

        expect(corpo.message).toBe('Este email já está sendo usado');
      });

      test('exige todos os campos obrigatórios', async ({ usuariosApi }) => {
        const corpo = await validarResposta(await usuariosApi.cadastrar({}), 400, errosValidacaoSchema);

        expect(corpo).toEqual({
          nome: 'nome é obrigatório',
          email: 'email é obrigatório',
          password: 'password é obrigatório',
          administrador: 'administrador é obrigatório',
        });
      });

      test('recusa tipos de dados inválidos', async ({ usuariosApi }) => {
        const corpo = await validarResposta(
          await usuariosApi.cadastrar({ nome: 123, email: 'invalido', password: 456, administrador: true }),
          400,
          errosValidacaoSchema,
        );

        expect(corpo).toEqual({
          nome: 'nome deve ser uma string',
          email: 'email deve ser um email válido',
          password: 'password deve ser uma string',
          administrador: "administrador deve ser 'true' ou 'false'",
        });
      });
    });
  });

  test.describe('PUT', () => {
    test('altera usuário existente', { tag: '@smoke' }, async ({ usuariosApi, massa }) => {
      const usuario = await massa.usuario();
      const alteracao = { ...novoUsuario(), administrador: 'true' as const };

      const corpo = await validarResposta(
        await usuariosApi.atualizar(usuario._id, alteracao),
        200,
        mensagemSchema,
      );
      expect(corpo.message).toBe('Registro alterado com sucesso');

      const salvo = await validarResposta(await usuariosApi.buscarPorId(usuario._id), 200, usuarioSchema);
      expect(salvo).toEqual({ ...alteracao, _id: usuario._id });
    });

    test('cria o usuário quando o id não existe (comportamento documentado do ServeRest)', async ({
      usuariosApi,
      massa,
    }) => {
      const dados = novoUsuario();

      const { _id } = await validarResposta(
        await usuariosApi.atualizar('idinexistente01', dados),
        201,
        cadastroSchema,
      );
      massa.registrarLimpeza(() => usuariosApi.excluir(_id));

      expect(_id).not.toBe('idinexistente01');
    });

    test.describe('cenários negativos', { tag: '@negative' }, () => {
      test('recusa e-mail que pertence a outro usuário', async ({ usuariosApi, massa }) => {
        const usuario = await massa.usuario();
        const outro = await massa.usuario();

        const corpo = await validarResposta(
          await usuariosApi.atualizar(usuario._id, { ...novoUsuario(), email: outro.email }),
          400,
          mensagemSchema,
        );

        expect(corpo.message).toBe('Este email já está sendo usado');
      });

      test('exige o corpo completo', async ({ usuariosApi, massa }) => {
        const usuario = await massa.usuario();

        const corpo = await validarResposta(
          await usuariosApi.atualizar(usuario._id, { nome: 'Somente o nome' }),
          400,
          errosValidacaoSchema,
        );

        expect(Object.keys(corpo).sort()).toEqual(['administrador', 'email', 'password']);
      });
    });
  });

  test.describe('DELETE', () => {
    test('exclui usuário', { tag: '@smoke' }, async ({ usuariosApi, massa }) => {
      const usuario = await massa.usuario();

      const corpo = await validarResposta(await usuariosApi.excluir(usuario._id), 200, mensagemSchema);
      expect(corpo.message).toBe('Registro excluído com sucesso');

      await validarResposta(await usuariosApi.buscarPorId(usuario._id), 400, mensagemSchema);
    });

    test('informa quando nenhum registro foi excluído', async ({ usuariosApi }) => {
      const corpo = await validarResposta(await usuariosApi.excluir('0000000000000000'), 200, mensagemSchema);

      expect(corpo.message).toBe('Nenhum registro excluído');
    });

    test('impede excluir usuário com carrinho', { tag: '@negative' }, async ({ usuariosApi, massa }) => {
      const admin = await massa.admin();
      const produto = await massa.produto(admin);
      const cliente = await massa.usuario();
      const idCarrinho = await massa.carrinho(cliente, [{ idProduto: produto._id, quantidade: 1 }]);

      const resposta = await usuariosApi.excluir(cliente._id);
      const corpo = await validarResposta(resposta, 400, mensagemSchema.extend({ idCarrinho: z.string() }));

      expect(corpo).toEqual({
        message: 'Não é permitido excluir usuário com carrinho cadastrado',
        idCarrinho,
      });
    });
  });
});
