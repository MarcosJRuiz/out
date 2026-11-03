# Outsera — Automação de Testes

Projeto de automação de testes de API, E2E, mobile e carga, com execução contínua no GitHub Actions.

> 🚧 Em construção. O planejamento completo está em [PLANO.md](PLANO.md).

## Estrutura

```
.
├── api/                  # Testes de API — Playwright Test + ServeRest
├── e2e/                  # Testes E2E — Cucumber + Playwright (AutomationExercise)
├── mobile/               # Testes mobile — Playwright Test + WebdriverIO + Appium
├── load/                 # Testes de carga — K6 (em construção)
├── docs/bugs/            # Bug reports dos defeitos encontrados
├── evidencias/           # Snapshot versionado dos relatórios
├── docker-compose.yml    # ServeRest local
└── .github/workflows/    # Pipeline de CI
```

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
| WebdriverIO                  | 10.1.0           |
| Appium                       | 3.9.0            |
| Driver UiAutomator2          | 8.7.3            |
| ServeRest (Docker)           | 3.2.2            |
| ESLint / Prettier            | 10.14.0 / 3.9.10 |

## Pré-requisitos

- Node.js 24 (`nvm use`) — o Cucumber não roda no Node 25
- E2E: navegador do Playwright (`npx playwright install chromium`)
- Docker com Compose v2 (`docker compose`)
- Mobile: Android SDK (`ANDROID_HOME`), emulador Android (API 33) e Java (`JAVA_HOME`)

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
npm run -w mobile driver:install
npm run -w mobile app:download
npm run test:mobile
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

| Feature                              | Cenários                                                                                                                                                                                           | Resultado                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `login.feature`                      | L1 login válido e navegação até o formulário **Contact Us**; L2 senha incorreta; L3 usuário inexistente; L4/L5 campos obrigatórios em branco; L6 e-mail inválido; L7 cadastro com e-mail existente | 7 ✅                                   |
| `checkout.feature`                   | C1 compra completa; C2 checkout sem login; C3 carrinho vazio; C4 pagamento em branco                                                                                                               | 4 ✅                                   |
| `checkout.feature` (`@known-defect`) | C5 cartão inválido; C6 endereço de entrega incompleto                                                                                                                                              | 2 ❌ falha esperada — defeitos do site |

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

## Qualidade de código

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # TypeScript
```

## Relatórios e evidências

- Relatórios de cada execução da pipeline: artifacts do GitHub Actions
- Evidências versionadas: [evidencias/](evidencias/)
