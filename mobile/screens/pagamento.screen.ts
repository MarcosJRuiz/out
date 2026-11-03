import { BaseScreen } from './base.screen';

export class PagamentoScreen extends BaseScreen {
  aguardarExibicao() {
    return this.aguardar('checkout payment screen');
  }
}
