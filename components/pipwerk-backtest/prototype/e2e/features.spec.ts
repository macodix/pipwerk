import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BUILT, CLIENT, EXAMPLE, STR01, STR03, chooseStrategy, jumpUntil, node, nowNode, openApp, runBacktest, startSingle } from './support';

// Functions of the prototype beyond the walk-through: preparation, test accounts, price data, data stock,
// trigger Manual, values at the steps, language, stored data.

test('preparation: the three strategies, presets per mode, period, parameters, explanations', async ({ page }) => {
  const errors = await openApp(page);
  const options = await page.getByTestId('select-strategy').locator('option').allTextContents();
  expect(options.some((o) => o.includes('Ihre Strategie'))).toBe(true);
  expect(options.some((o) => o.includes('str-01'))).toBe(true);
  expect(options.some((o) => o.includes('str-03'))).toBe(true);
  // presets: 30 days for the single-step test, 2 years for the backtest, both up to the last complete trading day
  await expect(page.getByTestId('input-from')).toHaveValue('2026-09-21');
  await expect(page.getByTestId('input-to')).toHaveValue('2026-10-20');
  await page.getByTestId('mode-backtest').click();
  await expect(page.getByTestId('input-from')).toHaveValue('2024-10-21');
  await expect(page.getByTestId('input-to')).toHaveValue('2026-10-20');
  // a period that ends after the last complete trading day is refused
  await page.getByTestId('input-to').fill('2026-10-25');
  await expect(page.getByTestId('period-error')).toBeVisible();
  await expect(page.getByTestId('start-test')).toBeDisabled();
  await page.getByTestId('period-reset').click();
  await expect(page.getByTestId('period-error')).toHaveCount(0);
  // strategy parameters are preset from the strategy and can be changed for this run
  await chooseStrategy(page, CLIENT);
  await expect(page.getByTestId('param-p-zeit')).toHaveValue('m15');
  await expect(page.getByTestId('param-p-stop')).toHaveValue('0');
  await page.getByTestId('param-p-zeit').selectOption('h1');
  await expect(page.getByTestId('field-param-p-zeit')).toHaveAttribute('data-changed', '1');
  await page.getByTestId('param-reset-p-zeit').click();
  await expect(page.getByTestId('param-p-zeit')).toHaveValue('m15');
  // every field has a short explanation that appears when pointing at it
  const labels = page.locator('.field-label[data-tip]');
  expect(await labels.count()).toBeGreaterThan(15);
  await labels.first().hover();
  await expect(page.getByTestId('tooltip')).toBeVisible();
  expect(errors).toEqual([]);
});

test('test account: changes in the run stay in the run until they are saved explicitly; create, edit, delete', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('input-capital').fill('25000');
  await expect(page.getByTestId('account-note')).toContainText('geändert');
  // the stored account is unchanged
  await page.getByTestId('menu-accounts').click();
  await expect(page.getByTestId('account-capital')).toHaveValue('10000');
  await page.getByTestId('menu-test').click();
  await expect(page.getByTestId('input-capital')).toHaveValue('25000');
  // explicit saving as a new test account
  await page.getByTestId('account-save-new').click();
  await page.getByTestId('account-new-name').fill('Mein Konto');
  await page.getByTestId('account-new-ok').click();
  await expect(page.getByTestId('select-account').locator('option')).toHaveCount(2);
  await page.getByTestId('menu-accounts').click();
  await expect(page.getByTestId('account-item')).toHaveCount(2);
  // edit and save
  await page.locator('[data-testid="account-item"][data-name="Mein Konto"]').click();
  await page.getByTestId('account-leverage').fill('100');
  await expect(page.getByTestId('account-dirty')).toBeVisible();
  await page.getByTestId('account-save').click();
  await page.locator('[data-testid="account-item"][data-name="Standard-Testkonto"]').click();
  await page.locator('[data-testid="account-item"][data-name="Mein Konto"]').click();
  await expect(page.getByTestId('account-leverage')).toHaveValue('100');
  // a new one
  await page.getByTestId('account-new').click();
  await page.getByTestId('account-name').fill('Drittes');
  await page.getByTestId('account-save').click();
  await expect(page.getByTestId('account-item')).toHaveCount(3);
  // delete with a question
  await page.getByTestId('account-delete').click();
  await page.getByTestId('delete-ok').click();
  await expect(page.getByTestId('account-item')).toHaveCount(2);
  // the account of the run is used by the test run (capital of the run)
  await page.getByTestId('menu-test').click();
  expect(errors).toEqual([]);
});

test('price data: a test run with missing data does not start, the message names the missing parts and leads to the data stock', async ({ page }) => {
  const errors = await openApp(page);
  // single-step test of str-01 on EURUSD: everything is there (two time units, ticks, contract data)
  await chooseStrategy(page, STR01);
  await expect(page.locator('[data-testid="need-row"][data-kind="ticks"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="need-row"][data-status="present"]')).toHaveCount(4);
  await expect(page.locator('[data-testid="need-row"][data-status="present"]').first()).toContainText('vorhanden');
  // USDJPY has no ticks: the run does not start and the message names instrument, data and the way to go on
  await page.getByTestId('select-instrument').selectOption('USDJPY');
  await expect(page.locator('[data-testid="need-row"][data-status="missing"]')).toHaveCount(1);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('blocked-message')).toBeVisible();
  await expect(page.getByTestId('blocked-message')).toContainText('USDJPY');
  await expect(page.getByTestId('blocked-message')).toContainText('Ticks');
  await expect(page.getByTestId('blocked-message')).toContainText('pipwerk-fetch-mt5');
  await expect(page.getByTestId('run')).toHaveCount(0);
  // the button leads to the data stock
  await page.getByTestId('goto-data').click();
  await expect(page.getByTestId('data')).toBeVisible();
  await page.getByTestId('menu-test').click();
  // backtest of two years on EURUSD: candles M15 and ticks are partly missing, with the missing period
  await page.getByTestId('select-instrument').selectOption('EURUSD');
  await page.getByTestId('mode-backtest').click();
  await expect(page.locator('[data-testid="need-row"][data-status="missing"]')).toHaveCount(2);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('blocked-message')).toContainText('Kerzen M15');
  await expect(page.getByTestId('blocked-message')).toContainText('21.10.2024 – 02.03.2025');
  await expect(page.getByTestId('blocked-item')).toHaveCount(2);
  await expect(page.getByTestId('bt-progress')).toHaveCount(0);
  // missing contract data of an instrument stop the run as well
  await page.getByTestId('mode-single').click();
  await chooseStrategy(page, STR03);
  await page.getByTestId('select-broker').selectOption('b2');
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('blocked-message')).toContainText('Kontraktdaten');
  expect(errors).toEqual([]);
});

test('a strategy parameter of the type instrument brings the data of that instrument into the check', async ({ page }) => {
  const errors = await openApp(page);
  await chooseStrategy(page, EXAMPLE);
  await expect(page.getByTestId('param-p-vergl')).toHaveValue('GBPUSD');
  await expect(page.locator('[data-testid="need-row"][data-instrument="GBPUSD"][data-kind="candles"]')).toHaveCount(1);
  await page.getByTestId('param-p-vergl').selectOption('XAUUSD');
  // XAUUSD has no H1 candles before 2024-10-01 problem-free: the row of the second instrument is there
  await expect(page.locator('[data-testid="need-row"][data-instrument="XAUUSD"][data-kind="candles"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

const row = (page: Page, broker: string, instrument: string, kind: string, tf = '') =>
  page.locator(`[data-testid="stock-row"][data-broker="${broker}"][data-instrument="${instrument}"][data-kind="${kind}"][data-tf="${tf}"]`);

test('data stock: bar, filter and pages of the table, details of a series', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('menu-data').click();
  // the bar: the button and the broker for test runs, which offers only the brokers of the data stock
  await expect(page.getByTestId('import-open')).toContainText('Datei importieren …');
  await expect(page.getByTestId('field-test-broker')).toContainText('Broker für Testläufe');
  expect(await page.getByTestId('select-test-broker').locator('option').allTextContents()).toEqual(['Demo-Broker (MetaTrader 5)', 'Zweiter Demo-Broker (MetaTrader 5)']);
  // the table: compact, paged
  expect(await page.locator('[data-testid="stock-table"] thead th').allTextContents()).toEqual(['Broker', 'Instrument', 'Daten', 'Zeitraum', 'Lücken']);
  await expect(page.getByTestId('stock-row')).toHaveCount(10);
  await expect(page.getByTestId('page-no')).toContainText('Seite 1 von 3');
  await expect(page.getByTestId('page-prev')).toBeDisabled();
  await page.getByTestId('page-next').click();
  await expect(page.getByTestId('page-no')).toContainText('Seite 2 von 3');
  await page.getByTestId('page-next').click();
  await expect(page.getByTestId('page-next')).toBeDisabled();
  await page.getByTestId('page-prev').click();
  await page.getByTestId('page-prev').click();
  // filter by broker, instrument and data
  await page.getByTestId('filter-broker').selectOption('b2');
  await expect(page.getByTestId('stock-row')).toHaveCount(4);
  await expect(page.getByTestId('page-no')).toContainText('Seite 1 von 1');
  await page.getByTestId('filter-data').selectOption('contract');
  await expect(page.getByTestId('stock-row')).toHaveCount(1);
  await expect(page.getByTestId('stock-row')).toContainText('Kontraktdaten');
  await page.getByTestId('filter-data').selectOption('');
  await page.getByTestId('filter-broker').selectOption('');
  await page.getByTestId('filter-instrument').selectOption('XAUUSD');
  await page.getByTestId('filter-data').selectOption('candles:h1');
  await expect(page.getByTestId('stock-row')).toHaveCount(1);
  // a click shows all gaps with start and end and the contract data of the instrument at this broker
  await row(page, 'b1', 'XAUUSD', 'candles', 'h1').click();
  await expect(page.getByTestId('stock-detail')).toBeVisible();
  await expect(page.getByTestId('gap-item')).toHaveCount(2);
  await expect(page.getByTestId('gap-item').first()).toContainText('12.04.2025 – 20.04.2025');
  await expect(page.getByTestId('contract-kontraktgroesse')).toHaveText('100');
  await row(page, 'b1', 'XAUUSD', 'candles', 'h1').click();
  await expect(page.getByTestId('stock-detail')).toHaveCount(0);
  // contract data missing: one sentence with the consequence
  await page.getByTestId('filter-instrument').selectOption('EURUSD');
  await page.getByTestId('filter-broker').selectOption('b2');
  await page.getByTestId('filter-data').selectOption('candles:h1');
  await row(page, 'b2', 'EURUSD', 'candles', 'h1').click();
  await expect(page.getByTestId('contract-missing')).toContainText('keine Kontraktdaten');
  await expect(page.getByTestId('contract-missing')).toContainText('startet dann nicht');
  // only contract data, no price data: a line "Kontraktdaten" without period and gaps
  await page.getByTestId('filter-instrument').selectOption('GBPUSD');
  await page.getByTestId('filter-data').selectOption('contract');
  await row(page, 'b2', 'GBPUSD', 'contract').click();
  await expect(page.getByTestId('detail-gaps')).toHaveCount(0);
  await expect(page.getByTestId('contract-tickgroesse')).toBeVisible();
  await expect(row(page, 'b2', 'GBPUSD', 'contract')).toContainText('–');
  // the broker for test runs presets the broker of the preparation
  await page.getByTestId('select-test-broker').selectOption('b2');
  await page.getByTestId('menu-test').click();
  await expect(page.getByTestId('select-broker')).toHaveValue('b2');
  expect(errors).toEqual([]);
});

test('data stock: import of two files in one go, new broker, changed time unit, result per file', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('menu-data').click();
  await page.getByTestId('import-open').click();
  await expect(page.getByTestId('dialog-import')).toBeVisible();
  await expect(page.getByTestId('import-empty')).toContainText('Noch keine Datei gewählt');
  await expect(page.getByTestId('import-run')).toBeDisabled();
  await page.getByTestId('import-sample-1').click();
  await page.getByTestId('import-sample-2').click();
  await expect(page.getByTestId('import-item')).toHaveCount(2);
  // instrument and data are recognised from the names; the time zone is asked once for the CSV file; the JSON file names the broker
  const csv = page.locator('[data-testid="import-item"][data-name$=".csv"]');
  const json = page.locator('[data-testid="import-item"][data-name$=".json"]');
  await expect(csv.getByTestId('import-instrument')).toHaveValue('EURUSD');
  await expect(csv.getByTestId('import-data')).toHaveValue('m15');
  await expect(json.getByTestId('import-instrument')).toHaveValue('XAUUSD');
  await expect(json.getByTestId('import-data')).toHaveValue('h1');
  await expect(page.getByTestId('import-tz')).toBeVisible();
  await expect(page.getByTestId('import-broker')).toHaveValue('Demo-Broker (MetaTrader 5)');
  // a new broker name, a changed time unit of one file
  await page.getByTestId('import-broker').fill('Neuer Broker');
  await csv.getByTestId('import-data').selectOption('m30');
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-result')).toHaveCount(2);
  await expect(csv.getByTestId('import-result')).toContainText('Zeilen übernommen, Zeitraum 21.10.2024 – 28.02.2025');
  await expect(csv.getByTestId('import-rejected')).toContainText('3 Zeilen abgelehnt');
  await expect(csv.getByTestId('import-result')).toContainText('Hoch liegt unter der Eröffnung');
  await expect(json.getByTestId('import-result')).toContainText('Zeitraum 14.04.2025 – 18.04.2025');
  await expect(json.getByTestId('import-rejected')).toContainText('1 Zeilen abgelehnt');
  await expect(json.getByTestId('import-result')).toContainText('Schluss liegt unter dem Tief');
  await expect(page.getByTestId('import-run')).toBeDisabled();
  await page.getByTestId('import-close').click();
  // the series are in the table and the new broker is offered for test runs
  expect(await page.getByTestId('select-test-broker').locator('option').allTextContents()).toContain('Neuer Broker');
  await page.getByTestId('filter-broker').selectOption('Neuer Broker');
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
  await expect(row(page, 'Neuer Broker', 'EURUSD', 'candles', 'm30')).toContainText('21.10.2024');
  await expect(row(page, 'Neuer Broker', 'XAUUSD', 'candles', 'h1')).toContainText('14.04.2025');
  // the samples with the broker of the data stock close the gap of the XAUUSD H1 candles
  await page.getByTestId('filter-broker').selectOption('b1');
  await page.getByTestId('filter-instrument').selectOption('XAUUSD');
  await page.getByTestId('filter-data').selectOption('candles:h1');
  await expect(row(page, 'b1', 'XAUUSD', 'candles', 'h1')).toHaveAttribute('data-gaps', '2');
  await page.getByTestId('import-open').click();
  await page.getByTestId('import-sample-2').click();
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-result')).toContainText('übernommen');
  await page.getByTestId('import-close').click();
  await expect(row(page, 'b1', 'XAUUSD', 'candles', 'h1')).toHaveAttribute('data-gaps', '1');
  expect(errors).toEqual([]);
});

test('data stock: a faulty file does not stop the others, a file without recognised data waits for the entry', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('menu-data').click();
  await page.getByTestId('import-open').click();
  const csv = '<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\n2025.01.06\t10:00:00\t1.1\t1.2\t1.0\t1.15\n2025.01.07\t10:00:00\t1.1\t1.2\t1.0\t1.15\n';
  await page.getByTestId('import-files').setInputFiles([
    { name: 'daten.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) },
    { name: 'kaputt.json', mimeType: 'application/json', buffer: Buffer.from('{ not json') },
    { name: 'tabelle.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('x') },
    { name: 'GBPUSD_CONTRACT.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ broker: 'Vertrag AG', contract: { tickSize: 0.00001, tickValue: 1, contractSize: 100000 } })) },
  ]);
  await expect(page.getByTestId('import-item')).toHaveCount(4);
  // the file without instrument and data is marked and blocks the import until it is completed
  const open = page.locator('[data-testid="import-item"][data-name="daten.csv"]');
  await expect(open).toHaveAttribute('data-state', 'needs');
  await expect(open.getByTestId('import-missing')).toBeVisible();
  await expect(page.getByTestId('import-run')).toBeDisabled();
  await open.getByTestId('import-instrument').selectOption('USDJPY');
  await open.getByTestId('import-data').selectOption('d1');
  await expect(page.getByTestId('import-run')).toBeEnabled();
  // a time zone that does not exist blocks as well
  await page.getByTestId('import-tz').fill('Nirgendwo/Stadt');
  await expect(page.getByTestId('import-run')).toBeDisabled();
  await page.getByTestId('import-tz').fill('UTC');
  // a file can be removed from the list
  await page.locator('[data-testid="import-item"][data-name="tabelle.xlsx"]').getByTestId('import-remove').click();
  await expect(page.getByTestId('import-item')).toHaveCount(3);
  await page.getByTestId('import-run').click();
  await expect(page.locator('[data-testid="import-item"][data-name="kaputt.json"]')).toContainText('Abgelehnt');
  await expect(open.getByTestId('import-result')).toContainText('2 Zeilen übernommen, Zeitraum 06.01.2025 – 07.01.2025');
  await expect(page.locator('[data-testid="import-item"][data-name="GBPUSD_CONTRACT.json"]')).toContainText('Kontraktdaten übernommen');
  await page.getByTestId('import-close').click();
  // the JSON file names the broker for all files
  await page.getByTestId('filter-broker').selectOption('Vertrag AG');
  await expect(page.getByTestId('stock-row')).toHaveCount(2);
  await expect(row(page, 'Vertrag AG', 'USDJPY', 'candles', 'd1')).toHaveCount(1);
  await expect(row(page, 'Vertrag AG', 'GBPUSD', 'contract')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('trigger Manual: the setting, a time in the test period, a time outside, the command between two evaluations', async ({ page }) => {
  const errors = await openApp(page);
  // the test cases str-01 and str-03 have no trigger Manual: no setting
  for (const id of [STR03, STR01]) {
    await chooseStrategy(page, id);
    await expect(page.getByTestId('card-manual')).toHaveCount(0);
  }
  // the example strategy shows the setting
  await chooseStrategy(page, EXAMPLE);
  await expect(page.getByTestId('card-manual')).toContainText('Auslöser Manuell');
  await expect(page.getByTestId('card-manual')).toContainText('tritt einmal ein, standardmäßig zu Beginn des Testzeitraums');
  // a time outside of the test period prevents the start, the message names the reason
  await page.getByTestId('input-manual-at').fill('2026-01-05T10:00');
  await expect(page.getByTestId('manual-error')).toContainText('außerhalb des Testzeitraums');
  await expect(page.getByTestId('start-test')).toBeDisabled();
  await page.getByTestId('manual-reset').click();
  await expect(page.getByTestId('manual-error')).toHaveCount(0);
  await expect(page.getByTestId('start-test')).toBeEnabled();
  // a time in the test period: the single-step test evaluates "Manual" at this time
  await page.getByTestId('input-manual-at').fill('2026-09-21T03:30');
  await expect(page.getByTestId('manual-error')).toHaveCount(0);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('eval-trigger')).toContainText('Manuell');
  await expect(page.getByTestId('eval-time')).toContainText('21.09.2026 03:30');
  await expect(page.getByTestId('marker-manual').first()).toBeVisible();
  // the command is usable only between two evaluations
  await page.getByTestId('btn-begin').click();
  await expect(page.getByTestId('eval-trigger')).toContainText('Kerzenschluss');
  await expect(page.getByTestId('btn-manual')).toBeDisabled();
  await page.getByTestId('btn-step').click();
  await expect(page.getByTestId('btn-manual')).toBeEnabled();
  const time = await page.getByTestId('eval-time').textContent();
  await page.getByTestId('btn-manual').click();
  await page.getByTestId('btn-step').click();
  await expect(page.getByTestId('eval-trigger')).toContainText('Manuell');
  await expect(page.getByTestId('eval-time')).toHaveText(time ?? '');
  // str-01 has neither the setting nor the command
  await page.getByTestId('btn-end').click();
  await chooseStrategy(page, STR01);
  await expect(page.getByTestId('card-manual')).toHaveCount(0);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('btn-manual')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('trigger Manual: by default once at the start of the test period', async ({ page }) => {
  const errors = await openApp(page);
  await startSingle(page, EXAMPLE);
  await page.getByTestId('btn-begin').click();
  await expect(page.getByTestId('eval-trigger')).toContainText('Manuell');
  await expect(page.getByTestId('eval-time')).toContainText('21.09.2026');
  await page.getByTestId('btn-step').click();
  await page.getByTestId('btn-jump').click();
  await expect(page.getByTestId('eval-trigger')).not.toContainText('Manuell');
  expect(errors).toEqual([]);
});


test('an indicator without values: the condition counts as not satisfied and the run goes on', async ({ page }) => {
  const errors = await openApp(page);
  await startSingle(page, STR03);
  await page.getByTestId('btn-begin').click();
  await expect(page.getByTestId('run-why')).toContainText('noch keine Werte');
  await page.getByTestId('btn-step').click();
  await expect(nowNode(page)).toHaveAttribute('data-node-name', 'Kreuzen');
  await expect(page.getByTestId('no-value-chip')).toBeVisible();
  await expect(nowNode(page).getByTestId('taken')).toContainText('falsch');
  await page.locator('[data-testid="node"][data-node-name="Kreuzen"]').click({ position: { x: 40, y: 20 }, force: true });
  await expect(page.getByTestId('no-value-note')).toBeVisible();
  // the next step goes on with the next evaluation
  await page.getByTestId('btn-step').click();
  await expect(page.getByTestId('eval-element')).toContainText('(1/');
  expect(errors).toEqual([]);
});

test('the management is evaluated before the main flow with the same trigger', async ({ page }) => {
  const errors = await openApp(page);
  await startSingle(page, STR03);
  await jumpUntil(page, 'eval-order', 120);
  const items = page.getByTestId('eval-order-item');
  await expect(items.first()).toContainText('1. Verwaltung');
  await expect(items.nth(1)).toContainText('2. Hauptablauf');
  await expect(page.getByTestId('eval-order')).toBeVisible();
  // the management closes the position first, then the main flow opens the new one
  await expect(page.locator('[data-testid="frame"][data-active="1"]')).toHaveCount(1);
  await items.nth(1).click();
  await expect(page.getByTestId('eval-flow')).toContainText('Hauptablauf');
  expect(errors).toEqual([]);
});

test('values at the step: hover shows the main values, changed values are highlighted, the properties view shows the result', async ({ page }) => {
  const errors = await openApp(page);
  await startSingle(page, STR03);
  // hover over an element: a short pop-up with its main values
  await node(page, 'Kreuzen').first().hover({ force: true });
  await expect(page.getByTestId('hover-values')).toBeVisible();
  await expect(page.getByTestId('hover-values')).toContainText('Ergebnis');
  await page.mouse.move(2, 2);
  // a card of an object shows its value and marks it when it changed
  await expect(page.locator('[data-testid="card"] [data-testid="row-value"]').first()).toBeVisible();
  await page.getByTestId('btn-jump').click();
  expect(await page.locator('[data-testid="card-row"][data-changed="1"]').count()).toBeGreaterThan(0);
  // select an element: parameters, properties and results with the values of the current step
  await page.locator('[data-testid="card"][data-node-name="EMA 20"]').click({ position: { x: 40, y: 20 }, force: true });
  await expect(page.getByTestId('props-element')).toContainText('EMA 20');
  await expect(page.getByTestId('sec-params')).toBeVisible();
  await expect(page.getByTestId('sec-results')).toBeVisible();
  await expect(page.getByTestId('sec-results').getByTestId('value').first()).not.toHaveText('–');
  await page.getByTestId('btn-jump').click();
  await expect(page.locator('[data-testid="value-row"][data-changed="1"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="value-row"][data-changed="1"]').first()).toContainText('geändert');
  expect(errors).toEqual([]);
});

test('language: all texts in English, the names of strategies stay as the user wrote them', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('mode-single')).toContainText('Single-step test');
  const german = /(Strategie|Testzeitraum|Kursdaten|Anfangskapital|Einzelschritt|Datenbestand|Testkonto|Beschaffung|Speichern|Abbrechen|Auswählen|Wann|Elemente|Ablauf)/;
  const grab = async () => (await page.locator('.header, .field-label, h1, h2, h3, .btn, .tbl th, .rs-chip, .muted').allTextContents()).join(' | ');
  const names = /(Scalping Punkt 2 Ausbruch – einfache Strategie|Scalping Punkt 2 Ausbruch|EMA-Trendfolge)/g;
  expect((await grab()).replace(names, '')).not.toMatch(german);
  await startSingle(page, STR01);
  expect((await grab()).replace(names, '')).not.toMatch(german);
  const flowTexts = (await page.locator('[data-testid="node"] .node-type, [data-testid="node"] .node-sum').allTextContents()).join(' | ');
  expect(flowTexts).not.toMatch(/(Bei jedem|Bedingung|Berechnung|Kerzenschluss)/);
  await page.getByTestId('mode-backtest').click();
  await chooseStrategy(page, STR03);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
  expect((await grab()).replace(names, '')).not.toMatch(german);
  await expect(page.getByTestId('fig-net')).toContainText('Net profit');
  await page.getByTestId('menu-data').click();
  expect((await grab()).replace(names, '')).not.toMatch(german);
  await page.getByTestId('import-open').click();
  await page.getByTestId('import-sample-1').click();
  await page.getByTestId('import-sample-2').click();
  await expect(page.getByTestId('dialog-import')).toContainText('Import file');
  expect((await grab()).replace(names, '')).not.toMatch(german);
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-result')).toHaveCount(2);
  await expect(page.getByTestId('dialog-import')).toContainText('rows taken over');
  expect((await page.getByTestId('dialog-import').textContent()) ?? '').not.toMatch(/(übernommen|Zeilen|abgelehnt|Zeitraum)/);
  await page.getByTestId('import-close').click();
  await page.getByTestId('menu-accounts').click();
  expect((await grab()).replace(names, '')).not.toMatch(german);
  await page.getByTestId('menu-about').click();
  await expect(page.getByTestId('dialog-about')).toContainText('About pipwerk replay');
  await expect(page.getByTestId('license-text')).toContainText('GNU');
  expect(errors).toEqual([]);
});

test('stored data: saved backtests and test accounts stay after reloading, the test cases and the default account are always there', async ({ page }) => {
  const errors = await openApp(page);
  await runBacktest(page, STR03);
  await page.getByTestId('btn-save-bt').click();
  await page.getByTestId('save-bt-ok').click();
  await page.getByTestId('menu-accounts').click();
  await page.getByTestId('account-new').click();
  await page.getByTestId('account-name').fill('Bleibt');
  await page.getByTestId('account-save').click();
  await page.locator('[data-testid="account-item"][data-name="Standard-Testkonto"]').click();
  await page.getByTestId('account-delete').click();
  await page.getByTestId('delete-ok').click();
  await expect(page.getByTestId('account-item')).toHaveCount(1);
  await page.goto(BUILT);
  await expect(page.getByTestId('menu-saved')).toContainText('(1)');
  await page.getByTestId('menu-accounts').click();
  await expect(page.locator('[data-testid="account-item"][data-name="Bleibt"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="account-item"][data-name="Standard-Testkonto"]')).toHaveCount(1);
  await page.getByTestId('menu-test').click();
  await expect(page.getByTestId('select-strategy').locator('option')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('backtest: progress, cancel, empty states', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('menu-saved').click();
  await expect(page.getByTestId('saved-empty')).toContainText('Nächster Schritt');
  await page.getByTestId('saved-goto-backtest').click();
  await chooseStrategy(page, STR03);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('bt-progress')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('bt-bar')).toBeVisible();
  await page.getByTestId('btn-cancel').click();
  await expect(page.getByTestId('prepare')).toBeVisible();
  await expect(page.getByTestId('toast')).toContainText('abgebrochen');
  // the strategy of the client has no trade at all: the result says what to do next
  await chooseStrategy(page, CLIENT);
  // the M15 candles of EURUSD exist from 2025-03-03 on
  await page.getByTestId('input-from').fill('2025-04-01');
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('no-trades')).toContainText('Nächster Schritt');
  await expect(page.getByTestId('fig-trades')).toContainText('0');
  await page.getByTestId('tab-rejected').click();
  await expect(page.getByTestId('rejected-row').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('instrument details can be changed for the run and are not stored', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('instr-details').locator('summary').click();
  await page.getByTestId('input-instr-mindestvolumen').fill('0.1');
  await expect(page.getByTestId('instr-mindestvolumen')).toHaveAttribute('data-changed', '1');
  await expect(page.getByTestId('instr-reset')).toBeVisible();
  await page.getByTestId('instr-reset').click();
  await expect(page.getByTestId('input-instr-mindestvolumen')).toHaveValue('0.01');
  expect(errors).toEqual([]);
});
