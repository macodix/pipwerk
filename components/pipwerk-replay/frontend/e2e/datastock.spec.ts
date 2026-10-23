import type { Page } from '@playwright/test';

import {
  FAULTY_CSV,
  GAPPY_CSV,
  candlesDocument,
  chooseImportFiles,
  contractDocument,
  csvFile,
  expect,
  fillImportBasics,
  importItem,
  jsonFile,
  openApp,
  openImportDialog,
  runImport,
  seedFiles,
  seedStock,
  test,
} from './fixtures';

// The view "Datenbestand" and the dialog "Datei importieren" against the real backend. The
// interface and the backend run on two ports; the requests go through the proxy of the interface,
// and the backend checks the header Origin of a form against Host (403 on a difference).

async function closeDialog(page: Page): Promise<void> {
  await page.getByTestId('import-close').click();
  await expect(page.getByTestId('dialog-import')).toHaveCount(0);
}

test('imports two files in one process with a new broker and a changed time unit, and shows the result per file', async ({
  page,
}) => {
  await openApp(page);
  await expect(page.getByTestId('stock-empty')).toContainText('pipwerk-fetch-mt5');
  await openImportDialog(page);
  await expect(page.getByTestId('import-empty')).toBeVisible();

  const csv = csvFile('GBPUSD_H4_202601050000_202601052300.csv', GAPPY_CSV);
  const json = jsonFile('eurusd-candles.json', candlesDocument({ broker: 'Json-Broker', instrument: 'EURUSD', unit: 'h1', hours: [8, 9, 10] }));
  await chooseImportFiles(page, [csv, json]);

  // Preset from the preview of the web API: name of the CSV file, content of the JSON file.
  await expect(importItem(page, csv.name).getByTestId('import-instrument')).toHaveValue('GBPUSD');
  await expect(importItem(page, csv.name).getByTestId('import-data')).toHaveValue('h4');
  await expect(importItem(page, json.name).getByTestId('import-instrument')).toHaveValue('EURUSD');
  await expect(importItem(page, json.name).getByTestId('import-data')).toHaveText('Kerzen H1');
  await expect(page.getByTestId('import-broker')).toHaveValue('Json-Broker');
  // The time zone is asked only because there is a CSV file; without it nothing can be imported.
  await expect(page.getByTestId('field-import-timezone')).toBeVisible();
  await expect(page.getByTestId('import-run')).toBeDisabled();
  await expect(page.getByTestId('import-hint')).toContainText('Zeitzone');

  // A new broker name for all files, another time unit for the CSV file.
  await fillImportBasics(page, { broker: 'Neuer-Server', timezone: 'Europe/Athens' });
  await importItem(page, csv.name).getByTestId('import-data').selectOption('h1');
  await expect(page.getByTestId('import-run')).toBeEnabled();
  await runImport(page);

  await expect(page.getByTestId('import-summary')).toHaveText('2 von 2 Dateien sind importiert.');
  const csvResult = importItem(page, csv.name).getByTestId('import-result');
  await expect(csvResult).toContainText('9 Zeilen übernommen, davon 0 als Ersatz.');
  // 08:00 to 20:00 server time (Europe/Athens, winter: UTC+2) is 06:00 to 18:00 UTC.
  await expect(csvResult).toContainText('05.01.2026 06:00 – 05.01.2026 18:00 (UTC)');
  await expect(importItem(page, json.name).getByTestId('import-result')).toContainText(
    '3 Zeilen übernommen, davon 0 als Ersatz. Zeitraum: 05.01.2026 08:00 – 05.01.2026 10:00 (UTC).',
  );
  await expect(importItem(page, csv.name)).toHaveAttribute('data-state', 'done');
  await expect(page.getByTestId('import-run')).toBeDisabled();

  // Behind the dialog the table is read again; the new broker is in the choice for test runs.
  await closeDialog(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
  const gbp = page.locator('[data-testid="stock-row"][data-instrument="GBPUSD"]');
  await expect(gbp).toContainText('Neuer-Server');
  await expect(gbp).toHaveAttribute('data-data', 'h1');
  await expect(gbp).toContainText('Kerzen H1');
  await expect(gbp).toContainText('05.01.2026 – 05.01.2026');
  await expect(gbp).toHaveAttribute('data-gaps', '1');
  await expect(page.locator('[data-testid="stock-row"][data-instrument="EURUSD"]')).toHaveAttribute('data-gaps', '0');
  await expect(page.getByTestId('select-test-broker')).toHaveValue('Neuer-Server');
  await expect(page.getByTestId('select-test-broker').locator('option')).toHaveText(['Neuer-Server']);
  await expect(page.getByTestId('import-open')).toBeFocused();
});

test('imports a faulty file beside a valid one and a refused one; the others are not stopped', async ({ page }) => {
  await openApp(page);
  await openImportDialog(page);
  const faulty = csvFile('EURUSD_H1_202601050000_202601050300.csv', FAULTY_CSV);
  const valid = jsonFile('gbpusd.json', candlesDocument({ broker: 'Egal', instrument: 'GBPUSD', unit: 'h1', hours: [8, 9] }));
  const broken = { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{ not json', 'utf-8') };
  await chooseImportFiles(page, [faulty, valid, broken]);

  // The unreadable JSON file is marked but does not block the others.
  await expect(importItem(page, broken.name).getByTestId('import-unreadable')).toContainText('Die Datei ist kein gültiges JSON.');
  await fillImportBasics(page, { broker: 'Test-Broker', timezone: 'UTC' });
  await runImport(page);

  await expect(page.getByTestId('import-summary')).toHaveText('2 von 3 Dateien sind importiert. Abgelehnt: 1.');
  const faultyItem = importItem(page, faulty.name);
  await expect(faultyItem).toHaveAttribute('data-state', 'done');
  await expect(faultyItem.getByTestId('import-result')).toContainText('2 Zeilen übernommen');
  await expect(faultyItem.getByTestId('import-rejected')).toHaveText('1 Zeilen abgelehnt:');
  // The header is row 1, so the faulty candle of 09:00 is row 3; the reason is named in words.
  await expect(faultyItem.getByTestId('import-rejected-row')).toHaveCount(1);
  await expect(faultyItem.getByTestId('import-rejected-row')).toContainText(/^Zeile 3: Hoch liegt unter /);
  await expect(importItem(page, valid.name)).toHaveAttribute('data-state', 'done');
  const brokenItem = importItem(page, broken.name);
  await expect(brokenItem).toHaveAttribute('data-state', 'failed');
  await expect(brokenItem.getByTestId('import-result')).toContainText('Abgelehnt: Die Datei ist kein gültiges JSON.');
  await expect(brokenItem.getByTestId('import-result')).toContainText('Nächster Schritt');

  // Only the refused file is left; it is removed and nothing is left to import.
  await expect(page.getByTestId('import-hint')).toContainText('Ergänzen Sie die abgelehnten Dateien');
  await closeDialog(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
});

test('imports the same file again: the existing rows are replaced', async ({ page }) => {
  await openApp(page);
  const csv = csvFile('EURUSD_H1_202601050000_202601052300.csv', GAPPY_CSV);
  for (const replaced of [0, 9]) {
    await openImportDialog(page);
    await chooseImportFiles(page, [csv]);
    await fillImportBasics(page, { broker: 'Test-Broker', timezone: 'UTC' });
    await runImport(page);
    await expect(page.getByTestId('import-result')).toContainText(`9 Zeilen übernommen, davon ${String(replaced)} als Ersatz.`);
    await closeDialog(page);
    await expect(page.getByTestId('stock-row')).toHaveCount(1);
  }
});

test('imports many files at once, then filters and pages through the table', async ({ page }) => {
  await openApp(page);
  await openImportDialog(page);
  const files = Array.from({ length: 12 }, (_, index) => {
    const instrument = `PAIR${String(index + 1).padStart(2, '0')}`;
    return jsonFile(`${instrument}.json`, candlesDocument({ broker: 'Mass-Broker', instrument, unit: 'h1', hours: [8, 9] }));
  });
  await chooseImportFiles(page, files);
  await expect(page.getByTestId('import-broker')).toHaveValue('Mass-Broker');
  await expect(page.getByTestId('field-import-timezone')).toHaveCount(0);
  await runImport(page);
  await expect(page.getByTestId('import-summary')).toHaveText('12 von 12 Dateien sind importiert.');
  await closeDialog(page);

  await expect(page.getByTestId('stock-row')).toHaveCount(10);
  await expect(page.getByTestId('stock-count')).toHaveText('1–10 von 12 Reihen');
  await expect(page.getByTestId('page-no')).toHaveText('Seite 1 von 2');
  await expect(page.getByTestId('page-prev')).toBeDisabled();
  await page.getByTestId('page-next').click();
  await expect(page.getByTestId('stock-count')).toHaveText('11–12 von 12 Reihen');
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
  await expect(page.getByTestId('stock-row').first()).toHaveAttribute('data-instrument', 'PAIR11');
  await expect(page.getByTestId('page-next')).toBeDisabled();

  // A filter asks the backend and starts at page one again.
  await page.getByTestId('filter-instrument').fill('pair1');
  await expect(page.getByTestId('stock-count')).toHaveText('1–3 von 3 Reihen (gefiltert)');
  await expect(page.getByTestId('stock-row')).toHaveCount(3);
  await page.getByTestId('filter-broker').fill('nobody');
  await expect(page.getByTestId('stock-nomatch')).toContainText('Keine Reihe passt zum Filter.');
  await page.getByTestId('filter-broker').fill('MASS');
  await page.getByTestId('filter-data').fill('Kerzen H1');
  await expect(page.getByTestId('stock-row')).toHaveCount(3);
  await page.getByTestId('filter-data').fill('Ticks');
  await expect(page.getByTestId('stock-nomatch')).toBeVisible();
  await page.getByTestId('filter-data').fill('');
  await page.getByTestId('filter-instrument').fill('');
  await page.getByTestId('filter-broker').fill('');
  await expect(page.getByTestId('stock-count')).toHaveText('1–10 von 12 Reihen');
});

test('shows the gaps and the contract data of a row after a click', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);

  // A series with a gap and with contract data.
  const eurusd = page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-data="h1"]');
  await expect(eurusd).toHaveAttribute('data-gaps', '1');
  await eurusd.click();
  await expect(page.getByTestId('gap-item')).toHaveCount(1);
  await expect(page.getByTestId('gap-item')).toHaveText(/^05\.01\.2026 1[2-6]:\d\d – 05\.01\.2026 1[3-7]:\d\d$/);
  await expect(page.getByTestId('contract-contractSize')).toHaveText('100.000');
  await expect(page.getByTestId('contract-tickValue')).toHaveText('1 USD');
  await expect(page.getByTestId('contract-swap')).toHaveText('-6,5 / 2,1');
  await expect(page.getByTestId('contract-tripleSwap')).toHaveText('Mittwoch');
  await expect(page.getByTestId('contract-margin')).toHaveText('3.650');
  await expect(page.getByTestId('contract-contractFrom')).toHaveText('05.01.2026 08:00');
  await expect(page.getByTestId('contract-missing')).toHaveCount(0);

  // Ticks without a gap, same contract data.
  await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-data="ticks"]').click();
  await expect(page.getByTestId('stock-detail')).toHaveCount(1);
  await expect(page.getByTestId('gaps-none')).toHaveText('Keine Lücken.');
  await expect(page.getByTestId('contract-contractSize')).toHaveText('100.000');

  // No contract data for this instrument at this broker: a sentence says what happens.
  await page.locator('[data-testid="stock-row"][data-instrument="GBPUSD"][data-data="h4"]').click();
  await expect(page.getByTestId('contract-missing')).toContainText('Ein Testlauf mit diesem Instrument startet dann nicht.');
  await expect(page.getByTestId('contract-contractSize')).toHaveCount(0);

  // A row of contract data only has no gaps.
  await page.locator('[data-testid="stock-row"][data-data="contract"]').click();
  await expect(page.getByTestId('detail-contract')).toBeVisible();
  await expect(page.getByTestId('detail-gaps')).toHaveCount(0);
  await expect(page.getByTestId('contract-contractSize')).toHaveText('100.000');

  // Another click closes the details; with the keyboard they open again.
  await page.locator('[data-testid="stock-row"][data-data="contract"]').click();
  await expect(page.getByTestId('stock-detail')).toHaveCount(0);
  await eurusd.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('stock-detail')).toBeVisible();
});

test('chooses the broker for test runs among the brokers of the data stock and keeps the choice', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  const select = page.getByTestId('select-test-broker');

  await expect(select.locator('option')).toHaveText(['Test-Broker', 'Zweiter-Broker']);
  await expect(select).toHaveValue('Test-Broker');
  expect(await (await fetch(`${stack.backendUrl}/api/replay/settings/test-run-broker`)).json()).toEqual({
    broker: 'Test-Broker',
    chosen: false,
  });

  await select.selectOption('Zweiter-Broker');
  await expect
    .poll(async () => (await fetch(`${stack.backendUrl}/api/replay/settings/test-run-broker`)).json())
    .toEqual({ broker: 'Zweiter-Broker', chosen: true });
  await page.reload();
  await expect(page.getByTestId('select-test-broker')).toHaveValue('Zweiter-Broker');
  await stack.restartBackend();
  await page.reload();
  await expect(page.getByTestId('select-test-broker')).toHaveValue('Zweiter-Broker');
});

test('refuses a form that a web page of another origin sends through the proxy of the interface', async ({ page, baseURL }) => {
  await openApp(page);

  const response = await page.request.post(`${baseURL ?? ''}/api/v1/market-data/imports`, {
    headers: { Origin: 'http://example.org' },
    multipart: {
      broker: 'Fremd',
      file: { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(candlesDocument({ broker: 'x', instrument: 'EURUSD', unit: 'h1', hours: [8] }))) },
    },
  });

  expect(response.status()).toBe(403);
  await page.reload();
  await expect(page.getByTestId('stock-empty')).toBeVisible();
});

test('shows a message with the next step when the backend is gone during the import', async ({ page, stack }) => {
  await openApp(page);
  await openImportDialog(page);
  await chooseImportFiles(page, [jsonFile('a.json', candlesDocument({ broker: 'B', instrument: 'EURUSD', unit: 'h1', hours: [8] }))]);
  await stack.stopBackend();

  await page.getByTestId('import-run').click();

  // The proxy of the interface answers with an error status when the backend does not answer.
  await expect(page.getByTestId('import-error')).toContainText('Nächster Schritt');
  await expect(page.getByTestId('import-run')).toBeEnabled();
  await stack.startBackend();
});

test('shows a data stock that was filled before as the table with its contract rows', async ({ page, stack }) => {
  await seedFiles(stack.backendUrl, 'Test-Broker', [
    { file: jsonFile('c.json', contractDocument({ broker: 'x', instrument: 'XAUUSD' })) },
  ]);

  await openApp(page);

  const row = page.getByTestId('stock-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Kontraktdaten');
  await expect(row).toHaveAttribute('data-gaps', '');
});
