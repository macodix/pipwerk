// Starts an isolated Pipwerk Studio backend for the Playwright end-to-end
// tests and removes everything it created when the backend ends.
//
// Only the documented startup configuration mechanism is used
// (req-system-016/req-system-017): a temporary INI with a temporary SQLite
// database is written and passed with the `-c <PATH>` parameter. No
// additional, undocumented environment variable is introduced for the
// database. The port is passed as the only argument.
//
// Playwright stops this process with SIGTERM (see `gracefulShutdown` in
// playwright.config.ts); the temporary directory is then removed.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = process.argv[2];
if (port === undefined) {
  console.error('Usage: start-backend.mjs <port>');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), `pipwerk-studio-e2e-${port}-`));
const configPath = join(dir, 'pipwerk-studio.ini');
writeFileSync(configPath, `[database]\nurl = sqlite:///${join(dir, 'studio.db')}\n`, 'utf-8');

function cleanup() {
  rmSync(dir, { recursive: true, force: true });
}

const backendProject = resolve(dirname(fileURLToPath(import.meta.url)), '../../backend');
const child = spawn(
  'uv',
  ['run', '--frozen', '--project', backendProject, 'pipwerk-studio', '-c', configPath, '--host', '127.0.0.1', '--port', port],
  { stdio: 'inherit' },
);

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill('SIGTERM'));
}

child.on('error', (error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});

child.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 0);
});
