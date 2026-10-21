import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const BUILT = pathToFileURL(join(here, '..', 'dist', 'pipwerk-replay-prototyp.html')).href;

export const SIZES = [
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet-portrait', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1180, height: 820 },
  { name: 'notebook', width: 1366, height: 768 },
  { name: 'large', width: 1920, height: 1080 },
] as const;

/** Values of the strategy selection. */
export const STR01 = 'sample-str01';
export const STR03 = 'sample-str03';
export const CLIENT = 'sample-auftraggeber';
export const EXAMPLE = 'sample-beispiel';

/** Opens the built file with empty storage and collects console errors. */
export async function openApp(page: Page, size = { width: 1366, height: 768 }): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setViewportSize(size);
  await page.goto(BUILT);
  await page.evaluate(() => { try { window.localStorage.clear(); } catch { /* ignore */ } });
  await page.goto(BUILT);
  await expect(page.getByTestId('app')).toBeVisible();
  return errors;
}

export const node = (page: Page, name: string): Locator => page.locator(`[data-testid="node"][data-node-name="${name}"]`);
export const nowNode = (page: Page): Locator => page.locator('[data-testid="node"][data-now="1"]');

/** Chooses a strategy in the preparation. */
export async function chooseStrategy(page: Page, value: string): Promise<void> {
  await page.getByTestId('select-strategy').selectOption(value);
}

/** Starts the single-step test of a strategy; it holds at the first acting place. */
export async function startSingle(page: Page, strategy: string): Promise<void> {
  await chooseStrategy(page, strategy);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 60_000 });
}

/** Runs a backtest from the preparation and waits for the result. */
export async function runBacktest(page: Page, strategy: string): Promise<void> {
  await page.getByTestId('mode-backtest').click();
  await chooseStrategy(page, strategy);
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
}

/** Jumps from acting place to acting place until the evaluation has the marker, at most `max` times. */
export async function jumpUntil(page: Page, testid: string, max = 80): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await page.getByTestId(testid).count()) return;
    await page.getByTestId('btn-jump').click();
  }
  throw new Error(`no ${testid} after ${max} jumps`);
}

/** Single steps until the condition holds. */
export async function stepUntil(page: Page, check: () => Promise<boolean>, max = 30): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await check()) return;
    await page.getByTestId('btn-step').click();
  }
  throw new Error(`condition not reached after ${max} steps`);
}
