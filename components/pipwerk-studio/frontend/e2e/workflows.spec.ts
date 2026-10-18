import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { createAndSave, insert, loadedPage, nodeById, objectDirectory, panel, save, useCleanRun } from './support';

// The workflows of the Strategy Designer in the three browsers, each from the point of view of
// the user: settings (language and object directory) and findings on the drawing area. The
// questions about unsaved changes, open and delete, rules and the unknown type are in
// `strategies.spec.ts`.

useCleanRun();

const SETTINGS = /^(Einstellungen|Settings)$/;

async function openSettings(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: SETTINGS }).click();
  const dialog = page.getByRole('dialog', { name: SETTINGS });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Changes the object directory in the settings, answers the question and closes the dialog. */
async function changeObjectDirectory(page: Page, path: string, answer: string): Promise<void> {
  const dialog = await openSettings(page);
  await dialog.getByLabel('Verzeichnis (absoluter Pfad)').fill(path);
  await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
  await expect(dialog.getByText('Dateien verschieben?')).toBeVisible();
  await dialog.getByRole('button', { name: answer }).click();
  await expect(dialog.getByText('Das Objektverzeichnis wurde geändert.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test.describe('settings: the object directory (acceptance criterion 9)', () => {
  let target: string;

  test.beforeEach(() => {
    // A directory of the run, next to the object directory of the backend, not in the standard directory.
    target = mkdtempSync(join(tmpdir(), 'pipwerk-studio-e2e-target-'));
  });

  test.afterEach(() => {
    rmSync(target, { recursive: true, force: true });
  });

  test('with "Ja, Dateien verschieben" the strategy stays in the list of "Öffnen", its file is in the new directory', async ({
    page,
  }, testInfo) => {
    const original = await objectDirectory(page);
    testInfo.annotations.push({ type: 'object-directory', description: original });
    await loadedPage(page);
    await createAndSave(page, 'Mit Verschieben');
    expect(readdirSync(original)).toHaveLength(1);
    expect(readdirSync(target)).toEqual([]);

    await changeObjectDirectory(page, target, 'Ja, Dateien verschieben');

    expect(await objectDirectory(page)).toBe(target);
    expect(readdirSync(target)).toHaveLength(1);
    expect(readdirSync(original)).toEqual([]);
    // The open strategy stays open; the list of "Öffnen" shows the moved file.
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('Mit Verschieben');
    await page.getByRole('button', { name: 'Öffnen' }).click();
    const list = page.getByRole('dialog', { name: 'Strategie öffnen' });
    await expect(list.getByRole('button', { name: 'Mit Verschieben' })).toBeVisible();
    await list.getByRole('button', { name: 'Abbrechen' }).click();
  });

  test('with "Nein, nur das Verzeichnis ändern" the strategy is not in the list of "Öffnen"; the next "Speichern" writes to the new directory', async ({
    page,
  }, testInfo) => {
    const original = await objectDirectory(page);
    testInfo.annotations.push({ type: 'object-directory', description: original });
    await loadedPage(page);
    await createAndSave(page, 'Ohne Verschieben');

    await changeObjectDirectory(page, target, 'Nein, nur das Verzeichnis ändern');

    expect(await objectDirectory(page)).toBe(target);
    // The file stays where it was; the new directory is empty and so is the list.
    expect(readdirSync(original)).toHaveLength(1);
    expect(readdirSync(target)).toEqual([]);
    await page.getByRole('button', { name: 'Öffnen' }).click();
    const list = page.getByRole('dialog', { name: 'Strategie öffnen' });
    await expect(list.getByText('Es sind keine Strategien gespeichert.')).toBeVisible();
    await expect(list.getByRole('button', { name: 'Ohne Verschieben' })).toHaveCount(0);
    await list.getByRole('button', { name: 'Abbrechen' }).click();

    // The strategy is still open and is saved into the new directory.
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('Ohne Verschieben');
    await page.getByLabel('Bezeichnung', { exact: true }).fill('Ohne Verschieben, gespeichert');
    await save(page);
    expect(readdirSync(target)).toHaveLength(1);
    await page.getByRole('button', { name: 'Öffnen' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Strategie öffnen' }).getByRole('button', { name: 'Ohne Verschieben, gespeichert' }),
    ).toBeVisible();
    await page.getByRole('dialog', { name: 'Strategie öffnen' }).getByRole('button', { name: 'Abbrechen' }).click();
  });

  test('"Abbrechen" and a path that is not absolute change nothing', async ({ page }, testInfo) => {
    const original = await objectDirectory(page);
    testInfo.annotations.push({ type: 'object-directory', description: original });
    await loadedPage(page);
    const dialog = await openSettings(page);

    await dialog.getByLabel('Verzeichnis (absoluter Pfad)').fill(target);
    await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    expect(await objectDirectory(page)).toBe(original);

    await dialog.getByLabel('Verzeichnis (absoluter Pfad)').fill('nicht/absolut');
    await dialog.getByRole('button', { name: 'Verzeichnis ändern' }).click();
    await dialog.getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }).click();
    // The cause stands in the dialog, nothing was changed.
    await expect(dialog.getByRole('alert')).toContainText('Das Objektverzeichnis konnte nicht geändert werden.');
    expect(await objectDirectory(page)).toBe(original);
  });
});

test.describe('settings: the language (acceptance criterion 9)', () => {
  test('stays after a reload of the page, for the whole user interface', async ({ page }) => {
    await loadedPage(page);
    const dialog = await openSettings(page);
    await dialog.getByLabel('Sprache').selectOption('en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(dialog.getByLabel('Language')).toBeEnabled();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('button', { name: 'New strategy' })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('button', { name: 'New strategy' })).toBeEnabled();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('complementary', { name: 'Element library' })).toBeVisible();
    await expect(page.getByRole('listbox', { name: 'Triggers' })).toBeVisible();
    await page.getByRole('button', { name: 'New strategy' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Strategy' })).toBeVisible();
    await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
  });
});

// --- findings (acceptance criteria 2 and 5) ---------------------------------------------------

/** The color of the outline of an element on the drawing area. */
async function outline(node: Locator): Promise<[number, number, number]> {
  const color = await node.locator('.element-node').evaluate((element) => getComputedStyle(element).borderTopColor);
  const match = /^rgba?\((\d+), (\d+), (\d+)/.exec(color);
  expect(match, color).not.toBeNull();
  return [Number(match![1]), Number(match![2]), Number(match![3])];
}

test.describe('findings (acceptance criteria 2 and 5)', () => {
  test('a trigger from the library without a time unit: "Prüfen" shows the finding red at the element, the text with its properties, the finding without element with the strategy', async ({
    page,
  }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await insert(page, 'Auslöser', /^Kerzenschluss/);
    await expect(page.locator('.element-node[data-severity]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Prüfen' }).click();

    // Three findings: the missing time unit and the missing connection at the trigger, and the hint
    // without an element that no order can be reached.
    await expect(page.getByText('Befunde: 3')).toBeVisible();
    const trigger = page.locator('.react-flow__node-element');
    await expect(trigger.locator('.element-node')).toHaveAttribute('data-severity', 'error');
    await expect(trigger.locator('.element-node-mark')).toHaveText('Fehler');
    const [red, green, blue] = await outline(trigger);
    expect(red).toBeGreaterThan(150);
    expect(green).toBeLessThan(80);
    expect(blue).toBeLessThan(80);
    // No message has to be clicked away.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    // With the selected element: the text of the finding stands next to its properties.
    await trigger.click();
    const ofElement = panel(page).getByRole('region', { name: 'Befunde dieses Elements' });
    await expect(ofElement).toContainText('Fehler');
    await expect(ofElement).toContainText('Der Pflichtparameter „Zeiteinheit“ hat keinen Wert.');
    await expect(ofElement).toContainText('Der Auslöser ist mit keinem Element des Ablaufs verbunden.');
    await expect(panel(page).getByLabel('Bindungsart von Zeiteinheit', { exact: true })).toBeVisible();

    // The finding without an element stands with the strategy.
    await page.locator('.react-flow__pane').click({ position: { x: 20, y: 20 } });
    const ofStrategy = panel(page).getByRole('region', { name: 'Befunde der Strategie' });
    await expect(ofStrategy).toContainText('Hinweis');
    await expect(ofStrategy).toContainText('Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt.');

    // Binding the time unit removes the finding of the parameter: the count falls.
    await trigger.click();
    await panel(page).getByLabel('Bindungsart von Zeiteinheit', { exact: true }).selectOption('fixed');
    await panel(page).getByLabel('Zeiteinheit', { exact: true }).selectOption('h1');
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(page.getByText('Befunde: 2')).toBeVisible();
  });

  test('an element with a hint is outlined orange (the answer of the check is replaced: a strategy has no hint at an element)', async ({
    page,
  }) => {
    let element: string | null = null;
    // The library reports a hint at an element only for templates. To see the outline of a hint, the
    // answer of the check gets, instead of the findings of the element, one finding of the level hint.
    await page.route('**/api/v1/check', async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { findings: { element: string | null; [field: string]: unknown }[] };
      if (element !== null) {
        body.findings = body.findings.filter((finding) => finding.element !== element);
        body.findings.push({ level: 'hint', code: 'flow.no_incoming', element, subject: null, details: {} });
      }
      await route.fulfill({ response, json: body });
    });
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    element = await insert(page, 'Elemente des Ablaufs', /^Bedingung/);

    await page.getByRole('button', { name: 'Prüfen' }).click();

    const node = nodeById(page, element);
    await expect(node.locator('.element-node')).toHaveAttribute('data-severity', 'hint');
    await expect(node.locator('.element-node-mark')).toHaveText('Hinweis');
    const [red, green, blue] = await outline(node);
    expect(red).toBeGreaterThan(150);
    expect(green).toBeGreaterThan(50);
    expect(green).toBeLessThan(140);
    expect(blue).toBeLessThan(40);
    await node.click();
    await expect(panel(page).getByRole('region', { name: 'Befunde dieses Elements' })).toContainText('Hinweis');
  });
});
