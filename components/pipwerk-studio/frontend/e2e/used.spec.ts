import type { Page } from '@playwright/test';

import { add, exprRoot, newStrategyFromScratch, props, select, setCalculation } from './builder';
import { removeStored, storedStrategy } from './compare';
import { card, clickMenu, expect, node, openApp, openStrategy, showArea, SIZES, STUB, test } from './support';

// Specification 5.4 (order 13): "Verwendete Werte" with the choice of the property and "Aktualisieren", the element of
// the first use chosen without dragging, the objects of the branch "wahr" that the branch "falsch" does not offer, and the
// question before removing an object or a step that places an order. They run against the real backend, which reads and
// forms the expressions and says where an object can be used.

test.skip(STUB, 'These tests run against the real backend: it reads and forms the expressions and walks the flow.');
test.use({ actionTimeout: 10_000 });

type Stored = { elements: { name: string | null; inputs: { instance: string; property: string; kind: string; arguments: unknown[]; refresh: boolean }[]; parameters: Record<string, { value?: string }>; instance?: { key: string; name: string; first_use: string | null } | null; id: string }[] };

async function showEverything(page: Page): Promise<void> {
  await showArea(page, 'canvas');
  await page.getByTestId('zoom-fit').click();
}

/** The labels of the entries of a list of values. */
async function labelsOf(list: ReturnType<Page['getByTestId']>): Promise<string[]> {
  return (await list.locator('option').allTextContents()).map((text) => text.trim());
}

const PHONE = SIZES[0];

for (const size of [{ name: 'notebook', width: 1366, height: 768 }, PHONE]) {
  test(`the value of an object is chosen under "Verwendete Werte" and "Aktualisieren" is switched on; the expression follows (${size.width} x ${size.height})`, async ({ page }) => {
    const name = `Verwendete Werte ${size.name}`;
    await openApp(page, size);
    try {
      await newStrategyFromScratch(page, name);
      await add(page, 'Kerzenschluss');
      await add(page, 'Berechnung', 'Hoch');
      await add(page, 'ZigZag', 'Zacke');
      await select(page, 'Hoch');
      await setCalculation(page, { pick: 'Zacke › Letztes Hoch' });
      await expect(exprRoot(page).getByTestId('expr-sentence')).toContainText('Zacke');

      // the value stands under "Verwendete Werte"; the choice names every property of the object. The identifier in
      // expressions (`zigzag`) comes from the first name of the object and does not change when it is renamed.
      const used = props(page).getByTestId('sec-used');
      const choice = used.getByTestId('used-zigzag-letztes_hoch-select');
      await expect(choice).toBeVisible();
      expect(await labelsOf(choice)).toEqual(expect.arrayContaining(['Letztes Hoch', 'Vorletztes Hoch', 'Letztes Tief', 'Vorletztes Tief']));
      await choice.selectOption({ label: 'Letztes Tief' });
      await expect(used.getByTestId('used-zigzag-letztes_tief-select')).toBeVisible();
      // the section and its controls stay within the window, also in the narrowest one
      const box = await used.boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
      await used.getByTestId('used-add-object').scrollIntoViewIfNeeded();
      const form = await used.getByTestId('used-add').boundingBox();
      expect((form?.x ?? 0) + (form?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
      // the expression of the element follows the choice
      await expect(exprRoot(page).getByTestId('expr-sentence')).toContainText('Letztes Tief');

      // "Aktualisieren" has an explanation when pointed at and is stored with the input
      const refresh = used.getByTestId('used-zigzag-letztes_tief-refresh');
      await expect(refresh).not.toBeChecked();
      await expect(used.locator('.used-refresh')).toHaveAttribute('data-tip', /Werte.*neu/);
      await refresh.check();
      await expect(refresh).toBeChecked();

      await clickMenu(page, 'save');
      await expect(page.getByTestId('status-pill')).not.toContainText('ungespeichert');
      const stored = (await storedStrategy(page, name)) as unknown as Stored;
      const step = stored.elements.find((element) => element.name === 'Hoch');
      expect(step?.parameters.ausdruck?.value).toBe('zigzag.letztes_tief');
      expect(step?.inputs).toEqual([{ instance: 'zigzag', property: 'letztes_tief', kind: 'property', arguments: [], refresh: true }]);
      // the first connection of the object made this element the element of its first use
      expect(stored.elements.find((element) => element.instance?.key === 'zigzag')?.instance?.first_use).toBe(step?.id);
    } finally {
      await removeStored(page, name);
    }
  });
}

test('the element of the first use is named in the properties view of the object and is chosen there without dragging', async ({ page }) => {
  const name = 'Erste Verwendung wählen';
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'Berechnung', 'Rechnung');
    await add(page, 'ZigZag', 'Zacke');
    await select(page, 'Zacke');

    await expect(page.getByTestId('first-use-text')).toContainText('Noch kein Element verwendet dieses Objekt');
    await page.getByTestId('first-use-select').selectOption({ label: 'Rechnung' });
    await expect(page.getByTestId('first-use-text')).toContainText('Rechnung');
    await showEverything(page);
    await expect(card(page, 'Zacke')).not.toHaveAttribute('data-unconnected', '1');
    // the element uses a value of the object now
    await select(page, 'Rechnung');
    await expect(props(page).getByTestId('used-row')).toHaveCount(1);

    await clickMenu(page, 'save');
    await expect(page.getByTestId('status-pill')).not.toContainText('ungespeichert');
    const stored = (await storedStrategy(page, name)) as unknown as Stored;
    expect(stored.elements.find((element) => element.instance?.name === 'Zacke')?.instance?.first_use).toBe(stored.elements.find((element) => element.name === 'Rechnung')?.id);
  } finally {
    await removeStored(page, name);
  }
});

test('an object that is determined only in the branch "wahr" is offered neither in the blocks nor for connecting in the branch "falsch"', async ({ page }) => {
  const name = 'Zweig falsch';
  await openApp(page, { width: 1920, height: 1080 });
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'Bedingung', 'Prüfung');
    await add(page, 'Berechnung', 'Im Ja');
    await select(page, 'Prüfung');
    await add(page, 'Berechnung', 'Im Nein');
    await add(page, 'EMA', 'Schnell');
    await showEverything(page);
    await expect(page.getByTestId('flow-edge')).toHaveCount(3);

    // the object is connected with the element in the branch "wahr": that is the element of its first use
    await card(page, 'Schnell').getByTestId('port-prop-wert').click();
    await node(page, 'Im Ja').click({ position: { x: 40, y: 14 } });
    await expect(page.getByTestId('armed-banner')).toHaveCount(0);

    // connecting: the element in the branch "falsch" does not take it, with a click or a line, and says why
    await card(page, 'Schnell').getByTestId('port-prop-wert').click();
    await expect(node(page, 'Im Ja')).toHaveAttribute('data-accepts', 'yes');
    await expect(node(page, 'Im Nein')).toHaveAttribute('data-accepts', 'no');
    await node(page, 'Im Nein').click({ position: { x: 40, y: 14 } });
    await expect(page.getByTestId('armed-banner')).toContainText('lässt sich an „Im Nein“ nicht verwenden');
    await page.getByTestId('armed-banner').getByRole('button', { name: 'Abbrechen' }).click();

    // the blocks: in the branch "wahr" the value is on the list, in the branch "falsch" it is not
    await select(page, 'Im Ja');
    const inTrue = exprRoot(page).getByTestId('calc-root-select');
    expect(await labelsOf(inTrue)).toContain('Schnell › Wert');
    await select(page, 'Im Nein');
    const inFalse = exprRoot(page).getByTestId('calc-root-select');
    await expect(inFalse).toBeVisible();
    expect(await labelsOf(inFalse)).not.toContain('Schnell › Wert');

    // "Verwendete Werte": the object is not on offer for a further value there either; it is at the element of its first use
    await expect(page.getByTestId('used-none-usable')).toBeVisible();
    await expect(page.getByTestId('used-add-object')).toHaveCount(0);
    await select(page, 'Im Ja');
    expect(await labelsOf(page.getByTestId('used-add-object'))).toContain('Schnell');

    // the same in the formula view: typing the name there is not suggested either
    await select(page, 'Im Nein');
    await exprRoot(page).getByTestId('view-formula').click();
    const input = exprRoot(page).getByTestId('formula-input');
    await input.click();
    await input.pressSequentially('Sch');
    await expect(exprRoot(page).getByTestId('formula-suggestions')).toHaveCount(0);
  } finally {
    await removeStored(page, name);
  }
});

test('the step that places an order is removed after a question that names the steps of its management', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');

  await select(page, 'Order aufgeben');
  await page.getByTestId('remove-element').click();

  const dialog = page.getByRole('dialog');
  const managed = dialog.getByTestId('remove-managed');
  await expect(managed).toContainText('Order ausgefuehrt');
  await expect(managed).toContainText('Position schließen');
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await showArea(page, 'canvas');
  await expect(node(page, 'Order aufgeben')).toHaveCount(1);
});

test('a strategy parameter that expressions use is removed after a question that lists the steps, and leaves empty places and a finding that says how to fix it', async ({ page }) => {
  const name = 'Parameter entfernen';
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'Berechnung', 'Abstand');
    await showArea(page, 'canvas');
    await page.getByTestId('param-new').click();
    const popover = page.getByTestId('param-popover');
    await popover.getByTestId('param-name').fill('Weite');
    await popover.getByTestId('param-type').selectOption('number');
    await popover.getByTestId('param-value').fill('5');
    await popover.getByTestId('param-done').click();
    await select(page, 'Abstand');
    await setCalculation(page, { pick: 'Weite' });
    await expect(exprRoot(page).getByTestId('expr-sentence')).toContainText('Weite');

    await showArea(page, 'canvas');
    await page.getByTestId('param-chip').filter({ hasText: 'Weite' }).click();
    await page.getByTestId('param-delete').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByTestId('remove-users')).toContainText('Abstand');
    await dialog.getByRole('button', { name: 'Entfernen' }).click();
    await expect(page.getByTestId('param-chip').filter({ hasText: 'Weite' })).toHaveCount(0);

    // the check finds the empty place and says what to do
    await clickMenu(page, 'check');
    await page.getByTestId('findings-count').click();
    const finding = page.locator('[data-testid="finding"][data-code="expression.empty"]');
    await expect(finding.first()).toBeVisible();
    await expect(finding.first()).toContainText('So beheben Sie es');
    await finding.first().getByTestId('finding-goto').click();
    await expect(props(page).getByTestId('element-name')).toHaveValue('Abstand');
  } finally {
    await removeStored(page, name);
  }
});
