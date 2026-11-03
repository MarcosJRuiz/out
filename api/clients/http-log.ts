import type { APIResponse } from '@playwright/test';

export type Troca = {
  metodo: string;
  url: string;
  requisicao?: unknown;
  status: number;
  resposta: string;
};

/** Guarda as requisições do teste para anexar ao relatório quando ele falhar. */
export class HttpLog {
  readonly trocas: Troca[] = [];

  async registrar(metodo: string, url: string, requisicao: unknown, response: APIResponse) {
    this.trocas.push({ metodo, url, requisicao, status: response.status(), resposta: await response.text() });
  }
}
