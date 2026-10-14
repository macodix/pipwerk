import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

import { lookupGitRevision } from './buildinfo/gitRevision.ts';

// Address of the pipwerk Studio backend that receives the /api requests of the
// development server. It can be changed without editing this file.
const backendUrl = process.env.PIPWERK_STUDIO_BACKEND_URL ?? 'http://127.0.0.1:8000';

const proxy = {
  '/api': { target: backendUrl, changeOrigin: false },
};

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

export default defineConfig(() => ({
  plugins: [react()],
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
}));
