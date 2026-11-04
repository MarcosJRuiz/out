# Outsera — Automação de Testes

[![Repositório no GitHub](https://img.shields.io/badge/Reposit%C3%B3rio-MarcosJRuiz%2Fout-181717?logo=github&logoColor=white)](https://github.com/MarcosJRuiz/out) &nbsp;&nbsp;&nbsp; [![Site de evidências](https://img.shields.io/badge/Site%20de%20evid%C3%AAncias-marcosjruiz.github.io%2Fout-7855D0?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0yIDEyaDIwTTEyIDJhMTUgMTUgMCAwIDEgMCAyME0xMiAyYTE1IDE1IDAgMCAwIDAgMjAiLz48L3N2Zz4=)](https://marcosjruiz.github.io/out/)

Projeto de automação de testes de **API**, **E2E**, **mobile** e **carga**, com execução a cada commit no GitHub Actions, relatório consolidado e evidências versionadas.

| Módulo | Ferramentas                            | Aplicação testada                                                    | Testes                                |
| ------ | -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| API    | Playwright Test                        | [ServeRest](https://serverest.dev) (local, Docker)                   | 60                                    |
| E2E    | Cucumber + Playwright                  | [AutomationExercise](https://automationexercise.com)                 | 11 + 2 defeitos conhecidos            |
| Mobile | Appium + WebdriverIO + Playwright Test | [My Demo App](https://github.com/saucelabs/my-demo-app-rn) (Android) | 7                                     |
| Carga  | k6                                     | ServeRest (local, Docker)                                            | 500 usuários por 5 min (6 thresholds) |
| CI/CD  | GitHub Actions                         | —                                                                    | 6 jobs                                |

**Resultado atual:** 86 testes (80 funcionais e 6 thresholds de carga) — 84 aprovados, 0 falhas inesperadas e 2 falhas esperadas que comprovam defeitos do site testado ([BUG-001](docs/bugs/BUG-001-cartao-invalido-aceito.md), [BUG-002](docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md)). Evidências no [relatório consolidado](https://marcosjruiz.github.io/out/#allure).

## Cobertura dos requisitos da avaliação

| Requisito                                                                                                   | Onde                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API: status code, headers e corpo; positivos e negativos (dados inválidos, ausentes, autenticação inválida) | [Testes de API](#testes-de-api) — `support/assertions.ts` valida as três partes em toda resposta                                                                                        |
| API: GET, POST, PUT e DELETE em vários endpoints; método inválido, payload malformado e dados ausentes      | `usuarios`, `produtos`, `carrinhos`, `login` e `metodos-http.spec.ts`                                                                                                                   |
| API: relatório detalhado com os resultados de todos os testes                                               | [Relatório consolidado](https://marcosjruiz.github.io/out/#allure), com as requisições e respostas HTTP anexadas a cada teste                                                           |
| E2E com Cucumber: login, navegação até um formulário, assertivas, positivos e negativos, Page Object        | [Testes E2E](#testes-e2e) — `login.feature` (L1–L7) e `e2e/pages/`                                                                                                                      |
| E2E: checkout (carrinho, pagamento, finalização), cartão inválido e endereço incompleto                     | `checkout.feature` (C1–C6); C5 e C6 comprovam defeitos do site ([BUG-001](docs/bugs/BUG-001-cartao-invalido-aceito.md), [BUG-002](docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md)) |
| E2E: relatório com evidências, incluindo falhas esperadas                                                   | [Relatório consolidado](https://marcosjruiz.github.io/out/#allure): screenshot em cada validação; vídeo e trace nas falhas                                                              |
| CI/CD: API, E2E e mobile a cada commit, com relatório das execuções                                         | [Pipeline de CI](#pipeline-de-ci-github-actions) e [execuções ao vivo](https://marcosjruiz.github.io/out/#pipeline)                                                                     |
| Carga (k6): 500 usuários por 5 min, métricas, gargalos, relatório e análise                                 | [Teste de carga](#teste-de-carga), [Análise](load/ANALISE.md) e [dashboard online](https://marcosjruiz.github.io/out/#carga)                                                            |
| Mobile (Appium): login, navegação, validação de elemento, formulário; locators nativos                      | [Testes mobile](#testes-mobile)                                                                                                                                                         |
| Mobile: relatório detalhado com os resultados dos testes                                                    | [Relatório consolidado](https://marcosjruiz.github.io/out/#allure): screenshot em cada validação e da tela final; page source nas falhas                                                |
| Projeto no GitHub, evidências salvas e README                                                               | [Este repositório](https://github.com/MarcosJRuiz/out), [site de evidências](https://marcosjruiz.github.io/out/), [`evidencias/`](evidencias/) (snapshot versionado) e este arquivo     |

## Estrutura

```
.
├── api/                        # Testes de API — Playwright Test + ServeRest
│   ├── tests/                  # *.spec.ts
│   ├── clients/                # clients por recurso
│   ├── fixtures/               # clients e massa de dados
│   ├── schemas/                # contratos (Zod)
│   ├── support/                # validações
│   └── playwright.config.ts
├── e2e/                        # Testes E2E — Cucumber + Playwright (AutomationExercise)
│   ├── features/               # *.feature (pt)
│   ├── steps/                  # step definitions
│   ├── pages/                  # Page Objects
│   ├── support/                # World e hooks
│   └── cucumber.mjs
├── mobile/                     # Testes mobile — Playwright Test + WebdriverIO + Appium (My Demo App, Android)
│   ├── tests/                  # *.spec.ts
│   ├── screens/                # Screen Objects
│   ├── fixtures/               # sessão Appium
│   ├── support/                # Appium e app
│   └── playwright.config.ts
├── load/                       # Teste de carga — k6 (script, resumo e ANALISE.md)
├── docs/bugs/                  # Bug reports dos defeitos encontrados
├── evidencias/                 # Snapshot versionado dos relatórios
├── scripts/                    # Relatório consolidado (Allure + resumo) e snapshot das evidências
├── allurerc.mjs                # Configuração do relatório Allure consolidado
├── docker-compose.yml          # ServeRest local
├── .github/workflows/          # Pipeline de CI, teste de carga e GitHub Pages
└── .github/pages/              # Site de evidências publicado no GitHub Pages
```

`api/`, `e2e/` e `mobile/` são workspaces npm, cada um com `package.json`, configuração e relatórios próprios.

## Stack e versões

| Ferramenta                   | Versão           |
| ---------------------------- | ---------------- |
| Node.js                      | 24 (LTS)         |
| TypeScript                   | 6.0.3            |
| Playwright Test              | 1.64.1           |
| Cucumber                     | 13.3.0           |
| Playwright (biblioteca, E2E) | 1.64.1           |
| Zod (contratos)              | 4.6.7            |
| Faker                        | 10.6.0           |
| Allure Playwright            | 3.14.0           |
| Allure Report (CLI)          | 3.22.1           |
| WebdriverIO                  | 10.1.0           |
| Appium                       | 3.9.0            |
| Driver UiAutomator2          | 8.7.3            |
| ServeRest (Docker)           | 3.2.2            |
| k6                           | 2.3.0            |
| ESLint / Prettier            | 10.14.0 / 3.9.10 |

## Pré-requisitos

- Node.js 24 (`nvm use`) — o Cucumber não roda no Node 25
- E2E: navegador do Playwright (`npx playwright install chromium`)
- Docker com Compose v2 (`docker compose`)
- Mobile:
  - Android SDK com `ANDROID_HOME` configurado e `platform-tools` (adb) no `PATH`
  - Emulador Android API 33 (`system-images;android-33;google_apis;x86_64` ou `arm64-v8a` em Mac Apple Silicon) em execução
  - Java 17+ com `JAVA_HOME` configurado (usado pelo UiAutomator2)
  - O servidor Appium é iniciado pelos próprios testes (`mobile/support/global-setup.ts`), não é preciso subi-lo manualmente

## Instalação

```bash
npm ci
```

## Execução

```bash
# ServeRest local (porta padrão 3000; altere com SERVEREST_PORT)
npm run serverest:up
npm run serverest:down

# API (com o ServeRest no ar; ajuste SERVEREST_URL se não usar a porta 3000)
npm run test:api
SERVEREST_URL=http://localhost:3001 npm run test:api
npm run report -w api        # abre o relatório HTML

# E2E (site público automationexercise.com)
npm run test:e2e                         # suíte principal (sem os defeitos conhecidos)
npm run test:known-defects -w e2e        # cenários dos defeitos conhecidos (falham de propósito)
BROWSER=firefox npm run test:e2e         # outro navegador (chromium, firefox ou webkit)
HEADED=1 npm run test:e2e                # com o navegador visível

# Mobile (com emulador Android em execução)
npm run -w mobile driver:install         # driver UiAutomator2 do Appium (uma vez)
npm run -w mobile app:download           # APK do My Demo App (uma vez)
npm run test:mobile
npx playwright show-report mobile/reports/html

# Relatório consolidado (Allure) com os resultados locais dos módulos
npm run relatorio
```

## Testes de API

Playwright Test (`APIRequestContext`) contra o [ServeRest](https://serverest.dev) local. 60 testes em 5 arquivos:

| Arquivo                | Escopo                                                                       | Testes |
| ---------------------- | ---------------------------------------------------------------------------- | ------ |
| `login.spec.ts`        | `POST /login`                                                                | 7      |
| `usuarios.spec.ts`     | `GET/POST/PUT/DELETE /usuarios`                                              | 15     |
| `produtos.spec.ts`     | `GET/POST/PUT/DELETE /produtos` (autenticação e perfil)                      | 17     |
| `carrinhos.spec.ts`    | `/carrinhos`, concluir e cancelar compra, estoque                            | 9      |
| `metodos-http.spec.ts` | Métodos não suportados (405) e JSON malformado em todos os métodos com corpo | 12     |

- Toda resposta é validada em **status code, headers e corpo** (`support/assertions.ts`), com o contrato do corpo verificado por schemas Zod (`schemas/`).
- Cada teste cria e remove a própria massa pela API (`fixtures/massa.ts`), então os testes são independentes e rodam em paralelo.
- Tags: `@smoke`, `@negative` (40 testes) e `@contract`. Ex.: `npx playwright test --grep @negative` dentro de `api/`.
- **Evidência em todo teste:** as requisições e respostas (status, headers e corpo) de cada teste são anexadas ao relatório em `requisicoes-http.json`, inclusive nos testes aprovados.
- Relatórios: HTML em `api/reports/html` e resultados Allure em `api/reports/allure-results`.

### Achados

| Comportamento observado                                                                                               | Observação                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Resposta a JSON malformado vem **sem CORS e sem headers de segurança** (`x-content-type-options`, `x-frame-options`)  | Todas as outras respostas trazem esses headers; o teste verifica a ausência e registra o achado no relatório |
| `PUT /usuarios/{id}` com id inexistente **cria** um usuário (201)                                                     | Comportamento documentado do ServeRest (upsert)                                                              |
| `DELETE` de id inexistente responde **200** "Nenhum registro excluído"                                                | Idempotente, sem erro                                                                                        |
| `DELETE /carrinhos/concluir-compra` sem carrinho responde **200** com "Não foi encontrado carrinho para esse usuário" | Sucesso com mensagem de ausência, em vez de 404                                                              |

## Testes E2E

Cucumber (Gherkin em português) com Playwright como biblioteca, contra o [AutomationExercise](https://automationexercise.com). Page Object Pattern em `e2e/pages/`.

| Feature                              | Cenários                                                                                                                                                                                           | Resultado                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `login.feature`                      | L1 login válido e navegação até o formulário **Contact Us**; L2 senha incorreta; L3 usuário inexistente; L4/L5 campos obrigatórios em branco; L6 e-mail inválido; L7 cadastro com e-mail existente | 7 sucesso                           |
| `checkout.feature`                   | C1 compra completa; C2 checkout sem login; C3 carrinho vazio; C4 pagamento em branco                                                                                                               | 4 sucesso                           |
| `checkout.feature` (`@known-defect`) | C5 cartão inválido; C6 endereço de entrega incompleto                                                                                                                                              | 2 falha esperada — defeitos do site |

- **Massa:** cada cenário cria a própria conta pela API do site e a exclui ao final.
- **Estabilidade:** bloqueio de anúncios, espera pela resposta do "add to cart" e nova tentativa automática quando o site responde "under heavy load". Retry de 1 vez na CI (exceto `@known-defect`).
- **Evidências:** screenshot após **cada validação** (passos "Então"/"E" de resultado, inclusive nos cenários negativos aprovados) e no passo que falhar, com o nome do passo; vídeo e trace do Playwright nas falhas. Ex.: o C1 registra o carrinho conferido, o endereço conferido e o pedido confirmado.
- **Relatórios:** `e2e/reports/cucumber-report.html` (suíte principal), `e2e/reports/known-defects/cucumber-report.html` (defeitos) e resultados Allure em `e2e/reports/allure-results`.

### Defeitos encontrados

| Bug                                                            | Descrição                                                                          | Cenário |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| [BUG-001](docs/bugs/BUG-001-cartao-invalido-aceito.md)         | Pagamento aceita cartão `abc123`, CVC `x` e validade `99/1900` e confirma o pedido | C5      |
| [BUG-002](docs/bugs/BUG-002-compra-sem-endereco-de-entrega.md) | Conta sem endereço (validação só no navegador) chega ao pagamento                  | C6      |

Os cenários `@known-defect` esperam o comportamento correto e por isso falham. Na pipeline rodam em um job separado e não bloqueante; se passarem, o job emite um aviso de que o bug pode ter sido corrigido.

## Testes mobile

Appium (driver UiAutomator2) controlado pelo WebdriverIO, com o **Playwright Test como runner** (fixtures, retries e relatórios iguais aos da API). App: [Sauce Labs My Demo App](https://github.com/saucelabs/my-demo-app-rn) v1.3.0, Android. Screen Objects em `mobile/screens/`.

| Arquivo                         | Cenários                                                                                                                                                                                               | Resultado |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `login.spec.ts` (Tarefa 1)      | Login válido → catálogo → detalhe do produto (nome, preço e botão **Add To Cart**) → carrinho (contador, produto e total); negativos: senha incorreta, usuário bloqueado, usuário e senha obrigatórios | 5 sucesso |
| `formulario.spec.ts` (Tarefa 2) | Preenche os 7 campos do endereço, confere cada valor e envia → tela de pagamento; negativo: envio vazio com mensagem em cada campo obrigatório                                                         | 2 sucesso |

- **Locators nativos:** accessibility id (`content-desc`) em todos os elementos, sem XPath; rolagem com `UiScrollable` para campos abaixo da dobra.
- **Isolamento e tempo:** uma sessão do Appium por execução (abrir sessão custa ~40 s); antes de cada teste o app é limpo (`mobile: clearApp`) e reaberto no catálogo.
- **Estabilidade no emulador da CI:** se o catálogo não aparecer ao abrir o app, o teste dispensa diálogos do sistema Android ("isn't responding"), reinicia o app e tenta de novo (até 3 vezes), anexando screenshot, page source e logcat de cada tentativa. Na pipeline, a imagem do Android é baixada antes do emulador com até 3 tentativas (o download às vezes chega corrompido).
- **Evidências:** screenshot em cada ponto de validação e da tela final de todo teste; XML da tela (page source) nas falhas; log do Appium em `mobile/reports/appium.log`.
- **Relatórios:** `mobile/reports/html` e resultados Allure em `mobile/reports/allure-results`.
- **Limitação:** o Trace Viewer do Playwright não se aplica a app nativo.

## Teste de carga

[k6](https://k6.io) contra o ServeRest: **500 usuários simultâneos por 5 minutos** (rampa de 30 s, patamar de 5 min, descida de 30 s). Cada usuário faz login, lista os produtos e consulta um produto, com 1 s de pausa entre as ações.

| Resultado (CI, 4 vCPUs) | Valor               | Critério             |
| ----------------------- | ------------------- | -------------------- |
| Requisições / vazão     | 165.324 / 457 req/s | —                    |
| Taxa de erro            | 0,00%               | < 1% sucesso         |
| Checks                  | 100%                | > 99% sucesso        |
| p95 / p99               | 4,9 ms / 9,2 ms     | p95 < 500 ms sucesso |

- **Estresse complementar** (mesmos 500 usuários, sem pausa): a vazão para em ~450 req/s, o p95 sobe para 940 ms e surgem timeouts no login — o gargalo é a **CPU do processo único do ServeRest**. Gargalos e recomendações na [Análise](load/ANALISE.md).
- **Fora do pipeline por commit:** workflow próprio `.github/workflows/load.yml`, executado manualmente (usuários, duração e pausa configuráveis), toda segunda-feira e quando o teste de carga muda.
- **Relatórios:**
  - [Carga](https://marcosjruiz.github.io/out/#carga) e [Estresse](https://marcosjruiz.github.io/out/#estresse): dashboards do k6, com os gráficos ao longo do tempo;
  - [Análise](load/ANALISE.md): resultados, gargalos e recomendações;
  - resumo de cada execução do workflow `Carga`: tabela de métricas e thresholds.

  Dashboards e resumos em JSON versionados em [`evidencias/load/`](evidencias/load/).

- **No relatório consolidado:** cada threshold do cenário oficial vira um teste do módulo **Carga** no Allure, com o valor medido e o dashboard anexado; o estresse fica em _Global Attachments_. Os dados são os do último teste de carga versionado em `evidencias/load/`, já que a carga não roda a cada commit.

```bash
npm run test:carga                                 # 500 usuários por 5 min (Docker: ServeRest + k6)
VUS=500 PATAMAR=2m PAUSA=0 npm run test:carga      # estresse, sem pausa entre as ações
```

## Qualidade de código

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # TypeScript
```

Padrões: EditorConfig, ESLint (flat config + typescript-eslint), Prettier, TypeScript estrito e Conventional Commits.

## Pipeline de CI (GitHub Actions)

Arquivo: `.github/workflows/ci.yml`. Roda **a cada push** em qualquer branch (e manualmente pela aba Actions).

```
lint ──┬─> api-tests            ServeRest como container de serviço        bloqueante
       ├─> e2e-tests            Cucumber + Playwright (Chromium)            bloqueante
       ├─> e2e-known-defects    cenários @known-defect (BUG-001, BUG-002)   não bloqueante
       └─> mobile-tests         emulador Android + Appium                   bloqueante
                  │
                  └─> publish-reports   Allure consolidado + resumo da execução
```

| Job                 | O que faz                                                                                                                            | Artifact                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `lint`              | ESLint, Prettier e TypeScript                                                                                                        | —                          |
| `api-tests`         | 60 testes de API contra o ServeRest                                                                                                  | `api-report`               |
| `e2e-tests`         | 11 cenários E2E (suíte principal)                                                                                                    | `e2e-report`               |
| `e2e-known-defects` | 2 cenários que reproduzem defeitos do site; a falha é esperada e registrada no resumo; se passarem, emite aviso de possível correção | `e2e-known-defects-report` |
| `mobile-tests`      | 7 testes mobile no emulador Android (API 33)                                                                                         | `mobile-report`            |
| `publish-reports`   | Junta os resultados Allure dos módulos, gera o **relatório consolidado** e escreve o **resumo** na página da execução                | `relatorio-consolidado`    |

- **Resumo da execução:** tabela com testes, aprovados, falhas, falhas esperadas e testes que passaram após retry, por módulo.
- **Relatório consolidado:** Allure em **arquivo HTML único** (abre direto no navegador), agrupado por módulo (API, E2E, Mobile e Carga), com a categoria "Defeitos conhecidos do site (falha esperada)" e link de cada cenário para o bug report.
- **Gerar o relatório consolidado localmente** (depois de rodar os testes): `npm run relatorio` → `reports/allure-report/index.html`.
- **Otimizações:** cache do npm; `concurrency` cancela a execução anterior em novo push no mesmo branch; imagem do Android baixada com novas tentativas.

## Relatórios e evidências

| Onde                                               | O quê                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [GitHub Pages](https://marcosjruiz.github.io/out/) | **Online, sem baixar nada:** site com menu lateral reunindo o relatório Allure da última CI aprovada na `main`, os dashboards do k6, os bug reports, a pipeline (ao vivo) e este README, com tema claro/escuro; publicado automaticamente após cada CI verde |
| [`evidencias/`](evidencias/)                       | **Snapshot versionado:** relatório Allure consolidado (`allure-report.html`, arquivo único), resumo dos resultados, relatório das execuções da pipeline e teste de carga (`load/`)                                                                           |
| Página de cada execução no GitHub Actions          | Resumo por módulo e artifacts: `relatorio-consolidado`, `api-report`, `e2e-report`, `e2e-known-defects-report`, `mobile-report`                                                                                                                              |
| Local, após rodar os testes                        | `api/reports/html`, `e2e/reports/cucumber-report.html`, `mobile/reports/html`; consolidado com `npm run relatorio` → `reports/allure-report/index.html`                                                                                                      |

Atualizar as evidências a partir da última execução bem-sucedida na `main` (requer o GitHub CLI autenticado): `npm run evidencias`.

## Decisões técnicas

- **Playwright como base:** runner da API e do mobile e biblioteca do E2E — mesma linguagem (TypeScript), mesmas asserções e relatórios.
- **Cucumber puro (`@cucumber/cucumber`) no E2E:** atende ao requisito de Cucumber de forma explícita (World, hooks e perfis do próprio Cucumber), com Playwright como biblioteca.
- **Appium com Playwright Test como runner:** o Playwright não automatiza apps nativos; o Appium faz a automação e o Playwright Test fornece fixtures, retries e relatórios.
- **ServeRest local (Docker):** API com autenticação, perfis e regras de negócio reais, estável na CI e sem depender de serviço externo.
- **Massa de dados pela API** em API e E2E: cada teste cria e remove os próprios dados, permitindo execução paralela e independente.
- **Defeitos conhecidos como testes que falham:** os cenários esperam o comportamento correto, ficam marcados com `@known-defect` e rodam num job não bloqueante — o bug fica visível sem deixar a pipeline vermelha.
- **Versões fixadas** em todos os `package.json` (`.npmrc` com `save-exact`), na imagem Docker, no driver do Appium e no runner da CI (`ubuntu-24.04`).

## Limitações conhecidas

- O E2E depende do site público AutomationExercise, que às vezes responde "under heavy load"; os testes tentam de novo automaticamente, mas indisponibilidade prolongada derruba o job.
- Mobile só em Android; iOS exigiria runner macOS e driver XCUITest.
- O teste de carga roda o k6 e o ServeRest na mesma máquina (4 vCPUs na CI); os números valem para esse ambiente.
