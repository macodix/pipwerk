import { expect, openApp, test } from './fixtures';

// The built user interface starts without an error in the console, in every browser engine.
test('the built user interface starts without an error in the console', async ({ page, consoleProblems }) => {
  await openApp(page);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Datenbestand');
  await expect(page.getByTestId('data-bar')).toBeVisible();
  await expect(page.getByTestId('stock-empty')).toBeVisible();
  await expect(page.getByTestId('header')).toContainText('pipwerk replay');
  await expect(page.getByTestId('footer')).toContainText('Backend: verbunden');
  await expect(page.getByTestId('revision')).toContainText('Stand:');
  // Give late errors a moment (queries that end after the first display).
  await page.waitForTimeout(500);
  expect(consoleProblems).toEqual([]);
});

test('both views open without an error in the console', async ({ page, consoleProblems, isMobile }) => {
  await openApp(page);

  if (isMobile) {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('cmenu-accounts').click();
  } else {
    await page.getByTestId('menu-accounts').click();
  }
  await expect(page.getByTestId('accounts')).toBeVisible();
  await expect(page.getByTestId('account-name')).toHaveValue('Standard-Testkonto');
  await page.waitForTimeout(300);
  expect(consoleProblems).toEqual([]);
});
