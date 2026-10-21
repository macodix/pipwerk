// @vitest-environment node
import { execFileSync as realExecFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { lookupGitRevision } from './gitRevision.ts';

const state = vi.hoisted(() => ({
  real: null as unknown as typeof import('node:child_process').execFileSync,
}));

// `execFileSync` calls the real function unless a test replaces it.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  state.real = actual.execFileSync;
  return { ...actual, execFileSync: vi.fn(actual.execFileSync) };
});

const execFileSyncMock = vi.mocked(realExecFileSync);

const WARNING = 'pipwerk replay: revision for the About dialog could not be determined';
const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const DATE = '2026-10-09T14:52:03+02:00';
const DIRECTORY = '/nonexistent/marker-directory';

const gitInstalled = spawnSync('git', ['--version']).status === 0;

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  execFileSyncMock.mockReset();
  execFileSyncMock.mockImplementation(state.real);
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

/** A run of the mocked `execFileSync` that returns the given outputs one after another. */
function answers(...outputs: (string | Error)[]): void {
  let index = 0;
  execFileSyncMock.mockImplementation((() => {
    const output = outputs[index];
    index += 1;
    if (output instanceof Error) {
      throw output;
    }
    return output ?? '';
  }) as unknown as typeof realExecFileSync);
}

function expectOneFixedWarning(): void {
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(WARNING);
}

describe.skipIf(!gitInstalled)('lookupGitRevision with real Git', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pipwerk-replay-revision-'));
    // Git is separated from the user's and the system's configuration.
    vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
    vi.stubEnv('GIT_CONFIG_SYSTEM', '/dev/null');
    vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1');
    vi.stubEnv('GIT_DIR', undefined);
    vi.stubEnv('GIT_WORK_TREE', undefined);
    vi.stubEnv('GIT_INDEX_FILE', undefined);
    vi.stubEnv('GIT_CEILING_DIRECTORIES', dirname(root));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function git(...args: string[]): string {
    return realExecFileSync('git', ['-C', root, ...args], { encoding: 'utf-8' }).trim();
  }

  it('returns commit and committer date of a repository with a fixed date', () => {
    git('init', '--quiet');
    writeFileSync(join(root, 'file.txt'), 'content\n');
    git('add', 'file.txt');
    vi.stubEnv('GIT_COMMITTER_DATE', DATE);
    vi.stubEnv('GIT_AUTHOR_DATE', '2020-01-01T00:00:00+00:00');
    git(
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'test',
    );
    vi.stubEnv('GIT_COMMITTER_DATE', undefined);
    vi.stubEnv('GIT_AUTHOR_DATE', undefined);

    const revision = lookupGitRevision(root);

    expect(revision).toEqual({ commit: git('rev-parse', 'HEAD'), committedAt: DATE });
    expect(revision?.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns null with one warning outside of any Git working tree', () => {
    const outside = join(root, 'outside');
    mkdirSync(outside);

    expect(lookupGitRevision(outside)).toBeNull();
    expectOneFixedWarning();
  });

  it('returns null with one warning in a repository without a commit', () => {
    git('init', '--quiet');

    expect(lookupGitRevision(root)).toBeNull();
    expectOneFixedWarning();
  });
});

describe('lookupGitRevision with replaced Git calls', () => {
  it('returns commit and date from valid outputs and removes the trailing new line', () => {
    answers(`${COMMIT}\n`, `${DATE}\n`);

    expect(lookupGitRevision(DIRECTORY)).toEqual({ commit: COMMIT, committedAt: DATE });
    expect(warn).not.toHaveBeenCalled();
  });

  it('calls Git twice, in the given directory, without a shell and with a fixed argument list', () => {
    answers(`${COMMIT}\n`, `${DATE}\n`);

    lookupGitRevision(DIRECTORY);

    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
    const [first, second] = execFileSyncMock.mock.calls;
    expect(first?.[0]).toBe('git');
    expect(first?.[1]).toEqual(['-C', DIRECTORY, 'rev-parse', 'HEAD']);
    expect(second?.[0]).toBe('git');
    expect(second?.[1]).toEqual(['-C', DIRECTORY, 'log', '-1', '--no-show-signature', '--format=%cI', COMMIT]);
    for (const call of [first, second]) {
      const options = call?.[2] as Record<string, unknown>;
      expect(options.shell).toBeUndefined();
      expect(options.encoding).toBe('utf-8');
      expect(options.timeout).toBe(5000);
      expect((options.stdio as unknown[])[0]).toBe('ignore');
    }
  });

  it.each([
    ['Git cannot be run', new Error('spawn git ENOENT')],
    [
      'the time limit is exceeded',
      Object.assign(new Error('spawnSync git ETIMEDOUT'), { code: 'ETIMEDOUT' }),
    ],
    [
      'the exit code is not 0',
      Object.assign(new Error('Command failed'), { status: 128, stdout: 'OUT', stderr: 'ERR' }),
    ],
  ])('returns null with one fixed warning if %s at the first call', (_name, error) => {
    answers(error);

    expect(lookupGitRevision(DIRECTORY)).toBeNull();
    expectOneFixedWarning();
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Git cannot be run', new Error('spawn git ENOENT')],
    ['the time limit is exceeded', Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' })],
    ['the exit code is not 0', Object.assign(new Error('Command failed'), { status: 1 })],
  ])('returns null with one fixed warning if %s at the second call', (_name, error) => {
    answers(`${COMMIT}\n`, error);

    expect(lookupGitRevision(DIRECTORY)).toBeNull();
    expectOneFixedWarning();
  });

  it.each([
    ['an empty output', ''],
    ['a short commit', COMMIT.slice(0, 7)],
    ['a commit with 39 characters', COMMIT.slice(1)],
    ['a commit with 41 characters', `${COMMIT}0`],
    ['a commit with capital letters', COMMIT.toUpperCase()],
    ['a commit with other characters', `${COMMIT.slice(1)}g`],
    ['two lines', `${COMMIT}\n${COMMIT}`],
    ['a commit with a space at the end', `${COMMIT} `],
  ])('returns null with one fixed warning and no second call for %s', (_name, output) => {
    answers(`${output}\n`, `${DATE}\n`);

    expect(lookupGitRevision(DIRECTORY)).toBeNull();
    expectOneFixedWarning();
    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an empty output', ''],
    ['a date without a time zone', '2026-10-09T14:52:03'],
    ['an impossible date', '2026-02-31T14:52:03+02:00'],
    ['another format', 'Fri Oct 9 14:52:03 2026 +0200'],
    ['several lines', `${DATE}\n${DATE}`],
    ['a date with a space at the end', `${DATE} `],
  ])('returns null with one fixed warning for %s as the date', (_name, output) => {
    answers(`${COMMIT}\n`, `${output}\n`);

    expect(lookupGitRevision(DIRECTORY)).toBeNull();
    expectOneFixedWarning();
    expect(execFileSyncMock).toHaveBeenCalledTimes(2);
  });

  it('returns null with one fixed warning if the call throws something else than an error', () => {
    execFileSyncMock.mockImplementation((() => {
      throw 'a text';
    }) as unknown as typeof realExecFileSync);

    expect(lookupGitRevision(DIRECTORY)).toBeNull();
    expectOneFixedWarning();
  });

  it('leaves no Git output, exception text, path or commit in the warning', () => {
    const error = Object.assign(new Error('EXCEPTION-MARKER'), {
      stdout: 'STDOUT-MARKER',
      stderr: 'STDERR-MARKER',
    });
    answers(`${COMMIT}\n`, error);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    lookupGitRevision(DIRECTORY);

    const output = JSON.stringify([warn.mock.calls, errorSpy.mock.calls, logSpy.mock.calls]);
    for (const forbidden of ['EXCEPTION-MARKER', 'STDOUT-MARKER', 'STDERR-MARKER', DIRECTORY, COMMIT]) {
      expect(output).not.toContain(forbidden);
    }
    expectOneFixedWarning();
  });
});
