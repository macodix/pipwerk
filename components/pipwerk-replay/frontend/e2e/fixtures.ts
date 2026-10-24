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

/** A CSV file (export format of MetaTrader 5) with hourly candles H1 on `day` (`YYYY-MM-DD`). */
export function dayCsv(day: string, hours: number[]): string {
  const rows = hours.map((hour) => {
    const o = 1.1 + hour / 1000;
    return [day.replaceAll('-', '.'), `${String(hour).padStart(2, '0')}:00:00`, o.toFixed(5), (o + 0.0005).toFixed(5), (o - 0.0005).toFixed(5), (o + 0.0002).toFixed(5), '100', '0', '12'];
  });
  return mt5Candles(rows);
}

/** A CSV file in the export format of MetaTrader 5 (tab, headers in angle brackets). */
export function mt5Candles(rows: string[][]): string {
  const header = ['<DATE>', '<TIME>', '<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>', '<TICKVOL>', '<VOL>', '<SPREAD>'];
  return `${[header, ...rows].map((row) => row.join('\t')).join('\n')}\n`;
}

/** An hourly candle on 2026-01-05 (a Monday) at `hour`, as a row of the export of MetaTrader 5. */
export function hourly(hour: number, base = 1.1, date = '2026.01.05'): string[] {
  const time = `${String(hour).padStart(2, '0')}:00:00`;
  const o = base + hour / 1000;
  return [date, time, o.toFixed(5), (o + 0.0005).toFixed(5), (o - 0.0005).toFixed(5), (o + 0.0002).toFixed(5), '100', '0', '12'];
}

/**
 * Candles H1 of 2026-01-05 from 08:00 to 12:00 and from 17:00 to 20:00: nine rows. The file
 * covers the whole day (specification 5.2), so the hours without candles in it are no gap.
 */
export const GAPPY_CSV = mt5Candles([8, 9, 10, 11, 12, 17, 18, 19, 20].map((hour) => hourly(hour)));

/**
 * Candles H1 of Wednesday 2026-01-07: together with `GAPPY_CSV` in one series, Tuesday 2026-01-06
 * lies between two covered periods and is a gap.
 */
export const WEDNESDAY_CSV = mt5Candles([8, 9, 10, 11, 12].map((hour) => hourly(hour, 1.1, '2026.01.07')));

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

/** Begins an import process through the web API and returns its identifier. */
export async function beginProcess(backendUrl: string): Promise<string> {
  const response = await fetch(`${backendUrl}/api/v1/market-data/import-processes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

/** Ends (`finish`) or aborts an import process through the web API. */
export async function endProcess(backendUrl: string, id: string, how: 'finish' | 'abort'): Promise<void> {
  const response = await fetch(`${backendUrl}/api/v1/market-data/import-processes/${id}/${how}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  expect(response.status).toBe(200);
}

/**
 * Puts files into the data stock through the web API of the backend (one import process, one
 * request per file), for tests that need a filled data stock and are not about the import.
 * `instrument` and `data` per file are for CSV files.
 */
export async function seedFiles(
  backendUrl: string,
  broker: string,
  files: { file: NamedFile; instrument?: string; data?: string }[],
  timezone = 'UTC',
): Promise<void> {
  const id = await beginProcess(backendUrl);
  for (const { file, instrument, data } of files) {
    const form = new FormData();
    form.append('broker', broker);
    form.append('timezone', timezone);
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }), file.name);
    form.append('instrument', instrument ?? '');
    form.append('data', data ?? '');
    const response = await fetch(`${backendUrl}/api/v1/market-data/import-processes/${id}/files`, {
      method: 'POST',
      body: form,
    });
    expect(response.status).toBe(200);
    const outcome = (await response.json()) as { refused: boolean };
    expect(outcome.refused, file.name).toBe(false);
  }
  await endProcess(backendUrl, id, 'finish');
}

/**
 * Candles M1 on 2026-01-05 from 00:00, `count` of them, in the JSON format of the import. A
 * candle is about 100 bytes, so `count` sets the size of the file.
 */
export function minuteCandles(options: { broker: string; instrument: string; count: number }): unknown {
  const start = Date.UTC(2026, 0, 5, 0, 0);
  return {
    version: 1,
    kind: 'candles',
    broker: options.broker,
    instrument: options.instrument,
    time_unit: 'm1',
    candles: Array.from({ length: options.count }, (_, index) => {
      const price = 1.1 + (index % 100) / 10000;
      return {
        time: new Date(start + index * 60_000).toISOString().replace('.000Z', 'Z'),
        open: Number(price.toFixed(5)),
        high: Number((price + 0.0005).toFixed(5)),
        low: Number((price - 0.0005).toFixed(5)),
        close: Number((price + 0.0002).toFixed(5)),
        volume: 100,
      };
    }),
  };
}

/**
 * A data stock with a series with a gap (Tuesday between two files) and contract data (`EURUSD`), ticks, candles without
 * contract data (`GBPUSD`) at one broker, and at a second broker candles and contract data only
 * (`GBPUSD`, which makes a row of contract data): five rows.
 */
export async function seedStock(backendUrl: string): Promise<void> {
  await seedFiles(backendUrl, 'Test-Broker', [
    { file: csvFile('EURUSD_H1_202601050000_202601052300.csv', GAPPY_CSV), instrument: 'EURUSD', data: 'h1' },
    { file: csvFile('EURUSD_H1_202601070000_202601072300.csv', WEDNESDAY_CSV), instrument: 'EURUSD', data: 'h1' },
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

export async function chooseView(page: Page, view: 'data' | 'accounts' | 'settings'): Promise<void> {
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

/**
 * Holds every request of a file of an import process back for `ms` milliseconds before it goes on
 * to the real backend. The backend is not replaced; the requests only take longer, so that the
 * running import can be seen and cancelled.
 */
export async function slowDownFiles(page: Page, ms: number): Promise<void> {
  await page.route('**/api/v1/market-data/import-processes/*/files', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

/** The rows of the data stock as the web API lists them (for checks behind the page). */
export async function seriesOf(backendUrl: string, query = ''): Promise<{ total: number; items: Record<string, unknown>[] }> {
  const response = await fetch(`${backendUrl}/api/v1/market-data/series?limit=100${query}`);
  expect(response.status).toBe(200);
  return (await response.json()) as { total: number; items: Record<string, unknown>[] };
}

// --- settings for files and the import directory ------------------------------------------

export type FileSettingsBody = {
  keep_imported_files: boolean;
  storage_directory: { path: string | null; is_default: boolean };
  import_directory: { path: string | null; is_default: boolean };
  export_directory: { path: string | null; is_default: boolean };
};

/** Sets the settings for files through the internal endpoint (not through the page). */
export async function putFileSettings(
  backendUrl: string,
  settings: { keep?: boolean; storage?: string | null; import?: string | null; export?: string | null },
): Promise<void> {
  const response = await fetch(`${backendUrl}/api/replay/settings/files`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keep_imported_files: settings.keep ?? false,
      storage_directory: settings.storage ?? null,
      import_directory: settings.import ?? null,
      export_directory: settings.export ?? null,
    }),
  });
  expect(response.status).toBe(200);
}

export async function getFileSettings(backendUrl: string): Promise<FileSettingsBody> {
  const response = await fetch(`${backendUrl}/api/replay/settings/files`);
  expect(response.status).toBe(200);
  return (await response.json()) as FileSettingsBody;
}

/** Opens the choice in the import directory of the open dialog "Datei importieren". */
export async function openPicker(page: Page): Promise<void> {
  await page.getByTestId('import-choose-directory').click();
  await expect(page.getByTestId('picker')).toBeVisible();
  await expect(
    page.getByTestId('picker-list').or(page.getByTestId('picker-empty')).or(page.getByTestId('picker-error')),
  ).toBeVisible();
}

/** The entry (file) of the choice for a name. */
export function pickerFile(page: Page, name: string) {
  return page.locator(`[data-testid="picker-file"][data-name="${name}"]`);
}

/** Opens a subdirectory of the choice. */
export async function openPickerDirectory(page: Page, name: string): Promise<void> {
  await page.locator(`[data-testid="picker-dir"][data-name="${name}"] [data-testid="picker-open"]`).click();
  await expect(page.getByTestId('picker-crumb').last()).toHaveText(name);
}
