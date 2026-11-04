# Execuções da pipeline

## Execução de referência

[https://github.com/MarcosJRuiz/out/actions/runs/41844172972](https://github.com/MarcosJRuiz/out/actions/runs/41844172972) — commit `6acb6e8` (main), 17m38s no total.

| Job | Resultado | Duração | Log |
|---|---|---|---|
| `lint` | ✅ success | 0m27s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126629554284) |
| `e2e-known-defects` | ✅ success | 1m00s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126629855242) |
| `e2e-tests` | ✅ success | 1m06s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126629855379) |
| `mobile-tests` | ✅ success | 5m17s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126629855406) |
| `api-tests` | ✅ success | 0m32s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126629855438) |
| `publish-reports` | ✅ success | 0m32s | [log](https://github.com/MarcosJRuiz/out/actions/runs/41844172972/job/126632911996) |

O job `e2e-known-defects` aparece como sucesso porque é não bloqueante: os 2 cenários falham como esperado (defeitos do site, ver `docs/bugs/`) e a falha fica registrada no resumo.

## Histórico recente na main

| Data (UTC) | Resultado | Commit | Execução |
|---|---|---|---|
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
| 2026-11-03 13:49 | ✅ success | Merge pull request #3 from MarcosJRuiz/feat/fase-0-fundacao | [#41647797725](https://github.com/MarcosJRuiz/out/actions/runs/41647797725) |
| 2026-11-03 13:27 | ✅ success | Merge: spike do job mobile na CI e plano atualizado | [#41644565739](https://github.com/MarcosJRuiz/out/actions/runs/41644565739) |
