import { expect, test } from '@playwright/test';
import {
  add, addOwnRule, bindExpr, bindFixed, bindParam, clickNode, createParam, field, newStrategyFromScratch, normalize, savedStrategy,
  reveal, setCalculation, setCondition,
} from './builder';
import type { C } from './builder';
import { node, openApp, card } from './support';

// Acceptance criterion 2: str-03 from the empty canvas, only by operating the interface.
test('str-03 EMA-Trendfolge is built from the empty canvas and equals the test case', async ({ page }) => {
  const errors = await openApp(page, { width: 1920, height: 1080 });
  await newStrategyFromScratch(page, 'EMA-Trendfolge aus dem Browsertest');

  // strategy parameters
  await createParam(page, 'Zeiteinheit', 'time_unit', 'h1');
  await createParam(page, 'Stop-Abstand', 'number', '2');
  await expect(page.getByTestId('param-chip')).toHaveCount(2);

  // trigger
  await add(page, 'trigger.candle_close');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');

  // three indicators
  for (const [type, name, period] of [['EMA', 'EMA 20', '20'], ['EMA', 'EMA 50', '50'], ['ATR', 'ATR 14', '14']] as const) {
    await add(page, type, name);
    await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
    await bindFixed(page, 'periode', period);
  }
  await expect(page.locator('[data-testid="card"]')).toHaveCount(3);

  // crossing condition from blocks
  await clickNode(page, 'Kerzenschluss');
  await add(page, 'flow.condition', 'Kreuzen');
  await setCondition(page, { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'any'] });
  await expect(page.getByTestId('expr-sentence')).toHaveText('EMA 20 kreuzt EMA 50 in beide Richtungen');

  // calculations
  await add(page, 'flow.calculation', 'Richtung');
  await setCalculation(page, {
    iff: [{ cmp: [{ pick: 'EMA 20 › Wert' }, '>', { pick: 'EMA 50 › Wert' }] }, { text: 'buy' }, { text: 'sell' }],
  });
  const stopFor = (sign: string): { calc: [{ pick: string }, string, { calc: [{ pick: string }, string, { pick: string }] }] } => ({
    calc: [{ pick: 'Kerze › Schluss' }, sign, { calc: [{ pick: 'Stop-Abstand' }, '*', { pick: 'ATR 14 › Wert' }] }],
  });
  await add(page, 'flow.calculation', 'Stop-Loss');
  await setCalculation(page, {
    iff: [{ cmp: [{ pick: 'Richtung › Ergebnis' }, '=', { text: 'buy' }] }, stopFor('-'), stopFor('+')],
  });

  // place order with its rules
  await add(page, 'flow.place_order');
  await bindExpr(page, 'richtung', { pick: 'Richtung › Ergebnis' });
  await bindExpr(page, 'stop_loss', { pick: 'Stop-Loss › Ergebnis' });
  await addOwnRule(page, 'Mindestvolumen', { cmp: [{ pick: 'Order › Volumen' }, '>=', { pick: 'Instrument › Mindestvolumen' }] });

  // the strategy rule "Risk per trade" determines the volume
  await page.getByTestId('status-pill').click();
  await page.getByTestId('sec-rules').getByTestId('rule-add-select').selectOption('tpl-risiko');
  await page.getByTestId('sec-rules').locator('.rule-head input').fill('Risiko');

  // management of the order: it hangs at the exit "placed"
  await clickNode(page, 'Order aufgeben');
  await expect(page.getByTestId('frame')).toHaveCount(1);
  await reveal(page, page.locator('[data-testid="frame"] .frame-head'));
  await page.locator('[data-testid="frame"] .frame-head').click({ position: { x: 120, y: 12 } });
  await expect(page.getByTestId('props-frame')).toBeVisible();
  await add(page, 'trigger.candle_close');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await add(page, 'flow.condition', 'Order ausgeführt');
  await setCondition(page, { cmp: [{ pick: 'Order › Status' }, '=', { choice: 'ausgeführt' }] });
  await add(page, 'flow.condition', 'Kreuzen gegen die Position');
  // "Direction" of the position is a choice: the right side offers its values
  const pos = (d: string): C => ({ cmp: [{ pick: 'Position › Richtung' }, '=', { choice: d === 'buy' ? 'buy (Kauf)' : 'sell (Verkauf)' }] });
  await setCondition(page, {
    or: [
      { and: [pos('buy'), { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'down'] }] },
      { and: [pos('sell'), { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'up'] }] },
    ],
  });
  await add(page, 'flow.close_position');
  await clickNode(page, 'Kreuzen gegen die Position');
  await add(page, 'flow.calculation', 'Neuer Stop-Loss');
  await setCalculation(page, {
    iff: [pos('buy'), stopFor('-'), stopFor('+')],
  });
  await add(page, 'flow.condition', 'Stop-Loss verbessert');
  await setCondition(page, {
    truthy: {
      iff: [
        pos('buy'),
        { cond: { cmp: [{ pick: 'Neuer Stop-Loss › Ergebnis' }, '>', { pick: 'Position › Stop-Loss' }] } },
        { cond: { cmp: [{ pick: 'Neuer Stop-Loss › Ergebnis' }, '<', { pick: 'Position › Stop-Loss' }] } },
      ],
    },
  });
  await add(page, 'flow.modify_position');
  await bindExpr(page, 'stop_loss', { pick: 'Neuer Stop-Loss › Ergebnis' });

  // all steps are there, connected, and the check finds nothing
  await page.getByTestId('menu-check').click();
  await expect(page.getByTestId('findings-count')).toContainText(/keine Befunde/);
  await expect(page.locator('[data-testid="node"]')).toHaveCount(12);
  await expect(page.locator('[data-testid="flow-edge"]')).toHaveCount(11);
  await expect(node(page, 'Kreuzen')).toBeVisible();
  await expect(card(page, 'EMA 20')).toBeVisible();

  // data connections: values of the indicators lead to the elements that use them (shown dotted: only in the expression)
  await page.getByTestId('wires-all').click();
  await expect(page.locator('[data-testid="wire"][data-src="EMA 20"][data-dst="Kreuzen"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="wire"][data-src="ATR 14"][data-dst="Stop-Loss"]')).toHaveCount(1);
  // blocks picked from the lists are solid wires, wired through the lists they are inputs of the element
  await expect(page.locator('[data-testid="wire"][data-src="EMA 20"][data-dst="Kreuzen"]')).toHaveAttribute('data-solid', '1');

  // save, then compare with the test case document of the library
  await page.getByTestId('menu-save').click();
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  const built = normalize((await savedStrategy(page, undefined, 'EMA-Trendfolge aus dem Browsertest')) as never);
  const expected = normalize((await savedStrategy(page, 'sample-str03')) as never);
  expect(built).toEqual(expected);

  // the advanced view shows the same condition as a formula
  await clickNode(page, 'Kreuzen');
  await page.getByTestId('view-formula').click();
  const formula = (await page.getByTestId('formula-input').inputValue()).replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  expect(formula).toContain('OR(AND(PREVIOUS([EMA 20].Wert) <= PREVIOUS([EMA 50].Wert); [EMA 20].Wert > [EMA 50].Wert);');
  expect(formula).toContain('AND(PREVIOUS([EMA 20].Wert) >= PREVIOUS([EMA 50].Wert); [EMA 20].Wert < [EMA 50].Wert))');
  await expect(field(page, 'ausdruck').getByTestId('formula-error')).toHaveCount(0);

  expect(errors).toEqual([]);
});
