import type { Page } from '@playwright/test';

import { add, createParam, exprRoot, newStrategyFromScratch, select } from './builder';
import { choose, clickMenu, expect, node, openApp, openStrategy, showArea, SIZES, test } from './support';

// Order 16 (acceptance report 3): the name of the order and position management (E1), no guided setup (E9), the list of
// findings after a click on their number (E2, B1), the strip of the strategy parameters without sideways swiping (B2),
// no name of a program library on the drawing area (B3) and the stored directory after "Abbrechen" (B4). They run
// against the real backend.

test.use({ actionTimeout: 10_000 });

/** The visible text of the whole page. */
async function pageText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

/** The short form of the name: the word without "Order- und Positions" in front of it. */
const SHORT_FORM = /(?<!Positions)[Vv]erwaltung/;

test('the part of the flow at "gestellt" is called "Order- und Positionsverwaltung" everywhere, never by a short form (E1)', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');

  // the frame on the drawing area, its toggle and the legend
  await expect(page.getByTestId('frame')).toContainText('Order- und Positionsverwaltung · Order aufgeben');
  await expect(page.getByTestId('frame-toggle')).toHaveAccessibleName('Order- und Positionsverwaltung einklappen');
  expect(await pageText(page)).not.toMatch(SHORT_FORM);

  // the properties view of the step that places the order and of the frame
  await select(page, 'Order aufgeben');
  expect(await pageText(page)).not.toMatch(SHORT_FORM);
  await page.getByTestId('frame').click({ position: { x: 20, y: 10 } });
  await expect(page.getByTestId('props-frame')).toContainText('Order- und Positionsverwaltung');
  expect(await pageText(page)).not.toMatch(SHORT_FORM);

  // the check names the same words
  await clickMenu(page, 'check');
  await page.getByTestId('findings-count').click();
  expect(await pageText(page)).not.toMatch(SHORT_FORM);
});

test('"Neue Strategie" opens an empty drawing area without a guided setup, with the hint that a trigger comes first (E9, E6)', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await clickMenu(page, 'new');
  await showArea(page, 'props');

  const hint = page.getByTestId('empty-strategy-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Beginnen Sie mit einem Auslöser');
  await expect(hint).toContainText('das Ereignis, das die Strategie startet');
  await expect(hint).toContainText('Ablaufsteuerung');
  expect(await hint.innerText()).not.toMatch(/rechn/);
  expect(await pageText(page)).not.toMatch(/Assist/i);
  await showArea(page, 'canvas');
  await expect(page.getByTestId('node')).toHaveCount(0);
  await expect(page.getByTestId('canvas')).toBeVisible();
});

test('the sentence of a condition is the one of its new kind after the kind changes, in both directions, and never the old sentence with the new one behind it (E13)', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await newStrategyFromScratch(page, `Art der Bedingung ${test.info().project.name}`);
  await add(page, 'Kerzenschluss');
  await add(page, 'Bedingung', 'Erste');
  await add(page, 'Bedingung', 'Zweite');

  const kind = exprRoot(page).locator('.cb-kind > .select > .select-trigger').first();
  const sentence = exprRoot(page).getByTestId('expr-sentence');
  /** Chooses the kind and returns the sentence once it has changed to the one of the kind. */
  const change = async (to: string): Promise<string> => {
    const before = await sentence.innerText();
    await choose(kind, { value: to });
    await expect(sentence).not.toHaveText(before);
    // the answer of the backend for the new expression has arrived when the text stays the same
    let last = '';
    await expect
      .poll(async () => {
        const now = await sentence.innerText();
        const stable = now === last;
        last = now;
        return stable;
      })
      .toBe(true);
    return sentence.innerText();
  };

  // "Zweite" (the one selected last): a condition that is new, changes to "Alle gelten (und)" and to "Nicht", each from the comparison
  const freshAnd = await change('and');
  await expect(exprRoot(page).locator('.cb-item')).toHaveCount(2);
  const notAfterAnd = await change('not');
  // from "Nicht" back to "und": the same as from the comparison, nothing of the old kind stays behind
  const andAfterNot = await change('and');
  expect(andAfterNot).toBe(freshAnd);
  await expect(exprRoot(page).locator('.cb-item')).toHaveCount(2);
  await expect(exprRoot(page).locator('.cb-item .cb-kind .select-trigger')).toHaveText(['Vergleich', 'Vergleich']);

  // "Erste": "Nicht" straight from the comparison reads as "Nicht" after "und" does
  await select(page, 'Erste');
  const notFresh = await change('not');
  expect(notAfterAnd).toBe(notFresh);
  // "or" starts new as well from "Nicht", and "und" takes the parts of "oder" along
  const orKind = await change('or');
  expect(orKind).not.toBe(notFresh);
  const andAgain = await change('and');
  expect(andAgain).toBe(freshAnd);
});

for (const size of SIZES) {
  test(`the number of findings is there for a new strategy, and a click shows the list in the properties view (${size.width} x ${size.height})`, async ({ page }) => {
    await openApp(page, size);
    await clickMenu(page, 'new');
    // B1: without "Prüfen"
    const count = page.getByTestId('findings-count');
    await expect(count).toBeVisible();
    await expect(count).toContainText('Befund');
    await expect(count).not.toContainText('keine');

    // E2: from the drawing area, a click leads to the list and the list is in view, not covered
    await showArea(page, 'canvas');
    await count.click();
    const section = page.getByTestId('sec-findings');
    await expect(section).toBeVisible();
    const finding = section.getByTestId('finding').first();
    // in a window of 390 pixels height the properties view itself is only about 100 pixels high: the finding is then
    // in view as far as the view reaches, below the heading of the section
    await expect(section.getByRole('heading')).toBeInViewport({ ratio: 1 });
    await expect(finding).toBeInViewport({ ratio: size.height < 500 ? 0.3 : 1 });
    const covered = await finding.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return top === null || !element.contains(top);
    });
    expect(covered, 'the finding is covered by another element').toBe(false);
    await expect(finding).toContainText('Hauptablauf ohne Auslöser');
  });
}

test('the strip of the strategy parameters wraps in 390 x 844: "Neu" and every parameter are reachable without swiping sideways (B2)', async ({ page }) => {
  const name = `Streifen ${test.info().project.name}`;
  await openApp(page, SIZES[0]);
  await newStrategyFromScratch(page, name);
  for (const parameter of ['Erster Parameter', 'Zweiter längerer Parameter', 'Dritter', 'Vierter Parameter mit langem Namen']) {
    await createParam(page, parameter, 'number', '3');
  }
  await showArea(page, 'canvas');

  const strip = page.getByTestId('param-strip');
  const wide = await strip.evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(wide, 'the strip scrolls sideways').toBe(false);
  for (const chip of await strip.locator('.chip').all()) {
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? -1) >= 0).toBe(true);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(SIZES[0].width + 1);
  }
  await expect(page.getByTestId('param-chip')).toHaveCount(4);
  await expect(page.getByTestId('param-new')).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  // the last parameter can be opened with a tap, and "Neu" still works
  await page.getByTestId('param-chip').last().click();
  await expect(page.getByTestId('param-popover')).toBeVisible();
  await page.getByTestId('param-done').click();
  await page.getByTestId('param-new').click();
  await expect(page.getByTestId('param-popover')).toBeVisible();
});

test('the drawing area names no program library and stays operable (B3)', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await openStrategy(page, 'EMA-Trendfolge');

  const canvas = page.getByTestId('canvas');
  expect(await canvas.innerText()).not.toMatch(/React ?Flow/i);
  expect(await pageText(page)).not.toMatch(/React ?Flow/i);
  // zooming and fitting still work
  const before = (await canvas.getAttribute('data-view')) ?? '';
  await page.getByTestId('zoom-out').click();
  await expect.poll(async () => (await canvas.getAttribute('data-view')) ?? '').not.toBe(before);
  await page.getByTestId('zoom-fit').click();
  await expect(node(page, 'Order aufgeben')).toBeVisible();
});
