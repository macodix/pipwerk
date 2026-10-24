import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chooseView, expect, getFileSettings, openApp, test } from './fixtures';

// The view "Einstellungen" (specification 5.7) against the real backend: saving the four values,
// reopening, the refusal of a directory with its reason (the backend checks the directories).

test('shows the defaults, saves all four values and shows them again after a reload and a restart', async ({
  page,
  stack,
}) => {
  const storage = join(stack.filesRoot, 'storage-new');
  const imports = stack.makeDirectory('in');
  const exports = join(stack.filesRoot, 'out', 'deeper');
  await openApp(page);
  await chooseView(page, 'settings');

  // Nothing is stored: the default of the operating system is shown for each directory.
  const initial = await getFileSettings(stack.backendUrl);
  expect(initial.keep_imported_files).toBe(false);
  for (const [key, field] of [
    ['storage', initial.storage_directory],
    ['import', initial.import_directory],
    ['export', initial.export_directory],
  ] as const) {
    expect(field.is_default).toBe(true);
    await expect(page.getByTestId(`settings-${key}-origin`)).toContainText(
      field.path === null ? 'kein Pfad' : 'Es gilt der Standard des Betriebssystems.',
    );
    await expect(page.getByTestId(`settings-${key}`)).toHaveValue(field.path ?? '');
  }
  await expect(page.getByTestId('settings-keep')).not.toBeChecked();
  await expect(page.getByTestId('settings-save')).toBeDisabled();

  await page.getByTestId('settings-keep').check();
  await page.getByTestId('settings-storage').fill(storage);
  await page.getByTestId('settings-import').fill(imports);
  await page.getByTestId('settings-export').fill(exports);
  await page.getByTestId('settings-save').click();

  await expect(page.getByTestId('settings-saved')).toBeVisible();
  const stored = await getFileSettings(stack.backendUrl);
  expect(stored).toEqual({
    keep_imported_files: true,
    storage_directory: { path: storage, is_default: false },
    import_directory: { path: imports, is_default: false },
    export_directory: { path: exports, is_default: false },
  });
  // The backend made the directories that did not exist (it checks that they can be written).
  expect(existsSync(storage)).toBe(true);
  expect(existsSync(exports)).toBe(true);
  await expect(page.getByTestId('settings-storage-origin')).toContainText('Gespeicherter Pfad.');

  // Reopening: after a reload, and after the backend was started again.
  await page.reload();
  await chooseView(page, 'settings');
  await expect(page.getByTestId('settings-keep')).toBeChecked();
  await expect(page.getByTestId('settings-storage')).toHaveValue(storage);
  await expect(page.getByTestId('settings-import')).toHaveValue(imports);
  await expect(page.getByTestId('settings-export')).toHaveValue(exports);
  await stack.restartBackend();
  await page.reload();
  await chooseView(page, 'settings');
  await expect(page.getByTestId('settings-import')).toHaveValue(imports);
  await expect(page.getByTestId('settings-keep')).toBeChecked();
});

test('emptying a directory brings back the default', async ({ page, stack }) => {
  const storage = stack.makeDirectory('storage');
  await openApp(page);
  await chooseView(page, 'settings');
  await page.getByTestId('settings-storage').fill(storage);
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-saved')).toBeVisible();
  expect((await getFileSettings(stack.backendUrl)).storage_directory).toEqual({ path: storage, is_default: false });

  await page.getByTestId('settings-storage').fill('');
  await page.getByTestId('settings-save').click();

  await expect(page.getByTestId('settings-saved')).toBeVisible();
  expect((await getFileSettings(stack.backendUrl)).storage_directory.is_default).toBe(true);
  await expect(page.getByTestId('settings-storage-origin')).toContainText('Standard');
});

test('refuses a relative path with its reason, keeps the input and saves nothing', async ({ page, stack }) => {
  const imports = stack.makeDirectory('in');
  await openApp(page);
  await chooseView(page, 'settings');
  const before = await getFileSettings(stack.backendUrl);
  await page.getByTestId('settings-import').fill('relative/path');
  await page.getByTestId('settings-export').fill(imports);

  await page.getByTestId('settings-save').click();

  const error = page.getByTestId('settings-import-error');
  await expect(error).toBeVisible();
  await expect(error).toHaveAttribute('data-reason', 'not_absolute');
  await expect(error).toContainText('Der Pfad ist nicht vollständig.');
  await expect(error).toContainText('Nächster Schritt:');
  await expect(page.getByTestId('settings-refused')).toBeVisible();
  // The input stays, also the valid one; the backend holds the old values (nothing is saved).
  await expect(page.getByTestId('settings-import')).toHaveValue('relative/path');
  await expect(page.getByTestId('settings-export')).toHaveValue(imports);
  await expect(page.getByTestId('settings-saved')).toHaveCount(0);
  expect(await getFileSettings(stack.backendUrl)).toEqual(before);
});

test('refuses a path that is a file and a path below a file, each with its reason', async ({ page, stack }) => {
  const file = join(stack.makeDirectory('plain'), 'a-file.txt');
  writeFileSync(file, 'x');
  await openApp(page);
  await chooseView(page, 'settings');
  await page.getByTestId('settings-storage').fill(file);
  await page.getByTestId('settings-export').fill(join(file, 'below'));

  await page.getByTestId('settings-save').click();

  await expect(page.getByTestId('settings-storage-error')).toHaveAttribute('data-reason', 'not_a_directory');
  await expect(page.getByTestId('settings-storage-error')).toContainText('kein Verzeichnis');
  // Below a file nothing can be made; the backend names `cannot_be_created` or `not_a_directory`.
  await expect(page.getByTestId('settings-export-error')).toBeVisible();
  await expect(page.getByTestId('settings-import-error')).toHaveCount(0);
  await expect(page.getByTestId('settings-storage')).toHaveValue(file);
});

test('a correction after a refusal saves', async ({ page, stack }) => {
  const imports = stack.makeDirectory('in');
  await openApp(page);
  await chooseView(page, 'settings');
  await page.getByTestId('settings-import').fill('nope');
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-import-error')).toBeVisible();

  await page.getByTestId('settings-import').fill(imports);
  await expect(page.getByTestId('settings-import-error')).toHaveCount(0);
  await page.getByTestId('settings-save').click();

  await expect(page.getByTestId('settings-saved')).toBeVisible();
  expect((await getFileSettings(stack.backendUrl)).import_directory.path).toBe(imports);
});

test('shows the reason in English and says that the export directory takes effect with the first export', async ({
  page,
}) => {
  await openApp(page);
  await page.getByTestId('lang-en').click();
  await chooseView(page, 'settings');

  await expect(page.getByTestId('field-settings-export')).toContainText('The setting takes effect with the first export.');
  await page.getByTestId('settings-import').fill('relative');
  await page.getByTestId('settings-save').click();

  await expect(page.getByTestId('settings-import-error')).toContainText('The path is not complete. Next step:');
  await expect(page.getByTestId('settings-refused')).toContainText('The settings were not saved.');
});
