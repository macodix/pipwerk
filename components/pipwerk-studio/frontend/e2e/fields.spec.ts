import type { Page } from '@playwright/test';

import { add, bindFixed, exprRoot, field, newStrategyFromScratch, props, select, setCondition, type C, type V } from './builder';
import { removeStored, storedStrategy } from './compare';
import { choose, clickMenu, expect, node, offered, openApp, openStrategy, showArea, test } from './support';

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

/**
 * The label the library delivers for the fixed value of the instrument ("Voreingestelltes Instrument aus Strategie" after
 * order 23; before that the library delivers its earlier label): the interface shows what the type description says.
 */
async function presetLabel(page: Page): Promise<string> {
  const answer = (await (await page.request.get('/api/v1/element-types')).json()) as {
    types: { id: string; parameters: { id: string; choices: { id: string; label: { de: string } }[] }[] }[];
  };
  const parameter = answer.types.find((type) => type.id === 'trigger.candle_close')?.parameters.find((candidate) => candidate.id === 'instrument');
  const label = parameter?.choices.find((choice) => choice.id === 'instrument_der_anwendung')?.label.de;
  if (label === undefined) {
    throw new Error('The type descriptions name no fixed value for the instrument');
  }
  return label;
}

test('the instrument is labelled "Instrument wählen (optional)" with one choice that shows the preset, an explanation, an input at "fest eingeben", and the way back over the first entry', async ({ page }) => {
  const name = 'Instrument in Worten';
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'EMA', 'EMA 20');

    const preset = await presetLabel(page);
    const instrument = field(page, 'instrument');
    const kind = instrument.getByTestId('kind-instrument');
    await expect(instrument).toContainText('Instrument wählen (optional)');
    await expect(instrument).not.toContainText('Woher kommt der Wert?');
    await expect(kind).toHaveText(preset);
    await expect(instrument.getByTestId('preset-explanation-instrument')).toHaveText(
      'Ohne eigene Wahl gilt das voreingestellte Instrument aus der Strategie. Das ist das Instrument, auf dem die Strategie läuft; es wird erst beim Start der Strategie festgelegt. Wählen Sie hier nur ein Instrument, wenn dieses Element ein anderes verwenden soll.',
    );
    await expect(instrument.getByRole('button', { name: /wieder das Instrument|anderes Instrument/ })).toHaveCount(0);
    expect((await offered(kind)).slice(0, 4)).toEqual([preset, 'fest eingeben', 'aus einem Strategieparameter', 'von einem anderen Element']);

    // "fest eingeben": an empty input with the grey example; left empty, the choice shows the preset again
    await choose(kind, { label: 'fest eingeben' });
    const input = instrument.getByTestId('value-instrument');
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', 'zum Beispiel EURUSD');
    await expect(kind).toHaveText('fest eingeben');
    await input.press('Tab');
    await expect(kind).toHaveText(preset);
    await expect(instrument.getByTestId('value-instrument')).toHaveCount(0);
    await clickMenu(page, 'save');
    expect(instrumentOf(await storedStrategy(page, name), 'EMA 20')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });

    // a typed instrument is kept
    await choose(kind, { label: 'fest eingeben' });
    await instrument.getByTestId('value-instrument').fill('EURUSD');
    await clickMenu(page, 'save');
    expect(instrumentOf(await storedStrategy(page, name), 'EMA 20')).toEqual({ kind: 'fixed', value: 'EURUSD' });

    // the way back is the first entry of the choice
    await choose(kind, { label: preset });
    await expect(kind).toHaveText(preset);
    await expect(instrument.getByTestId('value-instrument')).toHaveCount(0);
    await clickMenu(page, 'save');
    expect(instrumentOf(await storedStrategy(page, name), 'EMA 20')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });
  } finally {
    await removeStored(page, name);
  }
});

test('the instrument of the order has the same field and says "diese Order"; in English the words follow the specification', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Instrument der Order');
  try {
    await add(page, 'Kerzenschluss');
    await add(page, 'Order aufgeben');
    await bindFixed(page, 'ordertyp', 'MarketOrder');

    const preset = await presetLabel(page);
    const instrument = page.getByTestId('sec-order').getByTestId('field-instrument');
    await expect(instrument).toContainText('Instrument wählen (optional)');
    await expect(instrument.getByTestId('kind-instrument')).toHaveText(preset);
    await expect(instrument.getByTestId('preset-explanation-instrument')).toContainText('wenn diese Order ein anderes verwenden soll.');

    await clickMenu(page, 'settings');
    await choose(page.getByRole('dialog').getByLabel('Sprache'), 'English');
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
    try {
      await showArea(page, 'props');
      const english = page.getByTestId('sec-order').getByTestId('field-instrument');
      await expect(english).toContainText('Choose instrument (optional)');
      await expect(english.getByTestId('preset-explanation-instrument')).toHaveText(
        'Without your own choice, the default instrument from the strategy applies. This is the instrument the strategy runs on; it is set only when the strategy starts. Choose an instrument here only if this order is to use a different one.',
      );
      await choose(english.getByTestId('kind-instrument'), { label: 'enter a value' });
      await expect(english.getByTestId('value-instrument')).toHaveAttribute('placeholder', 'for example EURUSD');
    } finally {
      await clickMenu(page, 'settings');
      await choose(page.getByRole('dialog').getByLabel('Language'), 'Deutsch');
      await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
    }
  } finally {
    await removeStored(page, 'Instrument der Order');
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
    expect(await offered(kind)).toEqual([
      'Zwei Werte vergleichen',
      'Alle Bedingungen müssen gelten (und)',
      'Mindestens eine Bedingung muss gelten (oder)',
      'Eine Bedingung umkehren (nicht)',
      'Prüfen, ob ein Wert wahr ist',
    ]);
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
