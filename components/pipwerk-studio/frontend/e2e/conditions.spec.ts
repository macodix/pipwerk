import type { Locator, Page } from '@playwright/test';

import { exprRoot, props, select } from './builder';
import { choose, clickMenu, expect, offered, openApp, openStrategy, showArea, SIZES, test } from './support';

// Order 21 (fix after the fourth acceptance): F2 name of the strategy, F7 "Verwendete Werte", F9 remove a part of a
// condition, F10 change of the kind of a condition, F11 labels. They run against the real backend and its answers.

test.use({ actionTimeout: 10_000 });

/** The visible text of the whole page. */
async function pageText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

/** The field "Was soll geprüft werden?" at the top of the condition of the selected element. */
const kindOf = (page: Page): Locator => exprRoot(page).locator(':scope > .cb > .cb-kind > .select > .select-trigger');

/** Waits until the editor of the expression has nothing on its way. */
async function idle(page: Page): Promise<void> {
  await expect(exprRoot(page)).toHaveAttribute('data-pending', 'false');
}

for (const size of SIZES) {
  test(`F2: the name of a new strategy is an empty input with the label "Name der Strategie" and a grey hint that goes with the first character (${size.width} x ${size.height})`, async ({ page }) => {
    await openApp(page, size);
    await clickMenu(page, 'new');
    await showArea(page, 'props');

    const view = page.getByTestId('props-strategy');
    await expect(view.getByRole('heading', { name: 'Strategie', exact: true })).toBeVisible();
    await expect(view.getByRole('heading', { name: 'Name der Strategie', exact: true })).toBeVisible();
    const name = page.getByTestId('strategy-name');
    await expect(name).toBeVisible();
    await expect(name).toHaveValue('');
    await expect(name).toHaveAttribute('placeholder', 'Name eingeben');
    // the hint is shown while the field is empty: the grey text of the browser
    expect(await name.evaluate((input) => input.matches(':placeholder-shown'))).toBe(true);
    // it looks like an input, like the description, and not like a heading
    const look = async (locator: Locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return { border: style.borderTopWidth, background: style.backgroundColor, radius: style.borderTopLeftRadius, size: style.fontSize };
      });
    const description = page.getByTestId('strategy-description');
    const nameLook = await look(name);
    const descriptionLook = await look(description);
    expect(nameLook.border).not.toBe('0px');
    expect(nameLook.border).toBe(descriptionLook.border);
    expect(nameLook.radius).toBe(descriptionLook.radius);
    expect(nameLook.size).toBe(descriptionLook.size);

    await name.pressSequentially('M');
    expect(await name.evaluate((input) => input.matches(':placeholder-shown'))).toBe(false);
    await expect(page.getByTestId('status-pill')).toContainText('M');
  });
}

test('F7: no element shows the old paragraphs of "Verwendete Werte"; an element that can use no value shows one sentence or nothing', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');

  const shown: Record<string, string> = {};
  for (const name of ['Kerzenschluss', 'Kreuzen', 'Richtung', 'StopLoss', 'Order aufgeben', 'Position schließen', 'Position ändern']) {
    await select(page, name);
    await expect(page.getByTestId('element-name')).toHaveValue(name);
    // the report of the use has arrived (the interface asks for it a short time after the last change)
    await expect(page.getByTestId('canvas')).toHaveAttribute('data-usage', 'report');
    const section = page.getByTestId('sec-used');
    const text = (await section.count()) === 0 ? '' : ((await section.innerText()) ?? '');
    shown[name] = text;
    expect(text, name).not.toContain('kein Objekt verwendbar');
    expect(text, name).not.toContain('Dieses Element verwendet noch keinen Wert');
    expect(text, name).not.toContain('Legen Sie dafür ein weiteres Objekt');
    // at most one sentence of the kind "Weitere Objekte lassen sich hier erst verwenden …" and at most one note
    expect(await section.locator('p').count(), name).toBeLessThanOrEqual(3);
  }
  // the trigger starts the flow: no object is determined before it, so it shows no further object to connect
  await select(page, 'Kerzenschluss');
  await expect(page.getByTestId('used-add')).toHaveCount(0);
});

test('F9: every part of "oder" and "und" has "Entfernen"; the rest stays, and the last part leaves a blank one', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await select(page, 'Kreuzen');
  const root = exprRoot(page);
  await idle(page);

  const removes = root.getByTestId('cond-remove');
  // "oder" of two times "und" of two comparisons: two parts at the top and two in each "und"
  await expect(removes).toHaveCount(6);
  await expect(removes.first()).toHaveText('Entfernen');
  await expect(removes.first()).toHaveAttribute('data-tip', /Die übrigen bleiben erhalten/);
  // reachable by keyboard
  await removes.first().focus();
  await expect(removes.first()).toBeFocused();
  await expect(root.getByTestId('cmp-op')).toHaveCount(4);

  // the first comparison of the first "und" goes; the other three stay
  await page.keyboard.press('Enter');
  await expect(root.getByTestId('cmp-op')).toHaveCount(3);
  await expect(removes).toHaveCount(5);
  await idle(page);

  // the last part of the first "und": a blank comparison takes its place, the condition can be edited
  await removes.first().click();
  await expect(root.getByTestId('cmp-op')).toHaveCount(3);
  await expect(root.getByTestId('cmp-left-select').first()).toContainText('Wert wählen …');
  await expect(root.getByTestId('expr-bad')).toHaveCount(0);
  await expect(root.getByTestId('expr-failed')).toHaveCount(0);
  await choose(root.getByTestId('cmp-left-select').first(), { label: 'EMA20 › Wert' });
  await expect(root.getByTestId('cmp-left-select').first()).not.toContainText('Wert wählen …');
});

test('F10: a comparison becomes the first part of "und"; a change that would lose entries asks first; "Abbrechen" changes nothing', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');

  // a comparison with values: "Order ausgefuehrt" in the order and position management
  await select(page, 'Order ausgefuehrt');
  await idle(page);
  await expect(kindOf(page)).toHaveText('Zwei Werte vergleichen');
  const left = exprRoot(page).getByTestId('cmp-left-select').first();
  const before = await left.innerText();
  await choose(kindOf(page), 'Alle Bedingungen müssen gelten (und)');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(exprRoot(page).getByTestId('cond-block')).toHaveCount(3);
  await expect(exprRoot(page).getByTestId('cmp-left-select').first()).toHaveText(before);
  await expect(exprRoot(page).getByTestId('cmp-left-select').nth(1)).toContainText('Wert wählen …');

  // "und" with a value in the first part to "Zwei Werte vergleichen" loses entries: the question
  await idle(page);
  await choose(kindOf(page), 'Zwei Werte vergleichen');
  const dialog = page.getByRole('dialog', { name: 'Andere Prüfung wählen?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Dabei gehen die Eingaben dieser Bedingung verloren. Trotzdem wechseln?');
  await expect(dialog.getByRole('button')).toHaveText(['Abbrechen', 'Wechseln']);
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(kindOf(page)).toHaveText('Alle Bedingungen müssen gelten (und)');
  await expect(exprRoot(page).getByTestId('cmp-left-select').first()).toHaveText(before);

  // "Wechseln": the new kind is blank
  await choose(kindOf(page), 'Zwei Werte vergleichen');
  await page.getByRole('dialog', { name: 'Andere Prüfung wählen?' }).getByRole('button', { name: 'Wechseln' }).click();
  await expect(kindOf(page)).toHaveText('Zwei Werte vergleichen');
  await expect(exprRoot(page).getByTestId('cmp-left-select')).toContainText('Wert wählen …');

  // a condition without entries changes without a question
  await choose(kindOf(page), 'Eine Bedingung umkehren (nicht)');
  await choose(kindOf(page), 'Prüfen, ob ein Wert wahr ist');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('F11: the condition asks "Was soll geprüft werden?" and answers in whole words; the formula is called "Formel"', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await select(page, 'Kreuzen');
  await idle(page);

  await expect(exprRoot(page).getByLabel('Was soll geprüft werden?').first()).toBeVisible();
  expect(await offered(kindOf(page))).toEqual([
    'Zwei Werte vergleichen',
    'Alle Bedingungen müssen gelten (und)',
    'Mindestens eine Bedingung muss gelten (oder)',
    'Eine Bedingung umkehren (nicht)',
    'Prüfen, ob ein Wert wahr ist',
  ]);
  // the heading of the field of the formula, on the properties view
  const section = props(page).getByTestId('sec-ausdruck');
  await expect(section.getByRole('heading', { name: 'Formel', exact: true })).toBeVisible();
  expect(await section.innerText()).not.toContain('Ausdruck');
  expect(await pageText(page)).not.toMatch(/\bAusdruck\b/);

  // in English
  await clickMenu(page, 'settings');
  await choose(page.getByRole('dialog').getByLabel('Sprache'), 'English');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  try {
    await showArea(page, 'props');
    await expect(exprRoot(page).getByLabel('What should be checked?').first()).toBeVisible();
    await expect(kindOf(page)).toHaveText('At least one condition must hold (or)');
    await expect(props(page).getByTestId('sec-ausdruck').getByRole('heading', { name: 'Formula', exact: true })).toBeVisible();
    expect(await pageText(page)).not.toMatch(/\bExpression\b/);
  } finally {
    await clickMenu(page, 'settings');
    await choose(page.getByRole('dialog').getByLabel('Language'), 'Deutsch');
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
  }
});
