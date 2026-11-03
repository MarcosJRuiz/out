// Teste de carga: 500 usuários simultâneos por 5 minutos contra o ServeRest.
//
// Fluxo de cada usuário virtual (iteração): login → listar produtos → consultar um produto, com pausa de 1 s
// entre as ações (tempo de leitura de um usuário real).
//
// Variáveis (opcionais): BASE_URL, VUS (padrão 500), PATAMAR (padrão 5m), RAMPA (padrão 30s) e
// PAUSA (segundos entre ações, padrão 1; 0 = teste de estresse, sem tempo de leitura).
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const VUS = Number(__ENV.VUS || 500);
const PATAMAR = __ENV.PATAMAR || '5m';
const RAMPA = __ENV.RAMPA || '30s';
const PAUSA = Number(__ENV.PAUSA ?? 1);
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

// Tempo de cada etapa do fluxo, para localizar o gargalo.
const tempoLogin = new Trend('tempo_login', true);
const tempoListagem = new Trend('tempo_listagem_produtos', true);
const tempoDetalhe = new Trend('tempo_detalhe_produto', true);

export const options = {
  scenarios: {
    carga: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMPA, target: VUS }, // rampa de subida
        { duration: PATAMAR, target: VUS }, // 500 usuários simultâneos por 5 minutos
        { duration: RAMPA, target: 0 }, // rampa de descida
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos de 1% de erros
    http_req_duration: ['p(95)<500'], // 95% das requisições em menos de 500 ms
    checks: ['rate>0.99'],
    tempo_login: ['p(95)<500'],
    tempo_listagem_produtos: ['p(95)<500'],
    tempo_detalhe_produto: ['p(95)<500'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// Massa criada uma vez: um usuário para o login e a lista de produtos existentes.
export function setup() {
  const usuario = {
    nome: 'Usuário Carga',
    email: `carga.${Date.now()}@teste.com.br`,
    password: 'senha-carga',
    administrador: 'false',
  };
  const cadastro = http.post(`${BASE_URL}/usuarios`, JSON.stringify(usuario), JSON_HEADERS);
  check(cadastro, { 'setup: usuário criado (201)': (r) => r.status === 201 });

  const produtos = http.get(`${BASE_URL}/produtos`).json('produtos');
  if (!produtos || produtos.length === 0) throw new Error('ServeRest sem produtos para consultar');

  return { usuario, idsProdutos: produtos.map((p) => p._id), idUsuario: cadastro.json('_id') };
}

export default function (massa) {
  group('login', () => {
    const r = http.post(
      `${BASE_URL}/login`,
      JSON.stringify({ email: massa.usuario.email, password: massa.usuario.password }),
      { ...JSON_HEADERS, tags: { etapa: 'login' } },
    );
    tempoLogin.add(r.timings.duration);
    check(r, {
      'login: status 200': (res) => res.status === 200,
      'login: token Bearer': (res) => String(res.json('authorization') || '').startsWith('Bearer '),
    });
  });
  sleep(PAUSA);

  group('listar produtos', () => {
    const r = http.get(`${BASE_URL}/produtos`, { tags: { etapa: 'listagem' } });
    tempoListagem.add(r.timings.duration);
    check(r, {
      'listagem: status 200': (res) => res.status === 200,
      'listagem: contém produtos': (res) => res.json('quantidade') > 0,
    });
  });
  sleep(PAUSA);

  group('consultar produto', () => {
    const id = massa.idsProdutos[Math.floor(Math.random() * massa.idsProdutos.length)];
    const r = http.get(`${BASE_URL}/produtos/${id}`, { tags: { etapa: 'detalhe' } });
    tempoDetalhe.add(r.timings.duration);
    check(r, {
      'detalhe: status 200': (res) => res.status === 200,
      'detalhe: produto correto': (res) => res.json('_id') === id,
    });
  });
  sleep(PAUSA);
}

export function teardown(massa) {
  if (massa.idUsuario) http.del(`${BASE_URL}/usuarios/${massa.idUsuario}`);
}

// Resumo no terminal e em JSON (base da análise e do resumo da pipeline).
export function handleSummary(data) {
  const pasta = __ENV.RESULTADOS || 'load/reports';
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: false }),
    [`${pasta}/resumo-k6.json`]: JSON.stringify(data, null, 2),
  };
}
