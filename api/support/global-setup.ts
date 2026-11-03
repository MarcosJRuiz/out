import { SERVEREST_URL } from '../playwright.config';

// Falha cedo, com mensagem clara, se o ServeRest não estiver no ar.
export default async function globalSetup() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${SERVEREST_URL}/usuarios`);
      if (res.ok) return;
    } catch {
      // ServeRest ainda subindo
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(
    `ServeRest não respondeu em ${SERVEREST_URL}. Suba com "npm run serverest:up" ou ajuste SERVEREST_URL.`,
  );
}
