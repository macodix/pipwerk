import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { type Plugin, searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

import { lookupGitRevision } from './buildinfo/gitRevision.ts';

// Address of the pipwerk Studio backend that receives the /api requests of the
// development server and the preview. The scripts `check` and `testenv` and the
// browser test configuration pass it in PIPWERK_STUDIO_BACKEND_URL; there is no
// default value (no port in the code). Without it the build and the unit tests
// run as usual; a server that is started without it answers every /api request
// with an error that names the missing value.
const backendUrlName = 'PIPWERK_STUDIO_BACKEND_URL';

function backendProxy(backendUrl: string | undefined) {
  return backendUrl === undefined || backendUrl === ''
    ? undefined
    : { '/api': { target: backendUrl, changeOrigin: false } };
}

const missingBackendUrl: Plugin = {
  name: 'pipwerk-studio-missing-backend-url',
  configureServer(server) {
    server.middlewares.use('/api', answerMissingBackendUrl);
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api', answerMissingBackendUrl);
  },
};

function answerMissingBackendUrl(_request: IncomingMessage, response: ServerResponse): void {
  response.statusCode = 503;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end(`The address of the backend is missing: set ${backendUrlName}.`);
}

const frontendDirectory = dirname(fileURLToPath(import.meta.url));

// The license text is the file LICENSE in the root directory of the repository.
// The About dialog includes it as text (import with `?raw`); the development
// server may deliver exactly this file from outside the project directory.
// Vite checks the path with and without the query `?raw` against the list and
// compares file entries exactly, so both spellings of the one file are listed.
// No directory is released.
const licenseFile = resolve(frontendDirectory, '../../../LICENSE');

// Commit and date of the commit for the About dialog. Determined once when the
// configuration is loaded, for `vite build`, `vite` and `vite preview` alike.
const buildRevision = lookupGitRevision(frontendDirectory);

export default defineConfig(() => {
  // Read when the configuration is loaded, not when the file is imported.
  const proxy = backendProxy(process.env[backendUrlName]);
  return {
    plugins: proxy === undefined ? [react(), missingBackendUrl] : [react()],
    define: {
      __PIPWERK_STUDIO_BUILD_REVISION__: JSON.stringify(buildRevision),
    },
    server: {
      host: '127.0.0.1',
      strictPort: true,
      proxy,
      fs: {
        allow: [searchForWorkspaceRoot(frontendDirectory), licenseFile, `${licenseFile}?raw`],
      },
    },
    preview: {
      host: '127.0.0.1',
      strictPort: true,
      proxy,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'buildinfo/**/*.test.ts'],
    },
  };
});
