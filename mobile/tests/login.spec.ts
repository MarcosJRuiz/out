import { expect, test } from '../fixtures/driver.fixture';
import { USUARIOS } from '../screens/login.screen';

test.describe('Tarefa 1 — login, navegação e validação de elementos', () => {
  test(
    'login válido, navegação catálogo → produto → carrinho e validação dos elementos',
    { tag: '@smoke' },
    async ({ catalogo, menu, login, produto, carrinho, evidencia }) => {
      await test.step('faz login com usuário válido', async () => {
        await menu.abrirLogin();
        await login.aguardarExibicao();
        await login.entrar(USUARIOS.valido.usuario, USUARIOS.valido.senha);
      });

      const primeiroItem = await test.step('volta ao catálogo após o login', async () => {
        await catalogo.aguardarExibicao();
        expect(await login.estaExibida()).toBe(false);
        expect(await catalogo.titulo()).toBe('Products');
        const itens = await catalogo.itens();
        expect(itens.length).toBeGreaterThan(0);
        await evidencia('catalogo-apos-login');
        return itens[0];
      });

      await test.step('abre o produto e valida nome, preço e botão "Add To Cart"', async () => {
        await catalogo.abrirProduto(0);
        await produto.aguardarExibicao();
        expect(await produto.nome()).toBe(primeiroItem.nome);
        expect(await produto.preco()).toBe(primeiroItem.preco);
        await expect.poll(() => produto.botaoAdicionar().isDisplayed()).toBe(true);
        await expect.poll(() => produto.botaoAdicionar().isEnabled()).toBe(true);
        await evidencia('detalhe-do-produto');
      });

      await test.step('adiciona ao carrinho e valida o contador', async () => {
        await produto.adicionarAoCarrinho();
        await expect.poll(() => catalogo.quantidadeNoCarrinho()).toBe('1');
      });

      await test.step('abre o carrinho e valida produto e total', async () => {
        await catalogo.abrirCarrinho();
        await carrinho.aguardarExibicao();
        expect(await carrinho.nomeDoProduto()).toBe(primeiroItem.nome);
        expect(await carrinho.quantidadeTotal()).toBe('1 item');
        expect(await carrinho.precoTotal()).toBe(primeiroItem.preco);
        await evidencia('carrinho');
      });
    },
  );

  test.describe('cenários negativos', { tag: '@negative' }, () => {
    const casos = [
      {
        titulo: 'recusa senha incorreta',
        usuario: USUARIOS.valido.usuario,
        senha: 'senha-incorreta',
        campo: 'geral' as const,
        mensagem: 'Provided credentials do not match any user in this service.',
      },
      {
        titulo: 'recusa usuário bloqueado',
        usuario: USUARIOS.bloqueado.usuario,
        senha: USUARIOS.bloqueado.senha,
        campo: 'geral' as const,
        mensagem: 'Sorry, this user has been locked out.',
      },
      {
        titulo: 'exige usuário',
        usuario: '',
        senha: USUARIOS.valido.senha,
        campo: 'usuario' as const,
        mensagem: 'Username is required',
      },
      {
        titulo: 'exige senha',
        usuario: USUARIOS.valido.usuario,
        senha: '',
        campo: 'senha' as const,
        mensagem: 'Password is required',
      },
    ];

    for (const caso of casos) {
      test(caso.titulo, async ({ menu, login, evidencia }) => {
        await menu.abrirLogin();
        await login.aguardarExibicao();
        await login.entrar(caso.usuario, caso.senha);

        const erro = {
          geral: () => login.erroGeral(),
          usuario: () => login.erroUsuario(),
          senha: () => login.erroSenha(),
        };
        await expect.poll(erro[caso.campo]).toBe(caso.mensagem);
        expect(await login.estaExibida(), 'deve permanecer na tela de login').toBe(true);
        await evidencia('mensagem-de-erro');
      });
    }
  });
});
