# Execuções da pipeline

## Execução de referência

[https://github.com/MarcosJRuiz/out/actions/runs/41881419708](https://github.com/MarcosJRuiz/out/actions/runs/41881419708) — commit `ee64a43` (main), 5m53s no total.

| Job | Resultado | Duração | Log |
|---|---|---|---|
| `lint` | ✅ success | 0m27s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126754562869) |
| `api-tests` | ✅ success | 0m34s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126754848104) |
| `e2e-tests` | ✅ success | 1m29s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126754848115) |
| `e2e-known-defects` | ✅ success | 0m49s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126754848264) |
| `mobile-tests` | ✅ success | 4m48s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126754848298) |
| `publish-reports` | ✅ success | 0m29s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41881419708/job/126757743086) |

O job `e2e-known-defects` aparece como sucesso porque é não bloqueante: os 2 cenários falham como esperado (defeitos do site, ver `docs/bugs/`) e a falha fica registrada no resumo.

## Histórico recente na main

| Data (UTC) | Resultado | Commit | Execução |
|---|---|---|---|
| 2026-11-04 17:53 | ✅ success | Merge pull request #18 from MarcosJRuiz/ci/pages-apos-ci | [#41881419708](https://github.com/MarcosJRuiz/out/actions/runs/41881419708) |
| 2026-11-04 15:40 | ✅ success | Merge pull request #17 from MarcosJRuiz/feat/carga-no-allure | [#41860123408](https://github.com/MarcosJRuiz/out/actions/runs/41860123408) |
| 2026-11-04 14:58 | ✅ success | Merge pull request #16 from MarcosJRuiz/ci/pages | [#41852915079](https://github.com/MarcosJRuiz/out/actions/runs/41852915079) |
| 2026-11-04 14:38 | ✅ success | Merge pull request #15 from MarcosJRuiz/docs/evidencias-actions | [#41849639364](https://github.com/MarcosJRuiz/out/actions/runs/41849639364) |
| 2026-11-04 14:05 | ✅ success | Merge pull request #14 from MarcosJRuiz/ci/atualiza-actions | [#41844172972](https://github.com/MarcosJRuiz/out/actions/runs/41844172972) |
| 2026-11-04 13:01 | ✅ success | Merge pull request #13 from MarcosJRuiz/docs/evidencias-finais | [#41834282754](https://github.com/MarcosJRuiz/out/actions/runs/41834282754) |
| 2026-11-04 12:31 | ✅ success | Merge pull request #12 from MarcosJRuiz/docs/ajustes-entrega | [#41830017860](https://github.com/MarcosJRuiz/out/actions/runs/41830017860) |
| 2026-11-04 02:34 | ✅ success | Merge pull request #11 from MarcosJRuiz/feat/fase-6-carga | [#41761641859](https://github.com/MarcosJRuiz/out/actions/runs/41761641859) |
| 2026-11-03 19:24 | ✅ success | Merge pull request #10 from MarcosJRuiz/feat/fase-5-fechamento | [#41702963736](https://github.com/MarcosJRuiz/out/actions/runs/41702963736) |
| 2026-11-03 18:41 | ✅ success | Merge pull request #9 from MarcosJRuiz/feat/fase-4-ci | [#41696189225](https://github.com/MarcosJRuiz/out/actions/runs/41696189225) |
| 2026-11-03 18:12 | ✅ success | Merge pull request #8 from MarcosJRuiz/feat/fase-3-mobile | [#41691495951](https://github.com/MarcosJRuiz/out/actions/runs/41691495951) |
| 2026-11-03 16:22 | ✅ success | Merge pull request #7 from MarcosJRuiz/feat/fase-2-e2e | [#41673489028](https://github.com/MarcosJRuiz/out/actions/runs/41673489028) |
| 2026-11-03 15:35 | ✅ success | Merge pull request #6 from MarcosJRuiz/feat/fase-1-ajustes | [#41665455342](https://github.com/MarcosJRuiz/out/actions/runs/41665455342) |
| 2026-11-03 14:56 | ✅ success | Merge pull request #5 from MarcosJRuiz/ci/cache-emulador | [#41658654765](https://github.com/MarcosJRuiz/out/actions/runs/41658654765) |
| 2026-11-03 14:54 | ❌ cancelled | Merge pull request #4 from MarcosJRuiz/feat/fase-1-api | [#41658409396](https://github.com/MarcosJRuiz/out/actions/runs/41658409396) |
