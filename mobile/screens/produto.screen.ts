import { BaseScreen } from './base.screen';

export class ProdutoScreen extends BaseScreen {
  aguardarExibicao() {
    return this.aguardar('product screen');
  }

  async nome() {
    const tela = this.elemento('product screen');
    return (await tela.$$('android.widget.TextView'))[0].getText();
  }

  preco() {
    return this.elemento('product price').getText();
  }

  botaoAdicionar() {
    return this.elemento('Add To Cart button');
  }

  async adicionarAoCarrinho() {
    await this.tocar('Add To Cart button');
  }
}
