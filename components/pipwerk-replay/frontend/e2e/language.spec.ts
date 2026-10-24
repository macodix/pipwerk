import type { Locator, Page } from '@playwright/test';

import {
  FAULTY_CSV,
  GAPPY_CSV,
  candlesDocument,
  chooseImportFiles,
  chooseView,
  csvFile,
  expect,
  fillImportBasics,
  importItem,
  jsonFile,
  openApp,
  openImportDialog,
  runImport,
  seedStock,
  slowDownFiles,
  test,
} from './fixtures';

// German texts that must not be in the English interface: umlauts, the sharp s and German
// words that are no English words. Names the test entered itself are not German.
const GERMAN = /[äöüÄÖÜß]|\b(der|die|das|und|nicht|ist|keine|kein|Datei|Dateien|Zeitraum|Zeilen|Fehler|Konto|Testkonto|Testkonten|Datenbestand|Beschaffung|Quelle|Kerzen|Zeiteinheit|Hebel|Speichern|Löschen|Schließen|Menü|Sprache|Stand|Lücken|Menge|Zeiträume|Kontraktdaten|Reihen|Seite|Zurück|Weiter)\b/;

// English words that must not be in the German interface (the names of the data and of the
// brokers are the exception: they are written by the test).
const ENGLISH = /\b(The|This|data stock|Next step|Candles|Import files|Contract data|Gaps|Previous|Page)\b/;

async function visibleText(page: Page): Promise<string> {
  // The text of what the user sees: the page without the license text (English by origin).
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    for (const node of clone.querySelectorAll('[data-testid="license-text"], [lang="en"].about-license-name')) {
      node.remove();
    }
    for (const node of clone.querySelectorAll('dialog:not([open])')) {
      node.remove();
    }
    return clone.innerText;
  });
}

async function setLanguage(page: Page, language: 'de' | 'en'): Promise<void> {
  await page.getByTestId(`lang-${language}`).click();
  await expect(page.getByTestId(`lang-${language}`)).toHaveAttribute('aria-checked', 'true');
}

test('stores the language in the backend and keeps it after a reload', async ({ page, stack }) => {
  await openApp(page);
  await expect(page.getByTestId('lang-de')).toHaveAttribute('aria-checked', 'true');

  await setLanguage(page, 'en');

  await expect(page.getByTestId('menu-data')).toContainText('Data stock');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const stored = await (await fetch(`${stack.backendUrl}/api/replay/settings/language`)).json();
  expect(stored).toEqual({ language: 'en' });

  await page.reload();
  await expect(page.getByTestId('menu-data')).toContainText('Data stock');
  await stack.restartBackend();
  await page.reload();
  await expect(page.getByTestId('menu-data')).toContainText('Data stock');
});

test('shows no German text in the English interface', async ({ page, stack }) => {
  await openApp(page);
  await setLanguage(page, 'en');

  // Data stock: empty state.
  await expect(page.getByTestId('stock-empty')).toContainText('The data stock is empty.');
  expect(await visibleText(page)).not.toMatch(GERMAN);

  // Data stock with data: table, details of rows with and without contract data.
  await seedStock(stack.backendUrl);
  await page.reload();
  await expect(page.getByTestId('stock-row')).toHaveCount(5);
  await expect(page.getByTestId('stock-count')).toHaveText('1–5 of 5 series');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-data="h1"]').click();
  await expect(page.getByTestId('contract-contractSize')).toBeVisible();
  await expect(page.getByTestId('detail-gaps')).toContainText('Gaps');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.locator('[data-testid="stock-row"][data-instrument="GBPUSD"][data-data="h4"]').click();
  await expect(page.getByTestId('contract-missing')).toContainText('A test run with this instrument does not start then.');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('filter-instrument').fill('nothing');
  await expect(page.getByTestId('stock-nomatch')).toContainText('No series matches the filter.');
  expect(await visibleText(page)).not.toMatch(GERMAN);

  // The dialog: empty, with files that need an entry, with a result per file and rejected rows.
  await openImportDialog(page);
  await expect(page.getByTestId('import-empty')).toContainText('Next step: choose files');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  const faulty = csvFile('EURUSD_H1_202601050000_202601050300.csv', FAULTY_CSV);
  const unknown = csvFile('export.csv', GAPPY_CSV);
  const broken = { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{ not json', 'utf-8') };
  await chooseImportFiles(page, [faulty, unknown, broken]);
  await expect(importItem(page, unknown.name).getByTestId('import-missing')).toContainText('Instrument or data not recognised.');
  await expect(importItem(page, broken.name).getByTestId('import-unreadable')).toContainText('The file is not valid JSON.');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await expect(page.getByTestId('import-hint')).toContainText('Next step');
  await importItem(page, unknown.name).getByTestId('import-instrument').fill('EURUSD');
  await importItem(page, unknown.name).getByTestId('import-data').selectOption('h1');
  await fillImportBasics(page, { broker: 'Test-Broker', timezone: 'Europe/Nowhere' });
  await runImport(page);
  await expect(importItem(page, unknown.name).getByTestId('import-result')).toContainText('The time zone is unknown.');
  await expect(importItem(page, broken.name).getByTestId('import-result')).toContainText('Refused: The file is not valid JSON.');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await fillImportBasics(page, { timezone: 'UTC' });
  await runImport(page);
  await expect(importItem(page, faulty.name).getByTestId('import-rejected-row')).toContainText(/^Row 3: High is below /);
  await expect(page.getByTestId('import-summary')).toContainText('files are imported.');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await page.getByTestId('import-close').click();

  // The broker for test runs and the error when the backend is gone.
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('import-open').click();
  await page.getByTestId('import-files').setInputFiles(jsonFile('a.json', candlesDocument({ broker: 'B', instrument: 'EURUSD', unit: 'h1', hours: [8] })));
  await expect(page.getByTestId('import-item')).toHaveCount(1);
  await stack.stopBackend();
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-error')).toContainText('Next step');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await page.getByTestId('import-close').click();
  await stack.startBackend();

  // Test accounts, with an invalid value and the question before deleting.
  await chooseView(page, 'accounts');
  await expect(page.getByTestId('account-item')).toContainText('Default test account');
  await expect(page.getByTestId('account-item')).toContainText('built in');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('account-leverage').fill('0');
  await expect(page.getByTestId('account-invalid')).toContainText('The leverage must be a whole number');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('account-leverage').fill('30');
  await page.getByTestId('account-delete').click();
  await expect(page.getByTestId('dialog-delete-account')).toBeVisible();
  expect(await page.getByTestId('dialog-delete-account').innerText()).not.toMatch(GERMAN);
  await page.getByTestId('delete-cancel').click();

  // The dialog About.
  await page.getByTestId('menu-about').click();
  await expect(page.getByTestId('dialog-about')).toBeVisible();
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('about-close').click();
});

test('shows no English text in the German interface', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);
  await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-data="h1"]').click();
  await expect(page.getByTestId('contract-contractSize')).toBeVisible();

  const text = await visibleText(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Datenbestand');
  expect(text).toContain('Datenreihen');
  expect(text).toContain('Kontraktdaten');
  expect(text).not.toMatch(ENGLISH);
  await openImportDialog(page);
  await chooseImportFiles(page, [csvFile('export.csv', GAPPY_CSV)]);
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(ENGLISH);
});

/** The element is what a user sees at its place: nothing (a dialog, for example) covers it. */
async function expectOnTop(element: Locator): Promise<void> {
  const covered = await element.evaluate((node) => {
    // The explanation lets mouse events pass; for the measurement it does not.
    const html = node as HTMLElement;
    const before = html.style.pointerEvents;
    html.style.pointerEvents = 'auto';
    const box = html.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    html.style.pointerEvents = before;
    return top === null || !html.contains(top);
  });
  expect(covered, 'the explanation is covered by another element').toBe(false);
}

/** Every field in `scope` shows its explanation to the mouse and to the keyboard. */
async function expectExplanations(page: Page, scope: Locator, minimum: number): Promise<void> {
  const fields = scope.locator('[data-testid^="field-"]');
  const count = await fields.count();
  expect(count).toBeGreaterThanOrEqual(minimum);
  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    const label = field.locator('.field-label');
    const expected = (await label.getAttribute('data-tip')) ?? '';
    expect(expected.length, `field ${String(index)}`).toBeGreaterThan(10);
    // Mouse: pointing at the label shows the explanation.
    await field.scrollIntoViewIfNeeded();
    await label.hover();
    await expect(page.getByTestId('tooltip')).toHaveText(expected);
    await expectOnTop(page.getByTestId('tooltip'));
    await page.mouse.move(0, 0);
    await expect(page.getByTestId('tooltip')).toHaveCount(0);
    // Keyboard: the symbol is reached with focus and shows the same text.
    await field.locator('.info').focus();
    await expect(page.getByTestId('tooltip')).toHaveText(expected);
    await expectOnTop(page.getByTestId('tooltip'));
    await field.locator('.info').blur();
    await expect(page.getByTestId('tooltip')).toHaveCount(0);
  }
}

test('explains every field to the mouse and to the keyboard', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);

  // The bar and the filters of the data stock.
  await expectExplanations(page, page.getByTestId('data'), 4);
  // A row shows its explanation, too, when it has the focus (keyboard) or the mouse is over it.
  const row = page.getByTestId('stock-row').first();
  await row.focus();
  await expect(page.getByTestId('tooltip')).toHaveText('Klicken zeigt die Einzelheiten dieser Reihe.');
  await page.mouse.move(0, 0);

  // The fields of the dialog: broker, time zone, instrument and data of a file.
  await openImportDialog(page);
  await chooseImportFiles(page, [csvFile('export.csv', GAPPY_CSV)]);
  await expectExplanations(page, page.getByTestId('dialog-import'), 4);
  await page.getByTestId('import-close').click();

  await chooseView(page, 'accounts');
  await expect(page.getByTestId('account-name')).toBeVisible();
  await expectExplanations(page, page.getByTestId('accounts'), 5);
});

test('stores nothing in the browser', async ({ page }) => {
  await openApp(page);
  await setLanguage(page, 'en');
  await openImportDialog(page);
  await chooseImportFiles(page, [csvFile('EURUSD_H1_202601050000_202601052300.csv', GAPPY_CSV)]);
  await fillImportBasics(page, { broker: 'Test-Broker', timezone: 'UTC' });
  await runImport(page);
  await page.getByTestId('import-close').click();
  await page.getByTestId('select-test-broker').selectOption('Test-Broker');
  await chooseView(page, 'accounts');
  await page.getByTestId('account-new').click();
  await page.getByTestId('account-save').click();
  await expect(page.getByTestId('account-saved')).toBeVisible();

  const stored = await page.evaluate(async () => ({
    local: window.localStorage.length,
    session: window.sessionStorage.length,
    cookies: document.cookie,
    databases: (await indexedDB.databases()).length,
    caches: (await caches.keys()).length,
  }));

  expect(stored).toEqual({ local: 0, session: 0, cookies: '', databases: 0, caches: 0 });
});

/** Opens the questions of the four ways to delete one after the other and checks the text of each. */
async function checkDeleteTexts(page: Page, otherLanguage: RegExp): Promise<void> {
  const dialog = page.getByTestId('dialog-delete');
  // A series and a period.
  await page.locator('[data-testid="stock-row"][data-instrument="EURUSD"][data-data="h1"]').click();
  await expect(page.getByTestId('contract-contractSize')).toBeVisible();
  expect(await page.getByTestId('detail-actions').innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-open').click();
  expect(await dialog.innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-scope-period').click();
  await page.getByTestId('delete-start').fill('2026-01-05T09:00');
  await page.getByTestId('delete-end').fill('2026-01-05T11:00');
  await page.getByTestId('delete-next').click();
  await expect(page.getByTestId('delete-question')).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-cancel').click();
  // The error of a period without data.
  await page.getByTestId('delete-open').click();
  await page.getByTestId('delete-scope-period').click();
  await page.getByTestId('delete-start').fill('2027-03-01T08:00');
  await page.getByTestId('delete-end').fill('2027-03-01T09:00');
  await page.getByTestId('delete-next').click();
  await expect(page.getByTestId('delete-ask-error')).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-cancel').click();
  // The contract data.
  await page.getByTestId('delete-contract-open').click();
  await expect(page.getByTestId('delete-question')).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-cancel').click();
  // All data of a broker, which is the broker for test runs.
  await page.getByTestId('select-test-broker').selectOption('Zweiter-Broker');
  await page.getByTestId('filter-broker').fill('Zweiter');
  await page.getByTestId('delete-broker-open').click();
  await expect(page.getByTestId('delete-test-broker')).toBeVisible();
  expect(await dialog.innerText()).not.toMatch(otherLanguage);
  await page.getByTestId('delete-confirm').click();
  await expect(page.getByTestId('delete-notice')).toBeVisible();
  expect(await visibleText(page)).not.toMatch(otherLanguage);
}

test('shows no German text in the dialogs for deleting in the English interface', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await setLanguage(page, 'en');
  await expect(page.getByTestId('stock-row')).toHaveCount(5);

  await checkDeleteTexts(page, GERMAN);
});

test('shows no English text in the dialogs for deleting in the German interface', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await expect(page.getByTestId('stock-row')).toHaveCount(5);

  await checkDeleteTexts(page, ENGLISH);
});

test('shows no German text in the dialog for a running import in the English interface', async ({ page }) => {
  await openApp(page);
  await setLanguage(page, 'en');
  await slowDownFiles(page, 2500);
  await openImportDialog(page);
  await chooseImportFiles(page, [
    jsonFile('a.json', candlesDocument({ broker: 'B', instrument: 'EURUSD', unit: 'h1', hours: [8] })),
    jsonFile('b.json', candlesDocument({ broker: 'B', instrument: 'GBPUSD', unit: 'h1', hours: [8] })),
    jsonFile('c.json', candlesDocument({ broker: 'B', instrument: 'USDJPY', unit: 'h1', hours: [8] })),
  ]);

  await page.getByTestId('import-run').click();

  await expect(importItem(page, 'a.json')).toHaveAttribute('data-state', 'importing');
  await expect(page.getByTestId('import-progress')).toHaveText('0 of 3 files done.');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await page.getByTestId('import-close').click();
  await expect(page.getByTestId('import-close-ask')).toBeVisible();
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(GERMAN);
  await page.getByTestId('import-abort-close').click();
  await expect(page.getByTestId('dialog-import')).toHaveCount(0);
  expect(await visibleText(page)).not.toMatch(GERMAN);
});
