import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, STR01, STR03, chooseStrategy, jumpUntil, openApp, runBacktest, startSingle, stepUntil } from './support';

// Acceptance criterion 4: screenshots. The single-step test of str-01 and the result of the backtest of
// str-03 in all six window sizes (for the small sizes, where the areas follow one another, one image per
// area), in 1366 x 768 in addition: preparation, price data check with fetching, message for data that cannot
// be fetched, data stock with import, rejected order at the element, comparison of saved backtests.

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
const shot = (page: Page, name: string) => page.screenshot({ path: join(out, `${name}.png`) });
const settle = (page: Page) => page.waitForTimeout(350);
/** Clicks the first visible tab of the list, if there is one. */
async function tab(page: Page, ...ids: string[]): Promise<void> {
  for (const id of ids) {
    const b = page.locator(`[data-testid="${id}"]:visible`).first();
    if (await b.count()) { await b.click(); return; }
  }
}

for (const size of SIZES) {
  const tag = `${size.width}x${size.height}`;
  const compact = size.width < 1500;
  const narrow = size.width < 1100;

  test(`single-step test of str-01 in ${tag}`, async ({ page }) => {
    await openApp(page, { width: size.width, height: size.height });
    await startSingle(page, STR01);
    await settle(page);
    await shot(page, `einzelschritt-str01-${tag}`);
    if (narrow) {
      await tab(page, 'bar-charts');
      await settle(page);
      await shot(page, `einzelschritt-str01-${tag}-chart`);
      await tab(page, 'bar-values');
      await settle(page);
      await shot(page, `einzelschritt-str01-${tag}-werte`);
      await tab(page, 'bar-flow');
    }
    if (compact) {
      // an element is selected: its properties with the values of the step
      await page.getByTestId('btn-step').click();
      await page.getByTestId('btn-step').click();
      await page.locator('[data-testid="node"]').nth(1).click({ position: { x: 44, y: 14 }, force: true });
      await page.mouse.move(2, 2);
      await settle(page);
      await shot(page, `einzelschritt-str01-${tag}-eigenschaften`);
    }
  });

  test(`result of the backtest of str-03 in ${tag}`, async ({ page }) => {
    await openApp(page, { width: size.width, height: size.height });
    await runBacktest(page, STR03);
    await tab(page, 'bar-trades');
    await page.getByTestId('trade-row').nth(1).click();
    await tab(page, 'bar-summary');
    await settle(page);
    await shot(page, `backtest-ergebnis-str03-${tag}`);
    if (narrow) {
      for (const [id, name] of [['curve', 'kurve'], ['trades', 'trades'], ['chart', 'chart']] as const) {
        await page.getByTestId(`bar-${id}`).click();
        await settle(page);
        await shot(page, `backtest-ergebnis-str03-${tag}-${name}`);
      }
    }
  });
}

test('1366 x 768: preparation of the test run', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await settle(page);
  await shot(page, 'vorbereitung-1366x768');
});

test('1366 x 768: price data check with fetching', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await page.getByTestId('mode-backtest').click();
  await chooseStrategy(page, STR01);
  await page.getByTestId('start-test').click();
  await page.getByTestId('fetch-progress').first().waitFor();
  await page.waitForTimeout(260);
  await shot(page, 'kursdaten-pruefung-beschaffung-1366x768');
});

test('1366 x 768: message for data that cannot be fetched', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await chooseStrategy(page, STR01);
  await page.getByTestId('select-instrument').selectOption('USDJPY');
  await page.getByTestId('start-test').click();
  await page.getByTestId('blocked-message').waitFor();
  await page.waitForTimeout(700);
  await shot(page, 'kursdaten-nicht-beschaffbar-1366x768');
});

test('1366 x 768: data stock with import', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await page.getByTestId('menu-data').click();
  await page.getByTestId('import-sample').click();
  await page.getByTestId('import-run').click();
  await page.getByTestId('import-result').scrollIntoViewIfNeeded();
  await page.getByTestId('import-card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, 'datenbestand-import-1366x768');
});

test('1366 x 768: rejected order at the element', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await startSingle(page, STR01);
  await jumpUntil(page, 'eval-reject');
  await stepUntil(page, async () => (await page.locator('[data-testid="node"][data-rejected="1"]').count()) > 0);
  await page.locator('[data-testid="node"][data-rejected="1"]').first().click({ position: { x: 40, y: 20 } });
  await page.mouse.move(2, 2);
  await settle(page);
  await shot(page, 'abgelehnte-order-1366x768');
});

test('1366 x 768: comparison of saved backtests', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  await runBacktest(page, STR03);
  await page.getByTestId('btn-save-bt').click();
  await page.getByTestId('save-bt-name').fill('str-03 Stop-Abstand 2');
  await page.getByTestId('save-bt-ok').click();
  await page.getByTestId('btn-back').click();
  await page.getByTestId('param-p-stop').fill('3');
  await page.getByTestId('start-test').click();
  await page.getByTestId('result').waitFor({ timeout: 120_000 });
  await page.getByTestId('btn-save-bt').click();
  await page.getByTestId('save-bt-name').fill('str-03 Stop-Abstand 3');
  await page.getByTestId('save-bt-ok').click();
  await page.getByTestId('menu-saved').click();
  await page.getByTestId('saved-check').nth(0).check();
  await page.getByTestId('saved-check').nth(1).check();
  await page.getByTestId('btn-compare').click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(5000);
  await shot(page, 'vergleich-backtests-1366x768');
});
