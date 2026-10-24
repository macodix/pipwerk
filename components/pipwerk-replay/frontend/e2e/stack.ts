// The program behind the browser tests: the real backend of pipwerk replay with its own database.
// The tests can stop and restart it.
//
// Only the documented startup configuration is used: a temporary INI file is written and
// passed with `-c <PATH>`. Port and the directory of the database come from the environment
// (see playwright.config.ts).
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendProject = resolve(dirname(fileURLToPath(import.meta.url)), '../../backend');
const STOP_TIMEOUT_MS = 10_000;

/**
 * The limit per file of the backend of the browser tests (`[marketdata] max_upload_bytes` of the
 * startup configuration, 64 KiB instead of the default 32 MiB). The tests import files that are
 * small but together far above it, and a file above it, without writing files of megabytes.
 */
export const E2E_MAX_UPLOAD_BYTES = 64 * 1024;

function requiredPort(name: string): number {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a port; playwright.config.ts sets it`);
  }
  return value;
}

type Running = { child: ChildProcess; exited: Promise<void> };

function launch(args: string[]): Running {
  // A group of its own: `uv run` starts the program as its child, and the whole group ends together.
  const child = spawn('uv', args, { stdio: 'ignore', detached: true });
  const exited = new Promise<void>((resolveExit) => {
    child.once('exit', () => {
      resolveExit();
    });
    child.once('error', () => {
      resolveExit();
    });
  });
  return { child, exited };
}

async function terminate(running: Running | null): Promise<void> {
  if (running === null || running.child.pid === undefined || running.child.exitCode !== null) {
    return;
  }
  const group = -running.child.pid;
  try {
    process.kill(group, 'SIGTERM');
  } catch {
    return;
  }
  const timer = setTimeout(() => {
    try {
      process.kill(group, 'SIGKILL');
    } catch {
      // already gone
    }
  }, STOP_TIMEOUT_MS);
  await running.exited;
  clearTimeout(timer);
}

async function waitFor(url: string, running: Running, timeoutMs = 60_000): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (running.child.exitCode !== null) {
      throw new Error(`The program for ${url} ended during the start`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // not yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No answer from ${url} within ${timeoutMs} ms`);
}

export class Stack {
  readonly backendPort = requiredPort('PIPWERK_REPLAY_E2E_BACKEND_PORT');
  readonly backendUrl = `http://127.0.0.1:${String(this.backendPort)}`;
  private readonly dir: string;
  private readonly ownsDir: boolean;
  private backend: Running | null = null;

  constructor() {
    const given = process.env.PIPWERK_REPLAY_E2E_DATA_DIR;
    if (given !== undefined && given !== '') {
      mkdirSync(given, { recursive: true });
      this.dir = given;
      this.ownsDir = false;
    } else {
      this.dir = mkdtempSync(join(tmpdir(), 'pipwerk-replay-e2e-'));
      this.ownsDir = true;
    }
  }

  /** Writes the INI file and starts the backend. */
  async startBackend(): Promise<void> {
    if (this.backend !== null && this.backend.child.exitCode === null) {
      return;
    }
    const configPath = join(this.dir, 'pipwerk-replay.ini');
    writeFileSync(
      configPath,
      `[database]\nurl = sqlite:///${join(this.dir, 'replay.db')}\n\n[marketdata]\nmax_upload_bytes = ${String(E2E_MAX_UPLOAD_BYTES)}\n`,
      { encoding: 'utf-8', mode: 0o600 },
    );
    this.backend = launch([
      'run', '--frozen', '--project', backendProject,
      'pipwerk-replay', '-c', configPath, '--host', '127.0.0.1', '--port', String(this.backendPort),
    ]);
    await waitFor(`${this.backendUrl}/api/health`, this.backend);
  }

  async stopBackend(): Promise<void> {
    await terminate(this.backend);
    this.backend = null;
  }

  /** Ends and starts the backend again with the same database (a restart of the process). */
  async restartBackend(): Promise<void> {
    await this.stopBackend();
    await this.startBackend();
  }

  /** A backend with an empty database (the state every test starts from). */
  async reset(): Promise<void> {
    await this.stopBackend();
    for (const name of readdirSync(this.dir)) {
      if (name.startsWith('replay.db') || name.startsWith('pipwerk-replay.ini')) {
        rmSync(join(this.dir, name), { force: true });
      }
    }
    await this.startBackend();
  }

  async dispose(): Promise<void> {
    await this.stopBackend();
    if (this.ownsDir) {
      rmSync(this.dir, { recursive: true, force: true });
    }
  }
}
