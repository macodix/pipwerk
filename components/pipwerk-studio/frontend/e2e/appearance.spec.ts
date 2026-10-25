import type { Locator, Page } from '@playwright/test';

import { boxOf, clickMenu, expect, library, openApp, openStrategy, showArea, SIZES, test } from './support';

// Order 07. B1: the guided setup has an appearance (specification 5.1, 5.5): the row of the five steps is a row of marks,
// the cards for the trigger and the buttons are designed controls with space between them, in all six window sizes and no
// horizontal scroll bar. B2: the delivered rule template is named and explained in the language of the interface.

async function style(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
}

/** The width of the page is not larger than the window: no horizontal scroll bar. */
async function noSidewaysScroll(page: Page): Promise<void> {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(wide, 'horizontal scroll bar').toBe(false);
}

/** Two boxes of the page do not touch: between them lies at least `space` pixels horizontally or vertically. */
async function spaced(first: Locator, second: Locator, space: number): Promise<void> {
  const a = await boxOf(first);
  const b = await boxOf(second);
  const horizontal = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
  const vertical = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
  expect(Math.max(horizontal, vertical), 'space between the controls').toBeGreaterThanOrEqual(space);
}

for (const size of SIZES) {
  test(`the guided setup is designed in ${size.width} x ${size.height}`, async ({ page }) => {
    await openApp(page, size);
    await clickMenu(page, 'new');
    await showArea(page, 'props');
    const wizard = page.getByTestId('wizard');
    await expect(wizard).toBeVisible();

    // the row of the five steps: marks without a list number of the browser, the current one highlighted
    const steps = wizard.locator('ol.steps');
    expect(await style(steps, 'list-style-type')).toBe('none');
    expect(await style(steps, 'display')).toBe('flex');
    await expect(steps.locator('li')).toHaveCount(5);
    const mark = steps.locator('li.on span');
    expect(await style(mark, 'background-color')).toBe('rgb(37, 99, 235)');
    expect(await style(mark, 'border-top-left-radius')).not.toBe('0px');
    expect(Math.round((await boxOf(mark)).width)).toBe(20);
    expect(await style(steps.locator('li').nth(1), 'list-style-type')).toBe('none');
    await spaced(steps.locator('li').nth(0), steps.locator('li').nth(1), 4);

    // step 1: the fields lie apart
    await expect(page.getByTestId('wz-step-1')).toBeVisible();
    await spaced(page.getByTestId('wz-name'), wizard.locator('.wz-body label.field').nth(1), 8);
    await noSidewaysScroll(page);

    // step 2: the cards for the trigger
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wz-step-2')).toBeVisible();
    const cards = page.getByTestId('wz-trigger');
    await expect(cards).toHaveCount(3);
    const first = cards.nth(0);
    expect(await style(first, 'border-top-style')).toBe('solid');
    expect(await style(first, 'border-top-left-radius')).toBe('12px');
    expect(await style(first, 'background-color')).toBe('rgb(255, 255, 255)');
    expect(await style(first, 'display')).toBe('flex');
    expect(await style(first, 'padding-top')).toBe('11px');
    expect(await style(first.locator('b'), 'font-weight')).toMatch(/^(700|bold)$/);
    await spaced(first, cards.nth(1), 8);
    await spaced(cards.nth(1), cards.nth(2), 8);
    await first.click();
    expect(await style(first, 'border-top-color')).toBe('rgb(37, 99, 235)');
    await noSidewaysScroll(page);
    for (let index = 0; index < 3; index += 1) {
      const box = await boxOf(cards.nth(index));
      expect(box.x + box.width).toBeLessThanOrEqual(size.width + 1);
    }

    // the buttons below: "Zurück", "Überspringen" and "Weiter" with space between them
    const back = page.getByTestId('wz-back');
    const skip = page.getByTestId('wz-skip');
    const next = page.getByTestId('wz-next');
    await expect(back).toBeVisible();
    await expect(skip).toBeVisible();
    await expect(next).toBeVisible();
    await spaced(back, skip, 6);
    await spaced(skip, next, 6);
    expect(await style(next, 'background-color')).not.toBe('rgb(239, 239, 239)');
    expect(await style(next, 'border-top-left-radius')).not.toBe('0px');
    expect(await style(page.locator('.wz-foot'), 'border-top-style')).toBe('solid');
    await noSidewaysScroll(page);
  });
}

test('the delivered rule template appears in English in the library and in the rules of the strategy', async ({ page }) => {
  await openApp(page);
  await clickMenu(page, 'settings');
  await page.getByRole('dialog').getByLabel('Sprache').selectOption('English');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  try {
    // the library: name and explanation
    const entry = library(page, 'Risk per trade');
    await expect(entry).toHaveCount(1);
    await expect(library(page, 'Risiko je Trade')).toHaveCount(0);
    await expect(entry).toHaveAttribute('data-tip', /^Limits the loss up to the stop loss/);

    // the strategy: the card of the rule and the list that adds a rule
    await openStrategy(page, 'EMA-Trendfolge');
    await showArea(page, 'canvas');
    await page.getByTestId('status-pill').click();
    await showArea(page, 'props');
    const origin = page.getByTestId('rule-card').first().getByTestId('instance-origin');
    await expect(origin).toContainText('Risk per trade');
    await expect(origin).not.toContainText('Risiko je Trade');
    const options = await page.getByTestId('rule-add-select').first().locator('option').allTextContents();
    expect(options.some((text) => text.includes('Risk per trade'))).toBe(true);
    expect(options.some((text) => text.includes('Risiko je Trade'))).toBe(false);
  } finally {
    await clickMenu(page, 'settings');
    await page.getByRole('dialog').getByLabel('Language').selectOption('Deutsch');
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByTestId('param-strip')).toContainText('Strategieparameter');
  }
});
