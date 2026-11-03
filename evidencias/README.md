# Evidências dos testes

Snapshot versionado dos relatórios gerados pela pipeline. Os artifacts do GitHub Actions expiram; esta pasta mantém as evidências de forma permanente.

| Item | Valor |
|---|---|
| Gerado em | 2026-11-03 19:56 UTC |
| Commit testado | `d6e8b5d` (main) |
| Execução da pipeline | [#41702963736](https://github.com/MarcosJRuiz/out/actions/runs/41702963736) |

## Resumo dos resultados

| Módulo | Testes | Passou | Falhou | Falha esperada (`@known-defect`) | Passou após retry |
|---|---|---|---|---|---|
| API | 60 | 60 | 0 | 0 | 0 |
| E2E | 13 | 11 | 0 | 2 | 0 |
| Mobile | 7 | 7 | 0 | 0 | 0 |
| **Total** | **80** | **78** | **0** | **2** | **0** |

✅ Nenhuma falha inesperada.
ℹ️ 2 falha(s) esperada(s): defeitos conhecidos do site, documentados em `docs/bugs/`.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| [`allure-report.html`](allure-report.html) | **Relatório consolidado** (API + E2E + mobile) em arquivo único: baixe e abra no navegador. Agrupado por módulo, com passos, screenshots, requisições HTTP de cada teste de API e os vídeos dos defeitos conhecidos (aba *Categories* → "Defeitos conhecidos do site") |
| [`pipeline/execucoes.md`](pipeline/execucoes.md) | Jobs da execução de referência e histórico recente da pipeline na `main` |
| [`../docs/bugs/`](../docs/bugs/) | Bug reports dos defeitos encontrados (BUG-001 e BUG-002) |
| [`load/`](load/) | Teste de carga (k6): dashboard e resumo do cenário oficial (500 usuários, 5 min, na CI) e do teste de estresse — análise em [`load/ANALISE.md`](../load/ANALISE.md) |

Os relatórios nativos de cada módulo (Playwright HTML, Cucumber HTML com vídeos, traces do Playwright e log do Appium) ficam nos artifacts da execução: `api-report`, `e2e-report`, `e2e-known-defects-report` e `mobile-report`.

Para atualizar: `npm run evidencias` (usa a última execução bem-sucedida na `main`).
