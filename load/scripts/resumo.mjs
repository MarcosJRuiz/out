// Gera uma tabela Markdown com as principais métricas do resumo JSON do k6 e, se houver, a CPU medida
// durante o teste (cpu-serverest.txt e cpu-k6.txt, em % de um núcleo) e a máquina usada (maquina.txt).
// Uso: node load/scripts/resumo.mjs <pasta dos relatórios> [cenário]
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [pasta, cenario] = process.argv.slice(2);
const { metrics: m } = JSON.parse(readFileSync(path.join(pasta, 'resumo-k6.json'), 'utf8'));
const ms = (v) => (v === undefined ? '—' : `${v.toFixed(1)} ms`);
const thr = (nome) => {
  const t = m[nome]?.thresholds;
  if (!t) return '';
  return Object.values(t).some((v) => v.ok === false) ? ' ❌' : ' ✅';
};
const tempo = (nome, rotulo) => {
  const v = m[nome]?.values ?? {};
  return `| ${rotulo}${thr(nome)} | ${ms(v.avg)} | ${ms(v.med)} | ${ms(v['p(90)'])} | ${ms(v['p(95)'])} | ${ms(v['p(99)'])} | ${ms(v.max)} |`;
};
const amostras = (arquivo) => {
  const caminho = path.join(pasta, arquivo);
  if (!existsSync(caminho)) return null;
  const valores = readFileSync(caminho, 'utf8')
    .split('\n')
    .map((l) => Number(l.replace(',', '.')))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (!valores.length) return null;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  return `pico ${Math.max(...valores).toFixed(0)}% · média ${media.toFixed(0)}% (${valores.length} amostras)`;
};
const maquina = existsSync(path.join(pasta, 'maquina.txt'))
  ? readFileSync(path.join(pasta, 'maquina.txt'), 'utf8').trim().replaceAll('|', '·')
  : null;
const extras = [
  ['CPU do ServeRest (% de um núcleo)', amostras('cpu-serverest.txt')],
  ['CPU do gerador k6 (% de um núcleo)', amostras('cpu-k6.txt')],
  ['Máquina', maquina],
]
  .filter(([, valor]) => valor)
  .map(([rotulo, valor]) => `\n| ${rotulo} | ${valor} |`)
  .join('');

console.log(`### Teste de carga (k6)${cenario ? ` — ${cenario}` : ''}

| Métrica | Valor |
|---|---|
| Usuários simultâneos (máx.) | ${m.vus_max?.values.max ?? '—'} |
| Requisições | ${m.http_reqs?.values.count ?? '—'} (${(m.http_reqs?.values.rate ?? 0).toFixed(1)} req/s) |
| Iterações (fluxos completos) | ${m.iterations?.values.count ?? '—'} |
| Taxa de erro HTTP${thr('http_req_failed')} | ${((m.http_req_failed?.values.rate ?? 0) * 100).toFixed(2)}% |
| Checks aprovados${thr('checks')} | ${((m.checks?.values.rate ?? 0) * 100).toFixed(2)}% |${extras}

| Tempo de resposta | Média | Mediana | p90 | p95 | p99 | Máx. |
|---|---|---|---|---|---|---|
${tempo('http_req_duration', 'Todas as requisições')}
${tempo('tempo_login', 'Login')}
${tempo('tempo_listagem_produtos', 'Listar produtos')}
${tempo('tempo_detalhe_produto', 'Consultar produto')}

Thresholds: erro < 1%, checks > 99% e p95 < 500 ms (total e por etapa).`);
