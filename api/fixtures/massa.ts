import { expect } from '@playwright/test';
import type { CarrinhosClient, ItemCarrinho } from '../clients/carrinhos.client';
import type { LoginClient } from '../clients/login.client';
import type { Produto, ProdutosClient } from '../clients/produtos.client';
import type { Usuario, UsuariosClient } from '../clients/usuarios.client';
import { novoProduto, novoUsuario } from '../data/factories';

export type UsuarioCriado = Usuario & { _id: string; token: string };
export type ProdutoCriado = Produto & { _id: string };

/**
 * Cria a massa de cada teste pela própria API e a remove ao final, na ordem inversa da criação
 * (carrinho → usuário → produto), respeitando as regras de exclusão do ServeRest.
 */
export class MassaDeTeste {
  private readonly limpezas: Array<() => Promise<unknown>> = [];

  constructor(
    private readonly login: LoginClient,
    private readonly usuarios: UsuariosClient,
    private readonly produtos: ProdutosClient,
    private readonly carrinhos: CarrinhosClient,
  ) {}

  async usuario(overrides: Partial<Usuario> = {}): Promise<UsuarioCriado> {
    const dados = novoUsuario(overrides);
    const cadastro = await this.usuarios.cadastrar(dados);
    expect(cadastro.status(), 'pré-condição: cadastrar usuário').toBe(201);
    const { _id } = await cadastro.json();
    this.limpezas.push(() => this.usuarios.excluir(_id));

    const login = await this.login.login({ email: dados.email, password: dados.password });
    expect(login.status(), 'pré-condição: login do usuário').toBe(200);
    const { authorization } = await login.json();
    return { ...dados, _id, token: authorization };
  }

  admin(overrides: Partial<Usuario> = {}) {
    return this.usuario({ ...overrides, administrador: 'true' });
  }

  async produto(admin: UsuarioCriado, overrides: Partial<Produto> = {}): Promise<ProdutoCriado> {
    const dados = novoProduto(overrides);
    const cadastro = await this.produtos.cadastrar(dados, admin.token);
    expect(cadastro.status(), 'pré-condição: cadastrar produto').toBe(201);
    const { _id } = await cadastro.json();
    this.limpezas.push(() => this.produtos.excluir(_id, admin.token));
    return { ...dados, _id };
  }

  async carrinho(dono: UsuarioCriado, itens: ItemCarrinho[]): Promise<string> {
    const cadastro = await this.carrinhos.cadastrar(itens, dono.token);
    expect(cadastro.status(), 'pré-condição: cadastrar carrinho').toBe(201);
    const { _id } = await cadastro.json();
    // Cancelar devolve o estoque e libera a exclusão do usuário e dos produtos.
    this.limpezas.push(() => this.carrinhos.cancelarCompra(dono.token));
    return _id;
  }

  /** Para dados criados diretamente no teste (ex.: cenário de cadastro). */
  registrarLimpeza(limpeza: () => Promise<unknown>) {
    this.limpezas.push(limpeza);
  }

  async limpar() {
    for (const limpeza of this.limpezas.reverse()) {
      await limpeza().catch(() => undefined);
    }
  }
}
