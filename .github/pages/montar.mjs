// Monta a página inicial do GitHub Pages em <pasta do site>: menu lateral com os relatórios, o README e os
// bug reports. Os Markdown são convertidos pela API de Markdown do GitHub (mesma renderização do repositório)
// e ajustados para fora dele: títulos ganham id para os links internos, links relativos apontam para o
// repositório e os externos abrem em nova aba.
//
// Uso: GITHUB_TOKEN=... SHA=<commit> node .github/pages/montar.mjs <pasta do site>
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPOSITORIO = 'MarcosJRuiz/out';
const BASE = `https://github.com/${REPOSITORIO}`;
const PAGINAS = '.github/pages';
const site = process.argv[2];

// Mesmo formato de âncora do GitHub: minúsculas, sem pontuação, espaços viram hífen.
const ancora = (titulo) =>
  titulo
    .replace(/<[^>]+>/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

async function converter(entrada, saida, titulo) {
  const resposta = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
    body: JSON.stringify({ text: readFileSync(entrada, 'utf8'), mode: 'gfm', context: REPOSITORIO }),
  });
  if (!resposta.ok) throw new Error(`API de Markdown respondeu ${resposta.status} para ${entrada}`);
  const corpo = (await resposta.text())
    .replace(
      /<h([1-6]) dir="auto">(.*?)<\/h\1>/g,
      (_, n, t) => `<h${n} id="${ancora(t)}" dir="auto">${t}</h${n}>`,
    )
    .replace(/<a href="([^"]+)"/g, (_, href) => {
      if (href.startsWith('#')) return `<a href="${href}"`;
      let url = href;
      if (!/^[a-z]+:/i.test(href)) {
        const alvo = path.posix.join(path.posix.dirname(entrada), href);
        url = `${BASE}/${href.endsWith('/') ? 'tree' : 'blob'}/main/${alvo}`;
      }
      return `<a href="${url}" target="_blank" rel="noopener"`;
    });
  mkdirSync(path.dirname(saida), { recursive: true });
  const raiz = path.relative(path.dirname(saida), site) || '.';
  writeFileSync(
    saida,
    `<!doctype html>
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
`,
  );
}

await converter('README.md', path.join(site, 'readme.html'), 'README');

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
  readFileSync(path.join(PAGINAS, 'index.html'), 'utf8')
    .replace('<!-- BUGS -->', itens.join('\n      '))
    .replaceAll('__SHA__', (process.env.SHA ?? '').slice(0, 7)),
);
for (const arquivo of ['pipeline.html', 'markdown.css', 'tema.css', 'tema.js', 'k6.css'])
  copyFileSync(path.join(PAGINAS, arquivo), path.join(site, arquivo));

// Dashboards do k6 (copiados de evidencias/load antes deste script): recebem as cores e o tema do site.
for (const cenario of readdirSync(path.join(site, 'load'))) {
  const dashboard = path.join(site, 'load', cenario, 'k6-dashboard.html');
  writeFileSync(
    dashboard,
    readFileSync(dashboard, 'utf8').replace(
      '</head>',
      '<link rel="stylesheet" href="../../tema.css" /><link rel="stylesheet" href="../../k6.css" /><script src="../../tema.js"></script></head>',
    ),
  );
}
