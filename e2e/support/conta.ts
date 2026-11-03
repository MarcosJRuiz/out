import { faker } from '@faker-js/faker/locale/pt_BR';
import { BASE_URL } from './config';

export type Conta = {
  nome: string;
  email: string;
  senha: string;
  primeiroNome: string;
  sobrenome: string;
  empresa: string;
  endereco: string;
  pais: string;
  estado: string;
  cidade: string;
  cep: string;
  celular: string;
};

export function novaConta(overrides: Partial<Conta> = {}): Conta {
  const primeiroNome = faker.person.firstName();
  const sobrenome = faker.person.lastName();
  return {
    nome: `${primeiroNome} ${sobrenome}`,
    email: `qa.e2e.${Date.now().toString(36)}${faker.string.alphanumeric(6).toLowerCase()}@teste.com.br`,
    senha: faker.internet.password({ length: 12 }),
    primeiroNome,
    sobrenome,
    empresa: faker.company.name(),
    endereco: faker.location.streetAddress(),
    pais: 'Canada',
    estado: faker.location.state(),
    cidade: faker.location.city(),
    cep: faker.location.zipCode('#####'),
    celular: faker.string.numeric(11),
    ...overrides,
  };
}

/**
 * API pública do AutomationExercise, usada só para preparar e limpar a massa (mais rápido e estável que a UI).
 * Atenção: a API responde HTTP 200 sempre; o resultado real vem em "responseCode" no corpo.
 */
async function chamarApi(metodo: 'POST' | 'DELETE', rota: string, campos: Record<string, string>) {
  const resposta = await fetch(`${BASE_URL}/api/${rota}`, {
    method: metodo,
    body: new URLSearchParams(campos),
  });
  const texto = await resposta.text();
  try {
    return JSON.parse(texto) as { responseCode: number; message: string };
  } catch {
    throw new Error(
      `API ${rota} respondeu algo que não é JSON (site sobrecarregado?): ${texto.slice(0, 200)}`,
    );
  }
}

export async function criarContaViaApi(conta: Conta) {
  const corpo = await chamarApi('POST', 'createAccount', {
    name: conta.nome,
    email: conta.email,
    password: conta.senha,
    title: 'Mr',
    birth_date: '10',
    birth_month: '5',
    birth_year: '1990',
    firstname: conta.primeiroNome,
    lastname: conta.sobrenome,
    company: conta.empresa,
    address1: conta.endereco,
    address2: '',
    country: conta.pais,
    zipcode: conta.cep,
    state: conta.estado,
    city: conta.cidade,
    mobile_number: conta.celular,
  });
  if (corpo.responseCode !== 201) {
    throw new Error(`Pré-condição: falha ao criar conta via API (${corpo.responseCode}: ${corpo.message})`);
  }
}

export async function excluirContaViaApi(conta: Conta) {
  await chamarApi('DELETE', 'deleteAccount', { email: conta.email, password: conta.senha });
}
