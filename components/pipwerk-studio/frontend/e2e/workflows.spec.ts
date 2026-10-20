import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Page } from '@playwright/test';

import { clickMenu, expect, library, node, openApp, openStrategy, showArea, test } from './support';

// Specification 5.5: the workflows save, check, close, new, open, delete and settings.

async function dialogButton(page: Page, name: string | RegExp) {
  return page.getByRole('dialog').getByRole('button', { name });
}

test('a new strategy opens the empty drawing area and says what to do next; saving always works and shows the findings', async ({ page, api }) => {
  void api;
  await openApp(page);
  await clickMenu(page, 'new');

  await expect(page.getByTestId('status-pill')).toContainText('Neue Strategie');
  await expect(page.getByTestId('canvas-empty')).toContainText('Nächster Schritt');
  await expect(page.getByTestId('lane-empty')).toHaveCount(0);
  await expect(page.getByTestId('param-strip')).toContainText('Noch keine');

  // the name, then saving: "gespeichert", and the strategy stands in the list
  await showArea(page, 'props');
  await page.getByTestId('strategy-name').fill('Meine erste Strategie');
  await clickMenu(page, 'save');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  await expect(page.getByTestId('findings-count')).toBeVisible();
  await clickMenu(page, 'open');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Meine erste Strategie' })).toBeVisible();
});

test('"Prüfen" shows the findings with the way to fix them, and a click leads to the element', async ({ page, api }) => {
  void api;
  await openApp(page);
  await clickMenu(page, 'new');
  await library(page, 'Bedingung').click();
  await expect(node(page, 'Bedingung')).toHaveCount(1);

  await clickMenu(page, 'check');

  await expect(page.getByTestId('findings-count')).not.toContainText('keine');
  await page.getByTestId('findings-count').click();
  const findings = page.getByTestId('finding');
  await expect(findings.first()).toBeVisible();
  await expect(findings.first()).toContainText('So beheben Sie es');
  await expect(node(page, 'Bedingung')).toHaveClass(/err|hint/);
  // "Zur Stelle" selects the element
  await page.locator('[data-testid="finding"][data-code="flow.no_incoming"]').getByTestId('finding-goto').click();
  await expect(page.getByTestId('props-element')).toBeVisible();
  await expect(page.getByTestId('element-name')).toHaveValue('Bedingung');
});

test('closing, a new strategy and opening ask what to do with unsaved changes: save, discard, cancel', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  await showArea(page, 'props');
  await page.getByTestId('strategy-name').fill('EMA geändert');

  // cancel: nothing happens
  await clickMenu(page, 'close');
  await expect(page.getByRole('dialog')).toContainText('noch nicht gespeichert');
  for (const name of ['Speichern', 'Verwerfen', 'Abbrechen']) {
    await expect(await dialogButton(page, name)).toBeVisible();
  }
  await (await dialogButton(page, 'Abbrechen')).click();
  await expect(page.getByTestId('status-pill')).toContainText('EMA geändert');

  // discard: the strategy is closed, the stored one is unchanged
  await clickMenu(page, 'new');
  await (await dialogButton(page, 'Verwerfen')).click();
  await expect(page.getByTestId('status-pill')).toContainText('Neue Strategie');
  await clickMenu(page, 'open');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'EMA-Trendfolge', exact: true })).toBeVisible();
  await page.getByTestId('dialog-cancel').click();

  // save: the change is stored, then the strategy is closed
  await showArea(page, 'props');
  await page.getByTestId('strategy-name').fill('Gespeicherter Name');
  await clickMenu(page, 'open');
  await page.getByRole('dialog').getByRole('button', { name: 'EMA-Trendfolge', exact: true }).click();
  await (await dialogButton(page, 'Speichern')).click();
  await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
  await clickMenu(page, 'open');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Gespeicherter Name', exact: true })).toBeVisible();
});

test('the list of strategies shows name, description and last change, and marks a file that cannot be read', async ({ page, api }) => {
  void api;
  await openApp(page);

  await clickMenu(page, 'open');

  const row = page.getByTestId('open-row').filter({ hasText: 'EMA-Trendfolge' });
  await expect(row).toContainText('emma ist die 2 EMA Strategie');
  await expect(row).toContainText(/\d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr/);
  await expect(page.getByRole('dialog').getByText('nicht lesbar')).toHaveCount(1);
});

test('the open strategy is deleted after a question; it is gone from the list', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'Mit unbekanntem Typ');

  await clickMenu(page, 'delete');
  await expect(page.getByRole('dialog')).toContainText('Mit unbekanntem Typ');
  await (await dialogButton(page, 'Abbrechen')).click();
  await expect(page.getByTestId('status-pill')).toContainText('Mit unbekanntem Typ');

  await clickMenu(page, 'delete');
  await (await dialogButton(page, 'Löschen')).click();

  await expect(page.getByTestId('canvas-no-strategy')).toBeVisible();
  await clickMenu(page, 'open');
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Mit unbekanntem Typ' })).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'EMA-Trendfolge' })).toBeVisible();
});

test('the language of the interface is changed in the settings and stays after reloading', async ({ page, api }) => {
  void api;
  await openApp(page);
  await clickMenu(page, 'settings');
  await page.getByRole('dialog').getByLabel('Sprache').selectOption('English');
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Settings');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByTestId('param-strip')).toContainText('Strategy parameters');
  await expect(page.getByTestId('library')).toContainText('Element library');
  await expect(page.getByTestId('library')).toContainText('When to calculate');

  await page.reload();

  await expect(page.getByTestId('param-strip')).toContainText('Strategy parameters');
  await expect(library(page, 'Candle close')).toHaveCount(1);
  // back to German for the tests that follow
  await clickMenu(page, 'settings');
  await page.getByRole('dialog').getByLabel('Language').selectOption('Deutsch');
  await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByTestId('param-strip')).toContainText('Strategieparameter');
});

test('the object directory is changed with the question "Dateien verschieben?", with and without moving', async ({ page, api }) => {
  void api;
  await openApp(page);
  await clickMenu(page, 'settings');
  const dialog = page.getByRole('dialog');
  const directory = dialog.getByLabel('Verzeichnis (absoluter Pfad)');
  const first = join(tmpdir(), `pipwerk-studio-e2e-objects-${Date.now()}-a`);
  const second = join(tmpdir(), `pipwerk-studio-e2e-objects-${Date.now()}-b`);

  // a relative path is refused
  await directory.fill('relativ/pfad');
  await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
  await expect(dialog.getByText('Dateien verschieben?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Das Objektverzeichnis konnte nicht geändert werden.');

  // without moving
  await directory.fill(first);
  await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
  await expect(dialog.getByText('Dateien verschieben?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Abbrechen' }).first().click();
  await expect(dialog.getByText('Dateien verschieben?')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
  await dialog.getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }).click();
  await expect(dialog.getByText('Das Objektverzeichnis wurde geändert.')).toBeVisible();
  await expect(directory).toHaveValue(first);

  // with moving: the stored strategies come along
  await directory.fill(second);
  await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
  await dialog.getByRole('button', { name: 'Ja, Dateien verschieben' }).click();
  await expect(dialog.getByText('Das Objektverzeichnis wurde geändert.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Schließen' }).click();
  await clickMenu(page, 'open');
  // the list belongs to the directory: with the files moved, the strategies are still there
  await expect(page.getByRole('dialog').getByRole('button', { name: 'EMA-Trendfolge', exact: true })).toBeVisible();
});

test('the dialog "Über pipwerk Studio" shows name, version, license and address', async ({ page, api }) => {
  void api;
  await openApp(page);

  await page.getByTestId('menu-about').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('pipwerk Studio');
  await expect(dialog).toContainText('GNU General Public License');
  await expect(dialog.getByRole('link')).toBeVisible();
  await dialog.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
