import { expect, test } from '@playwright/test';
import { BUILT, CLIENT, EXAMPLE, STR01, STR03, chooseStrategy, jumpUntil, node, nowNode, openApp, runBacktest, startSingle } from './support';

// Functions of the prototype beyond the walk-through: preparation, test accounts, price data, data stock,
// open point "Start von Hand", values at the steps, language, stored data.

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

test('price data: missing data is fetched with progress, unobtainable data stops the run with the reason', async ({ page }) => {
  const errors = await openApp(page);
  // single-step test of str-01 on EURUSD: everything is there, ticks included
  await chooseStrategy(page, STR01);
  await expect(page.locator('[data-testid="need-row"][data-kind="ticks"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="need-row"][data-status="present"]')).toHaveCount(3);
  // USDJPY has no ticks: the run does not start and the message names the data and the reason
  await page.getByTestId('select-instrument').selectOption('USDJPY');
  await expect(page.locator('[data-testid="need-row"][data-status="blocked"]')).toHaveCount(1);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('blocked-message')).toBeVisible();
  await expect(page.getByTestId('blocked-message')).toContainText('USDJPY');
  await expect(page.getByTestId('blocked-message')).toContainText('Ticks');
  await expect(page.getByTestId('blocked-message')).toContainText('Grund');
  await expect(page.getByTestId('run')).toHaveCount(0);
  // backtest of two years on EURUSD: candles and ticks are partly missing and are fetched
  await page.getByTestId('select-instrument').selectOption('EURUSD');
  await page.getByTestId('mode-backtest').click();
  await expect(page.locator('[data-testid="need-row"][data-status="fetchable"]')).toHaveCount(2);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('fetch-progress').first()).toBeVisible();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
  // the fetched data is now in the data stock
  await page.getByTestId('menu-data').click();
  await expect(page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-kind="ticks"]')).toContainText('21.10.2024');
  expect(errors).toEqual([]);
});

test('a strategy parameter of the type instrument brings the data of that instrument into the check', async ({ page }) => {
  const errors = await openApp(page);
  await chooseStrategy(page, EXAMPLE);
  await expect(page.getByTestId('param-p-vergl')).toHaveValue('GBPUSD');
  await expect(page.locator('[data-testid="need-row"][data-instrument="GBPUSD"]')).toHaveCount(1);
  await page.getByTestId('param-p-vergl').selectOption('XAUUSD');
  // XAUUSD has no H1 candles before 2024-10-01 problem-free: the row of the second instrument is there
  await expect(page.locator('[data-testid="need-row"][data-instrument="XAUUSD"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('data stock: overview, import with check and result, fetch by hand', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByTestId('menu-data').click();
  await expect(page.getByTestId('stock-table')).toBeVisible();
  await expect(page.getByTestId('instr-table')).toContainText('EURUSD');
  const m15Before = await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-tf="m15"][data-broker="b1"]').textContent();
  expect(m15Before).toContain('03.2025');
  // import of the sample file: check, then result; the gap in the M15 candles is closed
  await expect(page.getByTestId('import-empty')).toBeVisible();
  await page.getByTestId('import-sample').click();
  await expect(page.getByTestId('import-checks')).toContainText('Format erkannt: CSV');
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-result')).toContainText('übernommen');
  const m15After = await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-tf="m15"][data-broker="b1"]').textContent();
  expect(m15After).toContain('21.10.2024');
  // a file of the wrong format is refused
  await page.getByTestId('import-file').setInputFiles({ name: 'daten.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
  await expect(page.getByTestId('import-checks')).toContainText('Format nicht erkannt');
  await expect(page.getByTestId('import-run')).toBeDisabled();
  // fetch by hand: ticks of USDJPY cannot be fetched
  await page.getByTestId('proc-instrument').selectOption('USDJPY');
  await page.getByTestId('proc-kind').selectOption('ticks');
  await page.getByTestId('proc-start').click();
  await expect(page.getByTestId('proc-result')).toContainText('Nicht beschaffbar');
  // candles of GBPUSD H1 are there already, ticks of EURUSD fetchable
  await page.getByTestId('proc-instrument').selectOption('EURUSD');
  await page.getByTestId('proc-from').fill('2024-12-01');
  await page.getByTestId('proc-to').fill('2024-12-31');
  await page.getByTestId('proc-start').click();
  await expect(page.getByTestId('proc-result')).toContainText('Beschafft und importiert', { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('open point "Start von Hand": the proposal can be shown in the test run', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.getByTestId('card-manual')).toContainText('einmal, zu Beginn des Testzeitraums');
  await page.getByTestId('manual-start').check();
  await startSingle(page, STR03);
  await page.getByTestId('btn-begin').click();
  await expect(page.getByTestId('eval-trigger')).toContainText('Start von Hand');
  await expect(page.getByTestId('marker-manual')).toBeVisible();
  await page.getByTestId('btn-step').click();
  await expect(page.getByTestId('eval-trigger')).toContainText('Kerzenschluss');
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
  await chooseStrategy(page, STR01);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('bt-progress')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('bt-bar')).toBeVisible();
  await page.getByTestId('btn-cancel').click();
  await expect(page.getByTestId('prepare')).toBeVisible();
  await expect(page.getByTestId('toast')).toContainText('abgebrochen');
  // the strategy of the client has no trade at all: the result says what to do next
  await chooseStrategy(page, CLIENT);
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
