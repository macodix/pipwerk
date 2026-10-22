import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clickNode, newStrategyFromScratch, props, setCondition } from './builder';
import { card, lib, openApp } from './support';

// Order 03: names proposed when a template is inserted (req-ablauf-003), the common namespace (req-fach-055),
// the use only in the expression (req-ui-014). Technical acceptance criteria 2 and 3.

const tpl = (page: Page, label: string) => page.locator(`[data-testid="lib-item"][data-label="${label}"]`);

/** Names of the contained instances in the properties view of the selected instance. */
async function containedNames(page: Page): Promise<string[]> {
  return props(page).getByTestId('own-includes').locator('.own-row input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
}

/** Names of the contained rules in the properties view of the selected rule set. */
async function ruleNames(page: Page): Promise<string[]> {
  return page.getByTestId('props-rule').locator('.rule-head input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
}

async function startWithCondition(page: Page, name: string): Promise<void> {
  await openApp(page, { width: 1920, height: 1080 });
  await newStrategyFromScratch(page, name);
  await lib(page, 'trigger.candle_close').click();
  await lib(page, 'flow.condition').click();
}

test.describe('names proposed when a template with instances or rules is inserted (req-ablauf-003, specification 3.3)', () => {
  test('a trend with two indicators, inserted several times: proposed names, appended number, changing a name, renaming the instance', async ({ page }) => {
    const errors = await openApp(page, { width: 1920, height: 1080 });
    await newStrategyFromScratch(page, 'Vorschlag');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();

    // first insertion: "<name of the new instance> <former name>"
    await tpl(page, 'Trend H1').click();
    await expect(page.getByTestId('element-name')).toHaveValue('Trend H1');
    expect(await containedNames(page)).toEqual(['Trend H1 EMA 20', 'Trend H1 EMA 50']);
    // the properties view says it, too
    await expect(props(page).getByTestId('sec-delivers')).toContainText('Trend H1 EMA 20');

    // second insertion of the same template: the instance is called "Trend H1 2", the names follow it
    await tpl(page, 'Trend H1').click();
    await expect(page.getByTestId('element-name')).toHaveValue('Trend H1 2');
    expect(await containedNames(page)).toEqual(['Trend H1 2 EMA 20', 'Trend H1 2 EMA 50']);

    // the user changes a name
    await props(page).getByTestId('own-includes').locator('.own-row input').first().fill('Schneller EMA');
    expect(await containedNames(page)).toEqual(['Schneller EMA', 'Trend H1 2 EMA 50']);

    // renaming the surrounding instance does not change the contained names
    await page.getByTestId('element-name').fill('Haupttrend');
    expect(await containedNames(page)).toEqual(['Schneller EMA', 'Trend H1 2 EMA 50']);
    await clickNode(page, 'Trend H1');
    expect(await containedNames(page)).toEqual(['Trend H1 EMA 20', 'Trend H1 EMA 50']);
    await page.getByTestId('element-name').fill('Erster Trend');
    expect(await containedNames(page)).toEqual(['Trend H1 EMA 20', 'Trend H1 EMA 50']);
    await clickNode(page, 'Haupttrend');
    expect(await containedNames(page)).toEqual(['Schneller EMA', 'Trend H1 2 EMA 50']);

    // third insertion: the instance is called "Trend H1" again, the proposals are taken, so a number is appended
    await tpl(page, 'Trend H1').click();
    await expect(page.getByTestId('element-name')).toHaveValue('Trend H1');
    expect(await containedNames(page)).toEqual(['Trend H1 EMA 20 2', 'Trend H1 EMA 50 2']);

    // the proposals made no name twice
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-box').filter({ hasText: 'Name doppelt vergeben' })).toHaveCount(0);
    await expect(card(page, 'Trend H1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('a rule set with two rules: the rules are named after the rule set', async ({ page }) => {
    await startWithCondition(page, 'Regelwerk');
    await tpl(page, 'Order-Check').click();
    await expect(page.getByTestId('props-rule')).toBeVisible();
    expect(await ruleNames(page)).toEqual(['Order-Check Mindestvolumen', 'Order-Check Stop-Loss gesetzt']);
    // a second one: the rule set is called "Order-Check 2"
    await tpl(page, 'Order-Check').click();
    await expect(page.getByTestId('props-rule').locator('.title-input input, input.title-input').first()).toHaveValue('Order-Check 2');
    expect(await ruleNames(page)).toEqual(['Order-Check 2 Mindestvolumen', 'Order-Check 2 Stop-Loss gesetzt']);
    // the user changes a name
    await page.getByTestId('props-rule').locator('.rule-head input').first().fill('Mindestmenge');
    expect(await ruleNames(page)).toEqual(['Mindestmenge', 'Order-Check 2 Stop-Loss gesetzt']);
  });

  test('the texts are in English, too', async ({ page }) => {
    await startWithCondition(page, 'Names');
    await page.getByTestId('menu-settings').click();
    await page.getByTestId('lang-en').click();
    await page.getByTestId('settings-apply').click();
    await tpl(page, 'Trend H1').click();
    await expect(props(page).getByTestId('own-includes')).toContainText('Contained indicators');
    expect(await containedNames(page)).toEqual(['Trend H1 EMA 20', 'Trend H1 EMA 50']);
  });
});

test.describe('one namespace for the whole strategy (req-fach-055, specification 3.3 and 3.6)', () => {
  test('contained instances and rules are chosen by their name in the blocks and the formula editor of the rest of the strategy', async ({ page }) => {
    await startWithCondition(page, 'Namensraum');
    await tpl(page, 'Trend H1').click();
    await tpl(page, 'Order-Check').click();
    await clickNode(page, 'Bedingung');

    // blocks: a contained instance, by its name
    await setCondition(page, { cmp: [{ pick: 'Trend H1 EMA 20 › Wert' }, '>', { num: 0 }] });
    await expect(page.getByTestId('expr-sentence')).toContainText('Trend H1 EMA 20');
    // a contained rule, by its name
    await lib(page, 'flow.condition').click();
    await setCondition(page, { truthy: { pick: 'Order-Check Mindestvolumen › Ergebnis' } });
    await expect(page.getByTestId('expr-sentence')).toContainText('Order-Check Mindestvolumen');

    // formula editor: after the name come the properties, the name itself is known
    await page.getByTestId('view-formula').click();
    const ta = page.getByTestId('formula-input');
    await expect(ta).toHaveValue(/\[Order-Check Mindestvolumen\]\.Ergebnis/);
    await ta.fill('[Trend H1 EMA 50].Wert > [Trend H1 EMA 20].Wert');
    await expect(page.getByTestId('formula-error')).toHaveCount(0);
    await ta.fill('[Trend H1 EMA 50].');
    await expect(page.getByTestId('formula-suggestions')).toContainText('Wert');
    await ta.fill('[Order-Check Stop-Loss gesetzt].Ergebnis');
    await expect(page.getByTestId('formula-error')).toHaveCount(0);
    await ta.fill('[Gibt es nicht].Wert > 1');
    await expect(page.getByTestId('formula-error')).toContainText('Unbekannter Name');
    await ta.fill('[Trend H1 EMA 50].Wert > [Trend H1 EMA 20].Wert');
    await page.getByTestId('view-blocks').click();

    // the check finds nothing wrong with the names or the expressions
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    const box = page.getByTestId('findings-box');
    await expect(box.filter({ hasText: 'Name doppelt vergeben' })).toHaveCount(0);
    await expect(box.filter({ hasText: 'Fehlerhafter Ausdruck' })).toHaveCount(0);
  });

  test('"Name doppelt vergeben" also for names in contained instances and rule sets', async ({ page }) => {
    await startWithCondition(page, 'Doppelt');
    await tpl(page, 'Trend H1').click();
    await tpl(page, 'Order-Check').click();
    const dup = (page: Page) => page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Name doppelt vergeben' });

    // two contained instances with one name
    await clickNode(page, 'Trend H1');
    await props(page).getByTestId('own-includes').locator('.own-row input').nth(1).fill('Trend H1 EMA 20');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(1);
    await expect(dup(page)).toContainText('Trend H1 EMA 20');
    await expect(dup(page)).toContainText('enthalten in „Trend H1“');
    await expect(dup(page)).toContainText('So beheben Sie es');
    // the jump leads to the instance that holds the name
    await dup(page).getByTestId('finding-goto').click();
    await expect(page.getByTestId('element-name')).toHaveValue('Trend H1');
    await props(page).getByTestId('own-includes').locator('.own-row input').nth(1).fill('Trend H1 EMA 50');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(0);

    // a contained instance with the name of an instance of the strategy
    await lib(page, 'EMA').click();
    await page.getByTestId('element-name').fill('Trend H1 EMA 20');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(1);
    await expect(dup(page)).toContainText('Trend H1 EMA 20');
    await clickNode(page, 'Trend H1 EMA 20');
    await page.getByTestId('element-name').fill('EMA Eigen');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(0);

    // a rule of a rule set with the name of the trend
    await page.getByTestId('status-pill').click();
    await page.getByTestId('sec-rules').getByTestId('rule-open').first().click();
    await page.getByTestId('props-rule').locator('.rule-head input').first().fill('Trend H1');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(1);
    await expect(dup(page)).toContainText('enthalten in „Order-Check“');
    await page.getByTestId('sec-rules').getByTestId('rule-open').first().click();
    await page.getByTestId('props-rule').locator('.rule-head input').first().fill('Order-Check Mindestvolumen');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup(page)).toHaveCount(0);
  });

  test('"Name doppelt vergeben" for a parameter of a rule with the name of an instance of the strategy', async ({ page }) => {
    await startWithCondition(page, 'Parameter');
    await lib(page, 'EMA').click();
    await page.getByTestId('element-name').fill('Schnell');
    await page.getByTestId('status-pill').click();
    const sec = page.getByTestId('sec-rules');
    await sec.getByTestId('rule-add-select').selectOption('__rule');
    const row = sec.locator('.rule-edit').last();
    await row.locator('summary').click();
    await row.getByRole('button', { name: /Parameter hinzufügen/ }).click();
    const name = row.getByTestId('rule-params').locator('.own-row input').first();
    await name.fill('Limit');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    const dup = page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Name doppelt vergeben' });
    await expect(dup).toHaveCount(0);
    await name.fill('Schnell');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup).toHaveCount(1);
    await expect(dup).toContainText('Parameter „Schnell“');
    await expect(dup).toContainText('ohne Punkt');
    await expect(dup).toContainText('So beheben Sie es');
    await name.fill('Limit');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(dup).toHaveCount(0);
  });
});

test.describe('an instance used only in an expression (req-ui-014, specification 3.3 and 3.6)', () => {
  test('it is not "without connection", even when only a later element uses it; it lies at the first element in the flow that uses it', async ({ page }) => {
    await startWithCondition(page, 'Nur im Ausdruck');
    // two conditions one after the other; the first one uses nothing
    await page.getByTestId('element-name').fill('Erste');
    await lib(page, 'flow.condition').click();
    await page.getByTestId('element-name').fill('Zweite');
    // the instance is dropped on free space, nothing connects it yet
    const viewport = page.getByTestId('viewport');
    const vb = (await viewport.boundingBox()) as { width: number };
    await lib(page, 'ATR').dragTo(viewport, { targetPosition: { x: Math.round(vb.width / 2) - 330, y: 120 } });
    await expect(page.locator('[data-testid="card"]').first().getByTestId('card-free')).toContainText('Noch nicht verbunden');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    const none = page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Instanz ohne Verbindung' });
    await expect(none).toHaveCount(1);
    // only the second condition names it, in its expression
    await clickNode(page, 'Zweite');
    await page.getByTestId('view-formula').click();
    await page.getByTestId('formula-input').fill('ATR.Wert > 1');
    await expect(page.getByTestId('formula-error')).toHaveCount(0);
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(none).toHaveCount(0);
    const w = page.locator('[data-testid="wire"][data-src="ATR"]');
    await expect(w).toHaveCount(1);
    await expect(w).toHaveAttribute('data-dst', 'Zweite');
    await expect(w).toHaveAttribute('data-first', '1');
    await expect(card(page, 'ATR').getByTestId('card-free')).toHaveCount(0);
    await clickNode(page, 'ATR');
    await expect(page.getByTestId('first-use-text')).toContainText('Zweite');

    // the first condition uses it, too: the instance moves to the first element in the flow that uses it (and the
    // later use is on a path through that element, so the check finds nothing)
    await clickNode(page, 'Erste');
    await page.getByTestId('view-formula').click();
    await page.getByTestId('formula-input').fill('ATR.Wert > 2');
    await page.getByTestId('menu-check').click();
    await page.getByTestId('status-pill').click();
    await expect(none).toHaveCount(0);
    await expect(page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Verwendung auf einem Weg' })).toHaveCount(0);
    await clickNode(page, 'ATR');
    await expect(page.getByTestId('first-use-text')).toContainText('Erste');
    const w2 = page.locator('[data-testid="wire"][data-src="ATR"][data-first="1"]');
    await expect(w2).toHaveCount(1);
    await expect(w2).toHaveAttribute('data-dst', 'Erste');
  });
});
