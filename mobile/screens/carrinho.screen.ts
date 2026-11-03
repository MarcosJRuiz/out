import { BaseScreen } from './base.screen';

export class CarrinhoScreen extends BaseScreen {
  aguardarExibicao() {
    return this.aguardar('cart screen');
  }

  nomeDoProduto() {
    return this.elemento('product label').getText();
  }

  precoTotal() {
    return this.elemento('total price').getText();
  }

  quantidadeTotal() {
    return this.elemento('total number').getText();
  }

  finalizarCompra() {
    return this.tocar('Proceed To Checkout button');
  }
}
