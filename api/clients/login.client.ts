import { BaseClient } from './base.client';

export type Credenciais = { email?: unknown; password?: unknown };

export class LoginClient extends BaseClient {
  login(credenciais: Credenciais) {
    return this.enviar('POST', '/login', { data: credenciais });
  }
}
