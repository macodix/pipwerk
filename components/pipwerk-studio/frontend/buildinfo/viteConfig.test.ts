// @vitest-environment node
import { existsSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type ConfigEnv, createServer, type UserConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import configFunction from '../vite.config.ts';
import { lookupGitRevision } from './gitRevision.ts';

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const licenseFile = resolve(frontendDirectory, '../../../LICENSE');

function load(command: ConfigEnv['command']): UserConfig {
  const config = configFunction as unknown as (env: ConfigEnv) => UserConfig;
  return config({ command, mode: command === 'build' ? 'production' : 'development' });
}

function plugins(config: UserConfig): string[] {
  return (config.plugins ?? []).flat(5).flatMap((plugin) => (plugin && typeof plugin === 'object' && 'name' in plugin ? [plugin.name] : []));
}

describe('vite.config.ts', () => {
  it.each(['build', 'serve'] as const)(
    'sets the build revision for command %s to the lookup for the directory of the configuration',
    (command) => {
      const expected = JSON.stringify(lookupGitRevision(frontendDirectory));

      expect(load(command).define).toEqual({ __PIPWERK_STUDIO_BUILD_REVISION__: expected });
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

  it('forwards /api to the address in PIPWERK_STUDIO_BACKEND_URL for the server and the preview', () => {
    vi.stubEnv('PIPWERK_STUDIO_BACKEND_URL', 'http://backend.test:1234');
    try {
      const config = load('serve');

      expect(config.server?.proxy).toEqual({ '/api': { target: 'http://backend.test:1234', changeOrigin: false } });
      expect(config.preview?.proxy).toEqual(config.server?.proxy);
      expect(plugins(config)).not.toContain('pipwerk-studio-missing-backend-url');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('has no default address: without the value there is no proxy, and a plugin answers /api with an error naming the value', () => {
    vi.stubEnv('PIPWERK_STUDIO_BACKEND_URL', '');
    try {
      for (const command of ['build', 'serve'] as const) {
        const config = load(command);

        expect(config.server?.proxy).toBeUndefined();
        expect(config.preview?.proxy).toBeUndefined();
        expect(plugins(config)).toContain('pipwerk-studio-missing-backend-url');
      }
      expect(JSON.stringify(load('serve'))).not.toMatch(/127\.0\.0\.1:\d|localhost:\d/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('answers a request to /api of a server without the address with status 503 and the name of the value', async () => {
    vi.stubEnv('PIPWERK_STUDIO_BACKEND_URL', '');
    const server = await createServer({
      configFile: resolve(frontendDirectory, 'vite.config.ts'),
      root: frontendDirectory,
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
    const listener = createHttpServer(server.middlewares);
    try {
      await new Promise<void>((done) => listener.listen(0, '127.0.0.1', done));
      const address = listener.address() as AddressInfo;
      const answer = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);

      expect(answer.status).toBe(503);
      expect(await answer.text()).toContain('PIPWERK_STUDIO_BACKEND_URL');
    } finally {
      await new Promise((done) => listener.close(done));
      await server.close();
      vi.unstubAllEnvs();
    }
  });

  it('includes the tests under buildinfo in the test run', () => {
    expect(load('serve').test?.include).toContain('buildinfo/**/*.test.ts');
  });
});
