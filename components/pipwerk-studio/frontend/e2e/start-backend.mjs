// Starts an isolated pipwerk Studio backend for the Playwright end-to-end
// tests and removes everything it created when the backend ends.
//
// Only the documented startup configuration mechanism is used
// (req-system-016/req-system-017): a temporary INI with a temporary SQLite
// database is written and passed with the `-c <PATH>` parameter. No
// additional, undocumented environment variable is introduced for the
// database. The port is passed as the only argument.
//
// The object directory of the backend is a directory inside the temporary
// directory of the run, so that no browser test writes into the standard
// directory below the home directory. It is set the way the test environment
// script sets it (technical documentation, section 4a, item 5): a small Python
// program stores the setting "object directory" in the database before the
// backend starts. The INI stays unchanged and there is no environment variable
// for it.
//
// Playwright stops this process with SIGTERM (see `gracefulShutdown` in
// playwright.config.ts); the temporary directory is then removed.
import { execFileSync, spawn } from 'node:child_process';
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
const databaseUrl = `sqlite:///${join(dir, 'studio.db')}`;
const objectDirectory = join(dir, 'objects');
writeFileSync(configPath, `[database]\nurl = ${databaseUrl}\n`, 'utf-8');

function cleanup() {
  rmSync(dir, { recursive: true, force: true });
}

const backendProject = resolve(dirname(fileURLToPath(import.meta.url)), '../../backend');

// -I (isolated mode): the current directory is not searched for modules.
const setObjectDirectory = `
import sys

from pipwerk_studio.settings_service import SettingsService
from pipwerk_studio.storage import create_session_factory, create_studio_engine

engine = create_studio_engine(sys.argv[1])
SettingsService(create_session_factory(engine)).set_object_directory(sys.argv[2], move=False)
engine.dispose()
`;

try {
  execFileSync(
    'uv',
    ['run', '--frozen', '--project', backendProject, 'python', '-I', '-c', setObjectDirectory, databaseUrl, objectDirectory],
    { stdio: 'inherit' },
  );
} catch (error) {
  console.error(error);
  cleanup();
  process.exit(1);
}

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
