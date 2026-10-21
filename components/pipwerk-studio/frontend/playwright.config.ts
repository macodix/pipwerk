import { defineConfig, devices } from '@playwright/test';

// The end-to-end tests start their own backend and frontend on separate ports,
// so they do not interfere with a development instance.
const backendPort = Number(process.env.PIPWERK_STUDIO_E2E_BACKEND_PORT ?? 18000);
const frontendPort = Number(process.env.PIPWERK_STUDIO_E2E_FRONTEND_PORT ?? 15173);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

// With PIPWERK_STUDIO_E2E_STUB=1 the tests run without the backend: a fake backend in the browser answers the requests
// of the interface (`src/testing/fakeApi.ts`). That is for the time until the backend of the branch speaks format 2.0;
// the report of a run names the mode.
const stub = process.env.PIPWERK_STUDIO_E2E_STUB === '1';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  // All projects intentionally share one isolated temporary Studio database.
  // Serial execution prevents language-changing tests in different browsers
  // from racing against each other.
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: frontendUrl,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    ...(stub
      ? []
      : [
          {
            command: `node e2e/start-backend.mjs ${backendPort}`,
            // Lets the launcher remove its temporary database directory.
            gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 10_000 },
            url: `${backendUrl}/api/health`,
            reuseExistingServer: false,
          },
        ]),
    {
      // The tests run against the built user interface, as the test environment
      // delivers it: first the build into its own directory (a user interface in
      // `dist` stays untouched), then `vite preview` for that directory.
      command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: false,
      // The time limit covers the build.
      timeout: 180_000,
      env: { PIPWERK_STUDIO_BACKEND_URL: backendUrl },
    },
  ],
});
