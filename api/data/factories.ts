import { faker } from '@faker-js/faker/locale/pt_BR';
import type { Produto } from '../clients/produtos.client';
import type { Usuario } from '../clients/usuarios.client';

// Sufixo único para evitar colisão entre testes paralelos (e-mail e nome de produto são únicos no ServeRest).
const unico = () => `${Date.now().toString(36)}${faker.string.alphanumeric(6).toLowerCase()}`;

export function novoUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    nome: faker.person.fullName(),
    email: `qa.${unico()}@teste.com.br`,
    password: faker.internet.password({ length: 12 }),
    administrador: 'false',
    ...overrides,
  };
}

export function novoProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    nome: `${faker.commerce.productName()} ${unico()}`,
    preco: faker.number.int({ min: 10, max: 5_000 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 5, max: 100 }),
    ...overrides,
  };
}
