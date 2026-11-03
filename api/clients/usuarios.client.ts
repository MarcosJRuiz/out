import { BaseClient } from './base.client';

export type Usuario = { nome: string; email: string; password: string; administrador: 'true' | 'false' };

export class UsuariosClient extends BaseClient {
  listar(filtros?: Partial<Usuario> & { _id?: string }) {
    return this.enviar('GET', '/usuarios', { params: filtros });
  }

  buscarPorId(id: string) {
    return this.enviar('GET', `/usuarios/${id}`);
  }

  cadastrar(usuario: Partial<Record<keyof Usuario, unknown>>) {
    return this.enviar('POST', '/usuarios', { data: usuario });
  }

  atualizar(id: string, usuario: Partial<Record<keyof Usuario, unknown>>) {
    return this.enviar('PUT', `/usuarios/${id}`, { data: usuario });
  }

  excluir(id: string) {
    return this.enviar('DELETE', `/usuarios/${id}`);
  }
}
