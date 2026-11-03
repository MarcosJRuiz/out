# Outsera — Automação de Testes

Projeto de automação de testes de API, E2E, mobile e carga, com execução contínua no GitHub Actions.

> 🚧 Em construção. O planejamento completo está em [PLANO.md](PLANO.md).

## Estrutura

```
.
├── api/                  # Testes de API — Playwright Test + ServeRest (em construção)
├── e2e/                  # Testes E2E — Cucumber + Playwright (em construção)
├── mobile/               # Testes mobile — Playwright Test + WebdriverIO + Appium
├── load/                 # Testes de carga — K6 (em construção)
├── evidencias/           # Snapshot versionado dos relatórios
├── docker-compose.yml    # ServeRest local
└── .github/workflows/    # Pipeline de CI
```

## Stack e versões

| Ferramenta          | Versão           |
| ------------------- | ---------------- |
| Node.js             | 24 (LTS)         |
| TypeScript          | 6.0.3            |
| Playwright Test     | 1.64.1           |
| WebdriverIO         | 10.1.0           |
| Appium              | 3.9.0            |
| Driver UiAutomator2 | 8.7.3            |
| ServeRest (Docker)  | 3.2.2            |
| ESLint / Prettier   | 10.14.0 / 3.9.10 |

## Pré-requisitos

- Node.js 24 (`nvm use`)
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

# Mobile (com emulador Android em execução)
npm run -w mobile driver:install
npm run -w mobile app:download
npm run test:mobile
```

## Qualidade de código

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # TypeScript
```

## Relatórios e evidências

- Relatórios de cada execução da pipeline: artifacts do GitHub Actions
- Evidências versionadas: [evidencias/](evidencias/)
