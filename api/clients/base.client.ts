import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { HttpLog } from './http-log';

type Opcoes = { data?: unknown; params?: Record<string, string | number>; token?: string; rawBody?: string };

export abstract class BaseClient {
  constructor(
    protected readonly request: APIRequestContext,
    private readonly log: HttpLog,
    private readonly token?: string,
  ) {}

  protected async enviar(metodo: string, url: string, opcoes: Opcoes = {}): Promise<APIResponse> {
    const token = opcoes.token ?? this.token;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = token;
    if (opcoes.rawBody !== undefined) headers['Content-Type'] = 'application/json';

    const response = await this.request.fetch(url, {
      method: metodo,
      headers,
      params: opcoes.params,
      data: opcoes.rawBody ?? opcoes.data,
    });
    await this.log.registrar(metodo, url, opcoes.rawBody ?? opcoes.data, response);
    return response;
  }

  /** Envia um método HTTP arbitrário (usado nos cenários de método inválido). */
  metodo(metodo: string, url: string) {
    return this.enviar(metodo, url);
  }

  /** Envia um corpo cru, sem serializar (usado nos cenários de JSON malformado). */
  corpoCru(metodo: string, url: string, corpo: string) {
    return this.enviar(metodo, url, { rawBody: corpo });
  }
}
