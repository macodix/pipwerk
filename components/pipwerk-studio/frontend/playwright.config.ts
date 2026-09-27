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
      command: `uv run --frozen --project ../backend uvicorn --factory pipwerk_studio.app:create_app --host 127.0.0.1 --port ${backendPort}`,
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
