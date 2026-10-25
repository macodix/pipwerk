import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, openApp, test } from './support';

const frontendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The license text is the file LICENSE in the root directory of the repository.
const licenseText = readFileSync(resolve(frontendDirectory, '../../../LICENSE'), 'utf-8');

// The address of the repository stands only in package.json.
const repositoryUrl = (
  JSON.parse(readFileSync(resolve(frontendDirectory, 'package.json'), 'utf-8')) as {
    repository: { url: string };
  }
).repository.url;

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('shows the status of the backend and the revision in the footer', async ({ page, errors }) => {
  const footer = page.getByTestId('footer');

  await expect(footer.getByRole('status')).toHaveText('Backend: verbunden');
  await expect(footer.locator('.studio-revision')).toContainText(/^Stand: /);
  expect(errors).toEqual([]);
});

test('opens the About dialog with its content and the original license text, and closes it again', async ({ page }) => {
  const button = page.getByTestId('menu-about');
  await button.click();

  const dialog = page.getByRole('dialog', { name: 'Über pipwerk Studio' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('pipwerk Studio', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Stand', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Lizenz', { exact: true })).toBeVisible();
  await expect(dialog.getByText('GNU General Public License, Version 3')).toBeVisible();
  expect(await dialog.locator('pre').evaluate((element) => element.textContent)).toBe(licenseText);
  await expect(dialog.getByRole('link', { name: repositoryUrl })).toHaveAttribute('target', '_blank');
  await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('keeps the focus in the open dialog and does not close it by a click beside it', async ({ page }) => {
  await page.getByTestId('menu-about').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Schließen' })).toBeFocused();

  const keys = [...Array<string>(6).fill('Tab'), ...Array<string>(6).fill('Shift+Tab')];
  for (const key of keys) {
    await page.keyboard.press(key);
    const inDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const modal = document.querySelector('dialog[open]');
      return modal !== null && active !== modal && modal.contains(active);
    });
    expect(inDialog, `after ${key}`).toBe(true);
  }

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await page.mouse.click(3, 3);
  await page.mouse.click(viewport!.width - 3, viewport!.height - 3);
  await expect(dialog).toBeVisible();
});

test('makes no request to another address while the dialog is open', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
      foreign.push(request.url());
    }
  });

  await page.getByTestId('menu-about').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(500);

  expect(foreign).toEqual([]);
});
