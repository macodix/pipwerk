import type { Page } from '@playwright/test';

import { add, addOwnRule, addRiskRule, bindExpr, bindFixed, bindParam, createParam, newStrategyFromScratch, refreshValue, select, setCalculation, setCondition, type C, type V } from './builder';
import { canonical, namesOf, removeStored, storedStrategy, testCase } from './compare';
import { clickMenu, expect, expectSaved, node, openApp, openStrategy, showArea, test } from './support';

// Specification 7 and the order 06: the test cases str-03 and str-01 are built only by operating the interface (no
// expression is typed as text) and compared with the documents of `contracts/strategies/v2/testcases`. The steps are
// described in `docs/technical/pipwerk-studio-testfaelle.md`. In both test cases the management uses objects of the
// main flow with "Aktualisieren" (specification 3.3).

// An action that finds nothing fails after ten seconds, with the step in the message, and not at the end of the test.
test.use({ actionTimeout: 10_000 });

const pick = (label: string): V => ({ pick: label });
const calc = (a: V, sign: '+' | '-' | '*' | '/', b: V): V => ({ calc: [a, sign, b] });
const compare = (a: V, operator: string, b: V): C => ({ cmp: [a, operator, b] });
const earlier = (label: string): V => ({ prev: pick(label) });
/** "EMA 20 crosses EMA 50 upwards" (there is no block for a crossing): the earlier values and the present ones compared. */
const crossingUp = (): C[] => [
  compare(earlier('EMA 20 › Wert'), '<=', earlier('EMA 50 › Wert')),
  compare(pick('EMA 20 › Wert'), '>', pick('EMA 50 › Wert')),
];
const crossingDown = (): C[] => [
  compare(earlier('EMA 20 › Wert'), '>=', earlier('EMA 50 › Wert')),
  compare(pick('EMA 20 › Wert'), '<', pick('EMA 50 › Wert')),
];

/** The frame of the management of the selected step becomes the place the next entries are laid out in. */
async function selectFrame(page: Page): Promise<void> {
  await showArea(page, 'canvas');
  // the whole drawing is brought into the window first: on a narrow window the frame may lie outside of it
  await page.getByTestId('zoom-fit').click();
  // the lines of the data would lie over the title of the frame
  await page.getByTestId('wires-off').click();
  await page.locator('[data-testid="frame"] .frame-title').click();
}

/**
 * Saves, compares the stored document with the test case, loads the page anew, opens the strategy, checks it, saves what
 * was opened and compares again: the strategy that was opened is the one that was built.
 */
async function saveAndCompare(page: Page, name: string, id: 'str-01' | 'str-03'): Promise<void> {
  await clickMenu(page, 'save');
  await expectSaved(page);
  const stored = await storedStrategy(page, name);
  expect(canonical(stored)).toEqual(canonical(testCase(id)));
  // the names are not part of the comparison, but the steps were named as the instructions say
  expect(namesOf(stored)).toEqual(namesOf(testCase(id)));

  // after loading the page anew the strategy opens as it was saved, and the check has no finding
  await page.reload();
  await expect(page.getByTestId('app')).toBeVisible();
  await expect(page.getByTestId('lib-item').first()).toBeAttached({ timeout: 15_000 });
  await openStrategy(page, name);
  await expectSaved(page);
  await clickMenu(page, 'check');
  await expect(page.getByTestId('findings-count')).toContainText('keine Befunde');
  await expectSaved(page);

  // what was opened is written again and equals the test case
  await clickMenu(page, 'save');
  await expectSaved(page);
  const reopened = await storedStrategy(page, name);
  expect(canonical(reopened)).toEqual(canonical(testCase(id)));
  expect(namesOf(reopened)).toEqual(namesOf(testCase(id)));
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
  await setCondition(page, { or: [{ and: crossingUp() }, { and: crossingDown() }] });
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
      { and: [compare(pick('Position › Richtung'), '=', { choice: 'buy' }), ...crossingDown()] },
      { and: [compare(pick('Position › Richtung'), '=', { choice: 'sell' }), ...crossingUp()] },
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
  // only clicks: the build does not drag anything
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

const TREND_UP: C = compare(pick('Trend Signalzeiteinheit › Ergebnis'), '=', { text: 'aufwaerts' });
const PIP = pick('Instrument › Pip');
const SPREAD = pick('Instrument › Spread');
const BUFFER_ENTRY = calc(pick('Entry-Puffer'), '*', PIP);
const BUFFER_STOP = calc(pick('Stop-Puffer'), '*', PIP);

/** The trend of a ZigZag: both the last high and the last low above (below) the ones before, otherwise "kein". */
function trendOf(zigzag: string): V {
  const higher = (kind: 'Hoch' | 'Tief', sign: '>' | '<'): C => compare(pick(`${zigzag} › Letztes ${kind}`), sign, pick(`${zigzag} › Vorletztes ${kind}`));
  return {
    iff: [
      { and: [higher('Hoch', '>'), higher('Tief', '>')] },
      { text: 'aufwaerts' },
      { iff: [{ and: [higher('Hoch', '<'), higher('Tief', '<')] }, { text: 'abwaerts' }, { text: 'kein' }] },
    ],
  };
}

async function buildStr01(page: Page, name: string): Promise<void> {
  await newStrategyFromScratch(page, name);
  await createParam(page, 'Signalzeiteinheit', 'time_unit', 'h1');
  await createParam(page, 'Handelszeiteinheit', 'time_unit', 'm15');
  await createParam(page, 'Entry-Puffer', 'number', '3');
  await createParam(page, 'Stop-Puffer', 'number', '3');

  await add(page, 'ZigZag', 'ZigZag Signal');
  await bindParam(page, 'zeiteinheit', 'Signalzeiteinheit');
  await add(page, 'ZigZag', 'ZigZag Handel');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');

  // the main flow
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await add(page, 'Berechnung', 'Trend Signalzeiteinheit');
  await setCalculation(page, trendOf('ZigZag Signal'));
  await add(page, 'Berechnung', 'Trend Handelszeiteinheit');
  await setCalculation(page, trendOf('ZigZag Handel'));
  await add(page, 'Bedingung', 'Trend in beiden Zeiteinheiten gleich');
  await setCondition(page, {
    and: [
      compare(pick('Trend Signalzeiteinheit › Ergebnis'), '<>', { text: 'kein' }),
      compare(pick('Trend Handelszeiteinheit › Ergebnis'), '=', pick('Trend Signalzeiteinheit › Ergebnis')),
    ],
  });
  await add(page, 'Bedingung', 'Keine Order und keine Position');
  await setCondition(page, compare(calc(pick('Strategie › wartende Orders'), '+', pick('Strategie › offene Positionen')), '=', { num: 0 }));
  await add(page, 'Berechnung', 'Einstieg');
  await setCalculation(page, {
    iff: [TREND_UP, calc(calc(pick('ZigZag Handel › Letztes Hoch'), '+', SPREAD), '+', BUFFER_ENTRY), calc(pick('ZigZag Handel › Letztes Tief'), '-', BUFFER_ENTRY)],
  });
  await add(page, 'Berechnung', 'Stop-Loss');
  await setCalculation(page, {
    iff: [
      TREND_UP,
      calc(pick('ZigZag Handel › Letztes Tief'), '-', BUFFER_STOP),
      calc(calc(pick('ZigZag Handel › Letztes Hoch'), '+', BUFFER_STOP), '+', SPREAD),
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
  await addRiskRule(page, 'risiko');

  // the management has its own triggers: the ZigZag of the trade time unit keeps the state it had when the order was
  // placed, so the management has its values refreshed (specification 3.3)
  await selectFrame(page);
  await add(page, 'type:trigger.tick');
  await add(page, 'Bedingung', 'Kurs durchbricht den Stop-Bezug');
  const orderBuys = compare(pick('Order › Richtung'), '=', { choice: 'buy' });
  await setCondition(page, {
    and: [
      compare(pick('Order › Status'), '=', { choice: 'wartend' }),
      {
        truthy: {
          iff: [
            orderBuys,
            { cond: compare(pick('Tick › Geld'), '<', pick('ZigZag Handel › Letztes Tief')) },
            { cond: compare(pick('Tick › Brief'), '>', pick('ZigZag Handel › Letztes Hoch')) },
          ],
        },
      },
    ],
  });
  await refreshValue(page, 'ZigZag Handel', 2);
  await add(page, 'Order löschen');
  await add(page, 'Kerzenschluss');
  await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
  await add(page, 'Bedingung', 'Order wartet');
  await setCondition(page, compare(pick('Order › Status'), '=', { choice: 'wartend' }));
  await add(page, 'Berechnung', 'Neuer Stop-Loss');
  await setCalculation(page, {
    iff: [
      orderBuys,
      calc(pick('ZigZag Handel › Letztes Tief'), '-', BUFFER_STOP),
      calc(calc(pick('ZigZag Handel › Letztes Hoch'), '+', BUFFER_STOP), '+', SPREAD),
    ],
  });
  await refreshValue(page, 'ZigZag Handel', 2);
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
