import type { Page } from '@playwright/test';

import { add, bindParam, createParam, newStrategyFromScratch, props, setCond, setValue } from './builder';
import { removeStored, storedStrategy } from './compare';
import { clickMenu, expect, expectSaved, openApp, showArea, test } from './support';

// Order 06, points 3 and 4: rules, an own indicator, an own trend and an own ruleset are filled completely in the
// strategy, saved and found again after opening. They run against the real backend, which forms the expressions.

test.use({ actionTimeout: 10_000 });

type Stored = {
  rules: { name: string; key: string; object_type: string; expression: string | null; determined_property: string | null; comparison: string | null; parameters: { name: string }[] }[];
  elements: {
    type: string;
    instance: null | {
      name: string;
      object_type: string;
      parameters: { name: string; datatype: string }[];
      properties: { name: string; key: string; expression: string }[];
      instances: { name: string }[];
      rules: { name: string; expression: string }[];
      result_expression: string | null;
    };
  }[];
};

/** Saves, then reads the strategy back from the backend. */
async function saveAndRead(page: Page, name: string): Promise<Stored> {
  await clickMenu(page, 'save');
  await expectSaved(page);
  return (await storedStrategy(page, name)) as unknown as Stored;
}

test('a rule is added to the strategy with parameters, an expression from blocks, a determined property and a comparison', async ({ page }, testInfo) => {
  const name = `Regel ${testInfo.project.name}`;
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await showArea(page, 'props');
    await page.getByTestId('status-pill').click();
    const section = page.getByTestId('sec-rules');
    await section.getByTestId('rule-add-select').selectOption({ label: 'eigene Regel' });
    const card = section.getByTestId('rule-card').last();
    await card.getByTestId('instance-name').fill('Höchstvolumen');

    // an own parameter of the rule
    await card.getByTestId('own-parameter-new-name').fill('Grenze');
    await card.getByTestId('own-parameter-add').click();
    await expect(card.getByTestId('own-parameter')).toHaveCount(1);

    // the rule determines the volume; the expression is a number from blocks
    await card.getByTestId('rule-determined').selectOption({ label: 'Volumen' });
    await expect(card.getByTestId('rule-comparison')).toHaveValue('hoechstens');
    await card.getByTestId('rule-comparison').selectOption({ label: 'mindestens' });
    await setValue(card.getByTestId('rule-expression').locator(':scope > .vb'), { calc: [{ pick: 'Grenze' }, '*', { num: 2 }] });

    const stored = await saveAndRead(page, name);
    expect(stored.rules).toHaveLength(1);
    expect(stored.rules[0]).toMatchObject({ name: 'Höchstvolumen', determined_property: 'volumen', comparison: 'mindestens' });
    expect(stored.rules[0]?.parameters.map((parameter) => parameter.name)).toEqual(['Grenze']);
    expect(stored.rules[0]?.expression).toContain('* 2');
  } finally {
    await removeStored(page, name);
  }
});

test('an own indicator has own parameters and properties with expressions from blocks', async ({ page }, testInfo) => {
  const name = `Eigener Indikator ${testInfo.project.name}`;
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'eigener Indikator', 'Doppelter Schluss');
    const parameters = page.getByTestId('sec-own-parameters');
    await parameters.getByTestId('own-parameter-new-name').fill('Faktor');
    await parameters.getByTestId('own-parameter-add').click();
    await expect(parameters.getByTestId('own-parameter')).toHaveCount(1);

    const properties = page.getByTestId('sec-instance-properties');
    await properties.getByTestId('own-property-new-name').fill('Wert');
    await properties.getByTestId('own-property-add').click();
    const property = properties.getByTestId('instance-property').first();
    await expect(property).toBeVisible();
    await setValue(property.getByTestId('property-expression-wert').locator(':scope > .vb'), {
      calc: [{ pick: 'Kerze › Schluss' }, '*', { pick: 'Faktor' }],
    });

    const stored = await saveAndRead(page, name);
    const indicator = stored.elements.find((element) => element.instance?.name === 'Doppelter Schluss')?.instance;
    expect(indicator?.parameters.map((parameter) => parameter.name)).toEqual(['Faktor']);
    expect(indicator?.properties.map((entry) => entry.name)).toEqual(['Wert']);
    expect(indicator?.properties[0]?.expression).toContain('*');
  } finally {
    await removeStored(page, name);
  }
});

test('an own trend gets its direction from an expression made of blocks and keeps the settings of its type', async ({ page }, testInfo) => {
  const name = `Eigener Trend ${testInfo.project.name}`;
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await createParam(page, 'Zeiteinheit', 'time_unit', 'h1');
    await add(page, 'eigener Trend', 'Mein Trend');
    await bindParam(page, 'zeiteinheit', 'Zeiteinheit');
    // instrument and time unit and the method of calculation are fields of the trend
    await expect(props(page).locator('[data-field="instrument"]')).toBeVisible();
    await expect(props(page).locator('[data-field="zeiteinheit"]')).toBeVisible();

    const properties = page.getByTestId('sec-instance-properties');
    await properties.locator('[data-testid^="property-define-"]').first().click();
    const direction = properties.locator('[data-testid^="property-expression-"]').first();
    await setValue(direction.locator(':scope > .vb'), {
      iff: [{ cmp: [{ pick: 'Kerze › Schluss' }, '>', { pick: 'Kerze › Eröffnung' }] }, { text: 'aufwaerts' }, { text: 'abwaerts' }],
    });

    const stored = await saveAndRead(page, name);
    const trend = stored.elements.find((element) => element.instance?.name === 'Mein Trend')?.instance;
    expect(trend?.properties.length).toBeGreaterThan(0);
    expect(trend?.properties[0]?.expression).toContain('IF(');
    expect(trend?.properties[0]?.expression).toContain('"aufwaerts"');
  } finally {
    await removeStored(page, name);
  }
});

test('an own ruleset holds rules and an expression for the overall result', async ({ page }, testInfo) => {
  const name = `Eigenes Regelwerk ${testInfo.project.name}`;
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await showArea(page, 'props');
    await page.getByTestId('status-pill').click();
    const section = page.getByTestId('sec-rules');
    await section.getByTestId('rule-add-select').selectOption({ label: 'eigenes Regelwerk' });
    // the ruleset is the only rule of the strategy; the rules it contains stand inside of its card
    const card = section.getByTestId('rule-card').first();
    await card.getByTestId('instance-name').first().fill('Meine Prüfungen');

    const rules = card.getByTestId('sec-contained-rules');
    await rules.getByTestId('rule-add-select').selectOption({ label: 'eigene Regel' });
    const inner = rules.getByTestId('rule-card').last();
    await inner.getByTestId('instance-name').first().fill('Kapital ausreichend');
    await setCond(inner.getByTestId('rule-expression').locator(':scope > .cb'), { cmp: [{ pick: 'Konto › Kapital' }, '>', { num: 1000 }] });
    await expect(card.getByTestId('sec-result')).toBeVisible();

    const stored = await saveAndRead(page, name);
    const ruleset = stored.rules.find((rule) => rule.name === 'Meine Prüfungen') as unknown as { rules: { name: string; expression: string }[] };
    expect(ruleset.rules.map((rule) => rule.name)).toEqual(['Kapital ausreichend']);
    expect(ruleset.rules[0]?.expression).toContain('> 1000');
  } finally {
    await removeStored(page, name);
  }
});
