// Monta a pasta evidencias/ a partir de uma execução da pipeline (por padrão, a última bem-sucedida na main).
// Requer o GitHub CLI (gh) autenticado.
//
// Uso: node scripts/evidencias-snapshot.mjs [id-da-execução]
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DESTINO = 'evidencias';
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' });
const json = (...args) => JSON.parse(gh(...args));
const duracao = (inicio, fim) => {
  const s = Math.round((new Date(fim) - new Date(inicio)) / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};

const idExecucao =
  process.argv[2] ??
  json(
    'run',
    'list',
    '--workflow',
    'ci.yml',
    '--branch',
    'main',
    '--status',
    'success',
    '--limit',
    '1',
    '--json',
    'databaseId',
  )[0]?.databaseId;
if (!idExecucao) throw new Error('Nenhuma execução bem-sucedida da pipeline encontrada na main');

const execucao = json(
  'run',
  'view',
  String(idExecucao),
  '--json',
  'headSha,headBranch,createdAt,updatedAt,url,jobs,conclusion',
);
console.log(`Execução ${idExecucao} (${execucao.conclusion}) — commit ${execucao.headSha.slice(0, 7)}`);

// Relatório consolidado e resumo publicados pelo job publish-reports.
const temporario = mkdtempSync(path.join(tmpdir(), 'evidencias-'));
gh('run', 'download', String(idExecucao), '--name', 'relatorio-consolidado', '--dir', temporario);
// Substitui só os arquivos gerados por este script; evidencias/load/ (teste de carga) é mantida.
for (const gerado of ['README.md', 'allure-report.html', 'pipeline']) {
  rmSync(path.join(DESTINO, gerado), { recursive: true, force: true });
}
mkdirSync(path.join(DESTINO, 'pipeline'), { recursive: true });
copyFileSync(path.join(temporario, 'allure-report', 'index.html'), path.join(DESTINO, 'allure-report.html'));
const resumo = readFileSync(path.join(temporario, 'resumo.md'), 'utf8').replace(
  '### Resultado dos testes\n\n',
  '',
);
rmSync(temporario, { recursive: true, force: true });

// Relatório das execuções da pipeline (item 3 da avaliação).
const jobs = execucao.jobs
  .map(
    (j) =>
      `| \`${j.name}\` | ${j.conclusion === 'success' ? '✅' : '❌'} ${j.conclusion} | ${duracao(j.startedAt, j.completedAt)} | [log](${j.url}) |`,
  )
  .join('\n');
const historico = json(
  'run',
  'list',
  '--workflow',
  'ci.yml',
  '--branch',
  'main',
  '--limit',
  '15',
  '--json',
  'databaseId,displayTitle,conclusion,createdAt,url',
)
  .map(
    (r) =>
      `| ${r.createdAt.slice(0, 16).replace('T', ' ')} | ${r.conclusion === 'success' ? '✅' : '❌'} ${r.conclusion || 'em andamento'} | ${r.displayTitle} | [#${r.databaseId}](${r.url}) |`,
  )
  .join('\n');

writeFileSync(
  path.join(DESTINO, 'pipeline', 'execucoes.md'),
  `# Execuções da pipeline

## Execução de referência

[${execucao.url}](${execucao.url}) — commit \`${execucao.headSha.slice(0, 7)}\` (${execucao.headBranch}), ${duracao(execucao.createdAt, execucao.updatedAt)} no total.

| Job | Resultado | Duração | Log |
|---|---|---|---|
${jobs}

O job \`e2e-known-defects\` aparece como sucesso porque é não bloqueante: os 2 cenários falham como esperado (defeitos do site, ver \`docs/bugs/\`) e a falha fica registrada no resumo.

## Histórico recente na main

| Data (UTC) | Resultado | Commit | Execução |
|---|---|---|---|
${historico}
`,
);

writeFileSync(
  path.join(DESTINO, 'README.md'),
  `# Evidências dos testes

Snapshot versionado dos relatórios gerados pela pipeline. Os artifacts do GitHub Actions expiram; esta pasta mantém as evidências de forma permanente.

| Item | Valor |
|---|---|
| Gerado em | ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC |
| Commit testado | \`${execucao.headSha.slice(0, 7)}\` (${execucao.headBranch}) |
| Execução da pipeline | [#${idExecucao}](${execucao.url}) |

## Resumo dos resultados

${resumo}
## Conteúdo

| Arquivo | Descrição |
|---|---|
| [\`allure-report.html\`](allure-report.html) | **Relatório consolidado** (API + E2E + mobile) em arquivo único: abra online em [GitHub Pages](https://marcosjruiz.github.io/out/allure-report.html) ou baixe e abra no navegador. Agrupado por módulo, com passos, screenshots, requisições HTTP de cada teste de API e os vídeos dos defeitos conhecidos (aba *Categories* → "Defeitos conhecidos do site") |
| [\`pipeline/execucoes.md\`](pipeline/execucoes.md) | Jobs da execução de referência e histórico recente da pipeline na \`main\` |
| [\`../docs/bugs/\`](../docs/bugs/) | Bug reports dos defeitos encontrados (BUG-001 e BUG-002) |
| [\`load/\`](load/) | Teste de carga (k6): dashboard e resumo do cenário oficial (500 usuários, 5 min, na CI) e do teste de estresse — análise em [\`load/ANALISE.md\`](../load/ANALISE.md) |

Os relatórios nativos de cada módulo (Playwright HTML, Cucumber HTML com vídeos, traces do Playwright e log do Appium) ficam nos artifacts da execução: \`api-report\`, \`e2e-report\`, \`e2e-known-defects-report\` e \`mobile-report\`.

Para atualizar: \`npm run evidencias\` (usa a última execução bem-sucedida na \`main\`).
`,
);
console.log(`Evidências geradas em ${DESTINO}/`);
