import type { Locator } from '@playwright/test';

/**
 * Estado de validação nativa do navegador (HTML5) de um campo.
 * Usado em vez do texto do balão de erro, que muda conforme navegador e idioma.
 */
export function validade(campo: Locator) {
  return campo.evaluate((el: HTMLInputElement) => ({
    valido: el.validity.valid,
    obrigatorioVazio: el.validity.valueMissing,
    formatoInvalido: el.validity.typeMismatch,
  }));
}
