import { EMA_ELEMENT_IDS } from '../src/testing/emaTrendfolge';
import type { Page } from '@playwright/test';

import { boxOf, card, clickMenu, dragBy, expect, library, newStrategy, node, openApp, openStrategy, overlap, test, viewOf } from './support';

/** "Alles zeigen": the whole strategy at once, so that every element can be reached with the mouse. */
async function showEverything(page: Page): Promise<void> {
  const before = await viewOf(page);
  await page.getByTestId('zoom-fit').click();
  await expect.poll(async () => viewOf(page)).not.toBe(before);
}

// Specification 5.2, 5.3: inserting, moving, connecting, management, sections, orientation and lines of values on the
// drawing area, with the real browser events (dragging with the mouse, dragging of library entries, clicking).

test('the view does not jump when a step is dropped (M3)', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1366, height: 768 });
  await openStrategy(page, 'EMA-Trendfolge');
  // the view is set when the strategy has been fitted into the area; only then does it make sense to compare
  await expect.poll(async () => viewOf(page)).not.toBe('');
  const before = await viewOf(page);
  const step = node(page, 'Richtung');
  const start = await boxOf(step);

  await dragBy(page, step, 70, 40, { x: 100, y: 14 });

  await expect.poll(async () => (await boxOf(step)).x).toBeGreaterThan(start.x + 40);
  expect(await viewOf(page)).toBe(before);
  // the user moved the step: the document holds the place, the document has unsaved changes
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
});

test('a click on an entry of the library inserts the element behind the selected step and connects it', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  const nodesBefore = await page.getByTestId('node').count();
  const edgesBefore = await page.getByTestId('flow-edge').count();
  await node(page, 'Kreuzen').click({ position: { x: 40, y: 14 } });

  await library(page, 'Berechnung').click();

  await expect(page.getByTestId('node')).toHaveCount(nodesBefore + 1);
  await expect(page.getByTestId('flow-edge')).toHaveCount(edgesBefore + 1);
  // the new element is selected, its name is the name of its type, unique
  await expect(page.getByTestId('element-name')).toHaveValue('Berechnung');
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
});

test('an entry of the library dragged onto the drawing area is inserted', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  const nodesBefore = await page.getByTestId('node').count();

  await page.locator('[data-lib="type:trigger.tick"]').dragTo(page.getByTestId('viewport'), { targetPosition: { x: 600, y: 300 } });

  await expect(page.getByTestId('node')).toHaveCount(nodesBefore + 1);
  await expect(page.locator('[data-testid="node"][data-node-name="Tick"]')).toHaveCount(1);
});

test('an entry dragged into the frame of the management belongs to the management', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await showEverything(page);
  const frame = await boxOf(page.getByTestId('frame'));
  // the point must lie in the frame and on no step: in the head of the frame, beside its title
  const x = frame.x + frame.width - 40;
  const y = frame.y + 16;
  const viewport = await boxOf(page.getByTestId('viewport'));

  await library(page, 'Order löschen').dragTo(page.getByTestId('viewport'), { targetPosition: { x: x - viewport.x, y: y - viewport.y } });

  await expect(node(page, 'Order löschen')).toHaveCount(1);
  const inserted = await boxOf(node(page, 'Order löschen'));
  const frameAfter = await boxOf(page.getByTestId('frame'));
  expect(inserted.x).toBeGreaterThanOrEqual(frameAfter.x - 1);
  expect(inserted.x + inserted.width).toBeLessThanOrEqual(frameAfter.x + frameAfter.width + 1);
  expect(inserted.y).toBeGreaterThanOrEqual(frameAfter.y - 1);
  expect(inserted.y + inserted.height).toBeLessThanOrEqual(frameAfter.y + frameAfter.height + 1);
});

test('a step dragged into the frame becomes part of the management, and out of it part of the main flow again', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await showEverything(page);
  const step = node(page, 'Richtung');
  const frame = await boxOf(page.getByTestId('frame'));
  const from = await boxOf(step);
  // the middle of the step moves to a free place inside the frame: next to its title
  await dragBy(page, step, frame.x + frame.width - 120 - (from.x + from.width / 2), frame.y + 60 - (from.y + from.height / 2));

  await expect(page.getByTestId('message')).toContainText('Verwaltung');
  // the flow was arranged anew without the step: the frame lies elsewhere now
  const inside = await boxOf(step);
  const frameNow = await boxOf(page.getByTestId('frame'));
  expect(inside.x).toBeGreaterThanOrEqual(frameNow.x - 1);
  expect(inside.x + inside.width).toBeLessThanOrEqual(frameNow.x + frameNow.width + 1);
  expect(inside.y).toBeGreaterThanOrEqual(frameNow.y - 1);
  expect(inside.y + inside.height).toBeLessThanOrEqual(frameNow.y + frameNow.height + 1);
  // the two connections of the step between the flows are gone
  await expect(page.locator('[data-testid="flow-edge"]')).toHaveCount(9);

  // and out again: to a free place in the main flow, left of the flow
  const placed = await boxOf(step);
  const trigger = await boxOf(page.locator(`[data-node-id="${EMA_ELEMENT_IDS.trigger}"]`));
  await dragBy(page, step, trigger.x - 130 - (placed.x + placed.width / 2), trigger.y - (placed.y + placed.height / 2));
  await expect(page.getByTestId('message')).toContainText('Hauptablauf');
  expect(overlap(await boxOf(step), await boxOf(page.getByTestId('frame')))).toBe(false);
});

test('the management output is connected with the first step when the management has no trigger; a trigger removes the connection', async ({ page, api }) => {
  void api;
  await openApp(page);
  await newStrategy(page);
  await library(page, 'Kerzenschluss').click();
  await library(page, 'Order aufgeben').click();
  await expect(node(page, 'Order aufgeben')).toHaveCount(1);
  // the frame is selected: what is inserted now belongs to the management
  await page.getByTestId('frame').click({ position: { x: 120, y: 18 } });
  await library(page, 'Order löschen').click();

  await expect(node(page, 'Order löschen')).toHaveCount(1);
  await expect(page.locator('[data-testid="flow-edge"][data-kind="management"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="flow-edge"][data-kind="management"]')).not.toHaveAttribute('data-connection', '');

  // a trigger in the management removes the connection: the line from the output to the frame remains
  // the line from the output to the frame ends at the left of the head: click at its right end
  const frameBox = await boxOf(page.getByTestId('frame'));
  await page.getByTestId('frame').click({ position: { x: frameBox.width - 40, y: 18 } });
  await page.locator('[data-lib="type:trigger.tick"]').click();
  await expect(page.locator('[data-testid="node"][data-node-name="Tick"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="flow-edge"][data-kind="management"]')).toHaveAttribute('data-connection', '');
});

test('a step is connected by dragging and by clicking, and a selected line is deleted', async ({ page, api }) => {
  void api;
  await openApp(page);
  await newStrategy(page);
  await expect(page.getByTestId('empty-strategy-hint')).toBeVisible();
  await library(page, 'Manuell').click();
  await page.getByTestId('canvas').locator('.react-flow__pane').click({ position: { x: 700, y: 400 }, force: true });
  await library(page, 'Order löschen').click();
  await expect(page.getByTestId('node')).toHaveCount(2);
  await expect(page.getByTestId('flow-edge')).toHaveCount(0);
  const trigger = node(page, 'Manuell');
  const target = node(page, 'Order löschen');

  // by dragging from the output to the other step
  const port = trigger.getByTestId('port-out-weiter');
  const targetBox = await boxOf(target);
  await dragBy(page, port, targetBox.x + targetBox.width / 2 - (await boxOf(port)).x, targetBox.y + 30 - (await boxOf(port)).y);
  await expect(page.getByTestId('flow-edge')).toHaveCount(1);

  // a click on the line selects it, the cross deletes it
  const line = await boxOf(page.locator('[data-testid="flow-edge"] .react-flow__edge-interaction').first());
  await page.mouse.click(line.x + line.width / 2, line.y + line.height / 2);
  await page.getByTestId('edge-delete').click();
  await expect(page.getByTestId('flow-edge')).toHaveCount(0);

  // by clicking the output and then the other step
  await port.click();
  await expect(page.getByTestId('armed-banner')).toBeVisible();
  await target.click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('flow-edge')).toHaveCount(1);
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
});

test('a value of an object is connected with an element by dragging a line and with the choice of the inputs', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await showEverything(page);
  const row = card(page, 'EMA50').getByTestId('port-prop-wert');
  // "StopLoss" lies behind "Kreuzen", the first use of EMA50: the object is usable there
  const target = node(page, 'StopLoss');
  const rowBox = await boxOf(row);
  const targetBox = await boxOf(target);

  await dragBy(page, row, targetBox.x + targetBox.width / 2 - (rowBox.x + rowBox.width / 2), targetBox.y + 30 - (rowBox.y + rowBox.height / 2));

  await target.click({ position: { x: 40, y: 14 } });
  const ema50 = page.locator('[data-testid="used-group"][data-instance="ema50"] [data-testid="used-row"]');
  await expect(ema50).toHaveCount(1);
  await expect(ema50.first()).toContainText('verbunden');

  // the second way: the choice of a further value in the properties view of the element
  await page.getByTestId('used-add-object').selectOption({ label: 'ATR14' });
  await page.getByTestId('used-add-value').selectOption({ label: 'Wert' });
  await page.getByTestId('used-add-button').click();
  await expect(page.locator('[data-testid="used-group"][data-instance="atr14"] [data-testid="used-row"]')).toHaveCount(1);
  await ema50.first().getByRole('button', { name: 'Verbindung entfernen' }).click();
  await expect(ema50).toHaveCount(0);
});

test('the switch "Weitere Verwendungen" shows the further uses for all, for the selection only, or not at all; the line to the first use stays; the legend explains them', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');

  const wires = page.getByTestId('wire');
  const first = page.locator('[data-testid="wire"][data-first="1"]');
  // EMA20 and EMA50 at "Kreuzen", ATR14 at "StopLoss": the lines of the first use are there always, solid
  await expect(first).toHaveCount(3);
  // the switch starts with "Auswahl": nothing selected, no further use
  await expect(page.getByTestId('wires-selection')).toHaveClass(/on/);
  await expect(wires).toHaveCount(3);
  await expect(page.getByTestId('wires-switch')).toContainText('Weitere Verwendungen');

  await page.getByTestId('wires-all').click();
  // EMA20 and EMA50 are used by three elements each, ATR14 by two
  await expect(wires).toHaveCount(8);
  await page.getByTestId('wires-off').click();
  await expect(wires).toHaveCount(3);
  await page.getByTestId('wires-selection').click();
  await expect(wires).toHaveCount(3);
  // a selected element shows its further uses: "Richtung" uses EMA20 and EMA50
  await node(page, 'Richtung').click({ position: { x: 40, y: 14 } });
  await expect(wires).toHaveCount(5);
  await expect(page.locator('[data-testid="wire"][data-first="0"]')).toHaveCount(2);
  // a selected object shows all its further uses
  await card(page, 'ATR14').click({ position: { x: 40, y: 14 } });
  await expect(page.locator('[data-testid="wire"][data-first="0"]')).toHaveCount(1);
  // one line carries the value in its label
  await expect(page.getByTestId('wire-label').first()).toContainText('Wert');

  await page.locator('.legend summary').click();
  await expect(page.locator('.legend-row')).toHaveCount(5);
});

test('the flow can be turned: vertical and horizontal, the choice belongs to the strategy', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  const trigger = node(page, 'Kreuzen');
  const condition = await boxOf(trigger);
  const first = await boxOf(page.locator(`[data-node-id="${EMA_ELEMENT_IDS.trigger}"]`));
  expect(first.y).toBeLessThan(condition.y);

  await page.getByTestId('orient-h').click();

  await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'h');
  await expect.poll(async () => (await boxOf(page.locator(`[data-node-id="${EMA_ELEMENT_IDS.trigger}"]`))).x).toBeLessThan((await boxOf(node(page, 'Kreuzen'))).x);
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
  // no two boxes overlap in the horizontal flow either
  const boxes = await page.locator('[data-testid="node"], [data-testid="card"]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: (element as HTMLElement).dataset.nodeId ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i] as (typeof boxes)[number];
      const b = boxes[j] as (typeof boxes)[number];
      expect(overlap(a, b), `${a.id} and ${b.id} overlap`).toBe(false);
    }
  }
  await page.getByTestId('orient-v').click();
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'v');
});

test('a step belongs to a section and to a management by the properties view, without dragging', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  await node(page, 'Richtung').click({ position: { x: 40, y: 14 } });

  // section: form, fold in, fold out
  await page.getByTestId('section-select').selectOption('__new');
  await page.getByTestId('section-name').fill('Einstieg');
  await page.getByTestId('section-create').click();
  await expect(page.getByTestId('band')).toHaveAttribute('data-section', 'Einstieg');
  await page.getByTestId('section-collapse').click();
  await expect(page.getByTestId('section-node')).toHaveAttribute('data-section', 'Einstieg');
  await expect(node(page, 'Richtung')).toHaveCount(0);
  await page.getByTestId('section-expand').click();
  await expect(node(page, 'Richtung')).toHaveCount(1);

  // management: the step moves into the frame and back
  await node(page, 'Richtung').click({ position: { x: 40, y: 14 } });
  const owners = page.getByTestId('management-select');
  await owners.selectOption({ label: 'Verwaltung von „Order aufgeben“' });
  const frame = await boxOf(page.getByTestId('frame'));
  const moved = await boxOf(node(page, 'Richtung'));
  expect(moved.y).toBeGreaterThanOrEqual(frame.y - 1);
  expect(moved.y + moved.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
  await owners.selectOption({ label: 'Hauptablauf' });
  expect(overlap(await boxOf(node(page, 'Richtung')), await boxOf(page.getByTestId('frame')))).toBe(false);
});

test('the management folds in and out, and its output can be connected with a step when it has no trigger', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await page.getByTestId('zoom-fit').click();
  const frame = page.getByTestId('frame');
  const full = await boxOf(frame);

  await page.getByTestId('frame-toggle').click();
  const folded = await boxOf(frame);
  expect(folded.height).toBeLessThan(full.height / 2);
  await expect(node(page, 'Neuer Stop-Loss')).toHaveCount(0);
  await page.getByTestId('frame-toggle').click();
  await expect(node(page, 'Neuer Stop-Loss')).toHaveCount(1);

  // a click on the frame selects it: its properties view says what to do with it
  await frame.click({ position: { x: 120, y: 18 } });
  await expect(page.getByTestId('props-frame')).toBeVisible();
});

test('a card dragged to another place stays there, the line follows, and "Neu anordnen" puts it back beside its element', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await expect(page.getByTestId('object-up')).toHaveCount(0);
  const cross = await boxOf(node(page, 'Kreuzen'));
  const start = await boxOf(card(page, 'ATR14'));

  await dragBy(page, card(page, 'ATR14'), -120, 140, { x: 100, y: 14 });

  await expect.poll(async () => (await boxOf(card(page, 'ATR14'))).y).toBeGreaterThan(start.y + 60);
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
  // the cards beside "Kreuzen" did not move
  expect((await boxOf(node(page, 'Kreuzen'))).x).toBeCloseTo(cross.x, 0);
  await page.getByTestId('arrange').click();
  await expect.poll(async () => Math.round((await boxOf(card(page, 'ATR14'))).y)).toBe(Math.round(start.y));
});

test('an element of an unknown type is outlined in red with the identifier of its type, keeps its assignments and can be connected to', async ({ page, api }) => {
  await openApp(page);
  await openStrategy(page, 'Mit unbekanntem Typ');
  const unknown = node(page, 'Fremdes Element');
  await expect(unknown).toHaveClass(/unknown/);
  await expect(unknown).toContainText('erweiterung.fremder_typ');
  // one input, and the one output that has a stored connection
  await expect(unknown.getByTestId('port-in')).toHaveCount(1);
  await expect(unknown.locator('[data-testid^="port-out-"]')).toHaveCount(1);
  await expect(unknown.getByTestId('port-out-ergebnis_a')).toHaveCount(1);

  await unknown.click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('props-unknown')).toBeVisible();
  await expect(page.getByTestId('unknown-type-note')).toContainText('erweiterung.fremder_typ');
  await expect(page.getByTestId('props-unknown')).toContainText('wert');

  // saving leaves the assignment as it is
  await clickMenu(page, 'save');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  const id = '5a0f3d7e-6b1c-4e52-8f0a-3c9d2b7e4a10';
  const stored = api !== null ? api.strategies.get(id) : ((await (await page.request.get(`/api/v1/strategies/${id}`)).json()) as Record<string, unknown>);
  const element = (stored?.elements as { type: string; parameters: Record<string, unknown> }[]).find((candidate) => candidate.type === 'erweiterung.fremder_typ');
  expect(element?.parameters).toEqual({ wert: { kind: 'fixed', value: 42 } });
});
