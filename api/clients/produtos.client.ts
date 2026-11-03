import { BaseClient } from './base.client';

export type Produto = { nome: string; preco: number; descricao: string; quantidade: number };

export class ProdutosClient extends BaseClient {
  listar(filtros?: Partial<Produto> & { _id?: string }) {
    return this.enviar('GET', '/produtos', { params: filtros });
  }

  buscarPorId(id: string) {
    return this.enviar('GET', `/produtos/${id}`);
  }

  cadastrar(produto: Partial<Record<keyof Produto, unknown>>, token?: string) {
    return this.enviar('POST', '/produtos', { data: produto, token });
  }

  atualizar(id: string, produto: Partial<Record<keyof Produto, unknown>>, token?: string) {
    return this.enviar('PUT', `/produtos/${id}`, { data: produto, token });
  }

  excluir(id: string, token?: string) {
    return this.enviar('DELETE', `/produtos/${id}`, { token });
  }
}
