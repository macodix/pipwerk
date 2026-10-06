import { defineConfig, devices } from '@playwright/test';

// The end-to-end tests start their own backend and frontend on separate ports,
// so they do not interfere with a development instance.
const backendPort = Number(process.env.PIPWERK_STUDIO_E2E_BACKEND_PORT ?? 18000);
const frontendPort = Number(process.env.PIPWERK_STUDIO_E2E_FRONTEND_PORT ?? 15173);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

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
    {
      command: `node e2e/start-backend.mjs ${backendPort}`,
      // Lets the launcher remove its temporary database directory.
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
      url: `${backendUrl}/api/health`,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${frontendPort}`,
      url: frontendUrl,
      reuseExistingServer: false,
      env: { PIPWERK_STUDIO_BACKEND_URL: backendUrl },
    },
  ],
});
