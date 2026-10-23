import { defineConfig, devices } from '@playwright/test';

// The tests open the built single HTML file from file:// (no server). Build first: npm run build.
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { trace: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testMatch: /(build-str03|build-str01|layout|features|objects|names|assistant|properties-only|buttons|smoke)\.spec\.ts/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /smoke\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /smoke\.spec\.ts/ },
    { name: 'screenshots', use: { ...devices['Desktop Chrome'] }, testMatch: /screenshots\.spec\.ts/ },
  ],
});
