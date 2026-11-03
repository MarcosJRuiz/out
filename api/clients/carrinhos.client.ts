import { BaseClient } from './base.client';

export type ItemCarrinho = { idProduto: string; quantidade: number };

export class CarrinhosClient extends BaseClient {
  listar(filtros?: { idUsuario?: string; _id?: string }) {
    return this.enviar('GET', '/carrinhos', { params: filtros });
  }

  buscarPorId(id: string) {
    return this.enviar('GET', `/carrinhos/${id}`);
  }

  cadastrar(produtos: ItemCarrinho[], token?: string) {
    return this.enviar('POST', '/carrinhos', { data: { produtos }, token });
  }

  concluirCompra(token?: string) {
    return this.enviar('DELETE', '/carrinhos/concluir-compra', { token });
  }

  cancelarCompra(token?: string) {
    return this.enviar('DELETE', '/carrinhos/cancelar-compra', { token });
  }
}
