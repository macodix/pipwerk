import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { newStrategyFromScratch } from './builder';
import { card, lib, openApp } from './support';

// Order 06, points 2 and 3 (req-ui-016): the properties view of an object describes every property and method it delivers
// with name, data type and a visible description; every row of an object on the canvas shows the name.

const TYPES_DE = ['Zahl', 'Ganzzahl', 'Prozent', 'ja/nein', 'Text', 'Auswahl', 'Zeiteinheit', 'Datum und Uhrzeit', 'Datum', 'Ausdruck', 'Instrument', 'Objekt', 'Methode'];
const TYPES_EN = ['Number', 'Integer', 'Percent', 'yes/no', 'Text', 'Choice', 'Time unit', 'Date and time', 'Date', 'Expression', 'Instrument', 'Object', 'Method'];
const GENERIC = /Ein Wert dieses Objekts, den andere Elemente verwenden können\.|A value of this object that other elements can use\./;

/** An indicator, a trend and the objects of the application that can lie on the canvas. */
const OBJECTS = ['EMA', 'ATR', 'ZigZag', 'Markttechnik', 'Trend', 'Konto', 'Instrument', 'Kerze', 'Tick'];

async function setEnglish(page: Page): Promise<void> {
  await page.getByTestId('menu-settings').click();
  await page.getByTestId('lang-en').click();
  await page.getByTestId('settings-apply').click();
}

async function expectDescribedRows(page: Page, scope: ReturnType<Page['locator']>, lang: 'de' | 'en', what: string): Promise<number> {
  const types = lang === 'de' ? TYPES_DE : TYPES_EN;
  const rows = scope.getByTestId('prop-row');
  const n = await rows.count();
  expect(n, `${what}: the object delivers something`).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    const name = ((await row.getByTestId('prop-name').textContent()) ?? '').trim();
    const type = ((await row.getByTestId('prop-type').textContent()) ?? '').trim();
    const desc = ((await row.getByTestId('prop-desc').textContent()) ?? '').trim();
    expect(name.length, `${what}, row ${i}: name`).toBeGreaterThan(1);
    // a name may equal the name of a data type ("Instrument", "Zeitpunkt"); what counts is that the name stands before the type
    expect(types.includes(name) && name === type, `${what}, row ${i}: shows a name, not only its data type (${name})`).toBe(false);
    expect(type.length, `${what}, ${name}: data type`).toBeGreaterThan(1);
    expect(desc.length, `${what}, ${name}: description`).toBeGreaterThan(40);
    expect(desc, `${what}, ${name}: a description of its own, not the general sentence`).not.toMatch(GENERIC);
    await expect(row.getByTestId('prop-desc'), `${what}, ${name}: the description is visible`).toBeVisible();
  }
  return n;
}

for (const lang of ['de', 'en'] as const) {
  test(`properties view of every object describes each property and method, ${lang}`, async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    if (lang === 'en') await setEnglish(page);
    await newStrategyFromScratch(page, 'Beschreibung');
    for (const type of OBJECTS) {
      // back to the strategy, so that the next instance is not connected to the previous one
      if (await page.getByTestId('crumb-strategy').count()) await page.getByTestId('crumb-strategy').click();
      await lib(page, type).click();
      const props = page.getByTestId('props-element');
      await expect(props, type).toBeVisible();
      const delivers = props.getByTestId('sec-delivers');
      await expect(delivers, `${type}: section "delivers"`).toBeVisible();
      const n = await expectDescribedRows(page, delivers, lang, type);
      // every row of the object on the canvas shows its name, never only a data type
      const c = card(page, await page.getByTestId('element-name').inputValue());
      await expect(c).toBeVisible();
      const more = c.getByTestId('card-more');
      if (await more.count()) await more.click();
      const types = lang === 'de' ? TYPES_DE : TYPES_EN;
      const crow = c.getByTestId('card-row');
      expect(await crow.count(), `${type}: rows on the canvas when unfolded`).toBe(n);
      for (let i = 0; i < n; i++) {
        const name = ((await crow.nth(i).getByTestId('row-name').textContent()) ?? '').trim();
        expect(name.length, `${type}, canvas row ${i}: name`).toBeGreaterThan(1);
        const ctype = ((await crow.nth(i).getByTestId('row-type').textContent()) ?? '').trim();
        expect(ctype.length, `${type}, canvas row ${i}: data type behind the name`).toBeGreaterThan(1);
        expect(types.includes(name) && name === ctype, `${type}, canvas row ${i}: not only a data type (${name})`).toBe(false);
      }
      // an indicator that delivers a method names it
      if (type === 'EMA') {
        await expect(delivers.locator('[data-testid="prop-row"][data-method="1"]')).toHaveCount(1);
        await expect(crow.filter({ hasText: lang === 'de' ? 'Wert vor' : 'Value' }).first()).toBeVisible();
      }
    }
  });

  test(`properties view of the strategy describes order, position and strategy, ${lang}`, async ({ page }) => {
    await openApp(page, { width: 1366, height: 768 });
    if (lang === 'en') await setEnglish(page);
    const sec = page.getByTestId('sec-app-objects');
    await sec.scrollIntoViewIfNeeded();
    for (const type of ['Order', 'Position', 'Strategie']) {
      const d = page.getByTestId(`app-object-${type}`);
      await d.locator('summary').click();
      await expectDescribedRows(page, d, lang, type);
    }
  });
}

test('the card of a new EMA names its value, the line to its element names the value too', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await newStrategyFromScratch(page, 'Namen');
  await lib(page, 'trigger.candle_close').click();
  await lib(page, 'flow.condition').click();
  await lib(page, 'EMA').click();
  const c = card(page, 'EMA');
  await expect(c.getByTestId('card-row').first().getByTestId('row-name')).toHaveText('Wert');
  await expect(c.getByTestId('card-row').first().getByTestId('row-type')).toHaveText('Zahl');
  await expect(page.locator('[data-testid="wire"][data-src="EMA"]')).toHaveAttribute('data-label', 'Wert');
  await expect(page.locator('[data-testid="wire"][data-src="EMA"] .wire-label text')).toHaveText('Wert');
});
