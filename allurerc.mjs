import { defineConfig } from 'allure';

// Relatório Allure consolidado (API + E2E + mobile), gerado como arquivo HTML único.
export default defineConfig({
  name: 'Outsera — Automação de Testes',
  output: './reports/allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'Outsera — Automação de Testes',
        singleFile: true,
        groupBy: ['parentSuite', 'suite', 'subSuite'],
      },
    },
  },
  categories: {
    rules: [
      {
        name: 'Defeitos conhecidos do site (falha esperada)',
        matchers: { labels: { tag: /known-defect/ } },
        expand: true,
      },
      { name: 'Falhas de produto', matchedStatuses: ['failed'] },
      { name: 'Falhas de teste (erro na automação ou no ambiente)', matchedStatuses: ['broken'] },
    ],
  },
});
