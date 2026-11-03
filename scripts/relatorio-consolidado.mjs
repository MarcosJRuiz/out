// Consolida os resultados Allure de API, E2E e mobile em um único diretório e gera o resumo da execução.
//
// Uso: node scripts/relatorio-consolidado.mjs <Módulo>=<pasta allure-results> [...]
// Ex.:  node scripts/relatorio-consolidado.mjs API=api/reports/allure-results E2E=e2e/reports/allure-results
//
// Saídas:
//   reports/allure-results/  resultados consolidados (entrada do "allure generate")
//   reports/resumo.md        tabela de totais por módulo (usada no resumo da pipeline)
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const DESTINO = 'reports/allure-results';
const BUGS = {
  'BUG-001': 'docs/bugs/BUG-001-cartao-invalido-aceito.md',
  'BUG-002': 'docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md',
};
const REPOSITORIO = process.env.GITHUB_SERVER_URL
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA}`
  : '.';

const modulos = process.argv.slice(2).map((arg) => {
  const [nome, pasta] = arg.split('=');
  return { nome, pasta };
});
if (modulos.length === 0) {
  console.error('Informe ao menos um módulo: <Módulo>=<pasta allure-results>');
  process.exit(1);
}

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

const tags = (r) => r.labels.filter((l) => l.name === 'tag').map((l) => l.value.replace(/^@/, ''));

const resultados = [];
for (const { nome, pasta } of modulos) {
  if (!existsSync(pasta)) {
    console.warn(`Aviso: ${pasta} não existe (módulo ${nome} sem resultados)`);
    continue;
  }
  for (const arquivo of readdirSync(pasta)) {
    const origem = path.join(pasta, arquivo);
    if (!arquivo.endsWith('-result.json')) {
      copyFileSync(origem, path.join(DESTINO, arquivo));
      continue;
    }
    const resultado = JSON.parse(readFileSync(origem, 'utf8'));
    // Agrupa o relatório por módulo (API, E2E, Mobile) no nível mais alto da árvore de suítes.
    resultado.labels = resultado.labels.filter((l) => l.name !== 'parentSuite');
    resultado.labels.push({ name: 'parentSuite', value: nome });
    // Liga os cenários de defeito conhecido aos bug reports.
    for (const tag of tags(resultado)) {
      if (BUGS[tag]) {
        resultado.links = [
          ...(resultado.links ?? []),
          { type: 'issue', name: tag, url: `${REPOSITORIO}/${BUGS[tag]}` },
        ];
      }
    }
    writeFileSync(path.join(DESTINO, arquivo), JSON.stringify(resultado));
    resultados.push({ modulo: nome, ...resultado });
  }
}

// Com retry, o mesmo teste gera mais de um resultado: vale o último (maior "stop").
const finais = new Map();
for (const r of resultados) {
  const chave = `${r.modulo}:${r.historyId ?? r.fullName ?? r.name}`;
  const atual = finais.get(chave);
  if (!atual || (r.stop ?? 0) > (atual.stop ?? 0))
    finais.set(chave, { ...r, tentativas: (atual?.tentativas ?? 0) + 1 });
  else atual.tentativas += 1;
}

const linhas = [];
const total = { testes: 0, passou: 0, falhou: 0, esperada: 0, instavel: 0 };
// Um módulo pode vir de mais de uma pasta (ex.: E2E principal e E2E de defeitos conhecidos).
for (const nome of new Set(modulos.map((m) => m.nome))) {
  const doModulo = [...finais.values()].filter((r) => r.modulo === nome);
  const esperada = doModulo.filter((r) => tags(r).includes('known-defect') && r.status !== 'passed').length;
  const conta = {
    testes: doModulo.length,
    passou: doModulo.filter((r) => r.status === 'passed').length,
    falhou: doModulo.filter((r) => r.status !== 'passed' && !tags(r).includes('known-defect')).length,
    esperada,
    instavel: doModulo.filter((r) => r.status === 'passed' && r.tentativas > 1).length,
  };
  for (const k of Object.keys(total)) total[k] += conta[k];
  linhas.push(
    `| ${nome} | ${conta.testes} | ${conta.passou} | ${conta.falhou} | ${conta.esperada} | ${conta.instavel} |`,
  );
}

const resumo = [
  '### Resultado dos testes',
  '',
  '| Módulo | Testes | Passou | Falhou | Falha esperada (`@known-defect`) | Passou após retry |',
  '|---|---|---|---|---|---|',
  ...linhas,
  `| **Total** | **${total.testes}** | **${total.passou}** | **${total.falhou}** | **${total.esperada}** | **${total.instavel}** |`,
  '',
  total.falhou === 0 ? '✅ Nenhuma falha inesperada.' : `❌ ${total.falhou} falha(s) inesperada(s).`,
  total.esperada > 0
    ? `ℹ️ ${total.esperada} falha(s) esperada(s): defeitos conhecidos do site, documentados em \`docs/bugs/\`.`
    : '',
].join('\n');

writeFileSync('reports/resumo.md', `${resumo}\n`);
console.log(resumo);
