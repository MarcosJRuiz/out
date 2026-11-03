import { test as base } from '@playwright/test';
import { CarrinhosClient } from '../clients/carrinhos.client';
import { HttpLog } from '../clients/http-log';
import { LoginClient } from '../clients/login.client';
import { ProdutosClient } from '../clients/produtos.client';
import { UsuariosClient } from '../clients/usuarios.client';
import { MassaDeTeste } from './massa';

type Fixtures = {
  httpLog: HttpLog;
  loginApi: LoginClient;
  usuariosApi: UsuariosClient;
  produtosApi: ProdutosClient;
  carrinhosApi: CarrinhosClient;
  massa: MassaDeTeste;
};

export const test = base.extend<Fixtures>({
  httpLog: async ({}, use, testInfo) => {
    const log = new HttpLog();
    await use(log);
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('requisicoes-http.json', {
        body: JSON.stringify(log.trocas, null, 2),
        contentType: 'application/json',
      });
    }
  },
  loginApi: async ({ request, httpLog }, use) => use(new LoginClient(request, httpLog)),
  usuariosApi: async ({ request, httpLog }, use) => use(new UsuariosClient(request, httpLog)),
  produtosApi: async ({ request, httpLog }, use) => use(new ProdutosClient(request, httpLog)),
  carrinhosApi: async ({ request, httpLog }, use) => use(new CarrinhosClient(request, httpLog)),
  massa: async ({ loginApi, usuariosApi, produtosApi, carrinhosApi }, use) => {
    const massa = new MassaDeTeste(loginApi, usuariosApi, produtosApi, carrinhosApi);
    await use(massa);
    await massa.limpar();
  },
});

export { expect } from '@playwright/test';
