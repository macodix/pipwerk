import type { Page } from '@playwright/test';

import { EMA_ELEMENT_IDS } from '../src/testing/emaTrendfolge';
import { boxOf, card, clickMenu, dragBy, expect, library, newStrategy, node, openApp, openStrategy, overlap, test } from './support';

// Specification 3.3, 5.3 (order 12): the objects lie beside the element of their first use, in both directions of the
// flow; a value is connected by dragging and by clicking; only an element at which the object is usable takes the line.

async function showEverything(page: Page): Promise<void> {
  await page.getByTestId('zoom-fit').click();
  await expect.poll(async () => (await page.getByTestId('canvas').getAttribute('data-view')) ?? '').not.toBe('');
}

test('"EMA-Trendfolge" opens without a finding of the kind error; the objects without a connection would be named', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  // the check runs after opening; a hint may stand there, an error may not
  await expect(page.getByTestId('findings-count')).toBeVisible();
  await page.getByTestId('findings-count').click();
  await expect(page.locator('[data-testid="finding"].error')).toHaveCount(0);
  await expect(page.locator('[data-testid="card"][data-unconnected="1"]')).toHaveCount(0);
  // the strategy is shown as it was saved: no element was rebuilt (every element of the file is there once)
  await expect(page.locator('[data-testid="node"], [data-testid="card"]')).toHaveCount(15);
});

for (const orientation of ['v', 'h'] as const) {
  test(`each object lies beside the element of its first use, nothing is covered (flow ${orientation === 'v' ? 'vertical' : 'horizontal'})`, async ({ page, api }) => {
    void api;
    await openApp(page, { width: 1920, height: 1080 });
    await openStrategy(page, 'EMA-Trendfolge');
    if (orientation === 'h') {
      await page.getByTestId('orient-h').click();
      await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'h');
    }
    await expect.poll(async () => page.getByTestId('wire').count()).toBe(3);
    const homes: [string, string][] = [
      ['EMA20', 'Kreuzen'],
      ['EMA50', 'Kreuzen'],
      ['ATR14', 'StopLoss'],
    ];
    // the arrangement is done when the cards stand beside their elements
    await expect
      .poll(async () => {
        const c = await boxOf(card(page, 'EMA20'));
        const n = await boxOf(node(page, 'Kreuzen'));
        return orientation === 'v' ? c.x + c.width <= n.x : c.y + c.height <= n.y;
      })
      .toBe(true);
    for (const [object, element] of homes) {
      const c = await boxOf(card(page, object));
      const n = await boxOf(node(page, element));
      if (orientation === 'v') {
        expect(c.x + c.width, object).toBeLessThanOrEqual(n.x);
        expect(c.y, object).toBeGreaterThanOrEqual(n.y - 1);
      } else {
        expect(c.y + c.height, object).toBeLessThanOrEqual(n.y);
        expect(c.x, object).toBeGreaterThanOrEqual(n.x - 1);
      }
    }
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
    // the cards of the main flow lie outside of the frame of the management
    const frame = await boxOf(page.getByTestId('frame'));
    for (const id of [EMA_ELEMENT_IDS.ema20, EMA_ELEMENT_IDS.ema50, EMA_ELEMENT_IDS.atr14]) {
      expect(overlap(await boxOf(page.locator(`[data-node-id="${id}"]`)), frame), id).toBe(false);
    }
  });
}

test('a value is connected by clicking its row and then an element; the first line stays solid, the new one is an input', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await showEverything(page);

  await card(page, 'EMA50').getByTestId('port-prop-wert').click();
  await expect(page.getByTestId('armed-banner')).toContainText('Wählen Sie jetzt das Element');
  // every element at which the object is usable says so
  await expect(node(page, 'StopLoss')).toHaveAttribute('data-accepts', 'yes');
  await node(page, 'StopLoss').click({ position: { x: 40, y: 14 } });

  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
  const chips = page.getByTestId('input-chip');
  await expect(chips).toHaveCount(1);
  await expect(chips.first()).toContainText('EMA50');
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
  // the line to "Kreuzen" is still the first use; the line to "StopLoss" is a further use
  await page.getByTestId('wires-all').click();
  await expect(page.locator(`[data-testid="wire"][data-first="1"]`)).toHaveCount(3);
  await expect(page.getByTestId('wire')).toHaveCount(9);
});

test('an element that cannot take the object says so, with a click and with a line, and gets no input', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await showEverything(page);
  // ATR14 is first used by "StopLoss": "Kreuzen" and "Richtung" come before it
  await card(page, 'ATR14').getByTestId('port-prop-wert').click();
  await expect(node(page, 'Kreuzen')).toHaveAttribute('data-accepts', 'no');
  await expect(node(page, 'Richtung')).toHaveAttribute('data-accepts', 'no');
  await expect(node(page, 'StopLoss')).toHaveAttribute('data-accepts', 'yes');

  await node(page, 'Kreuzen').click({ position: { x: 40, y: 14 } });

  await expect(page.getByTestId('armed-banner')).toContainText('lässt sich an „Kreuzen“ nicht verwenden');
  await expect(page.getByTestId('armed-banner')).toContainText('zuerst an „StopLoss“ ermittelt');
  // nothing was connected and the wish to connect stays until the user chooses an element or cancels
  await expect(page.getByTestId('armed-banner')).toHaveCount(1);
  await page.getByTestId('armed-banner').getByRole('button', { name: 'Abbrechen' }).click();
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
  await expect(page.getByTestId('status-pill')).not.toContainText('ungespeichert');

  // by dragging a line: it is not taken either
  const row = card(page, 'ATR14').getByTestId('port-prop-wert');
  const target = await boxOf(node(page, 'Kreuzen'));
  const rowBox = await boxOf(row);
  await dragBy(page, row, target.x + target.width / 2 - (rowBox.x + rowBox.width / 2), target.y + 30 - (rowBox.y + rowBox.height / 2));
  await expect(node(page, 'Kreuzen')).not.toHaveAttribute('data-accepts', /.+/);
  await expect(page.getByTestId('status-pill')).not.toContainText('ungespeichert');
  await node(page, 'Kreuzen').click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('input-chip')).toHaveCount(0);
});

test('a new object that no element uses lies beside the flow, covers nothing, and is connected by its first line', async ({ page, api }) => {
  void api;
  await openApp(page);
  await newStrategy(page);
  await library(page, 'Kerzenschluss').click();
  await library(page, 'Bedingung').click();
  await expect(node(page, 'Bedingung')).toHaveCount(1);

  await library(page, 'EMA').first().click();

  await expect(card(page, 'EMA')).toHaveCount(1);
  await expect(card(page, 'EMA')).toHaveAttribute('data-unconnected', '1');
  await expect(page.getByTestId('lane')).toHaveCount(0);
  const flowRight = Math.max(...(await Promise.all([node(page, 'Kerzenschluss'), node(page, 'Bedingung')].map(async (n) => (await boxOf(n)).x + (await boxOf(n)).width))));
  expect((await boxOf(card(page, 'EMA'))).x).toBeGreaterThan(flowRight);
  // without a use there is no line
  await expect(page.getByTestId('wire')).toHaveCount(0);

  // the first connection makes "Bedingung" the element of the first use: the card moves beside it
  await showEverything(page);
  await card(page, 'EMA').getByTestId('port-prop-wert').click();
  await node(page, 'Bedingung').click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('wire')).toHaveCount(1);
  await expect(page.locator('[data-testid="wire"][data-first="1"]')).toHaveCount(1);
  await expect.poll(async () => (await boxOf(card(page, 'EMA'))).x + (await boxOf(card(page, 'EMA'))).width).toBeLessThanOrEqual((await boxOf(node(page, 'Bedingung'))).x);
  await clickMenu(page, 'save');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
});

test('the one connection point of an element for values is on the side of the objects, in both directions', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  const port = node(page, 'Kreuzen').locator('.port.data');
  await expect(port).toHaveCount(1);
  const n = await boxOf(node(page, 'Kreuzen'));
  const p = await boxOf(port);
  expect(Math.abs(p.x + p.width / 2 - n.x)).toBeLessThanOrEqual(2);
  await page.getByTestId('orient-h').click();
  await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'h');
  await expect
    .poll(async () => {
      const b = await boxOf(node(page, 'Kreuzen').locator('.port.data'));
      const m = await boxOf(node(page, 'Kreuzen'));
      return Math.abs(b.y + b.height / 2 - m.y) <= 2;
    })
    .toBe(true);
});
