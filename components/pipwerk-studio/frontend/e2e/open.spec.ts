import { EMA_ELEMENT_IDS } from '../src/testing/emaTrendfolge';
import { boxOf, card, expect, node, openApp, openStrategy, overlap, test } from './support';

// Specification 3.7, 5.3: the strategy "EMA-Trendfolge" of the client opens with the names the conversion gives and is
// arranged without anything overlapping; the steps of the management lie in its frame, the others outside.

test('opens "EMA-Trendfolge" with the names after specification 3.7', async ({ page, api, errors }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');

  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  // the strategy parameters with the names of the conversion
  await expect(page.getByTestId('param-chip').filter({ hasText: 'Zeiteinheit' })).toContainText('M15');
  await expect(page.getByTestId('param-chip').filter({ hasText: 'Stop abstand' })).toContainText('0');
  // steps and objects
  for (const name of ['Kreuzen', 'Richtung', 'StopLoss', 'Order aufgeben', 'Order ausgefuehrt', 'Kreuzen gegen die position', 'Position schließen', 'Neuer Stop-Loss', 'StopLossVerbessert', 'Position ändern']) {
    await expect(node(page, name), name).toHaveCount(1);
  }
  await expect(page.locator('[data-testid="node"][data-node-name="Kerzenschluss"]')).toHaveCount(2);
  for (const name of ['EMA20', 'EMA50', 'ATR14']) {
    await expect(card(page, name), name).toHaveCount(1);
  }
  // the description of the strategy stands in its properties view
  await expect(page.getByTestId('strategy-description')).toHaveValue('emma ist die 2 EMA Strategie');
  expect(errors).toEqual([]);
});

test('arranges "EMA-Trendfolge" without overlap, with the management in its frame and the area for objects beside the flow', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await expect(page.getByTestId('frame')).toHaveCount(1);

  const boxes = await page.locator('[data-testid="node"], [data-testid="card"]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: (element as HTMLElement).dataset.nodeId ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  expect(boxes).toHaveLength(15);
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i] as (typeof boxes)[number];
      const b = boxes[j] as (typeof boxes)[number];
      expect(overlap(a, b), `${a.id} and ${b.id} overlap`).toBe(false);
    }
  }

  const frame = await boxOf(page.getByTestId('frame'));
  const managed: string[] = [
    EMA_ELEMENT_IDS.mgmtTrigger,
    EMA_ELEMENT_IDS.executed,
    EMA_ELEMENT_IDS.crossAgainst,
    EMA_ELEMENT_IDS.closePosition,
    EMA_ELEMENT_IDS.newStop,
    EMA_ELEMENT_IDS.improved,
    EMA_ELEMENT_IDS.modifyPosition,
  ];
  for (const box of boxes) {
    if (managed.includes(box.id)) {
      expect(box.x, box.id).toBeGreaterThanOrEqual(frame.x - 1);
      expect(box.y, box.id).toBeGreaterThanOrEqual(frame.y - 1);
      expect(box.x + box.width, box.id).toBeLessThanOrEqual(frame.x + frame.width + 1);
      expect(box.y + box.height, box.id).toBeLessThanOrEqual(frame.y + frame.height + 1);
    } else {
      expect(overlap(box, frame), `${box.id} lies in a frame it does not belong to`).toBe(false);
    }
  }

  // the area for objects lies beside the flow (vertical)
  const lane = await boxOf(page.getByTestId('lane'));
  const trigger = await boxOf(page.locator(`[data-node-id="${EMA_ELEMENT_IDS.trigger}"]`));
  expect(lane.x + lane.width).toBeLessThanOrEqual(trigger.x + 1);
  await expect(page.locator('[data-testid="card"] [data-testid="card-row"]').first()).toBeVisible();
});

test('shows no identifier of an element or an expression on the drawing area and in the properties view', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  await node(page, 'Kreuzen').click({ position: { x: 40, y: 14 } });

  const text = await page.getByTestId('app').innerText();
  expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  expect(text).not.toContain('flow.condition');
});
