import { add, addOwnRule, addRiskRule, bindExpr, bindFixed, bindParam, createParam, newStrategyFromScratch, select, setCalculation, setCondition, type V } from './builder';
import { canonical, removeStored, storedStrategy, testCase } from './compare';
import { clickMenu, expect, node, openApp, showArea, STUB, test } from './support';

// Specification 7 and the order 06: the test cases str-03 and str-01 are built only by operating the interface (no
// expression is typed as text) and compared with the documents of `contracts/strategies/v2/testcases`. The steps are
// described in `docs/technical/pipwerk-studio-testfaelle.md`.

test.skip(STUB, 'The test cases are built against the real backend: it forms the expressions.');

// An action that finds nothing fails after ten seconds, with the step in the message, and not at the end of the test.
test.use({ actionTimeout: 10_000 });

/** The closing price minus (plus) the stop distance times the average true range. */
const atrDistance = (sign: '-' | '+'): V => ({
  calc: [{ pick: 'Kerze › Schluss' }, sign, { calc: [{ pick: 'Stop-Abstand' }, '*', { pick: 'ATR 14 › Wert' }] }],
});

/** The frame of the management of the selected step becomes the place the next entries are laid out in. */
async function selectFrame(page: import('@playwright/test').Page): Promise<void> {
  await showArea(page, 'canvas');
  await page.getByTestId('frame').click({ position: { x: 120, y: 18 } });
}

async function saveAndCompare(page: import('@playwright/test').Page, name: string, id: 'str-01' | 'str-03'): Promise<void> {
  await clickMenu(page, 'save');
  await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
  const stored = await storedStrategy(page, name);
  expect(canonical(stored)).toEqual(canonical(testCase(id)));
}

test('str-03 EMA-Trendfolge is built by operating the interface and equals the test case', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const name = `Testfall str-03 ${testInfo.project.name}`;
  await openApp(page, { width: 1366, height: 768 });
  try {
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
    await setCondition(page, { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'any'] });
    await add(page, 'Berechnung', 'Richtung');
    await setCalculation(page, {
      iff: [{ cmp: [{ pick: 'EMA 20 › Wert' }, '>', { pick: 'EMA 50 › Wert' }] }, { text: 'buy' }, { text: 'sell' }],
    });
    await add(page, 'Berechnung', 'Stop-Loss');
    await setCalculation(page, { iff: [{ cmp: [{ pick: 'Richtung › Ergebnis' }, '=', { text: 'buy' }] }, atrDistance('-'), atrDistance('+')] });
    await add(page, 'Order aufgeben');
    await bindFixed(page, 'ordertyp', 'MarketOrder');
    await bindExpr(page, 'richtung', { pick: 'Richtung › Ergebnis' });
    await bindExpr(page, 'stop_loss', { pick: 'Stop-Loss › Ergebnis' });
    await addOwnRule(page, 'Mindestvolumen', { cmp: [{ pick: 'Order › Volumen' }, '>=', { pick: 'Order › Instrument › Mindestvolumen' }] });
    await addRiskRule(page, 'Risiko');

    // the management
    await selectFrame(page);
    await add(page, 'Kerzenschluss');
    await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
    await add(page, 'Bedingung', 'Order ausgeführt');
    await setCondition(page, { cmp: [{ pick: 'Order › Status' }, '=', { choice: 'ausgeführt' }] });
    await add(page, 'Bedingung', 'Kreuzen gegen die Position');
    await setCondition(page, {
      or: [
        {
          and: [
            { cmp: [{ pick: 'Position › Richtung' }, '=', { choice: 'buy' }] },
            { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'down'] },
          ],
        },
        {
          and: [
            { cmp: [{ pick: 'Position › Richtung' }, '=', { choice: 'sell' }] },
            { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'up'] },
          ],
        },
      ],
    });
    await add(page, 'Position schließen');
    await select(page, 'Kreuzen gegen die Position');
    await add(page, 'Berechnung', 'Neuer Stop-Loss');
    await setCalculation(page, {
      iff: [{ cmp: [{ pick: 'Position › Richtung' }, '=', { choice: 'buy' }] }, atrDistance('-'), atrDistance('+')],
    });
    await add(page, 'Bedingung', 'Stop-Loss verbessert');
    await setCondition(page, {
      truthy: {
        iff: [
          { cmp: [{ pick: 'Position › Richtung' }, '=', { choice: 'buy' }] },
          { cond: { cmp: [{ pick: 'Neuer Stop-Loss › Ergebnis' }, '>', { pick: 'Position › Stop-Loss' }] } },
          { cond: { cmp: [{ pick: 'Neuer Stop-Loss › Ergebnis' }, '<', { pick: 'Position › Stop-Loss' }] } },
        ],
      },
    });
    await add(page, 'Position ändern');
    await bindExpr(page, 'stop_loss', { pick: 'Neuer Stop-Loss › Ergebnis' });
    await expect(node(page, 'Position ändern')).toHaveCount(1);

    await saveAndCompare(page, name, 'str-03');
  } finally {
    await removeStored(page, name);
  }
});
