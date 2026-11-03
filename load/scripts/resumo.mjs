// Gera uma tabela Markdown com as principais métricas do resumo JSON do k6.
// Uso: node load/scripts/resumo.mjs load/reports/resumo-k6.json
import { readFileSync } from 'node:fs';

const { metrics: m } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
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

console.log(`### Teste de carga (k6)

| Métrica | Valor |
|---|---|
| Usuários simultâneos (máx.) | ${m.vus_max?.values.max ?? '—'} |
| Requisições | ${m.http_reqs?.values.count ?? '—'} (${(m.http_reqs?.values.rate ?? 0).toFixed(1)} req/s) |
| Iterações (fluxos completos) | ${m.iterations?.values.count ?? '—'} |
| Taxa de erro HTTP${thr('http_req_failed')} | ${((m.http_req_failed?.values.rate ?? 0) * 100).toFixed(2)}% |
| Checks aprovados${thr('checks')} | ${((m.checks?.values.rate ?? 0) * 100).toFixed(2)}% |

| Tempo de resposta | Média | Mediana | p90 | p95 | p99 | Máx. |
|---|---|---|---|---|---|---|
${tempo('http_req_duration', 'Todas as requisições')}
${tempo('tempo_login', 'Login')}
${tempo('tempo_listagem_produtos', 'Listar produtos')}
${tempo('tempo_detalhe_produto', 'Consultar produto')}

Thresholds: erro < 1%, checks > 99% e p95 < 500 ms (total e por etapa).`);
