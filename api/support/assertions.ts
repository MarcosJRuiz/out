import { expect, test, type APIResponse } from '@playwright/test';
import { z } from 'zod';

const HEADERS_PADRAO = {
  'access-control-allow-origin': '*',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
};

type Opcoes = {
  /**
   * false para respostas em que o ServeRest não aplica CORS nem headers de segurança
   * (ex.: JSON malformado). Nesse caso o teste verifica a ausência e registra o achado no relatório.
   */
  headersPadrao?: boolean;
};

/**
 * Valida as três partes de toda resposta: status code, headers e corpo (contrato via schema).
 * Devolve o corpo já tipado para as asserções de valor no teste.
 */
export async function validarResposta<S extends z.ZodType>(
  response: APIResponse,
  statusEsperado: number,
  schema: S,
  { headersPadrao = true }: Opcoes = {},
): Promise<z.infer<S>> {
  const corpoTexto = await response.text();

  expect(response.status(), `status de ${response.url()} — corpo: ${corpoTexto}`).toBe(statusEsperado);

  const headers = response.headers();
  expect(headers['content-type']).toBe('application/json; charset=utf-8');
  expect(Number(headers['content-length'])).toBe(Buffer.byteLength(corpoTexto));
  for (const [nome, valor] of Object.entries(HEADERS_PADRAO)) {
    expect(headers[nome], `header ${nome}`).toBe(headersPadrao ? valor : undefined);
  }
  if (!headersPadrao) {
    test.info().annotations.push({
      type: 'achado',
      description: `Resposta sem CORS e sem headers de segurança (${Object.keys(HEADERS_PADRAO).join(', ')})`,
    });
  }

  const corpo: unknown = JSON.parse(corpoTexto);
  const resultado = schema.safeParse(corpo);
  expect(
    resultado.success,
    `contrato do corpo:\n${resultado.error ? z.prettifyError(resultado.error) : ''}`,
  ).toBe(true);
  return resultado.data as z.infer<S>;
}
