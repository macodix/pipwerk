import { expect, test } from '@playwright/test';
import { openApp } from './support';

// Acceptance criterion 1: the built file opens from file:// without errors in the console
// (Chromium, Firefox, WebKit). A short walk through both modes makes sure that nothing fails later either.

test('the built file opens without errors in the console and runs a step', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.getByTestId('header')).toContainText('pipwerk replay');
  await expect(page.getByTestId('prepare')).toBeVisible();
  await page.getByTestId('select-strategy').selectOption('sample-str03');
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('run')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('btn-step').click();
  await expect(page.getByTestId('chart').first()).toBeVisible();
  await page.getByTestId('mode-backtest').click();
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('trade-row').first()).toBeVisible();
  expect(errors).toEqual([]);
});
