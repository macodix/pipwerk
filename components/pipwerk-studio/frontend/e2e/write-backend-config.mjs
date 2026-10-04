// Writes a dedicated, isolated INI startup configuration for the
// Playwright end-to-end backend process.
//
// This only uses the documented startup configuration mechanism
// (req-system-016/req-system-017): the backend is started with the
// `-c <PATH>` parameter pointing at the file written here. No additional,
// undocumented environment-variable based configuration source is
// introduced for the database. The port is still taken from the existing,
// already-documented PIPWERK_STUDIO_E2E_BACKEND_PORT variable (see
// docs/technical/pipwerk-studio.md) so parallel/manual runs do not collide.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = process.argv[2];
if (port === undefined) {
  console.error('Usage: write-backend-config.mjs <port>');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), `pipwerk-studio-e2e-${port}-`));
const dbPath = join(dir, 'studio.db');
const configPath = join(dir, 'pipwerk-studio.ini');

writeFileSync(
  configPath,
  `[database]\nurl = sqlite:///${dbPath}\n`,
  'utf-8',
);

// Printed so the shell command composing the backend start can pick it up.
process.stdout.write(configPath);
