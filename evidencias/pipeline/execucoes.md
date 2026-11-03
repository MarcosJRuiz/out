# Execuções da pipeline

## Execução de referência

[https://github.com/MarcosJRuiz/out/actions/runs/41702963736](https://github.com/MarcosJRuiz/out/actions/runs/41702963736) — commit `d6e8b5d` (main), 10m33s no total.

| Job | Resultado | Duração | Log |
|---|---|---|---|
| `lint` | ✅ success | 0m40s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126150750015) |
| `e2e-known-defects` | ✅ success | 3m18s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126151129192) |
| `api-tests` | ✅ success | 0m46s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126151129288) |
| `e2e-tests` | ✅ success | 1m29s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126151129293) |
| `mobile-tests` | ✅ success | 9m02s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126151129335) |
| `publish-reports` | ✅ success | 0m43s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41702963736/job/126156015414) |

O job `e2e-known-defects` aparece como sucesso porque é não bloqueante: os 2 cenários falham como esperado (defeitos do site, ver `docs/bugs/`) e a falha fica registrada no resumo.

## Histórico recente na main

| Data (UTC) | Resultado | Commit | Execução |
|---|---|---|---|
| 2026-11-03 19:24 | ✅ success | Merge pull request #10 from MarcosJRuiz/feat/fase-5-fechamento | [#41702963736](https://github.com/MarcosJRuiz/out/actions/runs/41702963736) |
| 2026-11-03 18:41 | ✅ success | Merge pull request #9 from MarcosJRuiz/feat/fase-4-ci | [#41696189225](https://github.com/MarcosJRuiz/out/actions/runs/41696189225) |
| 2026-11-03 18:12 | ✅ success | Merge pull request #8 from MarcosJRuiz/feat/fase-3-mobile | [#41691495951](https://github.com/MarcosJRuiz/out/actions/runs/41691495951) |
| 2026-11-03 16:22 | ✅ success | Merge pull request #7 from MarcosJRuiz/feat/fase-2-e2e | [#41673489028](https://github.com/MarcosJRuiz/out/actions/runs/41673489028) |
| 2026-11-03 15:35 | ✅ success | Merge pull request #6 from MarcosJRuiz/feat/fase-1-ajustes | [#41665455342](https://github.com/MarcosJRuiz/out/actions/runs/41665455342) |
| 2026-11-03 14:56 | ✅ success | Merge pull request #5 from MarcosJRuiz/ci/cache-emulador | [#41658654765](https://github.com/MarcosJRuiz/out/actions/runs/41658654765) |
| 2026-11-03 14:54 | ❌ cancelled | Merge pull request #4 from MarcosJRuiz/feat/fase-1-api | [#41658409396](https://github.com/MarcosJRuiz/out/actions/runs/41658409396) |
| 2026-11-03 13:49 | ✅ success | Merge pull request #3 from MarcosJRuiz/feat/fase-0-fundacao | [#41647797725](https://github.com/MarcosJRuiz/out/actions/runs/41647797725) |
| 2026-11-03 13:27 | ✅ success | Merge: spike do job mobile na CI e plano atualizado | [#41644565739](https://github.com/MarcosJRuiz/out/actions/runs/41644565739) |
