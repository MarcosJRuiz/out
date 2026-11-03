import { BaseScreen } from './base.screen';

export class MenuScreen extends BaseScreen {
  async abrirLogin() {
    await this.tocar('open menu');
    await this.tocar('menu item log in');
  }
}
