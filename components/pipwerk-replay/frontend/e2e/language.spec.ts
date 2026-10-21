import type { Page } from '@playwright/test';

import { GAPPY_CSV, chooseView, expect, importCsv, mt5Candles, hourly, openApp, test } from './fixtures';

// German texts that must not be in the English interface: umlauts, the sharp s and German
// words that are no English words. Names the test entered itself are not German.
const GERMAN = /[äöüÄÖÜß]|\b(der|die|das|und|nicht|ist|keine|kein|Datei|Zeitraum|Zeilen|Fehler|Konto|Testkonto|Testkonten|Datenbestand|Beschaffung|Quelle|Kerzen|Zeiteinheit|Hebel|Speichern|Löschen|Schließen|Menü|Sprache|Stand|Lücken|Menge|Zeiträume)\b/;

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

test('shows no German text in the English interface', async ({ page }) => {
  await openApp(page);
  await setLanguage(page, 'en');

  // Data stock: empty state.
  await expect(page.getByTestId('stock-empty')).toContainText('The data stock is empty.');
  expect(await visibleText(page)).not.toMatch(GERMAN);

  // Data stock with data, an import result with rejected rows, an acquisition that fails.
  const rows = [hourly(8), hourly(9), hourly(10)];
  rows[1] = ['2026.01.05', '09:00:00', '1.1', '1.0', '1.2', '1.1', '1', '0', '1'];
  await importCsv(page, { content: mt5Candles(rows), broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'UTC' });
  await expect(page.getByTestId('import-rejected-row')).toContainText('High is below open.');
  await page.getByTestId('proc-instrument').fill('NOSUCHSYMBOL');
  await page.getByTestId('proc-start').click();
  await expect(page.getByTestId('proc-result')).toHaveAttribute('data-state', 'failed', { timeout: 30_000 });
  await expect(page.getByTestId('proc-error-text')).toContainText('The instrument is unknown at the broker.');
  // A file of another kind and a refused file.
  await page.getByTestId('import-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await expect(page.getByTestId('import-format-unknown')).toContainText('Format not recognised.');
  expect(await visibleText(page)).not.toMatch(GERMAN);
  await page.getByTestId('import-file').setInputFiles({ name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from(GAPPY_CSV) });
  await page.getByTestId('import-instrument').fill('EURUSD');
  await page.getByTestId('import-timezone').fill('Europe/Nowhere');
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-error')).toContainText('The time zone is unknown.');
  expect(await visibleText(page)).not.toMatch(GERMAN);

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

test('shows no English text in the German interface of a view', async ({ page }) => {
  await openApp(page);

  const text = await visibleText(page);

  expect(text).toContain('Datenbestand historischer Kursdaten');
  expect(text).not.toMatch(/\b(The|This|data stock|Next step|Candles|Import a file)\b/);
});

test('explains every field to the mouse and to the keyboard', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('import-file').setInputFiles({ name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from(GAPPY_CSV) });

  for (const view of ['data', 'accounts'] as const) {
    await chooseView(page, view);
    if (view === 'accounts') {
      // The form appears when the test accounts are read.
      await expect(page.getByTestId('account-name')).toBeVisible();
    }
    const fields = page.locator('[data-testid^="field-"]');
    const count = await fields.count();
    expect(count).toBeGreaterThan(5);
    for (let index = 0; index < count; index += 1) {
      const field = fields.nth(index);
      const label = field.locator('.field-label');
      const expected = (await label.getAttribute('data-tip')) ?? '';
      expect(expected.length, `field ${String(index)} of ${view}`).toBeGreaterThan(10);
      // Mouse: pointing at the label shows the explanation.
      await field.scrollIntoViewIfNeeded();
      await label.hover();
      await expect(page.getByTestId('tooltip')).toHaveText(expected);
      await page.mouse.move(0, 0);
      await expect(page.getByTestId('tooltip')).toHaveCount(0);
      // Keyboard: the symbol is reached with focus and shows the same text.
      await field.locator('.info').focus();
      await expect(page.getByTestId('tooltip')).toHaveText(expected);
      await field.locator('.info').blur();
      await expect(page.getByTestId('tooltip')).toHaveCount(0);
    }
    if (view === 'data') {
      // The import fields exist only after a CSV file is chosen; stay on the data view for the next round.
      await expect(page.getByTestId('field-import-timezone')).toBeVisible();
    }
  }
});

test('stores nothing in the browser', async ({ page }) => {
  await openApp(page);
  await setLanguage(page, 'en');
  await importCsv(page, { content: GAPPY_CSV, broker: 'Test-Broker', instrument: 'EURUSD', timeUnit: 'h1', timezone: 'UTC' });
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
