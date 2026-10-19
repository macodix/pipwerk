import { expect, test } from '@playwright/test';
import {
  add, addOwnRule, bindExpr, bindFixed, bindParam, clickNode, createParam, newStrategyFromScratch, normalize, reveal, savedStrategy,
  setCalculation, setCondition,
} from './builder';
import type { C, V } from './builder';
import { node, openApp } from './support';

// Acceptance criterion 2 (second part): the main flow and the management of str-01, only by operating the interface.
test('str-01 Scalping Punkt 2 Ausbruch is built from the empty canvas and equals the test case', async ({ page }) => {
  const errors = await openApp(page, { width: 1920, height: 1080 });
  const NAME = 'Scalping Punkt 2 Ausbruch (Browsertest)';
  await newStrategyFromScratch(page, NAME);
  await createParam(page, 'Signalzeiteinheit', 'time_unit', 'h1');
  await createParam(page, 'Handelszeiteinheit', 'time_unit', 'm15');
  await createParam(page, 'Entry-Puffer', 'number', '3');
  await createParam(page, 'Stop-Puffer', 'number', '3');

  await add(page, 'trigger.candle_close');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');

  // two instances of the 1-2-3 trend (market technique), on two time units
  await add(page, 'Markttechnik', 'Markttechnik Signal');
  await bindParam(page, 'zeiteinheit', 'Signalzeiteinheit');
  await add(page, 'Markttechnik', 'Markttechnik Handel');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await expect(page.locator('[data-testid="card"]')).toHaveCount(2);

  const S = (p: string): V => ({ pick: `Markttechnik Signal › ${p}` });
  const H = (p: string): V => ({ pick: `Markttechnik Handel › ${p}` });
  const spread: V = { pick: 'Instrument › Spread' };
  const pip: V = { pick: 'Instrument › Pip' };
  const up: C = { cmp: [S('Trendrichtung'), '=', { choice: 'aufwärts' }] };
  const mul = (param: string): V => ({ calc: [{ pick: param }, '*', pip] });

  await clickNode(page, 'Kerzenschluss');
  await add(page, 'flow.condition', 'Intakter Trend in der Bewegung');
  await setCondition(page, { and: [{ truthy: S('Trend intakt') }, { cmp: [S('Phase'), '=', { choice: 'Bewegung' }] }] });
  await add(page, 'flow.condition', 'Handelszeiteinheit in Trendrichtung');
  await setCondition(page, { cmp: [H('Trendrichtung'), '=', S('Trendrichtung')] });
  await add(page, 'flow.condition', 'Keine Order und keine Position');
  await setCondition(page, {
    cmp: [{ calc: [{ pick: 'Strategie › wartende Orders' }, '+', { pick: 'Strategie › offene Positionen' }] }, '=', { num: 0 }],
  });
  await add(page, 'flow.calculation', 'Einstieg');
  await setCalculation(page, {
    iff: [up, { calc: [{ calc: [H('Punkt 2'), '+', spread] }, '+', mul('Entry-Puffer')] }, { calc: [H('Punkt 2'), '-', mul('Entry-Puffer')] }],
  });
  await add(page, 'flow.calculation', 'Stop-Loss');
  await setCalculation(page, {
    iff: [up, { calc: [H('Punkt 1/3'), '-', mul('Stop-Puffer')] }, { calc: [{ calc: [H('Punkt 1/3'), '+', mul('Stop-Puffer')] }, '+', spread] }],
  });
  const E: V = { pick: 'Einstieg › Ergebnis' };
  const St: V = { pick: 'Stop-Loss › Ergebnis' };
  await add(page, 'flow.calculation', 'Take-Profit');
  await setCalculation(page, {
    iff: [up, { calc: [{ calc: [E, '+', { calc: [E, '-', St] }] }, '+', spread] }, { calc: [{ calc: [E, '-', { calc: [St, '-', E] }] }, '-', spread] }],
  });
  await add(page, 'flow.place_order');
  await bindFixed(page, 'ordertyp', 'StopOrder');
  await bindExpr(page, 'richtung', { iff: [up, { text: 'buy' }, { text: 'sell' }] });
  await bindExpr(page, 'preis', E);
  await bindExpr(page, 'stop_loss', St);
  await bindExpr(page, 'take_profit', { pick: 'Take-Profit › Ergebnis' });
  await addOwnRule(page, 'Mindestvolumen', { cmp: [{ pick: 'Order › Volumen' }, '>=', { pick: 'Instrument › Mindestvolumen' }] });
  await page.getByTestId('status-pill').click();
  await page.getByTestId('sec-rules').getByTestId('rule-add-select').selectOption('tpl-risiko');
  await page.getByTestId('sec-rules').locator('.rule-head input').fill('Risiko');

  // management: two triggers, each with its own chain
  const frameHead = page.locator('[data-testid="frame"] .frame-head');
  const openFrame = async () => {
    await reveal(page, frameHead);
    await frameHead.click({ position: { x: 120, y: 12 } });
    await expect(page.getByTestId('props-frame')).toBeVisible();
  };
  await clickNode(page, 'Order aufgeben');
  await openFrame();
  await add(page, 'trigger.tick');
  await add(page, 'flow.condition', 'Kurs durchbricht Punkt 1/3');
  await setCondition(page, {
    and: [
      { cmp: [{ pick: 'Order › Status' }, '=', { choice: 'wartend' }] },
      {
        truthy: {
          iff: [
            { cmp: [{ pick: 'Order › Richtung' }, '=', { choice: 'buy (Kauf)' }] },
            { cond: { cmp: [{ pick: 'Tick › Geld' }, '<', H('Punkt 1/3')] } },
            { cond: { cmp: [{ pick: 'Tick › Brief' }, '>', H('Punkt 1/3')] } },
          ],
        },
      },
    ],
  });
  await add(page, 'flow.delete_order');

  await clickNode(page, 'Order aufgeben');
  await openFrame();
  await add(page, 'trigger.candle_close');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await add(page, 'flow.condition', 'Order wartet');
  await setCondition(page, { cmp: [{ pick: 'Order › Status' }, '=', { choice: 'wartend' }] });
  const buy: C = { cmp: [{ pick: 'Order › Richtung' }, '=', { choice: 'buy (Kauf)' }] };
  await add(page, 'flow.calculation', 'Neuer Stop-Loss');
  await setCalculation(page, {
    iff: [buy, { calc: [H('Punkt 1/3'), '-', mul('Stop-Puffer')] }, { calc: [{ calc: [H('Punkt 1/3'), '+', mul('Stop-Puffer')] }, '+', spread] }],
  });
  await add(page, 'flow.condition', 'Stop-Loss weicht ab');
  await setCondition(page, { cmp: [{ pick: 'Neuer Stop-Loss › Ergebnis' }, '<>', { pick: 'Order › Stop-Loss' }] });
  const P: V = { pick: 'Order › Preis' };
  const N: V = { pick: 'Neuer Stop-Loss › Ergebnis' };
  await add(page, 'flow.calculation', 'Neuer Take-Profit');
  await setCalculation(page, {
    iff: [buy, { calc: [{ calc: [P, '+', { calc: [P, '-', N] }] }, '+', spread] }, { calc: [{ calc: [P, '-', { calc: [N, '-', P] }] }, '-', spread] }],
  });
  await add(page, 'flow.modify_order');
  await bindExpr(page, 'stop_loss', N);
  await bindExpr(page, 'take_profit', { pick: 'Neuer Take-Profit › Ergebnis' });

  // "Order löschen" at the exit "not changed": connected by clicking the exit and then the step
  await openFrame();
  await add(page, 'flow.delete_order');
  const modify = node(page, 'Order ändern');
  await reveal(page, modify);
  await modify.locator('[data-port-out="nicht_geaendert"]').click();
  await expect(page.getByTestId('armed-banner')).toBeVisible();
  const second = node(page, 'Order löschen').nth(1);
  await reveal(page, second);
  await second.click({ position: { x: 44, y: 14 } });
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);

  await page.getByTestId('menu-check').click();
  await expect(page.getByTestId('findings-count')).toContainText(/keine Befunde/);
  await expect(page.locator('[data-testid="node"]')).toHaveCount(18);
  await expect(page.locator('[data-testid="flow-edge"]')).toHaveCount(16);

  await page.getByTestId('menu-save').click();
  const built = normalize((await savedStrategy(page, undefined, NAME)) as never);
  const expected = normalize((await savedStrategy(page, 'sample-str01')) as never);
  expect(built).toEqual(expected);
  expect(errors).toEqual([]);
});
