import type { APIResponse } from '@playwright/test';

export type Troca = {
  metodo: string;
  url: string;
  requisicao?: unknown;
  status: number;
  headers: Record<string, string>;
  resposta: unknown;
};

/** Guarda as requisições do teste para anexá-las ao relatório como evidência. */
export class HttpLog {
  readonly trocas: Troca[] = [];

  async registrar(metodo: string, url: string, requisicao: unknown, response: APIResponse) {
    const texto = await response.text();
    let resposta: unknown = texto;
    try {
      resposta = JSON.parse(texto);
    } catch {
      // corpo não-JSON: mantém o texto
    }
    this.trocas.push({
      metodo,
      url,
      requisicao,
      status: response.status(),
      headers: response.headers(),
      resposta,
    });
  }
}
