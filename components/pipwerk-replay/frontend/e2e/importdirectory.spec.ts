import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { Page, Request } from '@playwright/test';

import {
  candlesDocument,
  chooseImportFiles,
  chooseView,
  csvFile,
  dayCsv,
  expect,
  fillImportBasics,
  getFileSettings,
  importItem,
  openApp,
  openImportDialog,
  openPicker,
  openPickerDirectory,
  pickerFile,
  putFileSettings,
  runImport,
  seriesOf,
  test,
} from './fixtures';

// The import directory (specification 5.3), "Dateien behalten" (5.6) and the settings that feed
// them (5.7) against the real backend: the files in the directories are real files.

const EUR = 'EURUSD_H1_202601050000_202601052300.csv';
const GBP = 'GBPUSD_H1_202601060000_202601062300.csv';
const CHF = 'USDCHF_H1_202601070000_202601072300.csv';

/** What the files below a directory are: path (relative), size, time of change and a hash of the content. */
function snapshot(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  const walk = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      const info = statSync(path);
      if (info.isDirectory()) {
        result[`${relative(root, path)}/`] = 'directory';
        walk(path);
      } else {
        const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
        result[relative(root, path)] = `${String(info.size)}|${String(info.mtimeMs)}|${hash}`;
      }
    }
  };
  walk(root);
  return result;
}

/** An import directory with a file in the root, one in a subdirectory and a JSON file two levels down. */
function fillImportDirectory(directory: string): void {
  mkdirSync(join(directory, '2026', 'deep'), { recursive: true });
  writeFileSync(join(directory, EUR), dayCsv('2026-01-05', [8, 9, 10]));
  writeFileSync(join(directory, '2026', GBP), dayCsv('2026-01-06', [8, 9]));
  writeFileSync(
    join(directory, '2026', 'deep', 'USDJPY_D1.json'),
    JSON.stringify(candlesDocument({ broker: 'x', instrument: 'USDJPY', unit: 'd1', hours: [0] })),
  );
}

/** Records the requests of the import to the web API, to see that all files went through one process. */
function recordImportRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/v1/market-data/import-processes')) {
      requests.push(request);
    }
  });
  return requests;
}

async function openData(page: Page): Promise<void> {
  await openApp(page);
  await chooseView(page, 'data');
}

test('imports files of the import directory, subdirectories included, together with an uploaded file in one process, and leaves the files there as they were', async ({
  page,
  stack,
}) => {
  const imports = stack.makeDirectory('import');
  const storage = stack.makeDirectory('storage');
  fillImportDirectory(imports);
  await putFileSettings(stack.backendUrl, { import: imports, storage });
  const before = snapshot(imports);
  const requests = recordImportRequests(page);
  await openData(page);
  await openImportDialog(page);

  await chooseImportFiles(page, [csvFile(CHF, dayCsv('2026-01-07', [8, 9]))]);
  await openPicker(page);
  // The directories come first, then the files; the import directory is named.
  await expect(page.getByTestId('picker-directory')).toContainText(imports);
  const names = await page.getByTestId('picker-list').locator('> li').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-name')));
  expect(names).toEqual(['2026', EUR]);
  await pickerFile(page, EUR).getByTestId('picker-check').check();
  await openPickerDirectory(page, '2026');
  await pickerFile(page, GBP).getByTestId('picker-check').check();
  await openPickerDirectory(page, 'deep');
  await pickerFile(page, 'USDJPY_D1.json').getByTestId('picker-check').check();
  // Back up to the import directory, never above it.
  await page.getByTestId('picker-up').click();
  await page.getByTestId('picker-up').click();
  await expect(page.getByTestId('picker-up')).toBeDisabled();
  await expect(pickerFile(page, EUR).getByTestId('picker-check')).toBeChecked();
  await expect(page.getByTestId('picker-confirm')).toContainText('3 Dateien übernehmen');
  await page.getByTestId('picker-confirm').click();

  await expect(page.getByTestId('import-item')).toHaveCount(4);
  await expect(importItem(page, `2026/${GBP}`)).toHaveAttribute('data-source', 'directory');
  // Instrument and data come from the names; the JSON file names them itself.
  await expect(importItem(page, `2026/${GBP}`).getByTestId('import-instrument')).toHaveValue('GBPUSD');
  await expect(importItem(page, `2026/${GBP}`).getByTestId('import-data')).toHaveValue('h1');
  await expect(importItem(page, '2026/deep/USDJPY_D1.json').getByTestId('import-data')).toContainText('D1');
  await fillImportBasics(page, { broker: 'Verzeichnis-Broker', timezone: 'UTC' });
  await runImport(page);

  await expect(page.getByTestId('import-summary')).toContainText('4 von 4 Dateien sind importiert.');
  for (const item of await page.getByTestId('import-item').all()) {
    await expect(item).toHaveAttribute('data-state', 'taken');
  }
  await expect(importItem(page, EUR).getByTestId('import-stays')).toBeVisible();
  await expect(importItem(page, CHF).getByTestId('import-stays')).toHaveCount(0);
  // One process: one beginning, one end; four requests of files, three by path.
  const posts = requests.map((request) => new URL(request.url()).pathname.replace(/[0-9a-f-]{36}/, '<id>'));
  expect(posts.filter((path) => path.endsWith('/import-processes'))).toHaveLength(1);
  expect(posts.filter((path) => path.endsWith('/<id>/finish'))).toHaveLength(1);
  expect(posts.filter((path) => path.endsWith('/<id>/files'))).toHaveLength(1);
  expect(posts.filter((path) => path.endsWith('/<id>/directory-files'))).toHaveLength(3);
  expect(posts.filter((path) => path.endsWith('/abort'))).toHaveLength(0);

  // The data are in the data stock.
  const stock = await seriesOf(stack.backendUrl, '&broker=Verzeichnis-Broker');
  expect(stock.items.map((row) => `${String(row.instrument)}|${String(row.data)}`).sort()).toEqual([
    'EURUSD|h1',
    'GBPUSD|h1',
    'USDCHF|h1',
    'USDJPY|d1',
  ]);
  // The files in the import directory are as they were: not changed, not moved, not removed, no
  // intermediate file, and none of them was copied to the storage directory.
  expect(snapshot(imports)).toEqual(before);
  expect(readdirSync(storage)).toEqual([]);
});

test('"Dateien behalten" ticked puts every uploaded file, a refused one as well, unchanged into the storage directory and copies nothing from the import directory', async ({
  page,
  stack,
}) => {
  const imports = stack.makeDirectory('import');
  const storage = stack.makeDirectory('storage');
  fillImportDirectory(imports);
  await putFileSettings(stack.backendUrl, { import: imports, storage });
  const before = snapshot(imports);
  const good = dayCsv('2026-01-07', [8, 9]);
  const broken = '{ this is not json';
  await openData(page);
  await openImportDialog(page);
  await chooseImportFiles(page, [
    csvFile(CHF, good),
    { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(broken) },
  ]);
  await openPicker(page);
  await pickerFile(page, EUR).getByTestId('picker-check').check();
  await page.getByTestId('picker-confirm').click();
  await expect(page.getByTestId('import-item')).toHaveCount(3);
  await fillImportBasics(page, { broker: 'B', timezone: 'UTC' });
  await expect(page.getByTestId('import-keep-files')).not.toBeChecked();
  await page.getByTestId('import-keep-files').check();

  await runImport(page);

  await expect(importItem(page, CHF).getByTestId('import-kept')).toContainText('Die Datei ist im Ablageverzeichnis behalten.');
  await expect(importItem(page, 'broken.json')).toHaveAttribute('data-state', 'refused');
  await expect(importItem(page, 'broken.json').getByTestId('import-kept')).toBeVisible();
  await expect(importItem(page, EUR).getByTestId('import-kept')).toHaveCount(0);
  expect(readdirSync(storage).sort()).toEqual(['USDCHF_H1_202601070000_202601072300.csv', 'broken.json']);
  expect(readFileSync(join(storage, CHF), 'utf-8')).toBe(good);
  expect(readFileSync(join(storage, 'broken.json'), 'utf-8')).toBe(broken);
  expect(snapshot(imports)).toEqual(before);
});

test('"Dateien behalten" not ticked leaves nothing in the storage directory', async ({ page, stack }) => {
  const storage = stack.makeDirectory('storage');
  await putFileSettings(stack.backendUrl, { storage });
  await openData(page);
  await openImportDialog(page);
  await chooseImportFiles(page, [csvFile(CHF, dayCsv('2026-01-07', [8, 9]))]);
  await fillImportBasics(page, { broker: 'B', timezone: 'UTC' });
  await expect(page.getByTestId('import-keep-files')).not.toBeChecked();

  await runImport(page);

  await expect(importItem(page, CHF)).toHaveAttribute('data-state', 'taken');
  await expect(page.getByTestId('import-kept')).toHaveCount(0);
  expect(readdirSync(storage)).toEqual([]);
});

test('the tick is preset from the setting, read when the dialog opens, and the user can change it for one import', async ({
  page,
  stack,
}) => {
  const storage = stack.makeDirectory('storage');
  await putFileSettings(stack.backendUrl, { storage });
  await openData(page);
  await openImportDialog(page);
  await expect(page.getByTestId('import-keep-files')).not.toBeChecked();
  await page.getByTestId('import-close').click();

  // The setting is changed in the view "Einstellungen"; the dialog shows it the next time.
  await chooseView(page, 'settings');
  await page.getByTestId('settings-keep').check();
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-saved')).toBeVisible();
  expect((await getFileSettings(stack.backendUrl)).keep_imported_files).toBe(true);
  await chooseView(page, 'data');
  await openImportDialog(page);
  await expect(page.getByTestId('import-keep-files')).toBeChecked();

  // One import against the setting: untick, import, nothing is kept.
  await page.getByTestId('import-keep-files').uncheck();
  await chooseImportFiles(page, [csvFile(CHF, dayCsv('2026-01-07', [8, 9]))]);
  await fillImportBasics(page, { broker: 'B', timezone: 'UTC' });
  await runImport(page);
  expect(readdirSync(storage)).toEqual([]);
  await page.getByTestId('import-close').click();

  // The setting itself did not change; the next dialog is ticked again.
  await openImportDialog(page);
  await expect(page.getByTestId('import-keep-files')).toBeChecked();
  await page.getByTestId('import-close').click();

  await chooseView(page, 'settings');
  await page.getByTestId('settings-keep').uncheck();
  await page.getByTestId('settings-save').click();
  await expect(page.getByTestId('settings-saved')).toBeVisible();
  await chooseView(page, 'data');
  await openImportDialog(page);
  await expect(page.getByTestId('import-keep-files')).not.toBeChecked();
});

test('the explanation of the tick names the storage directory and says that the import directory stays', async ({
  page,
  stack,
}) => {
  const storage = stack.makeDirectory('storage');
  await putFileSettings(stack.backendUrl, { storage });
  await openData(page);
  await openImportDialog(page);

  const label = page.getByTestId('field-import-keep-files').locator('.field-label');
  await expect(label).toHaveAttribute('data-tip', new RegExp(storage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await label.hover();

  const tip = page.getByTestId('tooltip');
  await expect(tip).toContainText(storage);
  await expect(tip).toContainText('Dateien aus dem Importverzeichnis bleiben dort und werden nicht ins Ablageverzeichnis kopiert.');
  // The explanation is shown over the dialog, not under it.
  const covered = await tip.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return top === null || !node.contains(top);
  });
  expect(covered).toBe(false);
});

test('a file that cannot be kept is refused with the reason and the way to the settings, the others go on', async ({
  page,
  stack,
}) => {
  const imports = stack.makeDirectory('import');
  fillImportDirectory(imports);
  const storage = stack.makeDirectory('storage');
  await putFileSettings(stack.backendUrl, { import: imports, storage, keep: true });
  // The storage directory is gone and a file lies in its place: nothing can be written there.
  rmSync(storage, { recursive: true });
  writeFileSync(storage, 'not a directory');
  await openData(page);
  await openImportDialog(page);
  await expect(page.getByTestId('import-keep-files')).toBeChecked();
  await chooseImportFiles(page, [csvFile(CHF, dayCsv('2026-01-07', [8, 9]))]);
  await openPicker(page);
  await pickerFile(page, EUR).getByTestId('picker-check').check();
  await page.getByTestId('picker-confirm').click();
  await expect(page.getByTestId('import-item')).toHaveCount(2);
  await fillImportBasics(page, { broker: 'B', timezone: 'UTC' });

  await runImport(page);

  const refused = importItem(page, CHF);
  await expect(refused).toHaveAttribute('data-state', 'refused');
  await expect(refused.getByTestId('import-result')).toContainText('Sie wurde nicht importiert.');
  await expect(refused.getByTestId('import-result')).toContainText('„Einstellungen“');
  // The file of the import directory does not depend on the storage directory.
  await expect(importItem(page, EUR)).toHaveAttribute('data-state', 'taken');
  await expect(page.getByTestId('import-summary')).toContainText('1 von 2 Dateien sind importiert. Abgelehnt: 1.');
  const stock = await seriesOf(stack.backendUrl);
  expect(stock.items.map((row) => String(row.instrument))).toEqual(['EURUSD']);

  // Without the tick the same file goes in.
  await page.getByTestId('import-keep-files').uncheck();
  await runImport(page);
  await expect(importItem(page, CHF)).toHaveAttribute('data-state', 'taken');
});

test('an empty import directory is named, with the way to the settings', async ({ page, stack }) => {
  const imports = stack.makeDirectory('import');
  await putFileSettings(stack.backendUrl, { import: imports });
  await openData(page);
  await openImportDialog(page);

  await openPicker(page);

  const note = page.getByTestId('picker-empty');
  await expect(note).toContainText(`Das Importverzeichnis ${imports} enthält keine Dateien und keine Unterverzeichnisse.`);
  await expect(note).toContainText('Nächster Schritt: Legen Sie dort Dateien ab oder wählen Sie unter „Einstellungen“');
  await page.getByTestId('picker-settings').click();
  await expect(page.getByTestId('settings')).toBeVisible();
  await expect(page.getByTestId('dialog-import')).toHaveCount(0);
  await expect(page.getByTestId('settings-import')).toHaveValue(imports);
});

test('an import directory that cannot be read is named, with the way to the settings', async ({ page, stack }) => {
  const imports = stack.makeDirectory('import');
  await putFileSettings(stack.backendUrl, { import: imports });
  rmSync(imports, { recursive: true });
  await openData(page);
  await openImportDialog(page);

  await openPicker(page);

  const error = page.getByTestId('picker-error');
  await expect(error).toContainText(`Das Importverzeichnis ${imports} ist nicht gesetzt oder lässt sich nicht lesen.`);
  await expect(error).toContainText('Prüfen Sie es unter „Einstellungen“.');
  await expect(page.getByTestId('picker-settings')).toBeVisible();
  // The dialog is still usable: back to it, and upload.
  await page.getByTestId('picker-cancel').click();
  await expect(page.getByTestId('import-choose')).toBeEnabled();
});

test('a file that is gone when the import runs is refused with its reason, the others are imported', async ({
  page,
  stack,
}) => {
  const imports = stack.makeDirectory('import');
  fillImportDirectory(imports);
  await putFileSettings(stack.backendUrl, { import: imports });
  await openData(page);
  await openImportDialog(page);
  await openPicker(page);
  await pickerFile(page, EUR).getByTestId('picker-check').check();
  await openPickerDirectory(page, '2026');
  await pickerFile(page, GBP).getByTestId('picker-check').check();
  await page.getByTestId('picker-confirm').click();
  await expect(page.getByTestId('import-item')).toHaveCount(2);
  await fillImportBasics(page, { broker: 'B', timezone: 'UTC' });
  // The user removes a file in the meantime (the dialog never does).
  rmSync(join(imports, '2026', GBP));

  await runImport(page);

  await expect(importItem(page, EUR)).toHaveAttribute('data-state', 'taken');
  const gone = importItem(page, `2026/${GBP}`);
  await expect(gone).toHaveAttribute('data-state', 'refused');
  await expect(gone.getByTestId('import-result')).toContainText('Die Datei gibt es im Importverzeichnis nicht (mehr).');
  expect(existsSync(join(imports, EUR))).toBe(true);
});

test('the choice shows the files page by page', async ({ page, stack }) => {
  const imports = stack.makeDirectory('import');
  for (let index = 0; index < 55; index += 1) {
    writeFileSync(join(imports, `f${String(index).padStart(2, '0')}.csv`), 'x');
  }
  await putFileSettings(stack.backendUrl, { import: imports });
  await openData(page);
  await openImportDialog(page);

  await openPicker(page);

  await expect(page.getByTestId('picker-count')).toContainText('1–50 von 55 Einträgen');
  await page.getByTestId('picker-next').click();
  await expect(pickerFile(page, 'f50.csv')).toBeVisible();
  await expect(page.getByTestId('picker-count')).toContainText('51–55 von 55 Einträgen');
  await pickerFile(page, 'f54.csv').getByTestId('picker-check').check();
  await page.getByTestId('picker-previous').click();
  await pickerFile(page, 'f00.csv').getByTestId('picker-check').check();
  await expect(page.getByTestId('picker-confirm')).toContainText('2 Dateien übernehmen');
});
