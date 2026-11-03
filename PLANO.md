# Plano de Implementação — Avaliação Outsera (Automação de Testes)

> Documento de trabalho para revisarmos ponto a ponto antes de iniciar a implementação.
> Base: `Avaliação Outsera - Automação de Testes.pdf` (não versionado) · Foco da vaga: **Playwright**
> Local do projeto: `/usr/local/.app/ws/_diversos/out` (raiz do repositório)
> Repositório: [github.com/MarcosJRuiz/out](https://github.com/MarcosJRuiz/out) — **privado** por enquanto (tornar público na entrega)
> Última atualização: 03/11/2026 — exploração do E2E concluída e spike mobile na CI aprovado

### Status atual

| Etapa | Status |
|---|---|
| Plano e stack | Definidos (pendências na seção 10) |
| Exploração do site E2E (AutomationExercise) | ✅ Concluída — atende o PDF; 2 defeitos confirmados (seção 4.2) |
| Spike mobile na CI | ✅ Aprovado — branch `spike/mobile-ci` (seção 4.3) |
| Repositório | ✅ Criado; histórico limpo sem o PDF |
| Fase 0 — Fundação | ✅ Concluída (branch `feat/fase-0-fundacao`) |
| Fase 1 — API | ✅ Concluída (branch `feat/fase-1-api`): 57 testes, estáveis em execução repetida |
| Fases 2 a 6 | ⏳ Não iniciadas |

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
| CI | GitHub Actions | 1 job por módulo | — | **Allure consolidado** (principal) + nativos como artifacts; GitHub Pages quando o repo for público |

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
│   ├── tests/                 # login.spec.ts, formulario.spec.ts (spike.spec.ts é removido na Fase 3)
│   ├── screens/               # Screen Objects
│   ├── fixtures/              # driver.fixture.ts (WebdriverIO remote)
│   ├── support/               # global-setup.ts (sobe/derruba o Appium)
│   ├── apps/                  # APK baixado no setup (gitignored)
│   ├── playwright.config.ts
│   └── package.json
├── load/
│   ├── scripts/carga-500vus.js
│   ├── reports/
│   └── ANALISE.md
├── .github/workflows/         # ci.yml (por commit) e load.yml (manual/agendado)
├── docs/bugs/                 # bug reports (BUG-001 cartão inválido, BUG-002 endereço incompleto)
├── evidencias/                # snapshot final dos relatórios versionado na entrega
├── docker-compose.yml         # ServeRest
├── package.json               # npm workspaces + scripts agregados
├── .gitignore  .editorconfig  .nvmrc  eslint/prettier
├── PLANO.md                   # este arquivo
└── README.md
```

> **Decidido:** o PDF da avaliação **não é versionado** (`*.pdf` no `.gitignore`) e o histórico do repositório foi reescrito para removê-lo do primeiro commit. O README descreve os requisitos com nossas palavras.

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
| `POST /usuarios` | cadastro válido (201) | e-mail duplicado; campos obrigatórios ausentes; tipo inválido; **JSON malformado** → **400** (validado na Fase 0) |
| `PUT /usuarios/{id}` | atualização válida (200) | e-mail já usado por outro; payload inválido; id inexistente → ServeRest **cria** o registro (**201** "Cadastro realizado com sucesso", validado na Fase 0) |
| `DELETE /usuarios/{id}` | exclusão (200) | usuário com carrinho (regra de negócio, 400); id inexistente (mensagem "nenhum registro") |
| `POST/PUT/DELETE /produtos` | CRUD com admin | **sem token (401)**; **token inválido/expirado (401)**; **usuário não-admin (403)**; nome duplicado; preço/quantidade inválidos |
| `/carrinhos` | criar, consultar, concluir e cancelar compra | produto inexistente; estoque insuficiente; segundo carrinho para o mesmo usuário |
| Método inválido | — | `PATCH /usuarios`, `DELETE /login` → **405** com mensagem "Não é possível realizar ..." (validado na Fase 0) |

**Relatório:** Playwright HTML + Allure, com request/response anexados em falhas.

**Resultado da Fase 1:** 57 testes (login 7, usuários 16, produtos 17, carrinhos 9, métodos/payload 8), sendo 37 negativos; 171/171 aprovados com `--repeat-each=3` em paralelo; a massa criada é removida ao final (sobram apenas os dados iniciais do ServeRest).

**Achados registrados no README:**
- JSON malformado → resposta **sem CORS e sem headers de segurança** (todas as outras respostas trazem); o teste verifica a ausência e registra anotação `achado` no relatório.
- `PUT` com id inexistente cria o registro (201); `DELETE` de id inexistente → 200 "Nenhum registro excluído"; `concluir-compra` sem carrinho → 200 com mensagem de ausência.

---

### 4.2 E2E — Cucumber + Playwright

**Alvo:** [automationexercise.com](https://automationexercise.com) para todos os cenários.

**Padrões:**
- World customizado guardando `browser`, `context`, `page` e Page Objects.
- Hooks: `Before` cria contexto isolado; `After` anexa **screenshot** ao relatório em **todos os cenários** (inclusive negativos que passam, como evidência da mensagem de erro) e, quando falha, também **vídeo** e **trace** (`context.tracing`).
- Asserções com `expect` do `@playwright/test` (auto-wait), sem `waitForTimeout`.
- Seletores estáveis: atributos `data-qa` do site (validados na exploração), roles e labels.
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
| L1 | Login válido e navegação até o formulário **Contact Us** | Positivo | Sim | Após o login exibe "Logged in as <nome>"; no Contact Us: URL `/contact_us`, título "Get In Touch", campos do formulário visíveis e "Logged in as <nome>" ainda presente (sessão ativa) | **Sim** |
| L2 | Senha incorreta | Negativo | Sim | Recusa o login com "Your email or password is incorrect!" | **Sim** |
| L3 | Usuário inexistente | Negativo | Sim | Recusa o login com "Your email or password is incorrect!" | **Sim** |
| L4 | E-mail em branco | Negativo | Sim | Navegador bloqueia o envio (validação HTML5 `valueMissing`) | **Sim** |
| L5 | Senha em branco | Negativo | Sim | Navegador bloqueia o envio (validação HTML5 `valueMissing`) | **Sim** |
| L6 | E-mail em formato inválido | Negativo | Extra | Navegador bloqueia o envio (validação HTML5 `typeMismatch`) | **Sim** |
| L7 | Cadastro com e-mail já existente | Negativo | Extra | Recusa com "Email Address already exist!" | **Sim** |

**Resultado da Tarefa 1:** o site atende **100%** do que o PDF pede.

> **Por que Contact Us:** é o formulário mais completo do site (nome, e-mail, assunto, mensagem, anexo). Como a página também abre sem login, o L1 valida "Logged in as <nome>" **na própria página do formulário**, comprovando que a navegação ocorreu com a sessão autenticada. O checkout (único formulário que exige login) fica reservado para a Tarefa 2.

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
- Fixture `driver` cria e encerra a sessão Appium; anexa screenshot ao fim de todo teste (evidência) e, em falha, também page source (XML) via `testInfo.attach`.
- `globalSetup` sobe/derruba o servidor Appium, tanto local quanto na CI (validado no spike).
- Screen Objects; locators nativos por **accessibility id** e **resource-id** (evitar XPath).
- Esperas explícitas (`waitForDisplayed`) / `expect.poll` — o auto-wait do Playwright não se aplica a elementos WebdriverIO.
- `workers: 1` (um emulador).

**App:** Sauce Labs *My Demo App* v1.3.0 (React Native, APK Android, baixado no setup). **Somente Android.**

| Tarefa do PDF | No app | Validado? |
|---|---|---|
| Abrir o app e navegar | Catálogo "Products" → detalhe do produto → carrinho | Catálogo ✅ no spike; demais telas na Fase 3 |
| Login | Tela de login (`bob@example.com` / `10203040`) | A confirmar na Fase 3 |
| Validar elemento | Botão "Add to cart", preço, mensagens | A confirmar na Fase 3 |
| Preencher e enviar formulário | Endereço de entrega no checkout, com validação de obrigatórios | A confirmar na Fase 3 |

**iOS fora do escopo:** o PDF não exige; exigiria runner macOS (cada minuto conta 10× em repo privado), Xcode, simulador e driver XCUITest. Fica no README como melhoria futura — a arquitetura com Appium permite adicioná-lo trocando as capabilities.

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
| Disco | Passo **"Liberar espaço em disco"** antes do emulador (remove .NET, NDK, Haskell, Swift, CodeQL e imagens Docker) — sem isso o emulador aborta por falta de espaço |
| Emulador | `reactivecircus/android-emulator-runner@v2` — API 33, `google_apis`, `x86_64`, `cores: 4`, `ram-size: 4096M`, `disk-size: 6000M`, `disable-animations: true`, opções `-no-window -no-audio -no-boot-anim -gpu swiftshader_indirect -no-snapshot-save -no-metrics` |
| Cache do AVD | *A fazer:* `actions/cache` do snapshot do AVD para reduzir o boot (~79 s hoje) |
| Appium | `appium@3.9.0` como devDependency + driver `appium-uiautomator2-driver@8.7.3` instalado por script (`npm run -w mobile driver:install`); servidor iniciado pelo `globalSetup` dos testes (evita a pegadinha do `script` do emulator-runner, que executa cada linha em um shell separado) |
| App | APK do My Demo App v1.3.0 baixado por URL de release fixa (`npm run -w mobile app:download`); *a fazer:* cache |
| Estabilidade | `appium:uiautomator2ServerInstallTimeout` e `appium:adbExecTimeout` = 120 s, `newCommandTimeout` = 240 s; `autoGrantPermissions`; `retries: 1` só na CI; `timeout-minutes: 30` |
| Evidências | Artifact `mobile-report`: relatório HTML, screenshots, page source (XML) e **log do Appium**; *a fazer:* **logcat** |
| Custo | Repo **privado** no plano Free → 2.000 min/mês; o job mobile consome ~6 min por execução. Ao tornar público, minutos ilimitados |

Workflow validado no spike (`.github/workflows/ci.yml`, job mobile):

```yaml
mobile-tests:
  runs-on: ubuntu-latest
  timeout-minutes: 30
  steps:
    - uses: actions/checkout@v4
    - name: Liberar espaço em disco
      run: |
        sudo rm -rf /usr/share/dotnet /usr/local/lib/android/sdk/ndk /opt/ghc /usr/local/.ghcup /usr/share/swift /opt/hostedtoolcache/CodeQL
        sudo docker image prune --all --force
    - name: Habilitar KVM
      run: |
        echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
        sudo udevadm control --reload-rules
        sudo udevadm trigger --name-match=kvm
    - uses: actions/setup-node@v4
      with: { node-version-file: .nvmrc }
    - run: npm ci
    - run: npm run -w mobile driver:install
    - run: npm run -w mobile app:download
    - uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 33
        target: google_apis
        arch: x86_64
        cores: 4
        ram-size: 4096M
        disk-size: 6000M
        disable-animations: true
        emulator-options: -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect -no-snapshot-save -no-metrics
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
- **Execução:** local (`docker compose up` + `k6 run`) e no workflow próprio `.github/workflows/load.yml`, **fora do pipeline por commit** — gatilhos `workflow_dispatch` (manual) e `schedule` (semanal). ServeRest como service container no mesmo runner; relatório HTML e resumo como artifact. Cada execução consome ~7 min de CI.
- **Implementado na última fase (Fase 6).**

---

## 5. CI/CD — GitHub Actions

Gatilhos: `push` (todas as branches — atende "após cada commit"; os checks aparecem no PR pelo commit) e `workflow_dispatch`. Sem `pull_request`, para não duplicar execuções. `concurrency` cancela a execução anterior quando há novo push no mesmo branch.

> E2E roda só em **Chromium** a cada commit: o PDF não exige multi-browser e o AutomationExercise já apresenta instabilidade ("queue full"); dobrar o tráfego com Firefox aumentaria o risco de falsos negativos. Multi-browser fica disponível localmente via `BROWSER=`.

```
lint ──┬──> api-tests          (ServeRest como service container)          [bloqueante]
       ├──> e2e-tests          (Chromium; --tags "not @known-defect")      [bloqueante]
       ├──> e2e-known-defects  (--tags "@known-defect")                    [não bloqueante]
       └──> mobile-tests       (android-emulator-runner + Appium)          [bloqueante]
                    │
                    └──> publish-reports  (Allure consolidado: artifact single-file; Pages quando público)

load-test: workflow separado (load.yml) — apenas workflow_dispatch + agendamento semanal (não roda a cada commit)
```

- Cache de npm e dos browsers do Playwright.
- Relatórios de cada job como **artifacts** + Allure consolidado com histórico no **GitHub Pages**.
- ⚠️ GitHub Pages **não está disponível em repo privado no plano Free**. Enquanto o repo for privado, os relatórios ficam só como artifacts; o Pages entra quando o repo for tornado público.

**Estratégia de relatórios (decidida):**

| Relatório | Papel | Origem |
|---|---|---|
| **Allure consolidado** | **Principal** — porta de entrada (link no topo do README): visão única de API + E2E + mobile, agrupado por módulo/tag/severidade, `@known-defect` como falhas esperadas, links para os bug reports e histórico/tendência (quando no Pages) | `allure-playwright` (API e mobile) + `allure-cucumberjs` (E2E) → job `publish-reports` junta os `allure-results` |
| Playwright HTML + Trace Viewer | Complemento — investigação detalhada de falhas de API e mobile | Nativo |
| Cucumber HTML | Complemento — cenários em Gherkin com screenshots/vídeo | Nativo |
| K6 Web Dashboard + `ANALISE.md` | Relatório próprio da carga (o Allure não se aplica a métricas de performance) | Nativo |

- Enquanto o repo for privado: Allure gerado como **arquivo HTML único** (`--single-file`), publicado como artifact — abre direto no navegador, sem servidor.
- Quando o repo for público: Allure publicado no **GitHub Pages** com histórico entre execuções.
- Job summary (`$GITHUB_STEP_SUMMARY`) com totais por módulo.
- Badge de status e link dos relatórios no README.
- Relatório de execuções do pipeline (exigido no item 3): seção no README com prints/links das execuções.

### 5.1 Pasta `evidencias/` (decidida)

Atende à observação do PDF **"Salvar evidências do teste (report)"** de forma permanente, sem depender de artifacts (expiram) nem do GitHub Pages (só com repo público).

**Estrutura:**
```
evidencias/
├── README.md                    # índice: data, commit, link da execução da pipeline, resumo (total/passou/falhou por módulo)
├── allure-report.html           # Allure consolidado (API + E2E + mobile), arquivo único
├── api/
│   └── playwright-report.html   # relatório nativo
├── e2e/
│   ├── cucumber-report.html     # relatório nativo
│   └── screenshots/             # evidências dos cenários, incl. negativos e @known-defect
├── mobile/
│   ├── playwright-report.html
│   └── screenshots/
├── pipeline/
│   └── execucoes.md             # links e prints das execuções do GitHub Actions (item 3 do PDF)
└── load/                        # Fase 6
    ├── k6-dashboard.html
    └── resumo.json
```

**Regras:**
- A pasta é criada na Fase 0 (com o `README.md` de índice) e preenchida na **Fase 5** (escopo obrigatório) e na **Fase 6** (carga).
- O conteúdo vem dos **artifacts da execução da pipeline do commit final** — rastreável a uma execução real, não a uma rodada local.
- Script `npm run evidencias:snapshot` baixa os artifacts da execução (`gh run download`) e organiza na estrutura acima.
- Tamanho controlado: relatórios em HTML único e screenshots; **vídeos e traces ficam só nos artifacts** (pesados), exceto dos cenários `@known-defect`, que entram como prova dos bugs.
- Não conflita com o `.gitignore`: os relatórios locais (`**/reports/`) continuam ignorados; só `evidencias/` é versionada.

> **Decidido:** API, E2E e mobile rodam **a cada commit** e são **bloqueantes** (falha em qualquer um deixa a pipeline vermelha), conforme o item 3 do PDF. O job mobile tem `retries: 1` e timeout de 30 min; se ficar instável, plano B da seção 4.3. Exceção intencional: o job `@known-defect` é não bloqueante, pois contém testes que devem falhar.
>
> Enquanto o repo for privado (plano Free), não há proteção de branch: "bloqueante" significa pipeline vermelha, sem impedir merge. Ao tornar o repo público, ativar a regra de checks obrigatórios na `main`.

---

## 6. README (obrigatório)

- Nome e descrição do projeto
- Badge da pipeline + link dos relatórios
- Arquitetura e estrutura de pastas (por módulo)
- Stack e **versões utilizadas** (Node, Playwright, Cucumber, Appium, UiAutomator2, WebdriverIO, K6, Docker)
- Pré-requisitos e instalação de dependências (incl. Android SDK/emulador para mobile)
- Como executar cada módulo e gerar cada relatório
- Decisões técnicas (por que Cucumber puro, Appium + Playwright runner, ServeRest local)
- **Resultados e achados**: interpretação dos resultados de cada módulo, bugs encontrados (link para `docs/bugs/`) e comportamentos relevantes das aplicações testadas
- Link para as evidências versionadas (`evidencias/`) e para as execuções da pipeline
- Limitações conhecidas

---

## 7. Fases e estimativas

| Fase | Escopo | Estimativa | Status |
|---|---|---|---|
| — | Exploração do site E2E + spike mobile na CI | — | ✅ Concluído |
| 0 | Fundação: monorepo (npm workspaces), lint/prettier, `docker-compose` ServeRest, esqueleto README, pasta `evidencias/` com índice (`.nvmrc`, `.gitignore` e `package.json` raiz já criados no spike) | 0,5 dia | ✅ |
| 1 | API (Playwright) + job `api-tests` na CI (antecipado da Fase 4) | 1,5 dia | ✅ |
| 2 | E2E (Cucumber + Playwright) | 2 dias | ⏳ |
| 3 | Mobile (Appium + Playwright runner) — infraestrutura já validada no spike | 1 dia | ⏳ |
| 4 | CI/CD: jobs de API e E2E, lint, caches, job summary (job mobile já existe) | 0,5 dia | ⏳ |
| 5 | README final, bug reports, script `evidencias:snapshot` + preenchimento de `evidencias/` a partir da pipeline final, revisão geral → **escopo obrigatório entregue** | 0,5 dia | ⏳ |
| 6 | Carga (K6) + análise + workflow `load.yml` (manual/agendado) + seção no README + `evidencias/load/`; liberar acesso ao avaliador | 0,5 dia | ⏳ |
| | **Total restante** | **≈ 6,5 dias** | |

Commits seguindo **Conventional Commits**, um conjunto por fase.

> A carga (K6) é a **última fase** por ser opcional no PDF e não fazer parte do pipeline por commit: ao fim da Fase 5 todo o escopo obrigatório (API, E2E, CI + mobile) já está entregue e documentado.

---

## 8. Rastreabilidade — requisitos do PDF × entrega

| Requisito | Onde é atendido |
|---|---|
| API: status, headers e body | `api/` — toda asserção cobre os três + schema |
| API: positivos e negativos (dados inválidos, ausentes, auth inválida) | `api/` — tabela 4.1 |
| API: GET/POST/PUT/DELETE em múltiplos endpoints | `usuarios`, `produtos`, `carrinhos`, `login` |
| API: método inválido, payload malformado | `api/` — cenários específicos |
| API: relatório detalhado | Playwright HTML + Allure |
| API: interpretar os resultados (objetivo) | Seção "Resultados e achados" no README (ex.: comportamentos do ServeRest como PUT em id inexistente criar registro) |
| E2E: Cucumber + Playwright | `e2e/` — `@cucumber/cucumber` |
| E2E: login + navegação + asserções | `login.feature` |
| E2E: abrir app, login, navegar até formulário (Contact Us) | `login.feature` |
| E2E: senha incorreta, usuário inexistente, campos em branco | `login.feature` (Scenario Outline) |
| E2E: Page Object | `e2e/pages/` |
| E2E: checkout (carrinho, pagamento, finalização) | `checkout.feature` |
| E2E: cartão inválido, endereço incompleto | `checkout.feature` (+ `@known-defect` se aplicável) |
| E2E: relatório com evidências, incl. falhas esperadas | Cucumber HTML + Allure: screenshot em todos os cenários (negativos incluídos), vídeo/trace em falhas, `@known-defect` com link para `docs/bugs/` |
| CI: API, E2E e mobile a cada commit | `.github/workflows/ci.yml` |
| CI: relatório das execuções | Job summary + artifacts + Allure consolidado + seção README com links das execuções |
| Carga: K6, 500 VUs, 5 min | `load/scripts/carga-500vus.js` |
| Carga: métricas, gargalos, relatório e análise | K6 dashboard + `ANALISE.md` |
| Mobile: Appium, login, navegação, validar elemento | `mobile/tests/login.spec.ts` |
| Mobile: formulário + envio | `mobile/tests/formulario.spec.ts` |
| Mobile: locators nativos | accessibility id / resource-id |
| Mobile: configuração do ambiente (critério de avaliação) | README: Android SDK, emulador, Appium/driver, variáveis (`ANDROID_HOME`, `JAVA_HOME`) |
| Mobile: relatório | Playwright HTML + Allure |
| Projeto no GitHub/GitLab | GitHub — `MarcosJRuiz/out` (**precisa estar acessível ao avaliador na entrega**) |
| Evidências salvas | **`evidencias/` versionada** (seção 5.1) + artifacts por execução + Pages quando público |
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
| Emulador Android lento/instável na CI (**spike aprovado**, ver 4.3) | Pipeline vermelho | KVM, disco liberado, animações desligadas, retries, timeouts, log do Appium/logcat como evidência; plano B: device farm |
| Repo privado: minutos de CI limitados e sem GitHub Pages | Consumo da cota (~15 min por push com API + E2E + mobile → ~130 pushes/mês) | Todos os jobs rodam a cada commit (exigência do PDF); acompanhar o consumo; publicar Pages ao tornar o repo público |
| Versões novas incompatíveis (ex.: driver UiAutomator2 9.x exige Appium 4) | Quebra na instalação | Todas as versões fixadas (`package.json`, `package-lock.json`, scripts) |
| 500 VUs saturando a máquina geradora (não a API) | Análise distorcida | Monitorar CPU do gerador; documentar recursos; rodar local/manual |
| Divergência de comportamento do ServeRest (status de método inválido, PUT em id inexistente) | Asserções erradas | **Validado na Fase 0** (405 / 201); imagem Docker fixada em 3.2.2 |
| Porta 3000 ocupada na máquina local | ServeRest não sobe | Porta configurável via `SERVEREST_PORT` |

---

## 10. Pontos para avaliarmos / decidir

**Decididos:**
- [x] Linguagem: TypeScript; foco em Playwright
- [x] Cucumber puro (`@cucumber/cucumber`) no E2E
- [x] Mobile: Appium com Playwright Test como runner (Cypress e Playwright mobile web descartados)
- [x] App mobile: Sauce Labs My Demo App v1.3.0, **somente Android**; iOS fora do escopo (citado no README como melhoria futura)
- [x] Site alvo do E2E: AutomationExercise para todos os cenários
- [x] Destino da navegação na Tarefa 1 do E2E: formulário **Contact Us**, validando também que a sessão continua ativa ("Logged in as <nome>")
- [x] Plataforma: GitHub — repositório `MarcosJRuiz/out` (nome mantido)
- [x] Repo **privado** durante o desenvolvimento
- [x] PDF da avaliação não versionado; histórico limpo
- [x] Job mobile viável na CI (spike aprovado)
- [x] Estratégia `@known-defect` para cartão inválido (C5) e endereço incompleto (C6): cenário esperando o comportamento correto + bug report + job não bloqueante
- [x] Fluxo de branches: spike integrado à `main` via PR; cada fase em branch própria (`feat/fase-N-...`) com PR para a `main`
- [x] Job mobile **bloqueante** e executado **a cada commit** junto com API e E2E, conforme o PDF (item 3)
- [x] Load test **fora do pipeline por commit**: workflow próprio, só manual (`workflow_dispatch`) e agendado; implementado na **última fase**
- [x] Evidências versionadas na pasta **`evidencias/`** do repositório (artifacts do Actions expiram e o Pages só existe com repo público) — ver seção 5.1
- [x] Relatórios: **Allure consolidado como principal** (API + E2E + mobile) + nativos como complemento (Playwright HTML/Trace Viewer, Cucumber HTML, K6 dashboard)

**Pendentes (decisão):**
- [ ] Acesso do avaliador na entrega: tornar o repo **público** (sugestão, no fim da Fase 6) ou manter privado e **convidar o avaliador** como colaborador? *Obrigatório resolver antes da entrega — o PDF exige o projeto publicado.*

**Pendentes (validação técnica, durante as fases):**
- [x] ServeRest: método inválido → 405; JSON malformado → 400; PUT com id inexistente → 201 (cria o registro) — validado na Fase 0
- [ ] Fase 2 — AutomationExercise: confirmar mensagens e fluxos ao automatizar (exploração já feita)
- [ ] Fase 3 — My Demo App: confirmar tela de login, credenciais, formulário de endereço e mensagens de validação
- [ ] Fase 6 — K6: calibrar thresholds após a primeira execução
