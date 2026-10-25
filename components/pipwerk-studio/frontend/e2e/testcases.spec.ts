import type { Page } from '@playwright/test';

import { add, addOwnRule, addRiskRule, bindExpr, bindFixed, bindParam, createParam, newStrategyFromScratch, refreshValue, select, setCalculation, setCondition, type C, type V } from './builder';
import { canonical, namesOf, removeStored, storedStrategy, testCase } from './compare';
import { clickMenu, expect, node, openApp, openStrategy, showArea, STUB, test } from './support';

// Specification 7 and the order 06: the test cases str-03 and str-01 are built only by operating the interface (no
// expression is typed as text) and compared with the documents of `contracts/strategies/v2/testcases`. The steps are
// described in `docs/technical/pipwerk-studio-testfaelle.md`.

test.skip(STUB, 'The test cases are built against the real backend: it forms the expressions.');

// An action that finds nothing fails after ten seconds, with the step in the message, and not at the end of the test.
test.use({ actionTimeout: 10_000 });

const pick = (label: string): V => ({ pick: label });
const calc = (a: V, sign: '+' | '-' | '*' | '/', b: V): V => ({ calc: [a, sign, b] });
const compare = (a: V, operator: string, b: V): C => ({ cmp: [a, operator, b] });

/** The frame of the management of the selected step becomes the place the next entries are laid out in. */
async function selectFrame(page: Page): Promise<void> {
  await showArea(page, 'canvas');
  // the whole drawing is brought into the window first: on a narrow window the frame may lie outside of it
  await page.getByTestId('zoom-fit').click();
  // the lines of the data would lie over the title of the frame
  await page.getByTestId('wires-off').click();
  await page.locator('[data-testid="frame"] .frame-title').click();
}

async function saveAndCompare(page: Page, name: string, id: 'str-01' | 'str-03'): Promise<void> {
  await clickMenu(page, 'save');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  const stored = await storedStrategy(page, name);
  expect(canonical(stored)).toEqual(canonical(testCase(id)));
  // the names are not part of the comparison, but the steps were named as the instructions say
  expect(namesOf(stored)).toEqual(namesOf(testCase(id)));

  // after loading the page anew the strategy opens as it was saved, and the check has no finding
  await page.reload();
  await expect(page.getByTestId('app')).toBeVisible();
  await expect(page.getByTestId('lib-item').first()).toBeAttached({ timeout: 15_000 });
  await openStrategy(page, name);
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  await clickMenu(page, 'check');
  await expect(page.getByTestId('findings-count')).toContainText('keine Befunde');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
}

// ---- str-03 ---------------------------------------------------------------------------------------------------------

/** The closing price minus (plus) the stop distance times the average true range. */
const atrDistance = (sign: '-' | '+'): V => calc(pick('Kerze › Schluss'), sign, calc(pick('Stop-Abstand'), '*', pick('ATR 14 › Wert')));

async function buildStr03(page: Page, name: string): Promise<void> {
  await newStrategyFromScratch(page, name);
  await createParam(page, 'Zeiteinheit', 'time_unit', 'h1');
  await createParam(page, 'Stop-Abstand', 'number', '2');

  // the indicators
  await add(page, 'EMA', 'EMA 20');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await bindFixed(page, 'periode', '20');
  await add(page, 'EMA', 'EMA 50');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await bindFixed(page, 'periode', '50');
  await add(page, 'ATR', 'ATR 14');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await bindFixed(page, 'periode', '14');

  // the main flow
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await add(page, 'Bedingung', 'Kreuzen');
  await setCondition(page, { cross: [pick('EMA 20 › Wert'), pick('EMA 50 › Wert'), 'any'] });
  await add(page, 'Berechnung', 'Richtung');
  await setCalculation(page, { iff: [compare(pick('EMA 20 › Wert'), '>', pick('EMA 50 › Wert')), { text: 'buy' }, { text: 'sell' }] });
  await add(page, 'Berechnung', 'Stop-Loss');
  await setCalculation(page, { iff: [compare(pick('Richtung › Ergebnis'), '=', { text: 'buy' }), atrDistance('-'), atrDistance('+')] });
  await add(page, 'Order aufgeben');
  await bindFixed(page, 'ordertyp', 'MarketOrder');
  await bindExpr(page, 'richtung', pick('Richtung › Ergebnis'));
  await bindExpr(page, 'stop_loss', pick('Stop-Loss › Ergebnis'));
  await addOwnRule(page, 'Mindestvolumen', compare(pick('Order › Volumen'), '>=', pick('Order › Instrument › Mindestvolumen')));
  await addRiskRule(page, 'Risiko');

  // the management
  await selectFrame(page);
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
  await add(page, 'Bedingung', 'Order ausgeführt');
  await setCondition(page, compare(pick('Order › Status'), '=', { choice: 'ausgeführt' }));
  await add(page, 'Bedingung', 'Kreuzen gegen die Position');
  await setCondition(page, {
    or: [
      { and: [compare(pick('Position › Richtung'), '=', { choice: 'buy' }), { cross: [pick('EMA 20 › Wert'), pick('EMA 50 › Wert'), 'down'] }] },
      { and: [compare(pick('Position › Richtung'), '=', { choice: 'sell' }), { cross: [pick('EMA 20 › Wert'), pick('EMA 50 › Wert'), 'up'] }] },
    ],
  });
  // the management has its own triggers: the objects of the main flow keep the state they had when the order was placed,
  // so the management has them refreshed (specification 3.3)
  await refreshValue(page, 'EMA 20');
  await refreshValue(page, 'EMA 50');
  await add(page, 'Position schließen');
  await select(page, 'Kreuzen gegen die Position');
  await add(page, 'Berechnung', 'Neuer Stop-Loss');
  await setCalculation(page, { iff: [compare(pick('Position › Richtung'), '=', { choice: 'buy' }), atrDistance('-'), atrDistance('+')] });
  await refreshValue(page, 'ATR 14');
  await add(page, 'Bedingung', 'Stop-Loss verbessert');
  await setCondition(page, {
    truthy: {
      iff: [
        compare(pick('Position › Richtung'), '=', { choice: 'buy' }),
        { cond: compare(pick('Neuer Stop-Loss › Ergebnis'), '>', pick('Position › Stop-Loss')) },
        { cond: compare(pick('Neuer Stop-Loss › Ergebnis'), '<', pick('Position › Stop-Loss')) },
      ],
    },
  });
  await add(page, 'Position ändern');
  await bindExpr(page, 'stop_loss', pick('Neuer Stop-Loss › Ergebnis'));
  await expect(node(page, 'Position ändern')).toHaveCount(1);
}

for (const size of [
  { label: 'desktop', width: 1366, height: 768 },
  { label: 'phone', width: 390, height: 844 },
]) {
  test(`str-03 EMA-Trendfolge is built by operating the interface (${size.label}, ${size.width} x ${size.height}) and equals the test case`, async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const name = `Testfall str-03 ${size.label} ${testInfo.project.name}`;
    await openApp(page, size);
    try {
      await buildStr03(page, name);
      await saveAndCompare(page, name, 'str-03');
    } finally {
      await removeStored(page, name);
    }
  });
}

// ---- str-01 ---------------------------------------------------------------------------------------------------------

const TREND_UP: C = compare(pick('MT Signal › Trendrichtung'), '=', { choice: 'aufwärts' });
const PIP = pick('Instrument › Pip');
const SPREAD = pick('Instrument › Spread');
const BUFFER_STOP = calc(pick('Stop-Puffer'), '*', PIP);

async function buildStr01(page: Page, name: string): Promise<void> {
  await newStrategyFromScratch(page, name);
  await createParam(page, 'Signalzeiteinheit', 'time_unit', 'h1');
  await createParam(page, 'Handelszeiteinheit', 'time_unit', 'm15');
  await createParam(page, 'Entry-Puffer', 'number', '3');
  await createParam(page, 'Stop-Puffer', 'number', '3');

  await add(page, '1-2-3-Trend (Markttechnik)', 'MT Signal');
  await bindParam(page, 'zeiteinheit', 'Signalzeiteinheit');
  await add(page, '1-2-3-Trend (Markttechnik)', 'MT Handel');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');

  // the main flow
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await add(page, 'Bedingung', 'Intakter Trend in der Bewegung');
  await setCondition(page, { and: [{ truthy: pick('MT Signal › Trend intakt') }, compare(pick('MT Signal › Phase'), '=', { choice: 'Bewegung' })] });
  await add(page, 'Bedingung', 'Handelszeiteinheit in Trendrichtung');
  await setCondition(page, compare(pick('MT Handel › Trendrichtung'), '=', pick('MT Signal › Trendrichtung')));
  await add(page, 'Bedingung', 'Keine Order und keine Position');
  await setCondition(page, compare(calc(pick('Strategie › wartende Orders'), '+', pick('Strategie › offene Positionen')), '=', { num: 0 }));
  await add(page, 'Berechnung', 'Einstieg');
  await setCalculation(page, {
    iff: [
      TREND_UP,
      calc(calc(pick('MT Handel › Punkt 2'), '+', SPREAD), '+', calc(pick('Entry-Puffer'), '*', PIP)),
      calc(pick('MT Handel › Punkt 2'), '-', calc(pick('Entry-Puffer'), '*', PIP)),
    ],
  });
  await add(page, 'Berechnung', 'Stop-Loss');
  await setCalculation(page, {
    iff: [
      TREND_UP,
      calc(pick('MT Handel › Punkt 1/3'), '-', BUFFER_STOP),
      calc(calc(pick('MT Handel › Punkt 1/3'), '+', BUFFER_STOP), '+', SPREAD),
    ],
  });
  await add(page, 'Berechnung', 'Take-Profit');
  const entry = pick('Einstieg › Ergebnis');
  const stop = pick('Stop-Loss › Ergebnis');
  await setCalculation(page, {
    iff: [
      TREND_UP,
      calc(calc(entry, '+', calc(entry, '-', stop)), '+', SPREAD),
      calc(calc(entry, '-', calc(stop, '-', entry)), '-', SPREAD),
    ],
  });
  await add(page, 'Order aufgeben');
  await bindFixed(page, 'ordertyp', 'StopOrder');
  await bindExpr(page, 'richtung', { iff: [TREND_UP, { choice: 'buy' }, { choice: 'sell' }] });
  await bindExpr(page, 'preis', entry);
  await bindExpr(page, 'stop_loss', stop);
  await bindExpr(page, 'take_profit', pick('Take-Profit › Ergebnis'));
  await bindFixed(page, 'gueltigkeit', 'bis_auf_widerruf');
  await addOwnRule(page, 'Mindestvolumen', compare(pick('Order › Volumen'), '>=', pick('Order › Instrument › Mindestvolumen')));
  await addRiskRule(page, 'Risiko');

  // the management
  await selectFrame(page);
  await add(page, 'type:trigger.tick');
  await add(page, 'Bedingung', 'Kurs durchbricht Punkt 1/3');
  const orderBuys = compare(pick('Order › Richtung'), '=', { choice: 'buy' });
  await setCondition(page, {
    and: [
      compare(pick('Order › Status'), '=', { choice: 'wartend' }),
      {
        truthy: {
          iff: [
            orderBuys,
            { cond: compare(pick('Tick › Geld'), '<', pick('MT Handel › Punkt 1/3')) },
            { cond: compare(pick('Tick › Brief'), '>', pick('MT Handel › Punkt 1/3')) },
          ],
        },
      },
    ],
  });
  await add(page, 'Order löschen');
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await add(page, 'Bedingung', 'Order wartet');
  await setCondition(page, compare(pick('Order › Status'), '=', { choice: 'wartend' }));
  await add(page, 'Berechnung', 'Neuer Stop-Loss');
  await setCalculation(page, {
    iff: [
      orderBuys,
      calc(pick('MT Handel › Punkt 1/3'), '-', BUFFER_STOP),
      calc(calc(pick('MT Handel › Punkt 1/3'), '+', BUFFER_STOP), '+', SPREAD),
    ],
  });
  await add(page, 'Bedingung', 'Stop-Loss weicht ab');
  await setCondition(page, compare(pick('Neuer Stop-Loss › Ergebnis'), '<>', pick('Order › Stop-Loss')));
  await add(page, 'Berechnung', 'Neuer Take-Profit');
  const newStop = pick('Neuer Stop-Loss › Ergebnis');
  await setCalculation(page, {
    iff: [
      orderBuys,
      calc(calc(pick('Order › Preis'), '+', calc(pick('Order › Preis'), '-', newStop)), '+', SPREAD),
      calc(calc(pick('Order › Preis'), '-', calc(newStop, '-', pick('Order › Preis'))), '-', SPREAD),
    ],
  });
  await add(page, 'Order ändern');
  await bindExpr(page, 'stop_loss', newStop);
  await bindExpr(page, 'take_profit', pick('Neuer Take-Profit › Ergebnis'));

  // the second "Order löschen" hangs at the output "nicht geändert": laid out in the frame, then connected by clicking
  await selectFrame(page);
  await add(page, 'Order löschen');
  await showArea(page, 'canvas');
  await node(page, 'Order ändern').getByTestId('port-out-nicht_geaendert').click();
  await node(page, 'Order löschen').last().click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
}

test('str-01 Scalping Punkt 2 Ausbruch is built by operating the interface and equals the test case', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const name = `Testfall str-01 ${testInfo.project.name}`;
  await openApp(page, { width: 1366, height: 768 });
  try {
    await buildStr01(page, name);
    await saveAndCompare(page, name, 'str-01');
  } finally {
    await removeStored(page, name);
  }
});
