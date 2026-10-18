import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import {
  createAndSave,
  insert,
  libraryEntry,
  loadedPage,
  objectDirectory,
  openStored,
  panel,
  save,
  storedStrategies,
  testcase,
  useCleanRun,
} from './support';

// The workflows of the Strategy Designer in the three browsers, part 2: the questions about
// unsaved changes, open and delete, rules, the origin of an instance and a strategy with an
// element of an unknown type. A document is put in through the Web API only where the user
// interface cannot produce it (an unknown type, a file that cannot be read).

useCleanRun();

// --- unsaved changes (acceptance criterion 7) ------------------------------------------------

function unsavedDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Ungespeicherte Änderungen' });
}

test.describe('unsaved changes (acceptance criterion 7)', () => {
  test('"Schließen" asks: "Abbrechen" keeps the strategy open, "Verwerfen" closes it without saving', async ({ page }) => {
    await loadedPage(page);
    await createAndSave(page, 'Fragetest');
    await page.getByLabel('Bezeichnung', { exact: true }).fill('Fragetest geändert');

    await page.getByRole('button', { name: 'Schließen' }).click();
    await expect(unsavedDialog(page).getByRole('button')).toHaveText(['Speichern', 'Verwerfen', 'Abbrechen']);
    await unsavedDialog(page).getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('Fragetest geändert');

    await page.getByRole('button', { name: 'Schließen' }).click();
    await unsavedDialog(page).getByRole('button', { name: 'Verwerfen' }).click();
    await expect(page.getByText(/^Es ist keine Strategie geöffnet\./)).toBeVisible();
    expect((await storedStrategies(page)).map((document) => document.title)).toEqual(['Fragetest']);
  });

  test('"Neue Strategie" asks: "Speichern" saves the open strategy and opens the new, empty one', async ({ page }) => {
    await loadedPage(page);
    await createAndSave(page, 'Fragetest');
    await page.getByLabel('Bezeichnung', { exact: true }).fill('Fragetest gespeichert');

    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await unsavedDialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('');
    await expect.poll(async () => (await storedStrategies(page)).map((document) => document.title)).toEqual([
      'Fragetest gespeichert',
    ]);
  });

  test('"Öffnen" asks after the choice of an entry: "Speichern" saves the new strategy, then opens the chosen one', async ({
    page,
  }) => {
    await loadedPage(page);
    await createAndSave(page, 'Erste');
    await page.getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByText(/^Es ist keine Strategie geöffnet\./)).toBeVisible();
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await page.getByLabel('Bezeichnung', { exact: true }).fill('Zweite');

    await page.getByRole('button', { name: 'Öffnen' }).click();
    await page.getByRole('dialog', { name: 'Strategie öffnen' }).getByRole('button', { name: 'Erste' }).click();
    await expect(unsavedDialog(page)).toBeVisible();
    await unsavedDialog(page).getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('Erste');
    await expect
      .poll(async () => (await storedStrategies(page)).map((document) => document.title).sort())
      .toEqual(['Erste', 'Zweite']);
  });

  test('a strategy without changes is replaced and closed without a question', async ({ page }) => {
    await loadedPage(page);
    await createAndSave(page, 'Ohne Änderung');

    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Bezeichnung', { exact: true })).toHaveValue('');
    await page.getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/^Es ist keine Strategie geöffnet\./)).toBeVisible();
  });
});

// --- open and delete (acceptance criterion 8) ------------------------------------------------

const MODIFIED = /^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr$/;

test.describe('open and delete (acceptance criterion 8)', () => {
  test('"Öffnen" lists title, description and last change; a file that cannot be read is marked and cannot be opened', async ({
    page,
  }) => {
    const directory = await objectDirectory(page);
    await loadedPage(page);
    await createAndSave(page, 'Liste eins', 'Die erste Beschreibung');
    await page.getByRole('button', { name: 'Schließen' }).click();
    await createAndSave(page, 'Liste zwei', 'Die zweite Beschreibung');
    mkdirSync(directory, { recursive: true });
    const broken = join(directory, '00000000-0000-4000-8000-00000000e2e0.strategy.json');
    writeFileSync(broken, 'das ist kein Dokument', 'utf-8');
    try {
      await page.getByRole('button', { name: 'Öffnen' }).click();

      const list = page.getByRole('dialog', { name: 'Strategie öffnen' });
      await expect(list.getByRole('columnheader')).toHaveText(['Bezeichnung', 'Beschreibung', 'Letzte Änderung']);
      for (const [title, description] of [
        ['Liste eins', 'Die erste Beschreibung'],
        ['Liste zwei', 'Die zweite Beschreibung'],
      ] as const) {
        const row = list.getByRole('row').filter({ has: page.getByRole('button', { name: title }) });
        await expect(row.getByRole('cell').nth(1)).toHaveText(description);
        await expect(row.getByRole('cell').nth(2)).toHaveText(MODIFIED);
      }
      const unreadable = list.getByRole('row').filter({ hasText: 'nicht lesbar' });
      await expect(unreadable).toHaveCount(1);
      await expect(unreadable.getByRole('button')).toHaveCount(0);
      await list.getByRole('button', { name: 'Abbrechen' }).click();
    } finally {
      rmSync(broken, { force: true });
    }
  });

  test('"Löschen" asks first: "Abbrechen" keeps the strategy, "Löschen" removes it and closes it', async ({ page }) => {
    await loadedPage(page);
    await createAndSave(page, 'Zu löschen');
    await page.getByRole('button', { name: 'Schließen' }).click();
    await createAndSave(page, 'Bleibt');
    await page.getByRole('button', { name: 'Löschen' }).click();
    const question = page.getByRole('dialog', { name: 'Strategie löschen?' });
    await expect(question).toContainText('Die Strategie „Bleibt“ wird gelöscht.');

    await question.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await storedStrategies(page)).toHaveLength(2);

    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.getByRole('dialog', { name: 'Strategie löschen?' }).getByRole('button', { name: 'Löschen' }).click();

    await expect(page.getByText(/^Es ist keine Strategie geöffnet\./)).toBeVisible();
    expect((await storedStrategies(page)).map((document) => document.title)).toEqual(['Zu löschen']);
  });
});

// --- rules (acceptance criterion 10) -----------------------------------------------------------

function rulesOf(page: Page): Locator {
  return panel(page).getByRole('region', { name: 'Regeln', exact: true });
}

test.describe('rules (acceptance criterion 10)', () => {
  test('of the strategy: add a template of the library, create a new rule, change the order, remove; the findings of a rule stand with the rule', async ({
    page,
  }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    const rules = rulesOf(page);
    await expect(rules).toContainText('Keine Regeln.');

    // A template from the element library: the choice in the list and "Hinzufügen".
    const select = rules.getByLabel('Vorlage aus der Elementbibliothek', { exact: true });
    const template = await select.locator('option', { hasText: 'Risiko je Trade' }).first().getAttribute('value');
    await select.selectOption(template!);
    await rules.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
    await panel(page).getByLabel('Name', { exact: true }).fill('risiko');
    await panel(page).getByRole('button', { name: /^Zurück zu/ }).click();
    await expect(rules.locator('.rule-entry')).toHaveCount(1);
    await expect(rules.locator('.rule-entry')).toContainText('Risiko je Trade');

    // A new rule in the strategy, with an expression that has a mistake.
    await rules.getByRole('button', { name: 'Neue Regel' }).click();
    await panel(page).getByLabel('Name', { exact: true }).fill('pruefung');
    await panel(page).getByRole('combobox', { name: 'Ausdruck', exact: true }).fill('gibtesnicht.wert > 1');
    await panel(page).getByRole('button', { name: /^Zurück zu/ }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['risiko', 'pruefung']);

    // The order of the rules is the order of the evaluation.
    await rules.getByRole('button', { name: 'Regel pruefung nach oben' }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['pruefung', 'risiko']);
    await rules.getByRole('button', { name: 'Regel pruefung nach unten' }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['risiko', 'pruefung']);

    // The finding of the mistake stands with the rule: its count at the entry, its text in its view.
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(rules.locator('.rule-entry').filter({ hasText: 'pruefung' })).toContainText(/\d+ Fehler/);
    await expect(rules.locator('.rule-entry').filter({ hasText: 'risiko' }).locator('.rule-findings')).toHaveCount(0);
    await expect(panel(page).getByRole('region', { name: 'Befunde der Strategie' })).toHaveCount(0);
    await rules.getByRole('button', { name: 'Regel pruefung auswählen' }).click();
    await expect(panel(page).getByRole('region', { name: 'Befunde dieser Regel' })).toContainText(
      'Unbekannter Name „gibtesnicht“',
    );
    await panel(page).getByRole('button', { name: /^Zurück zu/ }).click();

    await rules.getByRole('button', { name: 'Regel pruefung entfernen' }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['risiko']);

    // Saved and opened again, the rule has kept its origin.
    await panel(page).getByLabel('Bezeichnung', { exact: true }).fill('Regeln');
    await save(page);
    const [stored] = await storedStrategies(page);
    expect(stored?.rules).toHaveLength(1);
    expect(stored?.rules[0]?.name).toBe('risiko');
    expect(stored?.rules[0]?.origin.template_title).toBe('Risiko je Trade');
  });

  test('of "Order aufgeben": add a template with the keyboard from the library, create a new rule, change the order, remove', async ({
    page,
  }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await insert(page, 'Elemente des Ablaufs', /^Order aufgeben/);
    const rules = rulesOf(page);
    await expect(rules).toContainText('Keine Regeln.');

    // The element is selected, so the entry of the library goes to its rules.
    await libraryEntry(page, 'Mitgelieferte Vorlagen', /^Risiko je Trade/).focus();
    await page.keyboard.press('Enter');
    await expect(panel(page).getByRole('button', { name: /^Zurück zu Order aufgeben/ })).toBeVisible();
    await panel(page).getByRole('button', { name: /^Zurück zu Order aufgeben/ }).click();
    await expect(rules.locator('.rule-entry')).toHaveCount(1);
    await expect(rules.locator('.rule-entry')).toContainText('Risiko je Trade');

    await rules.getByRole('button', { name: 'Neue Regel' }).click();
    await panel(page).getByLabel('Name', { exact: true }).fill('mindestvolumen');
    await panel(page).getByRole('button', { name: /^Zurück zu Order aufgeben/ }).click();
    const names = await rules.locator('.rule-name').allTextContents();
    expect(names).toHaveLength(2);
    expect(names[1]).toBe('mindestvolumen');

    await rules.getByRole('button', { name: 'Regel mindestvolumen nach oben' }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['mindestvolumen', names[0]!]);
    await rules.getByRole('button', { name: `Regel ${names[0]!} entfernen` }).click();
    await expect(rules.locator('.rule-name')).toHaveText(['mindestvolumen']);
  });

  test('an instance shows its origin: "ema20, aus Objekttyp EMA"', async ({ page }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await insert(page, 'Objekttypen', /^EMA/);

    await panel(page).getByLabel('Name', { exact: true }).fill('ema20');

    await expect(panel(page).locator('.origin')).toHaveText('ema20, aus Objekttyp EMA');
  });
});

// --- an element of an unknown type (acceptance criterion 11) -------------------------------

test.describe('an element of an unknown type (acceptance criterion 11)', () => {
  test('opens red with the identifier of its type; the values are read only and stay as they are after "Speichern"', async ({
    page,
    request,
  }) => {
    const document = testcase('str-03');
    document.title = 'Mit fremdem Element';
    document.elements.push({
      id: '00000000-0000-4000-8000-0000000000cc',
      type: 'x.unbekannt',
      title: 'Fremdes Element',
      name: null,
      x: 200,
      y: 200,
      parameters: { wert: { kind: 'fixed', value: 42 } },
      properties: {},
      rules: [],
      management_of: null,
      instance: null,
    });
    // The user interface cannot make such an element; the document comes through the Web API.
    expect((await request.post('/api/v1/strategies', { data: document })).ok()).toBe(true);
    await loadedPage(page);

    await openStored(page, 'Mit fremdem Element');

    const unknown = page.locator('.react-flow__node-element[data-id="00000000-0000-4000-8000-0000000000cc"]');
    await expect(unknown.locator('.element-node')).toHaveClass(/unknown-type/);
    await expect(unknown).toContainText('x.unbekannt');
    const [red, green, blue] = await unknown.locator('.element-node').evaluate((element) => {
      const match = /^rgba?\((\d+), (\d+), (\d+)/.exec(getComputedStyle(element).borderTopColor);
      return [Number(match?.[1]), Number(match?.[2]), Number(match?.[3])];
    });
    expect(red).toBeGreaterThan(150);
    expect(green).toBeLessThan(80);
    expect(blue).toBeLessThan(80);

    await unknown.click();
    await expect(panel(page)).toContainText('Unbekannter Typ „x.unbekannt“');
    const stored = panel(page).locator('.stored-bindings');
    await expect(stored).toContainText('wert');
    await expect(stored).toContainText('fester Wert: 42');
    await expect(stored.locator('input, select, textarea')).toHaveCount(0);

    // A change elsewhere is saved; the values of the unknown element stay.
    await page.locator('.react-flow__pane').click({ position: { x: 20, y: 20 } });
    await panel(page).getByLabel('Bezeichnung', { exact: true }).fill('Mit fremdem Element, gespeichert');
    await save(page);
    const [after] = await storedStrategies(page);
    expect(after?.title).toBe('Mit fremdem Element, gespeichert');
    expect(after?.elements).toEqual(document.elements);
  });
});
