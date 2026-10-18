import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, type Locator, type Page, test } from '@playwright/test';

// The Strategy Designer in the three browsers: what the unit tests cannot show because jsdom
// has no layout and no real mouse (dragging, connecting, the object directory of the run).

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

type StrategyDocument = {
  id: string;
  title: string;
  elements: { id: string; type: string; title: string; x: number; y: number; management_of: string | null }[];
  connections: { source: string; output: string; target: string }[];
};

function testcase(name: string): StrategyDocument {
  return JSON.parse(
    readFileSync(resolve(root, `contracts/strategies/v1/testcases/${name}.strategy.json`), 'utf-8'),
  ) as StrategyDocument;
}

test.beforeEach(async ({ request }) => {
  const response = await request.put('/api/studio/settings/language', { data: { language: 'de' } });
  expect(response.ok()).toBe(true);
});

// Every test leaves the object directory of the run empty: the next browser starts clean.
test.afterEach(async ({ request }) => {
  const list = (await (await request.get('/api/v1/strategies')).json()) as { items: { id: string }[] };
  for (const item of list.items) {
    await request.delete(`/api/v1/strategies/${item.id}`);
  }
});

async function objectDirectory(page: Page): Promise<string> {
  const response = await page.request.get('/api/studio/settings/object-directory');
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { path: string };
  return body.path;
}

async function loadedPage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Neue Strategie' })).toBeEnabled();
}

async function storedStrategies(page: Page): Promise<StrategyDocument[]> {
  const list = (await (await page.request.get('/api/v1/strategies')).json()) as { items: { id: string }[] };
  const documents: StrategyDocument[] = [];
  for (const item of list.items) {
    documents.push((await (await page.request.get(`/api/v1/strategies/${item.id}`)).json()) as StrategyDocument);
  }
  return documents;
}

function node(page: Page, text: string | RegExp): Locator {
  return page.locator('.react-flow__node-element').filter({ hasText: text });
}

async function center(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 20 });
  // The last movement lies on the target and gets a moment to be taken in, so that the release
  // meets the connector (the browsers differ in how soon they report the element under the pointer).
  await page.mouse.move(to.x + 1, to.y);
  await page.waitForTimeout(100);
  await page.mouse.up();
}

async function openStored(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Öffnen' }).click();
  await page.getByRole('dialog', { name: 'Strategie öffnen' }).getByRole('button', { name: title }).click();
  await expect(page.locator('.react-flow__node-element').first()).toBeVisible();
  // The view is fitted to the strategy and the elements are laid out.
  await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
}

test.describe('the object directory of the run (item 15 of the order)', () => {
  test('lies inside the temporary directory of the run, not in the standard directory', async ({ page }) => {
    const directory = await objectDirectory(page);

    expect(directory.startsWith(tmpdir())).toBe(true);
    expect(basename(dirname(directory))).toMatch(/^pipwerk-studio-e2e-\d+-/);
    expect(basename(directory)).toBe('objects');
  });

  test('holds exactly one file after "Speichern" of a new strategy', async ({ page }) => {
    const directory = await objectDirectory(page);
    // The directory is created with the first file. Before it there is nothing in it.
    expect(existsSync(directory) ? readdirSync(directory) : []).toEqual([]);
    await loadedPage(page);

    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(1);
    expect(existsSync(directory) ? readdirSync(directory) : []).toEqual([]);
    await page.getByLabel('Bezeichnung').fill('Eine Strategie im Browsertest');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
    const files = readdirSync(directory);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.strategy\.json$/);
    const stored = JSON.parse(readFileSync(join(directory, files[0] as string), 'utf-8')) as StrategyDocument;
    expect(stored.title).toBe('Eine Strategie im Browsertest');
    expect(stored.elements).toHaveLength(1);

    // Saving again replaces the file; there is still one. The test waits for the end of this save
    // (the answer of the PUT), not for the count of findings, which is shown since the first save.
    await page.getByLabel('Bezeichnung').fill('Zweiter Stand im Browsertest');
    const replaced = page.waitForResponse(
      (response) => response.request().method() === 'PUT' && /\/api\/v1\/strategies\/[^/]+$/.test(response.url()),
    );
    await page.getByRole('button', { name: 'Speichern' }).click();
    expect((await replaced).ok()).toBe(true);
    expect(readdirSync(directory)).toEqual(files);
    const replacedDocument = JSON.parse(readFileSync(join(directory, files[0] as string), 'utf-8')) as StrategyDocument;
    expect(replacedDocument.title).toBe('Zweiter Stand im Browsertest');

    // Deleting the strategy removes the file.
    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.getByRole('dialog', { name: 'Strategie löschen?' }).getByRole('button', { name: 'Löschen' }).click();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(0);
    expect(readdirSync(directory)).toEqual([]);
  });
});

test.describe('the drawing area', () => {
  test('inserts from the library with the keyboard and with the mouse, and connects with the mouse', async ({ page }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(1);

    // Keyboard: choose the entry and press Enter.
    await page.getByRole('option', { name: /^Bedingung/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.react-flow__node-element')).toHaveCount(2);
    await expect(page.getByRole('heading', { level: 2, name: 'Bedingung' })).toBeVisible();

    // Mouse: drag the entry to a place on the drawing area.
    const pane = page.locator('.react-flow__pane');
    const box = (await pane.boundingBox())!;
    await page.getByRole('option', { name: /^Berechnung/ }).dragTo(pane, { targetPosition: { x: box.width * 0.55, y: box.height * 0.7 } });
    await expect(page.locator('.react-flow__node-element')).toHaveCount(3);
    const calculation = node(page, 'Berechnung');
    const placed = await center(calculation);
    // The element lies where it was dropped, and wholly inside the visible drawing area.
    expect(Math.abs(placed.x - (box.x + box.width * 0.55))).toBeLessThan(box.width * 0.1);
    expect(placed.x).toBeLessThan(box.x + box.width - 120);
    expect(placed.y).toBeGreaterThan(box.y + box.height * 0.5);

    // Connect the trigger to the condition: from its output to the input of the condition.
    const trigger = node(page, 'Kerzenschluss');
    const condition = node(page, 'Bedingung');
    await drag(
      page,
      await center(trigger.locator('.react-flow__handle.source')),
      await center(condition.locator('.react-flow__handle.target')),
    );
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    // A second connection: from the output "wahr" of the condition to the calculation.
    await drag(
      page,
      await center(condition.locator('.react-flow__handle.source[data-handleid="wahr"]')),
      await center(calculation.locator('.react-flow__handle.target')),
    );
    await expect(page.locator('.react-flow__edge')).toHaveCount(2);
    // And a connection that leads back: from the calculation to the condition.
    await drag(
      page,
      await center(calculation.locator('.react-flow__handle.source')),
      await center(condition.locator('.react-flow__handle.target')),
    );
    await expect(page.locator('.react-flow__edge')).toHaveCount(3);

    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
    const [stored] = await storedStrategies(page);
    const byTitle = (title: string) => stored!.elements.find((element) => element.title === title)!;
    expect(stored?.elements.map((element) => element.title).sort()).toEqual(['Bedingung', 'Berechnung', 'Kerzenschluss']);
    expect(stored?.connections).toEqual(
      expect.arrayContaining([
        { source: byTitle('Kerzenschluss').id, output: 'weiter', target: byTitle('Bedingung').id },
        { source: byTitle('Bedingung').id, output: 'wahr', target: byTitle('Berechnung').id },
        { source: byTitle('Berechnung').id, output: 'weiter', target: byTitle('Bedingung').id },
      ]),
    );
    expect(stored?.connections).toHaveLength(3);
  });

  test('shows an expression with the names in the language, from the names the real backend recognizes', async ({ page }) => {
    await loadedPage(page);
    await page.getByRole('button', { name: 'Neue Strategie' }).click();
    await page.getByRole('option', { name: /^Bedingung/ }).focus();
    await page.keyboard.press('Enter');
    const expression = page.getByRole('combobox', { name: 'Ausdruck' });

    await expression.fill('Konto.kapital > Order.volumen');
    await expect(expression).toHaveValue('Konto.kapital > Order.volumen');
    // The suggestions come after a point and are chosen with the keyboard.
    await expression.pressSequentially(' + Kerze.');
    await expect(page.getByRole('listbox', { name: 'Vorschläge' }).getByRole('option').first()).toContainText('Eröffnung');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(expression).toHaveValue('Konto.kapital > Order.volumen + Kerze.hoch');

    await expect(page.locator('.expression-display code')).toHaveText('Konto.Kapital > Order.Volumen + Kerze.Hoch');
    await page.getByRole('button', { name: 'Einstellungen' }).click();
    // The names of the dialog change with the language, so it is found by both.
    const dialog = page.getByRole('dialog', { name: /^(Einstellungen|Settings)$/ });
    await dialog.getByLabel('Sprache').selectOption('en');
    await expect(dialog.getByLabel('Language')).toBeEnabled();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.expression-display code')).toHaveText('Account.Equity > Order.Volume + Candle.High');
  });

  test('removes a connection and an element with the Delete key', async ({ page, request }) => {
    const created = await request.post('/api/v1/strategies', { data: testcase('str-03') });
    expect(created.ok()).toBe(true);
    await loadedPage(page);
    await openStored(page, 'EMA-Trendfolge');
    const before = testcase('str-03').connections.length;
    await expect(page.locator('.react-flow__edge:not(.management-edge)')).toHaveCount(before);

    // The edge is chosen by a click on its path.
    await page.locator('.react-flow__edge:not(.management-edge) .react-flow__edge-interaction').first().click({ force: true });
    await page.keyboard.press('Delete');
    await expect(page.locator('.react-flow__edge:not(.management-edge)')).toHaveCount(before - 1);

    await node(page, 'Richtung').click();
    await page.keyboard.press('Delete');
    await expect(node(page, /^Richtung/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Speichern' }).click();
    const [stored] = await storedStrategies(page);
    expect(stored?.elements.some((element) => element.title === 'Richtung')).toBe(false);
    expect(stored?.connections.length).toBeLessThan(before - 1);
  });

  test('shows the management as a frame; collapsing hides its elements, they stay in the document', async ({ page, request }) => {
    const document = testcase('str-03');
    expect((await request.post('/api/v1/strategies', { data: document })).ok()).toBe(true);
    await loadedPage(page);
    await openStored(page, 'EMA-Trendfolge');
    const members = document.elements.filter((element) => element.management_of !== null).length;
    const all = document.elements.length;
    await expect(page.locator('.react-flow__node-management')).toBeVisible();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(all);

    await page.getByRole('button', { name: 'Verwaltung „Order aufgeben“ einklappen' }).click();

    await expect(page.locator('.react-flow__node-element')).toHaveCount(all - members);
    await expect(page.getByRole('button', { name: 'Verwaltung „Order aufgeben“ aufklappen' })).toHaveAttribute('aria-expanded', 'false');
    // The document is unchanged: closing does not ask.
    await page.getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.react-flow__node-element')).toHaveCount(0);
  });

  test('puts an element into the management when it is dragged into the frame, and takes it out when it is dragged out', async ({ page, request }) => {
    const document = testcase('str-03');
    expect((await request.post('/api/v1/strategies', { data: document })).ok()).toBe(true);
    await loadedPage(page);
    await openStored(page, 'EMA-Trendfolge');
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    const frame = page.locator('.react-flow__node-management');
    const frameBox = (await frame.boundingBox())!;

    // Into the frame: the calculation of the main flow to the empty place at the right of the frame.
    const calculation = node(page, /^Richtung/);
    await drag(page, await center(calculation), { x: frameBox.x + frameBox.width * 0.85, y: frameBox.y + frameBox.height * 0.4 });
    // Out of the frame: a member to the empty place above the frame.
    const member = node(page, /^Position schließen/);
    const pane = (await page.locator('.react-flow__pane').boundingBox())!;
    await drag(page, await center(member), { x: pane.x + 60, y: pane.y + 50 });

    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
    const [stored] = await storedStrategies(page);
    const byTitle = (title: string) => stored!.elements.find((element) => element.title === title)!;
    expect(byTitle('Richtung').management_of).toBe(owner.id);
    expect(byTitle('Position schließen').management_of).toBeNull();
    // The other members stay where they are.
    expect(byTitle('Order ausgeführt').management_of).toBe(owner.id);
    expect(byTitle('Order aufgeben').management_of).toBeNull();
  });

  test('moves all elements of a management when the frame is dragged by its title', async ({ page, request }) => {
    const document = testcase('str-03');
    expect((await request.post('/api/v1/strategies', { data: document })).ok()).toBe(true);
    await loadedPage(page);
    await openStored(page, 'EMA-Trendfolge');
    const header = page.locator('.management-header');
    const headerBox = (await header.boundingBox())!;

    await drag(page, { x: headerBox.x + headerBox.width - 30, y: headerBox.y + headerBox.height / 2 }, { x: headerBox.x + headerBox.width - 30, y: headerBox.y + headerBox.height / 2 + 60 });

    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText(/^Befunde: \d+$/)).toBeVisible();
    const [stored] = await storedStrategies(page);
    const moved = stored!.elements.filter((element) => element.management_of !== null);
    const original = document.elements.filter((element) => element.management_of !== null);
    expect(moved).toHaveLength(original.length);
    const first = original.find((element) => element.id === moved[0]!.id)!;
    const shift = { x: moved[0]!.x - first.x, y: moved[0]!.y - first.y };
    expect(shift.y).toBeGreaterThan(10);
    // Every element of the management moved by the same amount.
    for (const element of moved) {
      const before = original.find((candidate) => candidate.id === element.id)!;
      expect(element.y - before.y).toBeCloseTo(shift.y, 3);
      expect(element.x - before.x).toBeCloseTo(shift.x, 3);
    }
    // Elements outside the management stay where they were.
    for (const element of stored!.elements.filter((candidate) => candidate.management_of === null)) {
      const before = document.elements.find((candidate) => candidate.id === element.id)!;
      expect([element.x, element.y]).toEqual([before.x, before.y]);
    }
  });
});
