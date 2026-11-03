# Plano de Implementação — Avaliação Outsera (Automação de Testes)

> Documento de trabalho para revisarmos ponto a ponto antes de iniciar a implementação.
> Base: `Avaliação Outsera - Automação de Testes.pdf` · Foco da vaga: **Playwright**
> Local do projeto: `/usr/local/.app/ws/_diversos/out` (raiz do repositório)

---

## 1. Resumo do desafio

| # | Bloco | Status no PDF | Entrega |
|---|---|---|---|
| 1 | Testes de API | Obrigatório | Testes GET/POST/PUT/DELETE, positivos e negativos, + relatório |
| 2 | Testes E2E com Cucumber | Obrigatório | Login + navegação; checkout de e-commerce; + relatório com evidências |
| 3 | CI/CD | Obrigatório | Pipeline rodando API, E2E e **mobile** a cada commit + relatório |
| 4 | Carga (K6) | Opcional | 500 VUs por 5 min + relatório + análise |
| 5 | Mobile (Appium) | Opcional* | Login/navegação/validação + formulário + relatório |

\* O item 5 é opcional, mas o item 3 exige mobile na pipeline → **vamos implementar**.

**Requisitos gerais:** projeto no GitHub/GitLab · evidências salvas · README obrigatório (nome/descrição, estrutura de pastas, versões, dependências, como executar e gerar relatório) · qualidade "de produção".

---

## 2. Stack definida

| Módulo | Runner | Driver / Lib | Alvo de teste | Relatório |
|---|---|---|---|---|
| `api/` | Playwright Test | `APIRequestContext` | ServeRest (local, Docker) | Playwright HTML + Allure |
| `e2e/` | `@cucumber/cucumber` (puro) | Playwright (biblioteca) | AutomationExercise | Cucumber HTML (screenshots/vídeo/trace) + Allure |
| `mobile/` | Playwright Test | WebdriverIO (standalone) → Appium 3 + UiAutomator2 | Sauce Labs My Demo App (Android) | Playwright HTML + Allure |
| `load/` | K6 | — | ServeRest (local, Docker) | K6 Web Dashboard (HTML) + `ANALISE.md` |
| CI | GitHub Actions | 1 job por módulo | — | Allure consolidado no GitHub Pages + artifacts |

**Linguagem:** TypeScript em todos os módulos (K6 em JavaScript, padrão da ferramenta).

### Justificativas principais
- **Playwright em API, E2E e como runner do mobile:** demonstra domínio da ferramenta-foco da vaga.
- **Cucumber puro (não `playwright-bdd`):** o PDF exige "Cucumber em conjunto com Playwright"; o avaliador verá `cucumber.js`, World e hooks do Cucumber de forma inequívoca.
- **Appium com Playwright Test como runner:** Playwright não automatiza app nativo (o `_android` é experimental e só cobre Chrome/WebView). O Appium faz a automação nativa; o Playwright Test fornece runner, fixtures, retries e relatório.
- **Cypress descartado:** não automatiza app nativo e duplicaria o papel do Playwright.
- **ServeRest local:** API com autenticação JWT, regras de negócio e validações reais (permite cenários negativos de verdade) e estável na CI, sem depender de serviço externo.
- **K6 contra ServeRest local:** evita disparar 500 VUs contra API pública (rate limit / uso indevido); o PDF permite mock.
- **AutomationExercise para todo o E2E:** um único domínio para login, navegação e checkout → Page Objects compartilhados, massa coerente (o usuário criado no login é o mesmo do checkout) e é o único site de demo conhecido com formulário de cartão.

---

## 3. Estrutura do repositório

```
_diversos/out/
├── api/
│   ├── tests/                 # auth, usuarios, produtos, carrinhos (*.spec.ts)
│   ├── clients/               # UsuariosClient, ProdutosClient, ...
│   ├── fixtures/              # adminApi, userApi, factories de massa
│   ├── schemas/               # validação de contrato do body (zod)
│   ├── playwright.config.ts
│   └── package.json
├── e2e/
│   ├── features/              # login.feature, checkout.feature
│   ├── steps/
│   ├── pages/                 # Page Objects
│   ├── support/               # world.ts, hooks.ts (screenshot/vídeo/trace em falha)
│   ├── cucumber.js
│   └── package.json
├── mobile/
│   ├── tests/                 # login.spec.ts, formulario.spec.ts
│   ├── screens/               # Screen Objects
│   ├── fixtures/              # driver.fixture.ts (WebdriverIO remote)
│   ├── apps/                  # APK baixado no setup (gitignored)
│   ├── playwright.config.ts
│   └── package.json
├── load/
│   ├── scripts/carga-500vus.js
│   ├── reports/
│   └── ANALISE.md
├── .github/workflows/ci.yml
├── docker-compose.yml         # ServeRest
├── package.json               # npm workspaces + scripts agregados
├── .gitignore  .editorconfig  .nvmrc  eslint/prettier
├── PLANO.md                   # este arquivo
└── README.md
```

> ⚠️ **Ponto a avaliar:** o PDF da avaliação está nesta pasta. Sugestão: **não versionar** o PDF (adicionar ao `.gitignore`), pois é material da empresa; o README referencia os requisitos com nossas palavras.

---

## 4. Detalhamento por módulo

### 4.1 API — Playwright Test + ServeRest

**Padrões:**
- Clients por recurso encapsulando `APIRequestContext`.
- Fixtures `adminApi` / `userApi` já autenticadas; criação e limpeza de massa no setup/teardown (testes independentes, paralelizáveis).
- Massa dinâmica com `@faker-js/faker`.
- Validação de contrato com schema (zod) via `expect.extend` → matcher `toMatchSchema`.
- Toda asserção cobre **status code + headers (`content-type`, etc.) + body**.
- Tags: `@smoke`, `@negative`, `@contract`.

**Cenários previstos:**

| Endpoint | Positivos | Negativos |
|---|---|---|
| `POST /login` | credenciais válidas → 200 + token | senha errada (401); e-mail inexistente (401); campos ausentes (400); e-mail mal formatado (400) |
| `GET /usuarios` | listar; buscar por id; filtro por query | id inexistente (400) |
| `POST /usuarios` | cadastro válido (201) | e-mail duplicado; campos obrigatórios ausentes; tipo inválido; **JSON malformado** |
| `PUT /usuarios/{id}` | atualização válida (200) | e-mail já usado por outro; payload inválido; id inexistente (ServeRest **cria** o registro → testar e documentar) |
| `DELETE /usuarios/{id}` | exclusão (200) | usuário com carrinho (regra de negócio, 400); id inexistente (mensagem "nenhum registro") |
| `POST/PUT/DELETE /produtos` | CRUD com admin | **sem token (401)**; **token inválido/expirado (401)**; **usuário não-admin (403)**; nome duplicado; preço/quantidade inválidos |
| `/carrinhos` | criar, consultar, concluir e cancelar compra | produto inexistente; estoque insuficiente; segundo carrinho para o mesmo usuário |
| Método inválido | — | ex.: `PATCH /usuarios`, `DELETE /login` → **verificar** status retornado (405/404) e documentar |

**Relatório:** Playwright HTML + Allure, com request/response anexados em falhas.

---

### 4.2 E2E — Cucumber + Playwright

**Alvo:** [automationexercise.com](https://automationexercise.com) para todos os cenários.

**Padrões:**
- World customizado guardando `browser`, `context`, `page` e Page Objects.
- Hooks: `Before` cria contexto isolado; `After` anexa **screenshot**, **vídeo** e **trace** (`context.tracing`) ao relatório quando falha.
- Asserções com `expect` do `@playwright/test` (auto-wait), sem `waitForTimeout`.
- Seletores estáveis (`data-test`, roles, labels).
- `Scenario Outline` + `Examples` para os negativos.
- Tags: `@smoke`, `@login`, `@checkout`, `@negative`, `@known-defect`.
- Execução multi-browser via variável (`BROWSER=chromium|firefox|webkit`).
- Bloqueio de anúncios/terceiros com `page.route` (AutomationExercise tem ads que causam instabilidade).

**Massa:** usuário criado em `Before` via API do próprio site (`POST /api/createAccount`) e removido no `After` (`DELETE /api/deleteAccount`) — rápido, estável e testes independentes. Atenção: a API responde **HTTP 200 sempre**; o resultado real vem em `responseCode` no body (validar o body, não o status).

**Estabilidade (validado na exploração):**
- Clicar em "Add to cart" antes do JS da página carregar não abre o modal → aguardar a resposta `add_to_cart` (`waitForResponse`) em vez de esperar o modal às cegas.
- O site retorna intermitentemente **"This website is under heavy load (queue full)"** → helper de retry com backoff na navegação + `workers` baixo + `retry` na CI.
- Bloquear domínios de anúncios (`googlesyndication`, `doubleclick`, etc.) via `context.route`.

**Legenda das colunas:**
- **Tipo:** *Positivo* = fluxo de sucesso; *Negativo* = o sistema deve **recusar** a ação.
- **Pedido no PDF?:** *Sim* = exigido pela avaliação; *Extra* = cenário adicional nosso.
- **Site se comporta corretamente?:** resultado da exploração feita com Playwright. *Sim* = dá para automatizar e o teste vai passar; *Não (defeito)* = o site tem um bug, o teste vai falhar e isso vira bug report.

**Tarefa 1 — `login.feature`:**

| # | Cenário | Tipo | Pedido no PDF? | Comportamento esperado | Site se comporta corretamente? |
|---|---|---|---|---|---|
| L1 | Login válido e navegação até o formulário **Contact Us** | Positivo | Sim | Exibe "Logged in as <nome>"; Contact Us abre com URL, título e campos corretos | **Sim** |
| L2 | Senha incorreta | Negativo | Sim | Recusa o login com "Your email or password is incorrect!" | **Sim** |
| L3 | Usuário inexistente | Negativo | Sim | Recusa o login com "Your email or password is incorrect!" | **Sim** |
| L4 | E-mail em branco | Negativo | Sim | Navegador bloqueia o envio (validação HTML5 `valueMissing`) | **Sim** |
| L5 | Senha em branco | Negativo | Sim | Navegador bloqueia o envio (validação HTML5 `valueMissing`) | **Sim** |
| L6 | E-mail em formato inválido | Negativo | Extra | Navegador bloqueia o envio (validação HTML5 `typeMismatch`) | **Sim** |
| L7 | Cadastro com e-mail já existente | Negativo | Extra | Recusa com "Email Address already exist!" | **Sim** |

**Resultado da Tarefa 1:** o site atende **100%** do que o PDF pede.

**Tarefa 2 — `checkout.feature`:**

| # | Cenário | Tipo | Pedido no PDF? | Comportamento esperado | Site se comporta corretamente? |
|---|---|---|---|---|---|
| C1 | Compra completa: adicionar 2 produtos → validar carrinho (nome, preço, qtd, total) → checkout → validar endereço → pagamento → "Order Placed!" | Positivo | Sim | Pedido confirmado (URL `/payment_done/...`) | **Sim** |
| C2 | Checkout sem estar logado | Negativo | Extra | Bloqueia com modal "Register / Login account to proceed on checkout" | **Sim** |
| C3 | Carrinho vazio | Negativo | Extra | Mostra "Cart is empty!" e não exibe "Proceed To Checkout" | **Sim** |
| C4 | Campos de pagamento em branco | Negativo | Extra | Navegador bloqueia o envio (validação HTML5) | **Sim** |
| C5 | **Número de cartão inválido** (`abc123`, CVC `x`, validade `99/1900`) | Negativo | **Sim** | Recusar o pagamento | **Não (defeito)** — o site aceitou e confirmou o pedido |
| C6 | **Endereço de entrega incompleto** | Negativo | **Sim** | Impedir a compra sem endereço | **Não (defeito)** — só o navegador valida; contornando o HTML, o servidor aceita conta sem endereço e o checkout chega ao pagamento com endereço vazio |

**Resultado da Tarefa 2:** dá para automatizar **todos** os cenários. Dois dos negativos pedidos no PDF (C5 e C6) revelam **defeitos reais do site** — os testes vão falhar de propósito e isso será documentado como bug.

> Observação: neste site o endereço é informado no **cadastro**, não no checkout; o checkout só exibe o endereço da conta.

**Estratégia para os defeitos (C5 e C6):**
- Cenários escritos com o **comportamento correto esperado** (rejeitar), tag `@known-defect` + id do bug (`@BUG-001`, `@BUG-002`).
- Hook `After` anexa ao relatório evidências (screenshot, URL de confirmação) e o link do bug report.
- CI: suíte principal roda `--tags "not @known-defect"` (gate); a suíte `@known-defect` roda em job separado, não bloqueante, e aparece no relatório como falha esperada.
- Bug reports documentados no README (`docs/bugs/`) com passos, esperado × obtido e evidências.

**Relatório:** Cucumber HTML (`multiple-cucumber-html-reporter`) com evidências + Allure.

---

### 4.3 Mobile — Appium + Playwright Test (runner)

**Arquitetura:**
```
Playwright Test (runner) → webdriverio remote() → Appium 3 → UiAutomator2 → App Android
```

**Padrões:**
- Fixture `driver` cria e encerra a sessão Appium; em falha anexa screenshot e page source (XML) via `testInfo.attach`.
- `globalSetup` sobe/derruba o servidor Appium localmente (na CI pode ser etapa do workflow).
- Screen Objects; locators nativos por **accessibility id** e **resource-id** (evitar XPath).
- Esperas explícitas (`waitForDisplayed`) / `expect.poll` — o auto-wait do Playwright não se aplica a elementos WebdriverIO.
- `workers: 1` (um emulador).

**App:** Sauce Labs *My Demo App* (React Native, APK Android, baixado no setup).

**Tarefa 1:** login → catálogo → detalhe do produto → validar elemento (ex.: botão "Add to cart", mensagem).
- Negativo (extra): login com credenciais inválidas / campos vazios.

**Tarefa 2:** formulário de checkout (endereço de entrega) → preencher → enviar → validar próxima tela.
- Negativo (extra): envio com campos obrigatórios vazios → validar mensagens de erro.

**Relatório:** Playwright HTML + Allure.

> ⚠️ **Limitações a documentar no README:** sem Trace Viewer para mobile; Playwright não automatiza app nativo (por isso Appium).

**Execução no GitHub Actions:**

| Item | Decisão |
|---|---|
| Runner | `ubuntu-latest` com **KVM habilitado** (aceleração de hardware para o emulador). macOS não serve: runners Apple Silicon não rodam emulador Android x86 com aceleração |
| Emulador | `reactivecircus/android-emulator-runner@v2` — API 33, `google_apis`, `x86_64`, `disable-animations: true`, opções `-no-window -no-audio -no-boot-anim -gpu swiftshader_indirect` |
| Cache do AVD | `actions/cache` do snapshot do AVD → boot cai de ~3–4 min para ~1 min |
| Appium | Instalado via npm (`appium` + driver `uiautomator2`, versões fixadas) com cache; servidor iniciado pelo `globalSetup` dos testes (evita a pegadinha do `script` do emulator-runner, que executa cada linha em um shell separado) |
| App | APK do My Demo App baixado por URL de release fixa + cache |
| Estabilidade | `appium:uiautomator2ServerInstallTimeout`, `appium:adbExecTimeout` e `newCommandTimeout` maiores; `autoGrantPermissions`; `retries: 1` só na CI; timeout do job (~25 min) |
| Evidências | Upload como artifact de: relatório, screenshots, page source, **log do Appium** e **logcat** (para diagnosticar falhas só da CI) |
| Custo | Repositório público → minutos ilimitados em runner padrão |

```yaml
mobile-tests:
  runs-on: ubuntu-latest
  timeout-minutes: 25
  steps:
    - uses: actions/checkout@v4
    - name: Habilitar KVM
      run: |
        echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
        sudo udevadm control --reload-rules && sudo udevadm trigger --name-match=kvm
    - uses: actions/setup-node@v4
      with: { node-version-file: .nvmrc, cache: npm }
    - run: npm ci -w mobile && npx -w mobile appium driver install uiautomator2
    - run: npm run -w mobile app:download        # baixa o APK (com cache)
    - uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 33
        target: google_apis
        arch: x86_64
        disable-animations: true
        emulator-options: -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
        script: npm run -w mobile test:ci      # globalSetup sobe o Appium
    - if: always()
      uses: actions/upload-artifact@v4
      with: { name: mobile-report, path: mobile/reports/ }
```

**Plano B** (se o emulador na CI se mostrar instável): rodar o job contra um device farm (BrowserStack/Sauce Labs, plano trial/open source) apenas trocando as capabilities, ou manter o job com `continue-on-error` e documentar.

**Spike realizado em 03/11/2026 — ✅ APROVADO** (branch `spike/mobile-ci`, [run 41633566054](https://github.com/MarcosJRuiz/out/actions/runs/41633566054)):

| Item | Resultado |
|---|---|
| Versões validadas | Node 24 · Appium **3.9.0** · `appium-uiautomator2-driver` **8.7.3** · WebdriverIO 10.1.0 · Playwright Test 1.64.1 · emulador API 33 `google_apis` x86_64 · My Demo App v1.3.0 |
| Tempo do job | **~6 min** no total (boot do emulador ~79 s; teste 45 s) — sem cache de AVD ainda |
| Resultado | App abriu no catálogo "Products"; teste passou de primeira (sem retry) |
| Locators | App expõe **accessibility ids** (`products screen`, `store item`, `store item text`, `store item price`, `open menu`, `cart badge`, `sort button`) → locators nativos sem XPath |

Problemas encontrados e corrigidos no spike:
1. `appium-uiautomator2-driver@9.x` exige Appium 4 (beta) → fixado em **8.7.3**, última versão compatível com Appium 3.
2. Emulador abortou com *"Not enough space to create userdata partition"* (3,5 GB livres, precisa de 7,3 GB) → passo **"Liberar espaço em disco"** no workflow + `disk-size: 6000M`, `cores: 4`, `ram-size: 4096M`.

Próximos ajustes no job: cache do AVD e do driver Appium; upload do logcat.

---

### 4.4 Carga — K6

- Executor `ramping-vus`: rampa 30s → **500 VUs por 5 min** → rampa de descida 30s.
- Fluxo realista: login → listar produtos → buscar produto por id (com `check`s).
- Thresholds: `http_req_duration p(95)<500ms`, `http_req_failed<1%`, `checks>99%` (ajustar após primeira execução).
- Relatório HTML via `K6_WEB_DASHBOARD=true` + `K6_WEB_DASHBOARD_EXPORT`.
- **`ANALISE.md`:** throughput (req/s), latências p90/p95/p99, taxa de erro, comportamento ao longo do tempo, ponto de saturação, gargalos prováveis (ex.: ServeRest usa NeDB em arquivo → contenção em escrita), recomendações.
- Registrar recursos da máquina/container usados (a análise depende disso).

---

## 5. CI/CD — GitHub Actions

Gatilhos: `push` e `pull_request` (todas as branches) + `workflow_dispatch`.

```
lint ──┬──> api-tests      (ServeRest como service container)
       ├──> e2e-tests      (matriz: chromium / firefox)
       └──> mobile-tests   (reactivecircus/android-emulator-runner + Appium)
                    │
                    └──> publish-reports  (Allure consolidado → GitHub Pages)

load-test: apenas workflow_dispatch / agendado (não roda a cada commit)
```

- Cache de npm e dos browsers do Playwright.
- Relatórios de cada job como **artifacts** + Allure consolidado com histórico no **GitHub Pages**.
- Job summary (`$GITHUB_STEP_SUMMARY`) com totais por módulo.
- Badge de status e link dos relatórios no README.
- Relatório de execuções do pipeline (exigido no item 3): seção no README com prints/links das execuções.

> ⚠️ **Ponto a avaliar:** o job mobile (emulador) é o mais lento e propenso a instabilidade. Proposta: obrigatório no pipeline, com `retries` e timeout ajustados; se ficar instável, documentar.

---

## 6. README (obrigatório)

- Nome e descrição do projeto
- Badge da pipeline + link dos relatórios
- Arquitetura e estrutura de pastas (por módulo)
- Stack e **versões utilizadas** (Node, Playwright, Cucumber, Appium, UiAutomator2, WebdriverIO, K6, Docker)
- Pré-requisitos e instalação de dependências (incl. Android SDK/emulador para mobile)
- Como executar cada módulo e gerar cada relatório
- Decisões técnicas (por que Cucumber puro, Appium + Playwright runner, ServeRest local)
- Bugs/achados encontrados (ex.: cartão inválido aceito)
- Limitações conhecidas

---

## 7. Fases e estimativas

| Fase | Escopo | Estimativa |
|---|---|---|
| 0 | Fundação: monorepo (npm workspaces), lint/prettier, `.nvmrc`, `docker-compose` ServeRest, `.gitignore`, esqueleto README | 0,5 dia |
| 1 | API (Playwright) | 1,5 dia |
| 2 | E2E (Cucumber + Playwright) | 2 dias |
| 3 | Mobile (Appium + Playwright runner) | 1,5 dia |
| 4 | CI/CD (GitHub Actions + Pages) | 1 dia |
| 5 | Carga (K6) + análise | 0,5 dia |
| 6 | README final, revisão geral, pipeline limpa | 0,5 dia |
| | **Total** | **≈ 7,5 dias** |

Commits seguindo **Conventional Commits**, um conjunto por fase.

---

## 8. Rastreabilidade — requisitos do PDF × entrega

| Requisito | Onde é atendido |
|---|---|
| API: status, headers e body | `api/` — toda asserção cobre os três + schema |
| API: positivos e negativos (dados inválidos, ausentes, auth inválida) | `api/` — tabela 4.1 |
| API: GET/POST/PUT/DELETE em múltiplos endpoints | `usuarios`, `produtos`, `carrinhos`, `login` |
| API: método inválido, payload malformado | `api/` — cenários específicos |
| API: relatório detalhado | Playwright HTML + Allure |
| E2E: Cucumber + Playwright | `e2e/` — `@cucumber/cucumber` |
| E2E: login + navegação + asserções | `login.feature` |
| E2E: abrir app, login, navegar até formulário (Contact Us) | `login.feature` |
| E2E: senha incorreta, usuário inexistente, campos em branco | `login.feature` (Scenario Outline) |
| E2E: Page Object | `e2e/pages/` |
| E2E: checkout (carrinho, pagamento, finalização) | `checkout.feature` |
| E2E: cartão inválido, endereço incompleto | `checkout.feature` (+ `@known-defect` se aplicável) |
| E2E: relatório com evidências, incl. falhas esperadas | Cucumber HTML + screenshots/vídeo/trace |
| CI: API, E2E e mobile a cada commit | `.github/workflows/ci.yml` |
| CI: relatório das execuções | Artifacts + GitHub Pages + job summary + seção README |
| Carga: K6, 500 VUs, 5 min | `load/scripts/carga-500vus.js` |
| Carga: métricas, gargalos, relatório e análise | K6 dashboard + `ANALISE.md` |
| Mobile: Appium, login, navegação, validar elemento | `mobile/tests/login.spec.ts` |
| Mobile: formulário + envio | `mobile/tests/formulario.spec.ts` |
| Mobile: locators nativos | accessibility id / resource-id |
| Mobile: relatório | Playwright HTML + Allure |
| Projeto no GitHub/GitLab | GitHub |
| Evidências salvas | `reports/` por módulo + artifacts + Pages |
| README completo | Seção 6 |

---

## 9. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| AutomationExercise fora do ar ou alterado (todo o E2E depende dele) | E2E quebra | Seletores robustos; documentar dependência; SauceDemo como reserva para login |
| Campos em branco validados só por HTML5 (sem mensagem do servidor) | Asserção frágil por texto | Validar `validity.valueMissing` / `:invalid` em vez do texto |
| AutomationExercise com anúncios/pop-ups | Flakiness | Bloquear domínios de ads via `page.route` |
| Cartão inválido e endereço incompleto aceitos pelo site (**confirmado**) | Cenários negativos falham | `@known-defect` + bug report + job não bloqueante |
| Site retorna "under heavy load (queue full)" intermitentemente (**confirmado**) | Flakiness | Retry com backoff na navegação, `workers` baixo, `retry` na CI |
| Emulador Android lento/instável na CI (**spike aprovado**, ver 4.3) | Pipeline vermelho | KVM no runner, snapshot de AVD em cache, animações desligadas, retries, timeouts, logcat/log do Appium como evidência; **spike no início**; plano B: device farm |
| 500 VUs saturando a máquina geradora (não a API) | Análise distorcida | Monitorar CPU do gerador; documentar recursos; rodar local/manual |
| Divergência de comportamento do ServeRest (status de método inválido, PUT em id inexistente) | Asserções erradas | Validar na Fase 1 e documentar o comportamento real |

---

## 10. Pontos para avaliarmos / decidir

- [ ] Stack da seção 2 aprovada?
- [ ] Versionar ou não o PDF da avaliação no repositório? (sugestão: não)
- [ ] GitHub como plataforma (vs GitLab)?
- [ ] Nome do repositório (sugestão: `outsera-qa-automation`)?
- [x] Site alvo do E2E: AutomationExercise para todos os cenários
- [ ] Formulário de destino da navegação no login: Contact Us — ok?
- [ ] Estratégia `@known-defect` (cenário esperando o correto + job não bloqueante) para cartão inválido e endereço incompleto — ok?
- [ ] App mobile: Sauce Labs My Demo App (Android) — ok? iOS fora do escopo?
- [ ] Job mobile obrigatório na pipeline mesmo com risco de instabilidade?
- [ ] Load test fora do pipeline por commit (apenas manual/agendado)?
- [ ] Allure consolidado como relatório principal + relatórios nativos como complemento?
- [ ] Ordem das fases (mobile antes da CI para a pipeline já nascer completa)?
