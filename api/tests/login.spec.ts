import { expect, test } from '../fixtures/api.fixture';
import { errosValidacaoSchema, loginSchema, mensagemSchema } from '../schemas';
import { validarResposta } from '../support/assertions';

test.describe('POST /login', () => {
  test('autentica usuário comum e devolve token Bearer', { tag: '@smoke' }, async ({ loginApi, massa }) => {
    const usuario = await massa.usuario();

    const corpo = await validarResposta(
      await loginApi.login({ email: usuario.email, password: usuario.password }),
      200,
      loginSchema,
    );

    expect(corpo.authorization).toMatch(/^Bearer /);
  });

  test('autentica administrador', async ({ loginApi, massa }) => {
    const admin = await massa.admin();

    await validarResposta(
      await loginApi.login({ email: admin.email, password: admin.password }),
      200,
      loginSchema,
    );
  });

  test.describe('cenários negativos', { tag: '@negative' }, () => {
    test('recusa senha incorreta', async ({ loginApi, massa }) => {
      const usuario = await massa.usuario();

      const corpo = await validarResposta(
        await loginApi.login({ email: usuario.email, password: 'senha-incorreta' }),
        401,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Email e/ou senha inválidos');
    });

    test('recusa usuário inexistente', async ({ loginApi }) => {
      const corpo = await validarResposta(
        await loginApi.login({ email: 'nao.existe.123@teste.com.br', password: 'qualquer' }),
        401,
        mensagemSchema,
      );

      expect(corpo.message).toBe('Email e/ou senha inválidos');
    });

    test('exige e-mail e senha', async ({ loginApi }) => {
      const corpo = await validarResposta(await loginApi.login({}), 400, errosValidacaoSchema);

      expect(corpo).toEqual({ email: 'email é obrigatório', password: 'password é obrigatório' });
    });

    test('recusa e-mail em formato inválido', async ({ loginApi }) => {
      const corpo = await validarResposta(
        await loginApi.login({ email: 'email-sem-arroba', password: 'qualquer' }),
        400,
        errosValidacaoSchema,
      );

      expect(corpo).toEqual({ email: 'email deve ser um email válido' });
    });

    test('recusa campos vazios', async ({ loginApi }) => {
      const corpo = await validarResposta(
        await loginApi.login({ email: '', password: '' }),
        400,
        errosValidacaoSchema,
      );

      expect(corpo).toEqual({
        email: 'email não pode ficar em branco',
        password: 'password não pode ficar em branco',
      });
    });
  });
});
