import { expect, test } from '@playwright/test';
import { openApp } from './support';

// Acceptance criterion 1: the built file opens from file:// without errors in the console.
test('the built file opens from file:// without console errors and shows the strategy of the client', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
  await expect(page.getByTestId('canvas')).toBeVisible();
  await expect(page.getByTestId('library')).toBeVisible();
  await expect(page.getByTestId('props')).toBeVisible();
  await expect(page.getByTestId('param-strip')).toBeVisible();
  await expect(page.locator('[data-testid="node"]').first()).toBeVisible();
  // use the page a little: open the about dialog and the settings, switch the language and back
  await page.getByTestId('menu-about').click();
  await expect(page.getByTestId('dialog-about')).toBeVisible();
  await expect(page.getByTestId('license-text')).toContainText('GNU GENERAL PUBLIC LICENSE');
  await page.getByTestId('about-close').click();
  await page.getByTestId('menu-settings').click();
  await page.getByTestId('lang-en').click();
  await page.getByTestId('settings-apply').click();
  await expect(page.getByTestId('menu-save')).toContainText('Save');
  await page.getByTestId('menu-settings').click();
  await page.getByTestId('lang-de').click();
  await page.getByTestId('settings-apply').click();
  await expect(page.getByTestId('menu-save')).toContainText('Speichern');
  expect(errors).toEqual([]);
});
