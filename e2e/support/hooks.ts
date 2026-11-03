import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber';
import { chromium, firefox, webkit, type Browser } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { BASE_URL, BLOQUEIO_DE_TERCEIROS, HEADLESS, NAVEGADOR } from './config';
import { excluirContaViaApi } from './conta';
import type { E2EWorld } from './world';

const PASTA_EVIDENCIAS = path.resolve('reports/evidencias');
const BUGS: Record<string, string> = {
  '@BUG-001': 'docs/bugs/BUG-001-cartao-invalido-aceito.md',
  '@BUG-002': 'docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md',
};

let browser: Browser;

BeforeAll(async function () {
  browser = await { chromium, firefox, webkit }[NAVEGADOR].launch({ headless: HEADLESS });
});

AfterAll(async function () {
  await browser?.close();
});

Before(async function (this: E2EWorld, { pickle }) {
  const pastaVideo = path.join(PASTA_EVIDENCIAS, 'videos', pickle.id);
  this.context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1366, height: 900 },
    recordVideo: { dir: pastaVideo, size: { width: 1366, height: 900 } },
  });
  await this.context.route(BLOQUEIO_DE_TERCEIROS, (rota) => rota.abort());
  await this.context.tracing.start({ screenshots: true, snapshots: true });
  this.page = await this.context.newPage();
});

After(async function (this: E2EWorld, { pickle, result }) {
  const falhou = result?.status === Status.FAILED;

  // Evidência de todo cenário (inclusive negativos aprovados): screenshot do estado final.
  if (this.page) {
    this.attach(await this.page.screenshot({ fullPage: true }), 'image/png');
  }

  for (const tag of pickle.tags.map((t) => t.name)) {
    if (BUGS[tag]) this.attach(`Defeito conhecido ${tag.slice(1)}: ${BUGS[tag]}`, 'text/plain');
  }

  // Trace e vídeo só nas falhas (são pesados); em sucesso são descartados.
  const pastaTrace = path.join(PASTA_EVIDENCIAS, 'traces');
  mkdirSync(pastaTrace, { recursive: true });
  const arquivoTrace = path.join(pastaTrace, `${pickle.id}.zip`);
  await this.context?.tracing.stop(falhou ? { path: arquivoTrace } : undefined);

  const video = this.page?.video();
  await this.context?.close();
  if (video) {
    if (falhou) {
      this.attach(readFileSync(await video.path()), 'video/webm');
      this.attach(`Trace: ${arquivoTrace} (abrir com "npx playwright show-trace")`, 'text/plain');
    } else {
      rmSync(path.dirname(await video.path()), { recursive: true, force: true });
    }
  }

  if (this.conta) await excluirContaViaApi(this.conta).catch(() => undefined);
});
