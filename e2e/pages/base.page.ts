import type { Page } from '@playwright/test';

const TENTATIVAS_SITE_SOBRECARREGADO = 4;

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async abrir(caminho: string) {
    await this.page.goto(caminho);
    await this.aguardarSiteDisponivel();
  }

  /**
   * O AutomationExercise responde de forma intermitente "This website is under heavy load (queue full)".
   * Recarrega com espera crescente antes de seguir, para não transformar indisponibilidade do site em falha do teste.
   */
  async aguardarSiteDisponivel() {
    const aviso = this.page.getByText('This website is under heavy load');
    for (let tentativa = 1; tentativa <= TENTATIVAS_SITE_SOBRECARREGADO; tentativa++) {
      if (!(await aviso.isVisible())) return;
      await this.page.waitForTimeout(tentativa * 3_000);
      await this.page.reload();
    }
    throw new Error(`Site sobrecarregado ("queue full") após ${TENTATIVAS_SITE_SOBRECARREGADO} tentativas`);
  }
}
