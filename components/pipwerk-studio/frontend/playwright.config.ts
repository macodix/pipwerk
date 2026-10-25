import { defineConfig, devices } from '@playwright/test';

// The end-to-end tests start their own backend and frontend on separate ports,
// so they do not interfere with a development instance.
// The ports are required parameters; there are no default ports.
function requiredPort(name: string): number {
  const value = process.env[name];
  if (!value || !/^[0-9]+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error(`${name} is required: a port from 1 to 65535 for the end-to-end tests (the check script passes it).`);
  }
  return Number(value);
}

const backendPort = requiredPort('PIPWERK_STUDIO_E2E_BACKEND_PORT');
const frontendPort = requiredPort('PIPWERK_STUDIO_E2E_FRONTEND_PORT');
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
      gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 10_000 },
      url: `${backendUrl}/api/health`,
      reuseExistingServer: false,
    },
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
