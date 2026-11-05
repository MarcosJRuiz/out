// Monta a página inicial do GitHub Pages em <pasta do site>: menu lateral com os relatórios, o README e os
// bug reports. Os Markdown são convertidos pela API de Markdown do GitHub (mesma renderização do repositório)
// e ajustados para fora dele: títulos ganham id para os links internos, links para o que está publicado no site
// abrem o item do menu correspondente e os demais abrem em nova aba.
//
// Uso: GITHUB_TOKEN=... SHA=<commit> node .github/pages/montar.mjs <pasta do site>
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tabelasCarga } from './carga.mjs';

const REPOSITORIO = 'MarcosJRuiz/out';
const BASE = `https://github.com/${REPOSITORIO}`;
const PAGINAS = '.github/pages';
const SITE = 'https://marcosjruiz.github.io/out/';
const site = process.argv[2];
const VERSAO = (process.env.SHA ?? '').slice(0, 7) || 'local';

// Endereços internos levam a versão do commit: o GitHub Pages manda o navegador guardar os arquivos por 10 min,
// e as páginas abertas na área de conteúdo continuariam vindo do cache depois de uma nova publicação.
const versionar = (html) =>
  html.replace(
    /\b(data-src|href|src)="(?![a-z]+:|#|\.\/#)([^"?#]+\.(?:html|css|js|json))"/g,
    `$1="$2?v=${VERSAO}"`,
  );

// Mesmo formato de âncora do GitHub: minúsculas, sem pontuação, espaços viram hífen.
const ancora = (titulo) =>
  titulo
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

// Arquivo do repositório que está no site: item do menu ("#carga") ou cópia publicada ("load/..."); null se não estiver.
function noSite(arquivo) {
  const alvo = arquivo.replace(/\/$/, '');
  const pasta = arquivo.endsWith('/');
  const bug = alvo.match(/^docs\/bugs\/(BUG-\d+)/);
  if (bug) return `#${bug[1].toLowerCase()}`;
  if (alvo === 'README.md') return '#readme';
  if (alvo === 'load/ANALISE.md') return '#analise';
  if (alvo === 'evidencias' || alvo === 'evidencias/allure-report.html') return '#allure';
  if (alvo.startsWith('evidencias/pipeline')) return '#pipeline';
  if (alvo === 'evidencias/load/estresse') return '#estresse';
  if (alvo === 'evidencias/load' || alvo === 'evidencias/load/oficial') return '#carga';
  if (alvo.startsWith('evidencias/load/') && !pasta) return alvo.slice('evidencias/'.length);
  return null;
}

async function converter(entrada, saida, titulo, ajustar = (texto) => texto) {
  mkdirSync(path.dirname(saida), { recursive: true });
  const raiz = path.relative(path.dirname(saida), site) || '.';
  const resposta = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    body: JSON.stringify({ text: ajustar(readFileSync(entrada, 'utf8')), mode: 'gfm', context: REPOSITORIO }),
  });
  if (!resposta.ok) throw new Error(`API de Markdown respondeu ${resposta.status} para ${entrada}`);
  const corpo = (await resposta.text())
    .replace(
      /<h([1-6]) dir="auto">(.*?)<\/h\1>/g,
      (_, n, t) => `<h${n} id="${ancora(t)}" dir="auto">${t}</h${n}>`,
    )
    .replace(/<a href="([^"]+)"/g, (_, href) => {
      if (href.startsWith('#')) return `<a href="${href}"`;
      const externo = /^[a-z]+:/i.test(href);
      const arquivo = externo ? null : path.posix.join(path.posix.dirname(entrada), href);
      const local = href.startsWith(SITE) ? href.slice(SITE.length) || '#allure' : arquivo && noSite(arquivo);
      // Item do menu: troca só o hash da página principal, que abre o item sem recarregar o site.
      if (local?.startsWith('#')) return `<a href="${raiz}/${local}" target="_top"`;
      if (local) return `<a href="${raiz}/${local}" target="_blank" rel="noopener"`;
      const url = externo ? href : `${BASE}/${href.endsWith('/') ? 'tree' : 'blob'}/main/${arquivo}`;
      return `<a href="${url}" target="_blank" rel="noopener"`;
    });
  writeFileSync(
    saida,
    versionar(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titulo}</title>
    <link rel="stylesheet" href="${raiz}/tema.css" />
    <link rel="stylesheet" href="${raiz}/markdown.css" />
    <script src="${raiz}/tema.js"></script>
  </head>
  <body>
    <article class="markdown-body">
${corpo}
    </article>
  </body>
</html>
`),
  );
}

// Na Análise publicada, as tabelas de resultado (entre <!-- tabelas:cenário --> e <!-- /tabelas:cenário -->) vêm da
// execução de carga publicada no site; o texto continua o da execução de referência, e um aviso mostra as duas.
function atualizarAnalise(texto) {
  const execucoes = `${BASE}/actions/runs`;
  const { execucao, commit } = existsSync(path.join(site, 'load', 'execucao.json'))
    ? JSON.parse(readFileSync(path.join(site, 'load', 'execucao.json'), 'utf8'))
    : {};
  return texto
    .replace(/<!-- tabelas:(\w+) -->[\s\S]*?<!-- \/tabelas:\1 -->/g, (bloco, cenario) =>
      existsSync(path.join(site, 'load', cenario, 'resumo-k6.json'))
        ? tabelasCarga(path.join(site, 'load', cenario), cenario)
        : bloco,
    )
    .replace(/<!-- referencia:(\d+) -->/, (_, referencia) => {
      const tabelas = execucao
        ? `última execução de carga aprovada na \`main\` — [#${execucao}](${execucoes}/${execucao}), commit \`${commit.slice(0, 7)}\``
        : 'resultado versionado em `evidencias/load`';
      const texto =
        String(execucao) === referencia
          ? 'escritos a partir da mesma execução'
          : `escritos a partir da execução de referência [#${referencia}](${execucoes}/${referencia}); se os números mudarem muito, o texto precisa ser revisto`;
      return `> **Tabelas de resultado:** ${tabelas}.  \n> **Leitura, comparação, gargalos e recomendações:** ${texto}.`;
    });
}

await converter('README.md', path.join(site, 'readme.html'), 'README');
await converter(
  'load/ANALISE.md',
  path.join(site, 'analise.html'),
  'Análise do teste de carga',
  atualizarAnalise,
);

// Cada bug report vira um item do menu: o código (BUG-001) como título e a descrição como subtítulo.
const itens = [];
for (const arquivo of readdirSync('docs/bugs')
  .filter((a) => a.endsWith('.md'))
  .sort()) {
  const nome = path.basename(arquivo, '.md');
  const [, codigo, descricao] = readFileSync(path.join('docs/bugs', arquivo), 'utf8').match(
    /^# (\S+) — (.+)$/m,
  );
  await converter(path.posix.join('docs/bugs', arquivo), path.join(site, 'bugs', `${nome}.html`), codigo);
  itens.push(`<a href="#${codigo.toLowerCase()}" data-src="bugs/${nome}.html">
        <b>${codigo}</b>
        <small>${descricao}</small>
      </a>`);
}

writeFileSync(
  path.join(site, 'index.html'),
  versionar(
    readFileSync(path.join(PAGINAS, 'index.html'), 'utf8')
      .replace('<!-- BUGS -->', itens.join('\n      '))
      .replaceAll('__SHA__', (process.env.SHA ?? '').slice(0, 7))
      .replaceAll('__VERSAO__', VERSAO),
  ),
);
// Lido sem cache pela página principal para saber se há uma publicação mais nova.
writeFileSync(path.join(site, 'versao.json'), JSON.stringify({ versao: VERSAO }));
writeFileSync(
  path.join(site, 'pipeline.html'),
  versionar(readFileSync(path.join(PAGINAS, 'pipeline.html'), 'utf8')),
);
for (const arquivo of ['markdown.css', 'tema.css', 'tema.js', 'k6.css'])
  copyFileSync(path.join(PAGINAS, arquivo), path.join(site, arquivo));

// Dashboards do k6 (copiados de evidencias/load antes deste script): recebem as cores e o tema do site.
for (const cenario of ['oficial', 'estresse']) {
  const dashboard = path.join(site, 'load', cenario, 'k6-dashboard.html');
  writeFileSync(
    dashboard,
    readFileSync(dashboard, 'utf8').replace(
      '</head>',
      versionar(
        '<link rel="stylesheet" href="../../tema.css" /><link rel="stylesheet" href="../../k6.css" /><script src="../../tema.js"></script></head>',
      ),
    ),
  );
}
