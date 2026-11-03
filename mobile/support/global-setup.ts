import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPIUM_URL = 'http://127.0.0.1:4723/status';

async function waitForAppium(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(APPIUM_URL);
      if (res.ok) return;
    } catch {
      // servidor ainda subindo
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`Appium não respondeu em ${timeoutMs}ms (${APPIUM_URL})`);
}

export default async function globalSetup() {
  const reportsDir = path.resolve(__dirname, '..', 'reports');
  mkdirSync(reportsDir, { recursive: true });
  const log = createWriteStream(path.join(reportsDir, 'appium.log'));

  const appium = spawn('npx', ['appium', '--address', '127.0.0.1', '--port', '4723', '--log-timestamp'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  appium.stdout.pipe(log);
  appium.stderr.pipe(log);

  await waitForAppium(60_000);

  return async () => {
    appium.kill('SIGTERM');
    log.end();
  };
}
