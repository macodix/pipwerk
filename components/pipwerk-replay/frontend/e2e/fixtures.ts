import { test as base, expect, type Page } from '@playwright/test';

import { Stack } from './stack';

type WorkerFixtures = { stack: Stack };
type TestFixtures = { fresh: undefined; consoleProblems: string[] };

/**
 * `stack` (per worker): replica of the source and backend. `fresh` (every test): the backend with
 * empty databases and the source running. `consoleProblems`: errors of the console and of the
 * page since the test began.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  stack: [
    async ({}, use) => {
      const stack = new Stack();
      await use(stack);
      await stack.dispose();
    },
    { scope: 'worker' },
  ],
  fresh: [
    async ({ stack }, use) => {
      await stack.reset();
      await use(undefined);
    },
    { auto: true },
  ],
  consoleProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          problems.push(`console: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        problems.push(`page: ${error.message}`);
      });
      await use(problems);
    },
    { auto: true },
  ],
});

export { expect };

/** The six window sizes of the specification (8.4, point 1). */
export const WINDOW_SIZES = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
] as const;

/** A CSV file in the export format of MetaTrader 5 (tab, headers in angle brackets). */
export function mt5Candles(rows: string[][]): string {
  const header = ['<DATE>', '<TIME>', '<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>', '<TICKVOL>', '<VOL>', '<SPREAD>'];
  return `${[header, ...rows].map((row) => row.join('\t')).join('\n')}\n`;
}

/** An hourly candle on 2026-01-05 (a Monday) at `hour`. */
export function hourly(hour: number, base = 1.1): string[] {
  const time = `${String(hour).padStart(2, '0')}:00:00`;
  const o = base + hour / 1000;
  return ['2026.01.05', time, o.toFixed(5), (o + 0.0005).toFixed(5), (o - 0.0005).toFixed(5), (o + 0.0002).toFixed(5), '100', '0', '12'];
}

/** Candles H1 of 2026-01-05 from 08:00 to 12:00 and from 17:00 to 20:00: nine rows with a gap. */
export const GAPPY_CSV = mt5Candles([8, 9, 10, 11, 12, 17, 18, 19, 20].map((hour) => hourly(hour)));

export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('footer')).toContainText('Backend: verbunden');
}

export async function chooseView(page: Page, view: 'data' | 'accounts'): Promise<void> {
  const full = page.getByTestId(`menu-${view}`);
  if (await full.isVisible()) {
    await full.click();
  } else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId(`cmenu-${view}`).click();
  }
  await expect(page.getByTestId(view)).toBeVisible();
}

/** Imports a CSV file with the operation of the page. */
export async function importCsv(
  page: Page,
  options: { content: string; name?: string; broker: string; instrument: string; timeUnit?: string; timezone: string },
): Promise<void> {
  await page.getByTestId('import-file').setInputFiles({
    name: options.name ?? 'export.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(options.content, 'utf-8'),
  });
  await page.getByTestId('import-broker').fill(options.broker);
  await page.getByTestId('import-instrument').fill(options.instrument);
  if (options.timeUnit !== undefined) {
    await page.getByTestId('import-time-unit').selectOption(options.timeUnit);
  }
  await page.getByTestId('import-timezone').fill(options.timezone);
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-result').or(page.getByTestId('import-error'))).toBeVisible();
}
