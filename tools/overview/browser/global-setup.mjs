// Erzeugt vor den Tests die Seite aus einem Test-Repository (make_fixture.py) in einem
// temporären Verzeichnis und nennt ihren Pfad in OVERVIEW_PAGE. Danach wird das
// Verzeichnis entfernt.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  const here = dirname(fileURLToPath(import.meta.url));
  const directory = mkdtempSync(join(tmpdir(), 'overview-page-'));
  const page = join(directory, 'overview.html');
  const python = process.env.OVERVIEW_PYTHON || 'python3';
  execFileSync(python, [join(here, 'make_fixture.py'), page], { stdio: 'inherit' });
  process.env.OVERVIEW_PAGE = page;
  return () => {
    rmSync(directory, { recursive: true, force: true });
  };
}
