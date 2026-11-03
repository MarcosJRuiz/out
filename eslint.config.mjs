import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/reports/**',
      '**/allure-results/**',
      '**/allure-report/**',
      '**/test-results/**',
      '**/playwright-report/**',
      'evidencias/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Fixtures do Playwright exigem o primeiro parâmetro desestruturado, mesmo vazio.
    files: ['**/fixtures/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  prettier,
);
