// The programs behind the browser tests: a replica of the source (the same program that
// `pipwerk-fetch-mt5` offers for tests) and the real backend of pipwerk replay with its own
// databases. The tests can stop and restart both.
//
// Only the documented startup configuration is used: a temporary INI file is written and
// passed with `-c <PATH>`. Ports and the directory of the databases come from the environment
// (see playwright.config.ts).
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The key between the backend and the replica of the source: a value for tests, no secret. */
export const SOURCE_KEY = 'e2e-source-key-0123456789abcdef';

/** The name of the broker in the files of the replica of the source. */
export const SOURCE_BROKER = 'Fake-Broker-Demo';

const backendProject = resolve(dirname(fileURLToPath(import.meta.url)), '../../backend');
const STOP_TIMEOUT_MS = 10_000;

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
  readonly sourcePort = requiredPort('PIPWERK_REPLAY_E2E_SOURCE_PORT');
  readonly backendUrl = `http://127.0.0.1:${String(this.backendPort)}`;
  private readonly dir: string;
  private readonly ownsDir: boolean;
  private backend: Running | null = null;
  private source: Running | null = null;

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

  async startSource(): Promise<void> {
    if (this.source !== null && this.source.child.exitCode === null) {
      return;
    }
    this.source = launch([
      'run', '--frozen', '--project', backendProject,
      'python', '-m', 'pipwerk_fetch_mt5.fake_source',
      '--port', String(this.sourcePort), '--key', SOURCE_KEY,
    ]);
    // The replica answers every path with a status; any answer shows that it listens.
    const end = Date.now() + 60_000;
    while (Date.now() < end) {
      try {
        await fetch(`http://127.0.0.1:${String(this.sourcePort)}/api/v1/health`);
        return;
      } catch {
        if (this.source.child.exitCode !== null) {
          throw new Error('The replica of the source ended during the start');
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    throw new Error('The replica of the source does not answer');
  }

  async stopSource(): Promise<void> {
    await terminate(this.source);
    this.source = null;
  }

  /** Writes the INI file and starts the backend; `withSource: false` sets up no source. */
  async startBackend(withSource = true): Promise<void> {
    if (this.backend !== null && this.backend.child.exitCode === null) {
      return;
    }
    const lines = ['[database]', `url = sqlite:///${join(this.dir, 'replay.db')}`];
    if (withSource) {
      lines.push(
        '[source]',
        `fetch_url = http://127.0.0.1:${String(this.sourcePort)}`,
        `fetch_key = ${SOURCE_KEY}`,
      );
    }
    const configPath = join(this.dir, 'pipwerk-replay.ini');
    writeFileSync(configPath, `${lines.join('\n')}\n`, { encoding: 'utf-8', mode: 0o600 });
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

  /** Ends and starts the backend again with the same databases (a restart of the process). */
  async restartBackend(withSource = true): Promise<void> {
    await this.stopBackend();
    await this.startBackend(withSource);
  }

  /** A backend with empty databases and the source running (the state every test starts from). */
  async reset(withSource = true): Promise<void> {
    await this.stopBackend();
    for (const name of readdirSync(this.dir)) {
      if (name.startsWith('replay.db') || name.startsWith('pipwerk-replay.ini')) {
        rmSync(join(this.dir, name), { force: true });
      }
    }
    await this.startSource();
    await this.startBackend(withSource);
  }

  async dispose(): Promise<void> {
    await this.stopBackend();
    await this.stopSource();
    if (this.ownsDir) {
      rmSync(this.dir, { recursive: true, force: true });
    }
  }
}
