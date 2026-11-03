# Evidências dos testes

Snapshot versionado dos relatórios gerados pela pipeline do commit final. Os artifacts do GitHub Actions expiram; esta pasta mantém as evidências de forma permanente.

> Pasta preenchida nas Fases 5 (API, E2E, mobile e pipeline) e 6 (carga). Conteúdo gerado por `npm run evidencias:snapshot`.

| Item | Valor |
|---|---|
| Data | _a preencher_ |
| Commit | _a preencher_ |
| Execução da pipeline | _a preencher_ |

## Conteúdo

| Caminho | Descrição |
|---|---|
| `allure-report.html` | Relatório consolidado (API + E2E + mobile) |
| `api/` | Relatório nativo do Playwright |
| `e2e/` | Relatório Cucumber e screenshots dos cenários (inclui negativos e `@known-defect`) |
| `mobile/` | Relatório nativo do Playwright e screenshots |
| `pipeline/` | Execuções do GitHub Actions |
| `load/` | Dashboard e resumo do K6 |

## Resumo dos resultados

| Módulo | Total | Passou | Falhou | Falha esperada (`@known-defect`) |
|---|---|---|---|---|
| API | | | | |
| E2E | | | | |
| Mobile | | | | |
