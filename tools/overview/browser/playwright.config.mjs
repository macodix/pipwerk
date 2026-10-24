import { defineConfig, devices } from '@playwright/test';

// Die Seite erzeugt global-setup.mjs; der Test öffnet sie als Datei.
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.mjs',
  forbidOnly: !!process.env.CI,
  workers: 2,
  retries: 0,
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
