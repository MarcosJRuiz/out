# Análise do teste de carga — ServeRest

<!-- referencia:41946011095 -->

## Objetivo e cenário

Avaliar o comportamento da API ServeRest com **500 usuários simultâneos por 5 minutos** (item 4 da avaliação) e identificar potenciais gargalos.

| Item                                | Configuração                                                                                                                                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ferramenta                          | k6 2.3.0                                                                                                                                                                                                                                                              |
| Alvo                                | ServeRest 3.2.2 (Docker), mesma máquina do gerador de carga                                                                                                                                                                                                           |
| Perfil                              | Rampa de 30 s até 500 usuários → **500 usuários por 5 min** → rampa de descida de 30 s                                                                                                                                                                                |
| Fluxo de cada usuário               | `POST /login` → `GET /produtos` → `GET /produtos/{id}`, com **1 s de pausa** entre as ações (tempo de leitura de um usuário real)                                                                                                                                     |
| Critérios de aceitação (thresholds) | erros HTTP < 1%; checks > 99%; p95 < 500 ms (total e por etapa)                                                                                                                                                                                                       |
| Execução de referência              | GitHub Actions, runner `ubuntu-24.04` (**4 vCPUs, 15 GB**) — [execução #41946011095](https://github.com/MarcosJRuiz/out/actions/runs/41946011095), commit `5f01e9d`: cenário oficial e estresse na mesma execução, em jobs paralelos, cada um com o próprio ServeRest |
| CPU durante o teste                 | ServeRest via `docker stats` e k6 via `top`, a cada ~2 s, em % de um núcleo (100% = um núcleo inteiro)                                                                                                                                                                |

## Resultado — cenário oficial (500 usuários, 5 min)

<!-- tabelas:oficial -->

**Aprovado em todos os critérios.**

| Métrica                                     | Resultado                         | Critério |
| ------------------------------------------- | --------------------------------- | -------- |
| Requisições                                 | 165.315                           | —        |
| Vazão                                       | **457 req/s**                     | —        |
| Fluxos completos (iterações)                | 55.104                            | —        |
| Taxa de erro HTTP                           | **0,00%**                         | < 1% ✅  |
| Checks (status e conteúdo de cada resposta) | **100%** (330.625)                | > 99% ✅ |
| Duração média de um fluxo                   | 3,01 s (3 s são as pausas)        | —        |
| CPU do ServeRest                            | média 50%, pico 87% de um núcleo  | —        |
| CPU do gerador k6                           | média 25%, pico 282% de um núcleo | —        |

| Tempo de resposta    | Média  | Mediana | p90    | p95        | p99    | Máx.    |
| -------------------- | ------ | ------- | ------ | ---------- | ------ | ------- |
| Todas as requisições | 2,0 ms | 1,6 ms  | 3,8 ms | **5,0 ms** | 8,9 ms | 45,9 ms |
| Login                | 2,6 ms | 1,9 ms  | 4,4 ms | 5,4 ms     | 8,5 ms | 37,1 ms |
| Listar produtos      | 1,5 ms | 0,8 ms  | 2,7 ms | 4,0 ms     | 8,3 ms | 45,9 ms |
| Consultar produto    | 1,9 ms | 1,2 ms  | 3,8 ms | 5,2 ms     | 9,9 ms | 41,7 ms |

<!-- /tabelas:oficial -->

Leitura:

- O p95 de 5,0 ms está **100 vezes abaixo** do limite de 500 ms, e nenhuma requisição passou de 50 ms.
- O ServeRest usou em média metade de um núcleo: atende o perfil oficial sem chegar perto da saturação.
- O tempo de conexão (`http_req_blocked`/`connecting`) é praticamente zero: as conexões são reaproveitadas (keep-alive) e não há fila de conexão.
- A vazão de 457 req/s corresponde ao esperado para o perfil: 500 usuários × 3 requisições a cada ~3 s ≈ 500 req/s no patamar, menos as rampas.
- Em um runner anterior, de 2 vCPUs ([#41706066998](https://github.com/MarcosJRuiz/out/actions/runs/41706066998)), o mesmo perfil teve p95 de 13 ms com a mesma vazão (definida pelo perfil): parte da latência vinha da disputa de CPU entre o k6 e o ServeRest na mesma máquina (gargalo 5).

**Com esse perfil de uso, o ServeRest suporta 500 usuários simultâneos sem degradação.** Mas o teste não revela o limite do sistema — para isso existe o teste de estresse abaixo.

## Teste de estresse complementar — onde está o limite?

Mesmo script e mesmos 500 usuários, **sem a pausa entre as ações** (`PAUSA=0`): cada usuário dispara a próxima requisição assim que recebe a anterior. Patamar de 2 min.

Roda na mesma execução da CI do cenário oficial, em um job paralelo com o próprio ServeRest. A primeira medição do estresse foi feita localmente (Docker, **2 vCPUs e 2 GB**, em 03/11) e aparece na comparação abaixo: é ela que mostra como o limite muda com a máquina.

<!-- tabelas:estresse -->

**Reprovado, como esperado no estresse:** p95 de todas as requisições, p95 de consultar produto.

| Métrica                                     | Resultado                          | Critério |
| ------------------------------------------- | ---------------------------------- | -------- |
| Requisições                                 | 220.944                            | —        |
| Vazão                                       | **1.227 req/s**                    | —        |
| Fluxos completos (iterações)                | 73.647                             | —        |
| Taxa de erro HTTP                           | **0,00%**                          | < 1% ✅  |
| Checks (status e conteúdo de cada resposta) | **100%** (441.883)                 | > 99% ✅ |
| Duração média de um fluxo                   | 1,02 s                             | —        |
| CPU do ServeRest                            | média 118%, pico 136% de um núcleo | —        |
| CPU do gerador k6                           | média 54%, pico 100% de um núcleo  | —        |

| Tempo de resposta       | Média    | Mediana  | p90      | p95          | p99      | Máx.        |
| ----------------------- | -------- | -------- | -------- | ------------ | -------- | ----------- |
| Todas as requisições ❌ | 339,9 ms | 335,0 ms | 534,1 ms | **549,8 ms** | 573,4 ms | 35.823,8 ms |
| Login                   | 342,2 ms | 324,7 ms | 397,3 ms | 408,6 ms     | 434,6 ms | 35.823,8 ms |
| Listar produtos         | 272,6 ms | 314,0 ms | 374,7 ms | 386,2 ms     | 406,7 ms | 634,1 ms    |
| Consultar produto ❌    | 405,0 ms | 471,2 ms | 555,5 ms | 564,7 ms     | 583,2 ms | 603,8 ms    |

<!-- /tabelas:estresse -->

Comparação entre os cenários na execução de referência e o teste local anterior:

| Métrica                                       | Oficial (CI, 4 vCPUs) | **Estresse (CI, 4 vCPUs)** | Estresse local anterior (2 vCPUs)  |
| --------------------------------------------- | --------------------- | -------------------------- | ---------------------------------- |
| Vazão                                         | 457 req/s             | **1.227 req/s**            | 452 req/s                          |
| Taxa de erro                                  | 0,00%                 | **0,00%**                  | 0,40% (timeouts de 60 s no login)  |
| p95 (todas)                                   | 5,0 ms                | **550 ms** ❌              | 940 ms ❌                          |
| p95 login / listar / consultar                | 5,4 / 4,0 / 5,2 ms    | 409 / 386 / **565** ❌ ms  | 806 / 689 / 972 ms                 |
| Pior caso do login (p99 / máx.)               | 8,5 ms / 37 ms        | 435 ms / **35,8 s**        | **60 s** (limite de timeout do k6) |
| Tempo de espera pela resposta (`waiting`) p95 | 4,9 ms                | 550 ms                     | 940 ms                             |
| Tempo de conexão (`blocked`) p95              | ~0 ms                 | ~0 ms                      | ~0 ms                              |
| CPU do ServeRest                              | média 50%, pico 87%   | **média 118%, pico 136%**  | 110%                               |
| CPU do gerador k6                             | média 25%             | média 54%, pico 100%       | 4%                                 |

## Gargalos identificados

1. **CPU de um único processo Node.js (gargalo principal).** O ServeRest roda em um único processo, que usa essencialmente um núcleo (o que passa de 100% são as threads auxiliares do Node, como I/O e coleta de lixo). Sob estresse na CI ele fica em ~118% de CPU e a vazão **para em ~1.230 req/s**, enquanto a máquina tem 4 vCPUs e o k6 usou só meio núcleo: há núcleos sobrando que o ServeRest não aproveita. Mais usuários sem pausa não geram mais requisições atendidas, só mais fila — o aumento está todo no tempo de espera pela resposta (`waiting`), com o tempo de conexão em zero: a fila é **dentro do servidor**, não na rede. O teste local de 2 vCPUs mostrou o mesmo padrão (110% de CPU, vazão parada).
2. **O teto de capacidade depende da máquina.** O mesmo processo único, saturado em ~1 núcleo nos dois ambientes, atendeu ~450 req/s no Docker local de 2 vCPUs e ~1.230 req/s no runner da CI: a diferença vem do desempenho de cada núcleo e do ambiente, não da quantidade de núcleos, já que o ServeRest usa um só. O perfil oficial pede ~500 req/s — na CI a folga é de **~2,7 vezes**; na máquina local, o mesmo perfil já ficaria acima do teto. A capacidade real precisa ser medida no hardware em que o sistema vai rodar. (A primeira versão desta análise, só com o teste local, tratava os ~450 req/s como teto do ServeRest e concluía que a margem era estreita; o estresse na CI corrigiu essa conclusão.)
3. **Consulta por id é a etapa mais lenta sob saturação.** Nos dois ambientes ela tem o maior p95 (565 ms na CI, 972 ms local), à frente da listagem completa (386 ms e 689 ms), e é a única etapa reprovada no estresse da CI. Hipótese: com poucos produtos cadastrados, a listagem é barata, e a busca por id no banco em arquivo (NeDB) não tem índice que compense — as duas disputam a mesma CPU.
4. **Login concentra os piores casos.** Na CI não houve erros e o p99 do login foi 435 ms, mas o pior login levou 35,8 s; no teste local, 0,40% dos logins estouraram o timeout de 60 s. Sob saturação, uma parte pequena das requisições de login fica presa na fila do processo muito além das demais. Hipótese: gerar e assinar o token JWT custa mais CPU que as consultas (o teste mede o efeito, não a causa interna).
5. **Gerador e sistema testado na mesma máquina.** Na CI o k6 e o ServeRest dividem o mesmo runner. No cenário oficial, o p95 foi de 13 ms em 2 vCPUs e de 5,0 ms em 4 vCPUs: a disputa de CPU aparece na latência medida. No estresse o k6 usou em média meio núcleo e o ServeRest um, sobrando núcleos — o gerador não limitou a vazão, mas para medições precisas convém separá-los.

## Recomendações

| Gargalo                   | Recomendação                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Processo único de Node.js | Escalar horizontalmente: múltiplos processos (`cluster`/PM2) ou réplicas atrás de um balanceador, aproveitando todos os núcleos |
| Capacidade por máquina    | Repetir o estresse no hardware de produção e definir a capacidade a partir dele, não do ambiente de teste                       |
| Consulta por id (NeDB)    | Usar um banco de dados dedicado, com índices, para consultas por id                                                             |
| Login sob saturação       | Limitar a taxa de login por cliente (rate limiting) e reaproveitar tokens válidos em vez de autenticar a cada ação              |
| Listagem de produtos      | Paginação e cache de leitura (`GET /produtos` muda pouco)                                                                       |
| Monitoramento             | Acompanhar CPU por processo, p95 da consulta por id e p99/máximo do login como indicadores de saturação                         |

## Como reproduzir

```bash
# Local (Docker): sobe o ServeRest e roda o k6 — relatórios em load/reports/
npm run test:carga
VUS=500 PATAMAR=2m PAUSA=0 npm run test:carga     # estresse

# CI: aba Actions → workflow "Carga" → Run workflow (roda o oficial e o estresse juntos; usuários e duração configuráveis)
```

## Evidências

Os dois cenários são da [execução #41946011095](https://github.com/MarcosJRuiz/out/actions/runs/41946011095) (commit `5f01e9d`). Cada pasta tem o dashboard, o resumo JSON do k6, a CPU medida (`cpu-serverest.txt`, `cpu-k6.txt`) e a máquina (`maquina.txt`).

- Cenário oficial (CI): [dashboard online](https://marcosjruiz.github.io/out/#carga) (gráficos ao longo do tempo) e [`carga-resumo-k6.json`](../evidencias/load/oficial/resumo-k6.json)
- Estresse (CI): [dashboard online](https://marcosjruiz.github.io/out/#estresse) (gráficos ao longo do tempo) e [`estresse-resumo-k6.json`](../evidencias/load/estresse/resumo-k6.json)
