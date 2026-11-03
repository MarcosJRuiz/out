import { BaseScreen } from './base.screen';

export const USUARIOS = {
  valido: { usuario: 'bob@example.com', senha: '10203040' },
  bloqueado: { usuario: 'alice@example.com', senha: '10203040' },
};

export class LoginScreen extends BaseScreen {
  aguardarExibicao() {
    return this.aguardar('login screen');
  }

  async entrar(usuario: string, senha: string) {
    await this.preencherCampo('Username input field', usuario);
    await this.preencherCampo('Password input field', senha);
    await this.tocar('Login button');
  }

  estaExibida() {
    return this.visivel('login screen');
  }

  erroUsuario() {
    return this.textoDe('Username-error-message');
  }

  erroSenha() {
    return this.textoDe('Password-error-message');
  }

  erroGeral() {
    return this.textoDe('generic-error-message');
  }
}
