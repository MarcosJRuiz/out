// Consolida os resultados Allure de API, E2E e mobile em um único diretório e gera o resumo da execução.
// Com --carga, inclui o último teste de carga versionado: cada threshold do cenário oficial vira um teste
// do módulo "Carga" e o estresse entra como anexo global (os thresholds dele falham de propósito).
//
// Uso: node scripts/relatorio-consolidado.mjs <Módulo>=<pasta allure-results> [...] [--carga=<pasta>]
// Ex.:  node scripts/relatorio-consolidado.mjs API=api/reports/allure-results --carga=evidencias/load
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
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const DESTINO = 'reports/allure-results';
const BUGS = {
  'BUG-001': 'docs/bugs/BUG-001-cartao-invalido-aceito.md',
  'BUG-002': 'docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md',
};
const REPOSITORIO = process.env.GITHUB_SERVER_URL
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA}`
  : '.';

const argumentos = process.argv.slice(2);
const carga = argumentos.find((a) => a.startsWith('--carga='))?.slice('--carga='.length);
const modulos = argumentos
  .filter((a) => !a.startsWith('--'))
  .map((arg) => {
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

if (carga) resultados.push(...incluirCarga(carga));

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
for (const nome of new Set([...modulos.map((m) => m.nome), ...(carga ? ['Carga'] : [])])) {
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

function incluirCarga(pasta) {
  const oficial = path.join(pasta, 'oficial');
  const estresse = path.join(pasta, 'estresse');
  if (!existsSync(oficial)) {
    console.warn(`Aviso: ${oficial} não existe (relatório sem o módulo Carga)`);
    return [];
  }
  const anexo = (origem, nome, tipo) => {
    const source = `${randomUUID()}-attachment${path.extname(origem)}`;
    if (tipo === 'text/html') {
      // No tema escuro, o Allure injeta no anexo `:root,html,body{background:… !important}`. Seletores
      // mais específicos mantêm o dashboard do k6 com o fundo claro original.
      const html = readFileSync(origem, 'utf8').replace(
        '</head>',
        '<style>html:root,html body{background:#fff !important;color:#3c3c3c !important;color-scheme:light}</style></head>',
      );
      writeFileSync(path.join(DESTINO, source), html);
    } else {
      copyFileSync(origem, path.join(DESTINO, source));
    }
    return { name: nome, source, type: tipo };
  };

  if (existsSync(estresse)) {
    const attachments = [
      anexo(
        path.join(estresse, 'k6-dashboard.html'),
        'Estresse — 500 usuários sem pausa: dashboard k6',
        'text/html',
      ),
      anexo(
        path.join(estresse, 'resumo-k6.json'),
        'Estresse — 500 usuários sem pausa: resumo (JSON)',
        'application/json',
      ),
    ];
    writeFileSync(
      path.join(DESTINO, `${randomUUID()}-globals.json`),
      JSON.stringify({ attachments, errors: [] }),
    );
  }

  const NOMES = {
    http_req_failed: 'Taxa de erro HTTP',
    checks: 'Checks aprovados',
    http_req_duration: 'Tempo de resposta geral',
    tempo_login: 'Tempo do login',
    tempo_listagem_produtos: 'Tempo da listagem de produtos',
    tempo_detalhe_produto: 'Tempo do detalhe do produto',
  };
  const medido = (m) =>
    m.type === 'trend'
      ? `p95 ${m.values['p(95)'].toFixed(1)} ms · p99 ${m.values['p(99)'].toFixed(1)} ms · máx ${m.values.max.toFixed(1)} ms`
      : `${(m.values.rate * 100).toFixed(2)}%`;
  const resumo = JSON.parse(readFileSync(path.join(oficial, 'resumo-k6.json'), 'utf8'));
  const duracao = `${Math.round((resumo.state?.testRunDurationMs ?? 0) / 60000)} min`;
  // Cada threshold leva a própria cópia: o Allure não carrega um mesmo arquivo anexado a vários testes.
  const anexos = () => [
    anexo(path.join(oficial, 'k6-dashboard.html'), 'Dashboard k6', 'text/html'),
    anexo(path.join(oficial, 'resumo-k6.json'), 'Resumo (JSON)', 'application/json'),
  ];
  // A carga não roda neste pipeline: o horário acompanha o fim dos outros módulos para não distorcer a timeline.
  const horario = Math.max(0, ...resultados.map((r) => r.stop ?? 0));
  const suite = 'Carga — 500 usuários por 5 min (1 s entre ações)';

  const gerados = [];
  for (const [metrica, def] of Object.entries(resumo.metrics)) {
    for (const [regra, { ok }] of Object.entries(def.thresholds ?? {})) {
      const nome = `${NOMES[metrica] ?? metrica}: ${regra}`;
      const resultado = {
        uuid: randomUUID(),
        historyId: `carga:${metrica}:${regra}`,
        name: nome,
        fullName: `${suite} › ${nome}`,
        status: ok ? 'passed' : 'failed',
        statusDetails: ok ? {} : { message: `Threshold não atendido. Medido: ${medido(def)}` },
        stage: 'finished',
        start: horario,
        stop: horario,
        description: `Medido: ${medido(def)}. Resultado do último teste de carga (workflow Carga), versionado em evidencias/load/oficial.`,
        parameters: [
          { name: 'Medido', value: medido(def) },
          { name: 'Duração do teste', value: duracao },
        ],
        labels: [
          { name: 'parentSuite', value: 'Carga' },
          { name: 'suite', value: suite },
          { name: 'tag', value: 'k6' },
        ],
        attachments: anexos(),
      };
      writeFileSync(path.join(DESTINO, `${resultado.uuid}-result.json`), JSON.stringify(resultado));
      gerados.push({ modulo: 'Carga', ...resultado });
    }
  }
  return gerados;
}
