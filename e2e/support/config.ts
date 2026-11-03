export const BASE_URL = process.env.E2E_BASE_URL ?? 'https://automationexercise.com';

export const NAVEGADOR = (process.env.BROWSER ?? 'chromium') as 'chromium' | 'firefox' | 'webkit';

export const HEADLESS = process.env.HEADED !== '1';

// Anúncios e rastreadores do site causam lentidão e pop-ups que quebram cliques.
export const BLOQUEIO_DE_TERCEIROS =
  /googlesyndication|doubleclick|googleads|adservice|fundingchoices|google-analytics|googletagmanager|googletagservices/;
