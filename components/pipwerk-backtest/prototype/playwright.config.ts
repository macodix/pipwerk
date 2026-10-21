import { defineConfig, devices } from '@playwright/test';

// The browser tests open the built single HTML file from file:// (no server). Build first: npm run build.
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { trace: 'off' },
  projects: [
    { name: 'sim', testMatch: /sim\.spec\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testMatch: /(replay|layout|features|smoke)\.spec\.ts/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /smoke\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /smoke\.spec\.ts/ },
    { name: 'screenshots', use: { ...devices['Desktop Chrome'] }, testMatch: /screenshots\.spec\.ts/ },
  ],
});
