import { GAPPY_CSV, chooseView, expect, hourly, importCsv, mt5Candles, openApp, test } from './fixtures';
import { SOURCE_BROKER } from './stack';

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test.describe('import', () => {
  test('imports a CSV file in the export format of MetaTrader 5 and shows series, period and gaps', async ({ page }) => {
    await expect(page.getByTestId('stock-empty')).toBeVisible();

    await importCsv(page, { content: GAPPY_CSV, broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'UTC' });

    await expect(page.getByTestId('import-summary')).toContainText('9 Zeilen übernommen, davon 0 als Ersatz');
    await expect(page.getByTestId('import-series')).toHaveText('Test-Broker · EURUSD · Kerzen H1');
    // The period is the one of the rows taken over: the first and the last opening time.
    await expect(page.getByTestId('import-period')).toContainText('05.01.2026 08:00 – 05.01.2026 20:00');
    await expect(page.getByTestId('import-rejected-count')).toHaveText('0');

    const row = page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-unit="h1"]');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Test-Broker');
    await expect(row).toContainText('Kerzen H1');
    await expect(row.getByTestId('stock-periods')).toContainText('05.01.2026 08:00');
    await expect(row.getByTestId('stock-periods')).toContainText('05.01.2026 21:00');
    await expect(row).toContainText('9');
    await expect(row.getByTestId('stock-gaps')).toHaveAttribute('data-gap-count', '1');
    await expect(row.getByTestId('stock-gaps')).toContainText('05.01.2026 13:00 – 05.01.2026 17:00');
  });

  test('converts the times with the time zone of the file to UTC', async ({ page }) => {
    // 08:00 to 12:00 in Athens (UTC+2 in January) is 06:00 to 10:00 UTC.
    const content = mt5Candles([8, 9, 10, 11, 12].map((hour) => hourly(hour)));

    await importCsv(page, { content, broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'Europe/Athens' });

    await expect(page.getByTestId('import-period')).toContainText('05.01.2026 06:00 – 05.01.2026 10:00');
  });

  test('imports a file with faulty rows and names every rejected row with its reason', async ({ page }) => {
    const rows = [hourly(8), hourly(9), hourly(10), hourly(11), hourly(12)];
    // Line 3 (header is line 1): high below low. Line 5: a value that is no number.
    rows[1] = ['2026.01.05', '09:00:00', '1.10900', '1.10000', '1.11000', '1.10950', '100', '0', '12'];
    rows[3] = ['2026.01.05', '11:00:00', 'abc', '1.11200', '1.11000', '1.11100', '100', '0', '12'];

    await importCsv(page, { content: mt5Candles(rows), broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'UTC' });

    await expect(page.getByTestId('import-summary')).toContainText('3 Zeilen übernommen');
    await expect(page.getByTestId('import-rejected-count')).toHaveText('2');
    const rejected = page.getByTestId('import-rejected-row');
    await expect(rejected).toHaveCount(2);
    await expect(rejected.nth(0)).toContainText('3');
    await expect(rejected.nth(0)).toHaveAttribute('data-reason', 'high_below_open');
    await expect(rejected.nth(0)).toContainText('Hoch liegt unter der Eröffnung.');
    await expect(rejected.nth(1)).toContainText('5');
    await expect(rejected.nth(1)).toHaveAttribute('data-reason', 'value_invalid');
    await expect(rejected.nth(1)).toContainText('Ein Wert ist keine gültige Zahl.');
    // What is valid is in the data stock.
    await expect(page.locator('[data-testid="stock-row"][data-instrument="EURUSD"]')).toContainText('3');
  });

  test('imports again and replaces the rows of the same moment', async ({ page }) => {
    const options = { content: GAPPY_CSV, broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'UTC' };
    await importCsv(page, options);
    await expect(page.getByTestId('import-summary')).toContainText('davon 0 als Ersatz');

    await importCsv(page, options);

    await expect(page.getByTestId('import-summary')).toContainText('9 Zeilen übernommen, davon 9 als Ersatz');
    // The data stock holds the nine rows once.
    const row = page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-unit="h1"]');
    await expect(row).toHaveCount(1);
    await expect(row.locator('td').last()).toHaveText('9');
  });

  test('refuses a file as a whole with the reason and changes nothing', async ({ page }) => {
    await importCsv(page, { content: GAPPY_CSV, broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'Europe/Nowhere' });

    await expect(page.getByTestId('import-error')).toContainText('Die Zeitzone ist unbekannt.');
    await expect(page.getByTestId('stock-empty')).toBeVisible();
  });

  test('refuses a file of another format before it is sent', async ({ page }) => {
    await page.getByTestId('import-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });

    await expect(page.getByTestId('import-format-unknown')).toContainText('Format nicht erkannt. Erlaubt sind JSON und CSV.');
    await expect(page.getByTestId('import-run')).toBeDisabled();
  });

  test('imports a JSON file of the instrument details and shows them', async ({ page }) => {
    const document = {
      version: 1,
      kind: 'instrument',
      broker: 'Test-Broker',
      instrument: 'EURUSD',
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
    };
    await page.getByTestId('import-file').setInputFiles({
      name: 'instrument.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(document)),
    });
    await expect(page.getByTestId('import-broker')).toHaveCount(0);
    await page.getByTestId('import-run').click();

    await expect(page.getByTestId('import-result').or(page.getByTestId('import-error'))).toBeVisible();
    const error = page.getByTestId('import-error');
    if (await error.isVisible()) {
      throw new Error(`The import of the JSON file failed: ${await error.innerText()}`);
    }
    const row = page.getByTestId('instr-row');
    await expect(row).toContainText('Test-Broker');
    await expect(row).toContainText('EURUSD');
    await expect(row).toContainText('100.000');
    await expect(row).toContainText('Mittwoch');
  });
});

test.describe('acquisition by hand', () => {
  async function acquire(
    page: import('@playwright/test').Page,
    options: { instrument: string; kind?: string; unit?: string; from?: string; to?: string },
  ): Promise<void> {
    await page.getByTestId('proc-instrument').fill(options.instrument);
    if (options.kind !== undefined) {
      await page.getByTestId('proc-kind').selectOption(options.kind);
    }
    if (options.unit !== undefined) {
      await page.getByTestId('proc-tf').selectOption(options.unit);
    }
    if (options.from !== undefined) {
      await page.getByTestId('proc-from').fill(options.from);
    }
    if (options.to !== undefined) {
      await page.getByTestId('proc-to').fill(options.to);
    }
    await page.getByTestId('proc-start').click();
  }

  test('acquires candles from the source and shows them in the data stock', async ({ page }) => {
    await acquire(page, { instrument: 'EURUSD', unit: 'h1', from: '2026-01-05T00:00', to: '2026-01-06T00:00' });

    const result = page.getByTestId('proc-result');
    await expect(result).toHaveAttribute('data-state', 'succeeded', { timeout: 30_000 });
    await expect(page.getByTestId('proc-summary')).toContainText('Beschafft und importiert: 24 Zeilen');
    await expect(page.getByTestId('proc-summary')).toContainText('05.01.2026 00:00 – 05.01.2026 23:00');
    await expect(page.getByTestId('proc-start')).toBeEnabled();
    const row = page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-unit="h1"]');
    await expect(row).toContainText(SOURCE_BROKER);
    await expect(row).toContainText('24');
  });

  test('acquires the details of an instrument', async ({ page }) => {
    await acquire(page, { instrument: 'EURUSD', kind: 'instrument' });

    await expect(page.getByTestId('proc-result')).toHaveAttribute('data-state', 'succeeded', { timeout: 30_000 });
    await expect(page.getByTestId('instr-row')).toContainText('EURUSD');
    await expect(page.getByTestId('instr-row')).toContainText(SOURCE_BROKER);
  });

  test('acquires ticks', async ({ page }) => {
    // Half an hour of ticks (about 1200); a whole day would be more rows than the source delivers.
    await acquire(page, { instrument: 'EURUSD', kind: 'ticks', from: '2026-01-05T08:00', to: '2026-01-05T08:30' });

    await expect(page.getByTestId('proc-result')).toHaveAttribute('data-state', 'succeeded', { timeout: 60_000 });
    await expect(page.locator('[data-testid="stock-row"][data-unit="ticks"]')).toContainText('Ticks');
  });

  test('names the reason when the symbol is unknown', async ({ page }) => {
    await acquire(page, { instrument: 'NOSUCHSYMBOL', unit: 'h1', from: '2026-01-05T00:00', to: '2026-01-06T00:00' });

    const result = page.getByTestId('proc-result');
    await expect(result).toHaveAttribute('data-state', 'failed', { timeout: 30_000 });
    await expect(result).toHaveAttribute('data-code', 'symbol_unknown');
    await expect(page.getByTestId('proc-error-text')).toContainText('Das Instrument ist beim Broker unbekannt.');
    await expect(page.getByTestId('stock-empty')).toBeVisible();
  });

  test('names the reason when the source is not reachable', async ({ page, stack }) => {
    await stack.stopSource();

    await acquire(page, { instrument: 'EURUSD', unit: 'h1', from: '2026-01-05T00:00', to: '2026-01-06T00:00' });

    const result = page.getByTestId('proc-result');
    await expect(result).toHaveAttribute('data-state', 'failed', { timeout: 30_000 });
    await expect(result).toHaveAttribute('data-code', 'source_unreachable');
    await expect(page.getByTestId('proc-error-text')).toContainText('Quelle nicht erreichbar');
  });

  test('says that no source is set up when the backend has none', async ({ page, stack }) => {
    await stack.restartBackend(false);
    await page.reload();
    await expect(page.getByTestId('footer')).toContainText('Backend: verbunden');

    await acquire(page, { instrument: 'EURUSD', unit: 'h1', from: '2026-01-05T00:00', to: '2026-01-06T00:00' });

    await expect(page.getByTestId('proc-error-text')).toContainText('Keine Quelle eingerichtet');
    await expect(page.getByTestId('proc-result')).toHaveAttribute('data-state', 'failed');
    // Everything else keeps working.
    await chooseView(page, 'accounts');
    await expect(page.getByTestId('account-item')).toHaveCount(1);
  });

  test('refuses a period whose first day is after the last day', async ({ page }) => {
    await page.getByTestId('proc-instrument').fill('EURUSD');
    await page.getByTestId('proc-from').fill('2026-01-10T00:00');
    await page.getByTestId('proc-to').fill('2026-01-05T00:00');

    await expect(page.getByTestId('proc-start')).toBeDisabled();
    await expect(page.getByTestId('proc-next-step')).toContainText('Der Zeitraum ist ungültig');
  });
});

test.describe('default source', () => {
  test('is set, kept after a restart of the backend and removed again', async ({ page, stack }) => {
    await expect(page.getByTestId('default-source-current')).toContainText('keine Standardquelle');

    await page.getByTestId('source-broker').fill('Test-Broker');
    await page.getByTestId('source-set').click();
    await expect(page.getByTestId('default-source-current')).toContainText('Standardquelle: Test-Broker');

    await stack.restartBackend();
    await page.reload();
    await expect(page.getByTestId('default-source-current')).toContainText('Standardquelle: Test-Broker');

    await page.getByTestId('source-clear').click();
    await expect(page.getByTestId('default-source-current')).toContainText('keine Standardquelle');
  });

  test('is proposed as the broker of a CSV import', async ({ page }) => {
    await page.getByTestId('source-broker').fill('Test-Broker');
    await page.getByTestId('source-set').click();
    await expect(page.getByTestId('default-source-current')).toContainText('Standardquelle: Test-Broker');

    await page.getByTestId('import-file').setInputFiles({ name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from(GAPPY_CSV) });

    await expect(page.getByTestId('import-broker')).toHaveValue('Test-Broker');
  });
});
