# Análise do teste de carga — ServeRest

## Objetivo e cenário

Avaliar o comportamento da API ServeRest com **500 usuários simultâneos por 5 minutos** (item 4 da avaliação) e identificar potenciais gargalos.

| Item                                | Configuração                                                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ferramenta                          | k6 2.3.0                                                                                                                                                                                            |
| Alvo                                | ServeRest 3.2.2 (Docker), mesma máquina do gerador de carga                                                                                                                                         |
| Perfil                              | Rampa de 30 s até 500 usuários → **500 usuários por 5 min** → rampa de descida de 30 s                                                                                                              |
| Fluxo de cada usuário               | `POST /login` → `GET /produtos` → `GET /produtos/{id}`, com **1 s de pausa** entre as ações (tempo de leitura de um usuário real)                                                                   |
| Critérios de aceitação (thresholds) | erros HTTP < 1%; checks > 99%; p95 < 500 ms (total e por etapa)                                                                                                                                     |
| Execução de referência              | GitHub Actions, runner `ubuntu-24.04` (**4 vCPUs, 15 GB**) — [execução #41911888857](https://github.com/MarcosJRuiz/out/actions/runs/41911888857), commit `e198c05` (o mesmo do site de evidências) |

## Resultado — cenário oficial (500 usuários, 5 min)

**Aprovado em todos os critérios, com ampla folga.**

| Métrica                                     | Resultado                  | Critério |
| ------------------------------------------- | -------------------------- | -------- |
| Requisições                                 | 165.324                    | —        |
| Vazão                                       | **457 req/s**              | —        |
| Fluxos completos (iterações)                | 55.107                     | —        |
| Taxa de erro HTTP                           | **0,00%**                  | < 1% ✅  |
| Checks (status e conteúdo de cada resposta) | **100%** (330.643)         | > 99% ✅ |
| Duração média de um fluxo                   | 3,01 s (3 s são as pausas) | —        |

| Tempo de resposta    | Média  | Mediana | p90    | p95        | p99     | Máx.    |
| -------------------- | ------ | ------- | ------ | ---------- | ------- | ------- |
| Todas as requisições | 1,9 ms | 1,4 ms  | 3,7 ms | **4,9 ms** | 9,2 ms  | 51,0 ms |
| Login                | 2,5 ms | 1,8 ms  | 4,1 ms | 5,2 ms     | 8,6 ms  | 34,9 ms |
| Listar produtos      | 1,5 ms | 0,8 ms  | 2,7 ms | 4,0 ms     | 8,8 ms  | 37,9 ms |
| Consultar produto    | 1,9 ms | 1,2 ms  | 3,8 ms | 5,2 ms     | 10,2 ms | 51,0 ms |

Leitura:

- O p95 de 4,9 ms está **100 vezes abaixo** do limite de 500 ms, e nenhuma requisição passou de 60 ms.
- O tempo de conexão (`http_req_blocked`/`connecting`) é praticamente zero: as conexões são reaproveitadas (keep-alive) e não há fila de conexão.
- A vazão de 457 req/s corresponde ao esperado para o perfil: 500 usuários × 3 requisições a cada ~3 s ≈ 500 req/s no patamar, menos as rampas.
- Na execução anterior, em um runner de 2 vCPUs ([#41706066998](https://github.com/MarcosJRuiz/out/actions/runs/41706066998)), o mesmo perfil teve p95 de 13 ms e vazão de 455 req/s. Com 4 vCPUs a vazão é a mesma (é definida pelo perfil), mas o p95 caiu para menos da metade: parte da latência vinha da disputa de CPU entre o k6 e o ServeRest na mesma máquina (gargalo 5).

**Com esse perfil de uso, o ServeRest suporta 500 usuários simultâneos sem degradação.** Mas o teste não revela o limite do sistema — para isso foi feito o teste de estresse abaixo.

## Teste de estresse complementar — onde está o limite?

Mesmo script e mesmos 500 usuários, **sem a pausa entre as ações** (`PAUSA=0`): cada usuário dispara a próxima requisição assim que recebe a anterior. Patamar de 2 min.

Ambiente: Docker local com **2 vCPUs e 2 GB**. Reproduzível na CI pelo workflow `Carga` com `pausa = 0`.

| Métrica                                       | Cenário oficial (CI, 4 vCPUs, com pausa) | Estresse (local, 2 vCPUs, sem pausa)  |
| --------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Vazão                                         | 457 req/s                                | **452 req/s** — não aumentou          |
| Taxa de erro                                  | 0,00%                                    | **0,40%** (timeouts de 60 s no login) |
| p95 (todas)                                   | 4,9 ms                                   | **940 ms** ❌                         |
| p95 login / listar / consultar                | 5,2 / 4,0 / 5,2 ms                       | 806 / 689 / 972 ms                    |
| p99 login                                     | 8,6 ms                                   | **60 s** (limite de timeout do k6)    |
| Tempo de espera pela resposta (`waiting`) p95 | 4,9 ms                                   | 940 ms                                |
| Tempo de conexão (`blocked`) p95              | ~0 ms                                    | ~0 ms                                 |
| CPU do ServeRest (`docker stats`)             | —                                        | **110%** (≈ 1 núcleo inteiro)         |
| CPU do gerador k6                             | —                                        | 4%                                    |

## Gargalos identificados

1. **CPU de um único processo Node.js (gargalo principal).** O ServeRest roda em um único processo, que usa um núcleo. Sob estresse ele chega a ~110% de CPU e a vazão **para de crescer em ~450 req/s**: mais usuários sem pausa não geram mais requisições atendidas, só mais fila. O aumento está todo no tempo de espera pela resposta (`waiting`), enquanto o tempo de conexão continua zero — a fila é **dentro do servidor**, não na rede.
2. **Login é a operação mais sensível.** É a única etapa com timeouts (p99 de 60 s, 0,40% de erros): sob saturação, parte das requisições de login fica presa na fila do processo até estourar o tempo limite. Hipótese: gerar e assinar o token JWT custa mais CPU que as consultas (o teste mede o efeito, não a causa interna).
3. **Consulta por id mais lenta que a listagem sob saturação** (p95 972 ms × 689 ms). Hipótese: com poucos produtos cadastrados, a listagem completa é barata, e a busca por id no banco em arquivo (NeDB) não tem índice que compense — ambas disputam a mesma CPU.
4. **Margem de capacidade estreita no cenário oficial.** O perfil oficial pede ~500 req/s e o teto medido no estresse foi ~450 req/s. Como o ServeRest usa um único núcleo, esse teto depende da velocidade de um núcleo, não da quantidade de núcleos da máquina (hipótese: o estresse não foi repetido com 4 vCPUs). Na CI o ServeRest atendeu 457 req/s com 4,9 ms de p95, ainda abaixo da saturação — mas a folga é pequena: um aumento de usuários, de ações por usuário ou um núcleo mais lento levaria o sistema ao comportamento do teste de estresse.
5. **Gerador e sistema testado na mesma máquina.** Na CI o k6 e o ServeRest dividem o mesmo runner. Com o mesmo perfil, o p95 foi de 13 ms em 2 vCPUs e de 4,9 ms em 4 vCPUs: a disputa de CPU entre os dois aparece na latência medida. No estresse local o k6 usou só 4% de CPU, então não limitou a vazão, mas para medições precisas convém separá-los.

## Recomendações

| Gargalo                   | Recomendação                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Processo único de Node.js | Escalar horizontalmente: múltiplos processos (`cluster`/PM2) ou réplicas atrás de um balanceador, aproveitando todos os núcleos |
| Login sob saturação       | Limitar a taxa de login por cliente (rate limiting) e reaproveitar tokens válidos em vez de autenticar a cada ação              |
| Banco em arquivo (NeDB)   | Usar um banco de dados dedicado, com índices, para consultas por id                                                             |
| Listagem de produtos      | Paginação e cache de leitura (`GET /produtos` muda pouco)                                                                       |
| Monitoramento             | Acompanhar CPU por processo e p95/p99 do login como indicadores de saturação                                                    |

## Como reproduzir

```bash
# Local (Docker): sobe o ServeRest e roda o k6 — relatórios em load/reports/
npm run test:carga
VUS=500 PATAMAR=2m PAUSA=0 npm run test:carga     # estresse

# CI: aba Actions → workflow "Carga" → Run workflow (roda o oficial e o estresse juntos; usuários e duração configuráveis)
```

## Evidências

- Cenário oficial (CI): [dashboard online](https://marcosjruiz.github.io/out/#carga) (gráficos ao longo do tempo) e [`carga-resumo-k6.json`](../evidencias/load/oficial/resumo-k6.json)
- Estresse (local): [dashboard online](https://marcosjruiz.github.io/out/#estresse) (gráficos ao longo do tempo) e [`estresse-resumo-k6.json`](../evidencias/load/estresse/resumo-k6.json)
