import { defineConfig } from '@playwright/test';

// Chromium fuer den Browsertest und die Bildschirmbilder; Firefox und WebKit
// pruefen dieselben Tests (Aufruf mit --project=firefox beziehungsweise --project=webkit).
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.js',
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
