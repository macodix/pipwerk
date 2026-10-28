import type { Locator, Page } from '@playwright/test';

import { add, newStrategyFromScratch, select, setCalculation } from './builder';
import { boxOf, clickMenu, expect, openApp, SIZES, test } from './support';

// Specification 5.1 (E4): the lists of choices of the properties view and the settings are designed controls, not the
// lists of the browser. They work with the keyboard, have a name for assistive technology, and are reachable in all six
// window sizes without dragging. The tests run against the real backend.

test.use({ actionTimeout: 10_000 });

/** The page has no list of the browser at all. */
async function noNativeLists(page: Page): Promise<void> {
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('option')).toHaveCount(0);
}

async function noSidewaysScroll(page: Page): Promise<void> {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(wide, 'horizontal scroll bar').toBe(false);
}

/** The box lies completely inside the window. */
async function insideWindow(page: Page, locator: Locator, what: string): Promise<void> {
  const box = await boxOf(locator);
  const size = page.viewportSize();
  expect(box.x, `${what}: left`).toBeGreaterThanOrEqual(-0.5);
  expect(box.y, `${what}: top`).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width, `${what}: right`).toBeLessThanOrEqual((size?.width ?? 0) + 0.5);
  expect(box.y + box.height, `${what}: bottom`).toBeLessThanOrEqual((size?.height ?? 0) + 0.5);
}

for (const size of SIZES) {
  test(`the language list of the settings is a designed control with the keyboard and in the window (${size.width} x ${size.height})`, async ({ page }) => {
    await openApp(page, size);
    await clickMenu(page, 'settings');
    const dialog = page.getByRole('dialog');
    const field = dialog.getByLabel('Sprache');

    // a field of the interface, named by its label; no list of the browser
    await expect(field).toHaveAttribute('role', 'combobox');
    await expect(field).toHaveAttribute('aria-expanded', 'false');
    await noNativeLists(page);
    expect(await field.evaluate((element) => getComputedStyle(element).borderTopLeftRadius)).toBe('8px');
    expect(await field.evaluate((element) => getComputedStyle(element).appearance)).not.toBe('menulist');

    // it opens with a click: the list is a part of the interface (white, rounded, with a shadow), inside the window
    await field.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await expect(field).toHaveAttribute('aria-expanded', 'true');
    expect(await list.evaluate((element) => getComputedStyle(element).borderTopLeftRadius)).toBe('10px');
    expect(await list.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    expect(await list.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
    await insideWindow(page, list, 'list');
    await expect(list.getByRole('option')).toHaveText(['Deutsch', 'English']);
    for (const option of await list.getByRole('option').all()) {
      await insideWindow(page, option, 'option');
    }
    await noSidewaysScroll(page);

    // Escape closes the list and leaves the dialog open
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(field).toBeFocused();

    // the keyboard alone changes the language: arrow keys and Enter
    await page.keyboard.press('ArrowDown');
    await expect(list).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Settings');
    // back to German for the tests that follow
    await expect(dialog.getByLabel('Language')).toBeEnabled();
    await dialog.getByLabel('Language').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Einstellungen');
  });
}

for (const size of SIZES) {
  test(`the lists of the properties view are designed controls, reachable with the keyboard and with a click, also the long ones (${size.width} x ${size.height})`, async ({ page }) => {
    const name = `Auswahllisten ${size.name} ${test.info().project.name}`;
    await openApp(page, size);
    await newStrategyFromScratch(page, name);
    await add(page, 'Kerzenschluss');
    await add(page, 'EMA', 'EMA 20');
    await add(page, 'EMA', 'EMA 50');
    await add(page, 'Berechnung', 'Rechnung');
    await select(page, 'Rechnung');
    await noNativeLists(page);

    // the list of the values is long: it has a height limit, scrolls inside, and its last entry is reached with End
    const root = page.getByTestId('calc-root-select');
    await root.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await insideWindow(page, list, 'list');
    const scrolls = await list.evaluate((element) => element.scrollHeight > element.clientHeight);
    expect(scrolls, 'a long list scrolls inside itself').toBe(true);
    await noSidewaysScroll(page);
    await page.keyboard.press('End');
    const last = list.getByRole('option').last();
    await expect(last).toBeInViewport();
    await insideWindow(page, last, 'last entry');
    await expect(root).toHaveAttribute('aria-activedescendant', (await last.getAttribute('id')) ?? '');
    await page.keyboard.press('Home');
    await expect(list.getByRole('option').first()).toBeInViewport();

    // type-ahead and Enter choose; a click on the entry chooses as well
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await setCalculation(page, { pick: 'EMA 20 › Wert' });
    await expect(root).toContainText('EMA 20 › Wert');
    await root.focus();
    await page.keyboard.press('ArrowDown');
    await expect(list).toBeVisible();
    await page.keyboard.type('EMA 50');
    await page.keyboard.press('Enter');
    await expect(root).toContainText('EMA 50');
    await noNativeLists(page);
  });
}
