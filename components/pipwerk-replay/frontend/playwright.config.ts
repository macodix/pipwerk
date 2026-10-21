import { createServer } from 'node:net';

import { defineConfig, devices } from '@playwright/test';

// The browser tests start their own backend, their own replica of the source and their own
// user interface; they do not interfere with a development instance or the test environment.
// Ports and the directory of the databases are parameters (environment variables):
//
//   PIPWERK_REPLAY_E2E_FRONTEND_PORT   port of the user interface
//   PIPWERK_REPLAY_E2E_BACKEND_PORT    port of the backend
//   PIPWERK_REPLAY_E2E_SOURCE_PORT     port of the replica of the source
//   PIPWERK_REPLAY_E2E_DATA_DIR        directory for the databases (default: a new temporary one)
//
// A port that is not given is a free port that is determined once, here, and passed on to the
// runner and the workers by the environment (the configuration is loaded in each of them).
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

async function port(name: string): Promise<number> {
  const given = process.env[name];
  if (given === undefined || given === '') {
    process.env[name] = String(await freePort());
  }
  return Number(process.env[name]);
}

const frontendPort = await port('PIPWERK_REPLAY_E2E_FRONTEND_PORT');
const backendPort = await port('PIPWERK_REPLAY_E2E_BACKEND_PORT');
await port('PIPWERK_REPLAY_E2E_SOURCE_PORT');
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  // The tests share one backend with one database; they reset it before each test. Serial
  // execution keeps them from disturbing each other.
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: frontendUrl,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The start of the built user interface is checked in the other engines as well.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /smoke\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /smoke\.spec\.ts/ },
  ],
  webServer: {
    // The tests run against the built user interface, as the test environment delivers it:
    // first the build into its own directory (a user interface in `dist` stays untouched),
    // then `vite preview` for that directory.
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${frontendPort}`,
    url: frontendUrl,
    reuseExistingServer: false,
    // The time limit covers the build.
    timeout: 180_000,
    env: { PIPWERK_REPLAY_BACKEND_URL: backendUrl },
  },
});
