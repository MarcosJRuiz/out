import { BaseScreen } from './base.screen';

export type ItemDoCatalogo = { nome: string; preco: string };

export class CatalogoScreen extends BaseScreen {
  async aguardarExibicao() {
    await this.driver.$('~products screen').waitForDisplayed({ timeout: 60_000 });
  }

  async titulo() {
    return this.driver.$('android=new UiSelector().text("Products")').getText();
  }

  async itens(): Promise<ItemDoCatalogo[]> {
    const nomes = await this.elementos('store item text');
    const precos = await this.elementos('store item price');
    const itens: ItemDoCatalogo[] = [];
    for (let i = 0; i < nomes.length; i++) {
      itens.push({ nome: await nomes[i].getText(), preco: await precos[i].getText() });
    }
    return itens;
  }

  async abrirProduto(indice: number) {
    const itens = await this.elementos('store item');
    await itens[indice].click();
  }

  async quantidadeNoCarrinho() {
    const badge = this.elemento('cart badge');
    const texto = await badge.$$('android.widget.TextView');
    return texto.length > 0 ? texto[0].getText() : '0';
  }

  abrirCarrinho() {
    return this.tocar('cart badge');
  }
}
