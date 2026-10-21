import { expect, openApp, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('the About dialog names the product, the revision, the license and the repository', async ({ page }) => {
  await page.getByTestId('menu-about').click();

  const dialog = page.getByTestId('dialog-about');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Über pipwerk replay' })).toBeVisible();
  await expect(dialog.getByText('pipwerk replay', { exact: true })).toBeVisible();
  // The revision comes from the build (commit and date of the commit).
  await expect(page.getByTestId('about-revision')).toHaveText(/^[0-9a-f]{40} vom \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr$/);
  await expect(dialog.getByText('GNU General Public License, Version 3')).toBeVisible();
  await expect(page.getByTestId('license-text')).toContainText('GNU GENERAL PUBLIC LICENSE');
  await expect(page.getByTestId('license-text')).toContainText('Version 3, 29 June 2007');
  const link = dialog.getByRole('link', { name: 'https://github.com/macodix/pipwerk' });
  await expect(link).toHaveAttribute('href', 'https://github.com/macodix/pipwerk');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('the About dialog locks the page, keeps the focus inside and gives it back', async ({ page }) => {
  const opener = page.getByTestId('menu-about');
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByTestId('dialog-about');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('about-close')).toBeFocused();
  expect(await page.evaluate(() => document.querySelector('dialog:modal') !== null)).toBe(true);

  // Tab goes round inside the dialog: license text, link, button, and again.
  const inside: boolean[] = [];
  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press('Tab');
    inside.push(await page.evaluate(() => document.querySelector('dialog[open]')?.contains(document.activeElement) === true));
  }
  expect(inside.every(Boolean)).toBe(true);
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => document.querySelector('dialog[open]')?.contains(document.activeElement) === true)).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('the footer shows the revision with its commit and date as an explanation', async ({ page }) => {
  const revision = page.getByTestId('revision');
  await expect(revision).toHaveText(/^Stand: [0-9a-f]{7}$/);

  await revision.hover();

  await expect(page.getByTestId('tooltip')).toHaveText(/^Commit [0-9a-f]{40} vom \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr$/);
  await page.mouse.move(0, 0);
  await revision.focus();
  await expect(page.getByTestId('tooltip')).toContainText('Commit ');
});

test('the footer shows when the backend is not reachable', async ({ page, stack }) => {
  await expect(page.getByTestId('footer')).toContainText('Backend: verbunden');

  await stack.stopBackend();
  await page.reload();

  await expect(page.getByTestId('footer')).toContainText('Backend: nicht erreichbar');
  await expect(page.getByTestId('footer').locator('.backend-status')).toHaveAttribute('data-state', 'unreachable');
  await expect(page.getByTestId('footer')).toContainText('Stand: unbekannt');
});
