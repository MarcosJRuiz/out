import { expect, test } from '../fixtures/api.fixture';
import { mensagemSchema } from '../schemas';
import { validarResposta } from '../support/assertions';

const METODOS_NAO_SUPORTADOS = [
  { metodo: 'PATCH', rota: '/usuarios' },
  { metodo: 'PATCH', rota: '/produtos' },
  { metodo: 'PATCH', rota: '/carrinhos' },
  { metodo: 'PUT', rota: '/login' },
  { metodo: 'DELETE', rota: '/login' },
  { metodo: 'GET', rota: '/login' },
];

test.describe('métodos HTTP não suportados', { tag: '@negative' }, () => {
  for (const { metodo, rota } of METODOS_NAO_SUPORTADOS) {
    test(`${metodo} ${rota} responde 405`, async ({ usuariosApi }) => {
      const corpo = await validarResposta(await usuariosApi.metodo(metodo, rota), 405, mensagemSchema);

      expect(corpo.message).toContain(`Não é possível realizar ${metodo} em ${rota}`);
    });
  }
});

test.describe('payload malformado', { tag: '@negative' }, () => {
  for (const rota of ['/login', '/usuarios']) {
    test(`POST ${rota} recusa JSON malformado`, async ({ usuariosApi }) => {
      const corpo = await validarResposta(
        await usuariosApi.corpoCru('POST', rota, '{"email": '),
        400,
        mensagemSchema,
        { headersPadrao: false },
      );

      expect(corpo.message).toContain('Adicione aspas em todos os valores');
    });
  }
});
