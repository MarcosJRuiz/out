import { BaseScreen } from './base.screen';

export type Endereco = {
  nomeCompleto: string;
  endereco1: string;
  endereco2: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
};

/** Campos do formulário: accessibility id do campo e da mensagem de erro seguem o rótulo exibido. */
const CAMPOS: Record<keyof Endereco, string> = {
  nomeCompleto: 'Full Name*',
  endereco1: 'Address Line 1*',
  endereco2: 'Address Line 2',
  cidade: 'City*',
  estado: 'State/Region',
  cep: 'Zip Code*',
  pais: 'Country*',
};

export class EnderecoScreen extends BaseScreen {
  aguardarExibicao() {
    return this.aguardar('checkout address screen');
  }

  async preencher(endereco: Partial<Endereco>) {
    for (const [campo, valor] of Object.entries(endereco) as [keyof Endereco, string][]) {
      await this.preencherCampo(`${CAMPOS[campo]} input field`, valor);
    }
  }

  async valorDe(campo: keyof Endereco) {
    return (await this.rolarAte(`${CAMPOS[campo]} input field`)).getText();
  }

  async erroDe(campo: keyof Endereco) {
    await this.rolarAte(`${CAMPOS[campo]}-error-message`);
    return this.textoDe(`${CAMPOS[campo]}-error-message`);
  }

  async irParaPagamento() {
    const botao = await this.rolarAte('To Payment button');
    await botao.click();
  }
}
