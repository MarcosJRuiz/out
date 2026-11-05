// Tabelas de resultado de um cenário do teste de carga, no formato da Análise (load/ANALISE.md), a partir do
// resumo JSON do k6 e da CPU medida pelo workflow Carga (cpu-serverest.txt e cpu-k6.txt, em % de um núcleo).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const numero = (v, casas = 1) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const ms = (v) => `${numero(v)} ms`;
const reprovado = (metrica) => Object.values(metrica?.thresholds ?? {}).some((t) => t.ok === false);
const marca = (metrica) => (reprovado(metrica) ? ' ❌' : ' ✅');

function cpu(pasta, arquivo) {
  const caminho = path.join(pasta, arquivo);
  if (!existsSync(caminho)) return null;
  const valores = readFileSync(caminho, 'utf8')
    .split('\n')
    .map(Number)
    .filter((v) => v > 0);
  if (!valores.length) return null;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  return `média ${numero(media, 0)}%, pico ${numero(Math.max(...valores), 0)}% de um núcleo`;
}

const ETAPAS = [
  ['http_req_duration', 'Todas as requisições'],
  ['tempo_login', 'Login'],
  ['tempo_listagem_produtos', 'Listar produtos'],
  ['tempo_detalhe_produto', 'Consultar produto'],
];

export function tabelasCarga(pasta, cenario) {
  const { metrics: m } = JSON.parse(readFileSync(path.join(pasta, 'resumo-k6.json'), 'utf8'));
  const percentual = (taxa) => (taxa === 1 ? '100%' : `${numero(taxa * 100, 2)}%`);
  const fluxo = numero(m.iteration_duration.values.avg / 1000, 2);

  const reprovadas = [
    ['http_req_failed', 'taxa de erro'],
    ['checks', 'checks'],
    ...ETAPAS.map(([nome, rotulo]) => [nome, `p95 de ${rotulo.toLowerCase()}`]),
  ]
    .filter(([nome]) => reprovado(m[nome]))
    .map(([, rotulo]) => rotulo);
  const veredito = !reprovadas.length
    ? '**Aprovado em todos os critérios.**'
    : cenario === 'estresse'
      ? `**Reprovado, como esperado no estresse:** ${reprovadas.join(', ')}.`
      : `**Reprovado em:** ${reprovadas.join(', ')}.`;

  const linhas = [
    ['Requisições', m.http_reqs.values.count.toLocaleString('pt-BR'), '—'],
    ['Vazão', `**${numero(m.http_reqs.values.rate, 0)} req/s**`, '—'],
    ['Fluxos completos (iterações)', m.iterations.values.count.toLocaleString('pt-BR'), '—'],
    [
      'Taxa de erro HTTP',
      `**${numero(m.http_req_failed.values.rate * 100, 2)}%**`,
      `< 1%${marca(m.http_req_failed)}`,
    ],
    [
      'Checks (status e conteúdo de cada resposta)',
      `**${percentual(m.checks.values.rate)}** (${m.checks.values.passes.toLocaleString('pt-BR')})`,
      `> 99%${marca(m.checks)}`,
    ],
    [
      'Duração média de um fluxo',
      cenario === 'oficial' ? `${fluxo} s (3 s são as pausas)` : `${fluxo} s`,
      '—',
    ],
    ['CPU do ServeRest', cpu(pasta, 'cpu-serverest.txt'), '—'],
    ['CPU do gerador k6', cpu(pasta, 'cpu-k6.txt'), '—'],
  ].filter(([, valor]) => valor);

  const tempos = ETAPAS.map(([nome, rotulo]) => {
    const v = m[nome].values;
    const p95 = nome === 'http_req_duration' ? `**${ms(v['p(95)'])}**` : ms(v['p(95)']);
    return `| ${rotulo}${reprovado(m[nome]) ? ' ❌' : ''} | ${ms(v.avg)} | ${ms(v.med)} | ${ms(v['p(90)'])} | ${p95} | ${ms(v['p(99)'])} | ${ms(v.max)} |`;
  });

  return [
    veredito,
    '',
    '| Métrica | Resultado | Critério |',
    '| --- | --- | --- |',
    ...linhas.map((l) => `| ${l.join(' | ')} |`),
    '',
    '| Tempo de resposta | Média | Mediana | p90 | p95 | p99 | Máx. |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...tempos,
  ].join('\n');
}
