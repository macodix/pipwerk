import { test as base, expect, type Page } from '@playwright/test';

import { Stack } from './stack';

type WorkerFixtures = { stack: Stack };
type TestFixtures = { fresh: undefined; consoleProblems: string[] };

/**
 * `stack` (per worker): the backend. `fresh` (every test): the backend with an empty database.
 * `consoleProblems`: errors of the console and of the page since the test began.
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

// --- test files: small files made in the test --------------------------------------------

/** A file as Playwright takes it for an input of files. */
export type NamedFile = { name: string; mimeType: string; buffer: Buffer };

export function csvFile(name: string, content: string): NamedFile {
  return { name, mimeType: 'text/csv', buffer: Buffer.from(content, 'utf-8') };
}

export function jsonFile(name: string, document: unknown): NamedFile {
  return { name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document), 'utf-8') };
}

/** A CSV file in the export format of MetaTrader 5 (tab, headers in angle brackets). */
export function mt5Candles(rows: string[][]): string {
  const header = ['<DATE>', '<TIME>', '<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>', '<TICKVOL>', '<VOL>', '<SPREAD>'];
  return `${[header, ...rows].map((row) => row.join('\t')).join('\n')}\n`;
}

/** An hourly candle on 2026-01-05 (a Monday) at `hour`, as a row of the export of MetaTrader 5. */
export function hourly(hour: number, base = 1.1): string[] {
  const time = `${String(hour).padStart(2, '0')}:00:00`;
  const o = base + hour / 1000;
  return ['2026.01.05', time, o.toFixed(5), (o + 0.0005).toFixed(5), (o - 0.0005).toFixed(5), (o + 0.0002).toFixed(5), '100', '0', '12'];
}

/** Candles H1 of 2026-01-05 from 08:00 to 12:00 and from 17:00 to 20:00: nine rows with one gap. */
export const GAPPY_CSV = mt5Candles([8, 9, 10, 11, 12, 17, 18, 19, 20].map((hour) => hourly(hour)));

/** The same candles with a faulty row: the high (1.0) is below the low. */
export const FAULTY_CSV = mt5Candles(
  [8, 9, 10].map((hour) => (hour === 9 ? ['2026.01.05', '09:00:00', '1.1', '1.0', '1.2', '1.1', '1', '0', '1'] : hourly(hour))),
);

/** Candles in the JSON format of the import (`contracts/market-data/v1/candles.schema.json`). */
export function candlesDocument(options: {
  broker: string;
  instrument: string;
  unit: string;
  hours: number[];
}): unknown {
  return {
    version: 1,
    kind: 'candles',
    broker: options.broker,
    instrument: options.instrument,
    time_unit: options.unit,
    candles: options.hours.map((hour) => {
      const price = 1.1 + hour / 1000;
      return {
        time: `2026-01-05T${String(hour).padStart(2, '0')}:00:00Z`,
        open: Number(price.toFixed(5)),
        high: Number((price + 0.0005).toFixed(5)),
        low: Number((price - 0.0005).toFixed(5)),
        close: Number((price + 0.0002).toFixed(5)),
        volume: 100,
      };
    }),
  };
}

/** Contract data in the JSON format of the import (`instrument.schema.json`). */
export function contractDocument(options: { broker: string; instrument: string }): unknown {
  return {
    version: 1,
    kind: 'instrument',
    broker: options.broker,
    instrument: options.instrument,
    acquired_at: '2026-01-05T08:00:00Z',
    tick_size: 0.00001,
    tick_value: 1,
    tick_value_currency: 'USD',
    point: 0.00001,
    pip: 0.0001,
    spread: 0.00012,
    min_volume: 0.01,
    volume_step: 0.01,
    contract_size: 100000,
    swap_long: -6.5,
    swap_short: 2.1,
    swap_triple_weekday: 'wednesday',
    margin_per_lot: 3650,
  };
}

/** Ticks in the JSON format of the import (`ticks.schema.json`). */
export function ticksDocument(options: { broker: string; instrument: string }): unknown {
  return {
    version: 1,
    kind: 'ticks',
    broker: options.broker,
    instrument: options.instrument,
    ticks: [
      { time: '2026-01-05T10:00:00.120Z', bid: 1.1, ask: 1.10008 },
      { time: '2026-01-05T10:00:01.874Z', bid: 1.10001, ask: 1.10009 },
    ],
  };
}

/**
 * Puts files into the data stock through the web API of the backend, for tests that need a filled
 * data stock and are not about the import. `instrument` and `data` per file are for CSV files.
 */
export async function seedFiles(
  backendUrl: string,
  broker: string,
  files: { file: NamedFile; instrument?: string; data?: string }[],
  timezone = 'UTC',
): Promise<void> {
  const form = new FormData();
  form.append('broker', broker);
  form.append('timezone', timezone);
  for (const { file } of files) {
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }), file.name);
  }
  for (const { instrument } of files) {
    form.append('instrument', instrument ?? '');
  }
  for (const { data } of files) {
    form.append('data', data ?? '');
  }
  const response = await fetch(`${backendUrl}/api/v1/market-data/imports`, { method: 'POST', body: form });
  expect(response.status).toBe(200);
  const outcome = (await response.json()) as { refused_count: number };
  expect(outcome.refused_count).toBe(0);
}

/**
 * A data stock with a series with a gap and contract data (`EURUSD`), ticks, candles without
 * contract data (`GBPUSD`) at one broker, and at a second broker candles and contract data only
 * (`GBPUSD`, which makes a row of contract data): five rows.
 */
export async function seedStock(backendUrl: string): Promise<void> {
  await seedFiles(backendUrl, 'Test-Broker', [
    { file: csvFile('EURUSD_H1_202601050000_202601052300.csv', GAPPY_CSV), instrument: 'EURUSD', data: 'h1' },
    { file: jsonFile('EURUSD_CONTRACT.json', contractDocument({ broker: 'x', instrument: 'EURUSD' })) },
    { file: jsonFile('EURUSD_TICKS.json', ticksDocument({ broker: 'x', instrument: 'EURUSD' })) },
    { file: jsonFile('GBPUSD_H4.json', candlesDocument({ broker: 'x', instrument: 'GBPUSD', unit: 'h4', hours: [8, 12, 16] })) },
  ]);
  await seedFiles(backendUrl, 'Zweiter-Broker', [
    { file: jsonFile('USDJPY_D1.json', candlesDocument({ broker: 'x', instrument: 'USDJPY', unit: 'd1', hours: [0] })) },
    { file: jsonFile('GBPUSD_CONTRACT.json', contractDocument({ broker: 'x', instrument: 'GBPUSD' })) },
  ]);
}

// --- operation of the page ---------------------------------------------------------------

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

/** Opens the dialog "Datei importieren". */
export async function openImportDialog(page: Page): Promise<void> {
  await page.getByTestId('import-open').click();
  await expect(page.getByTestId('dialog-import')).toBeVisible();
}

/** Chooses files in the open dialog and waits until the preview has put them into the list. */
export async function chooseImportFiles(page: Page, files: NamedFile[]): Promise<void> {
  const before = await page.getByTestId('import-item').count();
  await page.getByTestId('import-files').setInputFiles(files);
  await expect(page.getByTestId('import-item')).toHaveCount(before + files.length);
}

/** The entry of the list of the dialog for a file. */
export function importItem(page: Page, name: string) {
  return page.locator(`[data-testid="import-item"][data-name="${name}"]`);
}

/** Types the broker (for all files) and the time zone (for all CSV files) into the dialog. */
export async function fillImportBasics(page: Page, options: { broker?: string; timezone?: string }): Promise<void> {
  if (options.broker !== undefined) {
    await page.getByTestId('import-broker').fill(options.broker);
  }
  if (options.timezone !== undefined) {
    await page.getByTestId('import-timezone').fill(options.timezone);
  }
}

/** Clicks "Importieren" and waits for the summary. */
export async function runImport(page: Page): Promise<void> {
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-summary').or(page.getByTestId('import-error'))).toBeVisible();
}
