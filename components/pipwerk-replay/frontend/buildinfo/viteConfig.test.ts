// @vitest-environment node
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type ConfigEnv, createServer, type UserConfig } from 'vite';
import { describe, expect, it } from 'vitest';

import configFunction from '../vite.config.ts';
import { lookupGitRevision } from './gitRevision.ts';

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const licenseFile = resolve(frontendDirectory, '../../../LICENSE');

function load(command: ConfigEnv['command']): UserConfig {
  const config = configFunction as unknown as (env: ConfigEnv) => UserConfig;
  return config({ command, mode: command === 'build' ? 'production' : 'development' });
}

describe('vite.config.ts', () => {
  it.each(['build', 'serve'] as const)(
    'sets the build revision for command %s to the lookup for the directory of the configuration',
    (command) => {
      const expected = JSON.stringify(lookupGitRevision(frontendDirectory));

      expect(load(command).define).toEqual({ __PIPWERK_REPLAY_BUILD_REVISION__: expected });
    },
  );

  it('releases exactly the file LICENSE for the development server, besides the default release', () => {
    const allow = load('serve').server?.fs?.allow ?? [];

    expect(existsSync(licenseFile)).toBe(true);
    expect(allow).toContain(licenseFile);
    // Vite compares file entries exactly and checks the import with `?raw` too.
    expect(allow).toContain(`${licenseFile}?raw`);
    // The directory with LICENSE (the root of the repository) is not released as a whole.
    expect(allow).not.toContain(dirname(licenseFile));
    expect(allow.length).toBe(3);
  });

  it('lets the development server deliver LICENSE as text but no other file outside of the project directory', async () => {
    const server = await createServer({
      configFile: resolve(frontendDirectory, 'vite.config.ts'),
      root: frontendDirectory,
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
    try {
      const license = await server.transformRequest(`/@fs${licenseFile}?raw`);
      expect(license?.code).toContain('GNU GENERAL PUBLIC LICENSE');

      const readme = resolve(frontendDirectory, '../../../README.md');
      await expect(server.transformRequest(`/@fs${readme}?raw`)).rejects.toThrow();
    } finally {
      await server.close();
    }
  });

  it('includes the tests under buildinfo in the test run', () => {
    expect(load('serve').test?.include).toContain('buildinfo/**/*.test.ts');
  });

  it('proxies /api to the backend of the environment variable or to the development default', () => {
    const proxy = load('serve').server?.proxy as Record<string, { changeOrigin: boolean }>;

    expect(Object.keys(proxy)).toEqual(['/api']);
    // The header Host stays as the browser sent it; the backend checks it.
    expect(proxy['/api']?.changeOrigin).toBe(false);
  });
});
