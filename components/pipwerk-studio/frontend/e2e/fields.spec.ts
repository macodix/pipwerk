import type { Page } from '@playwright/test';

import { add, exprRoot, field, newStrategyFromScratch, props, select, setCondition, type C, type V } from './builder';
import { removeStored, storedStrategy } from './compare';
import { choose, clickMenu, expect, expectChosen, node, offered, openApp, openStrategy, showArea, test } from './support';

// Order 17 (acceptance report 3, E3, E11, E12): the fields ask "Woher kommt der Wert?", the data type stands in the
// explanation, the instrument is shown in words, the condition of a crossing is built from the blocks, and every finding
// names its element and its field. They run against the real backend, which delivers the type descriptions, reads and
// forms the expressions and checks the strategy.

test.use({ actionTimeout: 10_000 });

type Stored = { elements: { instance?: { name: string; parameter_values?: Record<string, { kind: string; value?: unknown }> } | null }[] };

const instrumentOf = (stored: unknown, name: string): { kind: string; value?: unknown } | undefined =>
  (stored as Stored).elements.find((element) => element.instance?.name === name)?.instance?.parameter_values?.instrument;

test('the fields ask "Woher kommt der Wert?" with the five answers and show the data type in the explanation, not beside the label', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Felder fragen');
  await add(page, 'Kerzenschluss');
  await add(page, 'EMA', 'EMA 20');

  const period = field(page, 'periode');
  await expect(period).toContainText('Woher kommt der Wert?');
  await expect(props(page)).not.toContainText(/Belegung|Bindungsart/);
  // no mark of the data type beside the label; the explanation names it in the words of the library
  await expect(period.locator('.dtype-chip')).toHaveCount(0);
  await expect(period.getByLabel('Erklärung')).toHaveAttribute('data-tip', /Gefragt ist: ganze Zahl\./);
  expect(await offered(period.getByTestId('kind-periode'))).toEqual([
    'nicht belegt',
    'fest eingeben',
    'aus einem Strategieparameter',
    'von einem anderen Element',
    'aus einer Formel',
    'beim Start der Strategie festlegen',
  ]);
  // the card on the drawing area uses the same word for the data type
  await showArea(page, 'canvas');
  await expect(page.locator('[data-testid="card"][data-node-name="EMA 20"] [data-testid="card-row"]').first()).toContainText('Zahl');
});

test('the instrument is shown as "das Instrument, auf dem die Strategie läuft"; another one is chosen, and the way back leads to the standard value', async ({ page }) => {
  const name = 'Instrument in Worten';
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'EMA', 'EMA 20');

    const instrument = field(page, 'instrument');
    await expect(instrument.getByTestId('preset-text-instrument')).toHaveText('das Instrument, auf dem die Strategie läuft');
    await expect(instrument).toContainText('Dafür müssen Sie nichts wählen.');
    await expect(instrument.getByTestId('preset-other-instrument')).toHaveText('anderes Instrument wählen');
    await expect(instrument.getByTestId('kind-instrument')).toHaveCount(0);

    // "anderes Instrument wählen" shows the question; choosing nothing keeps the standard value
    await instrument.getByTestId('preset-other-instrument').click();
    await expect(instrument).toContainText('Woher kommt der Wert?');
    await choose(instrument.getByTestId('kind-instrument'), { value: 'fixed' });
    await expectChosen(instrument.getByTestId('value-instrument'), 'instrument_der_anwendung');
    await choose(instrument.getByTestId('value-instrument'), { label: 'Andere Bezeichnung …' });
    await instrument.getByTestId('value-instrument-text').fill('EURUSD');
    await clickMenu(page, 'save');
    expect(instrumentOf(await storedStrategy(page, name), 'EMA 20')).toEqual({ kind: 'fixed', value: 'EURUSD' });

    // the way back
    await instrument.getByTestId('preset-back-instrument').click();
    await expect(instrument.getByTestId('preset-text-instrument')).toHaveText('das Instrument, auf dem die Strategie läuft');
    await clickMenu(page, 'save');
    expect(instrumentOf(await storedStrategy(page, name), 'EMA 20')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });
  } finally {
    await removeStored(page, name);
  }
});

const earlier = (label: string): V => ({ prev: { pick: label } });
const crossingUp: C = {
  and: [
    { cmp: [earlier('EMA 20 › Wert'), '<=', earlier('EMA 50 › Wert')] },
    { cmp: [{ pick: 'EMA 20 › Wert' }, '>', { pick: 'EMA 50 › Wert' }] },
  ],
};

test('there is no block "Kreuzung": the condition of a crossing is built from "vorheriger Wert von", comparisons and "und"', async ({ page }) => {
  const name = 'Bedingung aus Bausteinen';
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'EMA', 'EMA 20');
    await add(page, 'EMA', 'EMA 50');
    await add(page, 'Bedingung', 'Kreuzen');

    // the kinds of a condition: no crossing
    const kind = exprRoot(page).locator(':scope > .cb > .cb-kind > .select > .select-trigger');
    expect(await offered(kind)).toEqual(['Vergleich', 'Alle gelten (und)', 'Eine gilt (oder)', 'Nicht', 'Wert ist wahr']);
    await expect(page.getByText(/Kreuzung|kreuzt/)).toHaveCount(0);

    // "vorheriger Wert von" offers only values that have an earlier value
    await setCondition(page, { cmp: [earlier('EMA 20 › Wert'), '>', { num: 1 }] });
    const inner = exprRoot(page).locator('.vb-inner > .vb > .select > .select-trigger').first();
    const offeredValues = await offered(inner);
    expect(offeredValues).toContain('EMA 20 › Wert');
    expect(offeredValues).toContain('EMA 50 › Wert');
    expect(offeredValues.filter((label) => /^(Zahl …|Rechnung|Wenn …|Funktion|Bedingung|Vorheriger Wert)/.test(label))).toEqual([]);

    // the crossing upwards as the user builds it
    await setCondition(page, crossingUp);
    await expect(exprRoot(page).getByTestId('expr-sentence')).toContainText('vorheriger Wert von');
    await expect(exprRoot(page).getByTestId('previous-value')).toHaveCount(2);
    await clickMenu(page, 'save');
    const stored = (await storedStrategy(page, name)) as { elements: { name: string | null; parameters: Record<string, { value?: string }> }[] };
    const condition = stored.elements.find((element) => element.name === 'Kreuzen');
    expect(String(condition?.parameters.ausdruck?.value).toUpperCase()).toMatch(/^AND\(PREVIOUS\(.+\) <= PREVIOUS\(.+\); .+ > .+\)$/);
  } finally {
    await removeStored(page, name);
  }
});

test('"EMA-Trendfolge" opens without rebuilding and shows its conditions written out', async ({ page }) => {
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  await select(page, 'Kreuzen');

  const expression = exprRoot(page);
  // "Eine gilt (oder)" of two times "Alle gelten (und)": each direction compares the earlier values and then the present ones
  await expect(expression.getByTestId('previous-value')).toHaveCount(4);
  await expect(expression.getByTestId('cmp-op')).toHaveCount(4);
  await expect(expression.getByTestId('expr-sentence')).toContainText('vorheriger Wert von');
  await expect(page.getByText(/Kreuzung|kreuzt/)).toHaveCount(0);
});

async function twoEmptyConditions(page: Page): Promise<void> {
  await newStrategyFromScratch(page, 'Befunde mit Element');
  await add(page, 'Kerzenschluss');
  await add(page, 'Bedingung', 'Erste Bedingung');
  await add(page, 'Bedingung', 'Zweite Bedingung');
}

test('findings with the same text name their element and their field, and "Zur Stelle" leads to the field', async ({ page }) => {
  await openApp(page);
  await twoEmptyConditions(page);

  await clickMenu(page, 'check');
  await page.getByTestId('findings-count').click();
  const findings = page.locator('[data-testid="finding"][data-code="parameter.missing"]').filter({ hasText: 'Bedingung' });
  await expect(findings).toHaveCount(2);

  // the same sentence for both, told apart by the element; the field is named as the element shows it, without the word "Parameter"
  const first = await findings.nth(0).textContent();
  const second = await findings.nth(1).textContent();
  expect(first).not.toBe(second);
  await expect(findings.nth(0).getByTestId('finding-element')).toHaveText('Element: Erste Bedingung');
  await expect(findings.nth(1).getByTestId('finding-element')).toHaveText('Element: Zweite Bedingung');
  await expect(findings.nth(0).getByTestId('finding-field')).toContainText('Feld: ');
  await expect(findings.nth(0)).not.toContainText(/Parameter/);

  await findings.nth(1).getByTestId('finding-goto').click();
  await expect(props(page).getByTestId('element-name')).toHaveValue('Zweite Bedingung');
  await expect(field(page, 'ausdruck')).toBeVisible();
  await expect(node(page, 'Zweite Bedingung')).toBeAttached();
});
