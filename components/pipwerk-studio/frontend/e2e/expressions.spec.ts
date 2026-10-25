import type { Page } from '@playwright/test';

import { add, exprRoot, newStrategyFromScratch, props, select, setCalculation, setCondition } from './builder';
import { removeStored, storedStrategy } from './compare';
import { clickMenu, expect, node, openApp, showArea, SIZES, STUB, test } from './support';

// Order 06: the formula editor, the blocks and the guided setup in the narrow windows, rename and remove, and the way
// from a finding to the spot in the expression. They run against the real backend, which forms the expressions. The
// steps of the test cases that build whole strategies are in `docs/technical/pipwerk-studio-testfaelle.md`.

test.skip(STUB, 'These tests run against the real backend: it reads and forms the expressions.');
test.use({ actionTimeout: 10_000 });

const PHONES = SIZES.filter((size) => size.name.startsWith('phone'));

/** The formula view of the expression that is open in the properties view. */
async function openFormula(page: Page): Promise<ReturnType<Page['getByTestId']>> {
  await exprRoot(page).getByTestId('view-formula').click();
  return exprRoot(page).getByTestId('formula-input');
}

test('the formula editor suggests after the name of a calculation and after "Objekt." and marks an error where it is', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Formeleditor');
  await add(page, 'EMA', 'EMA 20');
  await add(page, 'Berechnung', 'Richtung');
  await add(page, 'Berechnung', 'Stop-Loss');
  const input = await openFormula(page);

  // after the name of a calculation: its result
  await input.click();
  await input.pressSequentially('Richtung.');
  const suggestions = exprRoot(page).getByTestId('formula-suggestions');
  await expect(suggestions).toBeVisible();
  await expect(suggestions.getByTestId('formula-suggestion').first()).toContainText('Ergebnis');
  await suggestions.getByTestId('formula-suggestion').first().click();
  await expect(input).toHaveValue('Richtung.Ergebnis');

  // after the name of an object: its values, with the datatype and the explanation
  await input.fill('');
  await input.pressSequentially('[EMA 20].');
  await expect(suggestions.getByTestId('formula-suggestion').first()).toContainText('Wert');

  // an error is underlined where it is, with the explanation on pointing at it
  await input.fill('IF(ema20.wert >');
  const marked = exprRoot(page).locator('.tk-error').first();
  await expect(marked).toBeVisible();
  await expect(marked).toHaveAttribute('data-tip', /.+/);
  // the expression with the error stays in the formula view; the sentence says so
  await exprRoot(page).getByTestId('view-blocks').click();
  await expect(exprRoot(page).getByTestId('expr-bad')).toBeVisible();
});

test('the formula editor explains the arguments of a function while it is typed and shows the brackets that belong together', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Formeleditor Argumente');
  await add(page, 'Berechnung', 'Rechnung');
  const input = await openFormula(page);
  await input.click();
  await input.pressSequentially('IF(');
  await expect(exprRoot(page).getByTestId('formula-hint')).toContainText('IF(');
  await input.pressSequentially('1 = 1; 2');
  await expect(exprRoot(page).getByTestId('formula-hint').locator('b.cur')).toBeVisible();
  await input.pressSequentially('; 3)');
  // the caret stands behind the opening bracket: both brackets are marked
  await input.press('Home');
  for (let step = 0; step < 3; step += 1) {
    await input.press('ArrowRight');
  }
  await expect(exprRoot(page).locator('.tk-bracket')).toHaveCount(2);
});

test('renaming shows the new name everywhere at once; removing a connected object asks, lists the steps that use it and leaves an empty place', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Umbenennen und Entfernen');
  await add(page, 'EMA', 'EMA 20');
  await add(page, 'Berechnung', 'Doppelt');
  await setCalculation(page, { calc: [{ pick: 'EMA 20 › Wert' }, '*', { num: 2 }] });
  const sentence = exprRoot(page).getByTestId('expr-sentence');
  await expect(sentence).toContainText('EMA 20');
  await expect(props(page).getByTestId('used-row')).toHaveCount(1);

  // rename without a question: the sentence, the group of "Verwendete Werte" and the card show the new name
  await select(page, 'EMA 20');
  await page.getByTestId('element-name').fill('Schnelle EMA');
  await select(page, 'Doppelt');
  await expect(sentence).toContainText('Schnelle EMA');
  await expect(sentence).not.toContainText('EMA 20');
  await expect(props(page).getByTestId('used-group').first()).toContainText('Schnelle EMA');

  // remove: the question lists the step that uses the object
  await select(page, 'Schnelle EMA');
  await page.getByTestId('remove-element').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Schnelle EMA');
  await expect(dialog.getByTestId('remove-users')).toContainText('Doppelt');
  // cancel: nothing changes
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await showArea(page, 'canvas');
  await expect(page.locator('[data-testid="card"][data-node-name="Schnelle EMA"]')).toHaveCount(1);

  await select(page, 'Schnelle EMA');
  await page.getByTestId('remove-element').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click();
  await showArea(page, 'canvas');
  await expect(page.locator('[data-testid="card"][data-node-name="Schnelle EMA"]')).toHaveCount(0);

  // the step that used it has an empty place, no input and no line
  await select(page, 'Doppelt');
  await expect(props(page).getByTestId('used-row')).toHaveCount(0);
  await expect(exprRoot(page).getByTestId('calc-root-select')).toBeVisible();
  await expect(exprRoot(page).locator('.vb-inner.calc .vb').first().locator(':scope > .select select')).toHaveValue('');
  await expect(exprRoot(page).getByTestId('expr-sentence')).not.toContainText('Schnelle EMA');
  await showArea(page, 'canvas');
  await expect(page.getByTestId('wire')).toHaveCount(0);
});

test('removing a step in the middle of the flow closes the gap', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Lücke schließen');
  await add(page, 'Kerzenschluss');
  await add(page, 'Berechnung', 'Eins');
  await add(page, 'Berechnung', 'Zwei');
  await add(page, 'Berechnung', 'Drei');
  await showArea(page, 'canvas');
  await expect(page.getByTestId('flow-edge')).toHaveCount(3);

  await select(page, 'Zwei');
  await page.getByTestId('remove-element').click();
  if ((await page.getByRole('dialog').count()) > 0) {
    await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click();
  }
  await showArea(page, 'canvas');

  await expect(node(page, 'Zwei')).toHaveCount(0);
  await expect(page.getByTestId('flow-edge')).toHaveCount(2);
});

test('a finding in an expression leads to the spot in the expression', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Befund zur Stelle');
  await add(page, 'Kerzenschluss');
  await add(page, 'Bedingung', 'Prüfung');
  const input = await openFormula(page);
  await input.fill('1 = = 2');
  await expect(exprRoot(page).locator('.tk-error').first()).toBeVisible();
  // leave the formula view and the step, then check
  await select(page, 'Kerzenschluss');
  await clickMenu(page, 'check');
  // the findings are listed in the properties view of the strategy
  await page.getByTestId('findings-count').click();
  const finding = page.locator('[data-testid="finding"][data-code="expression.invalid"]');
  await expect(finding).toHaveCount(1);

  await finding.getByTestId('finding-goto').click();

  await expect(props(page).getByTestId('element-name')).toHaveValue('Prüfung');
  const formula = exprRoot(page).getByTestId('formula-input');
  await expect(formula).toBeVisible();
  await expect(formula).toBeFocused();
  // the spot of the finding is selected in the text
  const selected = await formula.evaluate((element) => {
    const area = element as HTMLTextAreaElement;
    return area.value.slice(area.selectionStart, area.selectionEnd);
  });
  expect(selected).toBe('=');
});

test('the guided setup lays out the elements of its steps, can be left at any step and stores only with "Speichern"', async ({ page }, testInfo) => {
  const name = `Geführter Aufbau ${testInfo.project.name}`;
  await openApp(page);
  try {
    await clickMenu(page, 'new');
    await showArea(page, 'props');
    await expect(page.getByTestId('wizard')).toBeVisible();

    await page.getByTestId('wz-name').fill(name);
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-trigger').first().click();
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wz-step-3')).toBeVisible();
    await page.getByTestId('wz-add-indicator').filter({ hasText: /^EMA$/ }).click();
    await expect(page.getByTestId('wz-indicator')).toHaveCount(1);
    await page.getByTestId('wz-add-indicator').filter({ hasText: /^EMA$/ }).click();
    await expect(page.getByTestId('wz-indicator')).toHaveCount(2);
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wz-step-4')).toBeVisible();
    const choices = await page.getByTestId('wz-a').locator('option').allTextContents();
    await page.getByTestId('wz-a').selectOption({ index: 1 });
    await page.getByTestId('wz-b').selectOption({ index: 2 });
    expect(choices.length).toBeGreaterThan(2);
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wz-step-5')).toBeVisible();
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wizard')).toHaveCount(0);

    // the elements are there; nothing is stored yet
    await showArea(page, 'canvas');
    await expect(page.locator('[data-testid="node"][data-type-name="Bedingung"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="card"]')).toHaveCount(2);
    await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
    await clickMenu(page, 'save');
    await expect(page.getByTestId('status-pill')).toContainText('gespeichert');
    const stored = await storedStrategy(page, name);
    expect((stored.elements as { type: string }[]).map((element) => element.type)).toEqual(
      expect.arrayContaining(['EMA', 'trigger.candle_close', 'flow.condition', 'flow.place_order']),
    );
  } finally {
    await removeStored(page, name);
  }
});

test('"Ohne Assistent weiterarbeiten" keeps what the guided setup laid out', async ({ page }) => {
  await openApp(page);
  await clickMenu(page, 'new');
  await showArea(page, 'props');
  await page.getByTestId('wz-next').click();
  await page.getByTestId('wz-trigger').first().click();
  await page.getByTestId('wz-next').click();
  await expect(page.getByTestId('wz-step-3')).toBeVisible();

  await page.getByTestId('wz-leave').click();

  await expect(page.getByTestId('wizard')).toHaveCount(0);
  await showArea(page, 'canvas');
  await expect(page.getByTestId('node')).toHaveCount(1);
  await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
});

for (const size of PHONES) {
  test.describe(`on a phone, ${size.width} x ${size.height}`, () => {
    /** Nothing reaches beyond the window to the right and the page does not scroll sideways. */
    async function fitsTheWindow(page: Page, selector: string): Promise<void> {
      const box = await page.locator(selector).first().boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? -1) >= -1).toBe(true);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(wide).toBe(false);
    }

    test('the blocks and the formula editor fit the window and can be operated', async ({ page }) => {
      await openApp(page, size);
      await newStrategyFromScratch(page, 'Phone Bausteine');
      await add(page, 'EMA', 'EMA 20');
      await add(page, 'EMA', 'EMA 50');
      await add(page, 'Bedingung', 'Kreuzen');
      await setCondition(page, { cross: [{ pick: 'EMA 20 › Wert' }, { pick: 'EMA 50 › Wert' }, 'any'] });
      await fitsTheWindow(page, '[data-testid="props-element"] .cb');
      await expect(exprRoot(page).getByTestId('expr-sentence')).toContainText('EMA 20');

      const input = await openFormula(page);
      await expect(input).toBeVisible();
      await fitsTheWindow(page, '[data-testid="formula-editor"]');
      await input.click();
      await input.press('End');
      await input.pressSequentially(' ');
      await fitsTheWindow(page, '[data-testid="formula-editor"]');
    });

    test('the guided setup fits the window and leads through all steps', async ({ page }) => {
      await openApp(page, size);
      await clickMenu(page, 'new');
      await showArea(page, 'props');
      await expect(page.getByTestId('wizard')).toBeVisible();
      await fitsTheWindow(page, '[data-testid="wizard"]');
      for (const step of ['wz-step-1', 'wz-step-2', 'wz-step-3']) {
        await expect(page.getByTestId(step)).toBeVisible();
        await fitsTheWindow(page, `[data-testid="${step}"]`);
        if (step === 'wz-step-2') {
          await page.getByTestId('wz-trigger').first().click();
        }
        await page.getByTestId('wz-next').click();
      }
      await expect(page.getByTestId('wz-step-4')).toBeVisible();
      await fitsTheWindow(page, '[data-testid="wz-step-4"]');
      // the buttons of the steps can be reached
      await expect(page.getByTestId('wz-next')).toBeInViewport();
      await expect(page.getByTestId('wz-leave')).toBeVisible();
    });

    test('renaming and removing work with clicks', async ({ page }) => {
      await openApp(page, size);
      await newStrategyFromScratch(page, 'Phone Entfernen');
      await add(page, 'EMA', 'EMA 20');
      await add(page, 'Berechnung', 'Doppelt');
      await setCalculation(page, { calc: [{ pick: 'EMA 20 › Wert' }, '*', { num: 2 }] });
      await select(page, 'EMA 20');
      await page.getByTestId('element-name').fill('Schnelle EMA');
      await page.getByTestId('remove-element').click();
      await expect(page.getByRole('dialog').getByTestId('remove-users')).toContainText('Doppelt');
      await page.getByRole('dialog').getByRole('button', { name: 'Entfernen' }).click();
      await showArea(page, 'canvas');
      await expect(page.locator('[data-testid="card"][data-node-name="Schnelle EMA"]')).toHaveCount(0);
    });
  });
}
