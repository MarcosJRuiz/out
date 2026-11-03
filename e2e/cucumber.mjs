const comum = {
  paths: ['features/**/*.feature'],
  import: ['support/**/*.ts', 'steps/**/*.ts'],
  language: 'pt',
  parallel: Number(process.env.E2E_PARALLEL ?? 2),
  // Retry só na CI e nunca para os defeitos conhecidos (eles devem falhar de forma consistente).
  ...(process.env.CI ? { retry: 1, retryTagFilter: 'not @known-defect' } : {}),
  format: ['progress'],
  formatOptions: { snippetInterface: 'async-await', resultsDir: 'reports/allure-results' },
};

// Suíte principal (bloqueante): tudo, exceto os defeitos conhecidos do site.
export default {
  ...comum,
  tags: 'not @known-defect',
  format: [
    ...comum.format,
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
    // O formatador do Allure grava em resultsDir; o arquivo abaixo só evita que ele ocupe o terminal.
    'allure-cucumberjs/reporter:reports/.allure-reporter.log',
  ],
};

// Defeitos conhecidos (não bloqueante): cenários que esperam o comportamento correto e falham por bug do site.
export const knownDefects = {
  ...comum,
  tags: '@known-defect',
  format: [
    ...comum.format,
    'html:reports/known-defects/cucumber-report.html',
    'json:reports/known-defects/cucumber-report.json',
    // O formatador do Allure grava em resultsDir; o arquivo abaixo só evita que ele ocupe o terminal.
    'allure-cucumberjs/reporter:reports/.allure-reporter.log',
  ],
};
