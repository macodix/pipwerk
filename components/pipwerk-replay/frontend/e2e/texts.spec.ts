import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ACQUISITION_IN_BUILD,
  AREA_DIRECTIONS,
  REMOVED_HEADINGS,
  TOTAL_LIMIT_NAMES,
  TOTAL_LIMIT_TEXT,
} from '../checks/forbiddenTexts';

import {
  openPickerDirectory,
  putFileSettings,
  chooseImportFiles,
  chooseView,
  expect,
  importItem,
  jsonFile,
  minuteCandles,
  openApp,
  openImportDialog,
  seedStock,
  slowDownFiles,
  test,
} from './fixtures';

// The headings of the old view and everything about an acquisition do not occur in the built
// interface (acceptance criterion 2 of order 14) and are not on any screen of the data stock.

test('the built files do not contain the removed headings or anything about an acquisition', async ({ page, baseURL }) => {
  await openApp(page);
  const scripts = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src], link[rel="stylesheet"]')).map(
      (node) => node.getAttribute('src') ?? node.getAttribute('href') ?? '',
    ),
  );
  expect(scripts.length).toBeGreaterThan(0);

  const files = ['/', ...scripts];
  for (const path of files) {
    const response = await page.request.get(new URL(path, baseURL ?? '').toString());
    expect(response.ok(), path).toBe(true);
    const content = await response.text();
    for (const heading of REMOVED_HEADINGS) {
      expect(content.includes(heading), `${path} contains "${heading}"`).toBe(false);
    }
    expect(content.match(ACQUISITION_IN_BUILD)?.[0] ?? null, `${path} mentions an acquisition`).toBeNull();
    // No text about the number or the total size of the files (order 17, M3).
    expect(content.match(TOTAL_LIMIT_TEXT)?.[0] ?? null, `${path} speaks of a limit for the files together`).toBeNull();
    expect(content.match(TOTAL_LIMIT_NAMES)?.[0] ?? null, `${path} names a removed limit`).toBeNull();
  }
});

test('no text of the dialog for importing, with files, a refusal and a cancelled import, speaks of the number or the total size of the files', async ({
  page,
}) => {
  await slowDownFiles(page, 1500);
  await openApp(page);
  await openImportDialog(page);
  const files = ['AAA', 'BBB', 'CCC'].map((instrument) =>
    jsonFile(`${instrument}.json`, minuteCandles({ broker: 'B', instrument, count: 400 })),
  );
  const above = jsonFile('above.json', minuteCandles({ broker: 'B', instrument: 'DDD', count: 1000 }));
  await chooseImportFiles(page, [...files, above]);
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(TOTAL_LIMIT_TEXT);

  await page.getByTestId('import-run').click();
  await expect(importItem(page, 'AAA.json')).toHaveAttribute('data-state', 'importing');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(TOTAL_LIMIT_TEXT);
  await page.getByTestId('import-cancel').click();
  await expect(page.getByTestId('import-summary')).toBeVisible();
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(TOTAL_LIMIT_TEXT);
  await page.getByTestId('import-run').click();
  await expect(page.getByTestId('import-summary')).toContainText('Abgelehnt: 1');
  expect(await page.getByTestId('dialog-import').innerText()).not.toMatch(TOTAL_LIMIT_TEXT);
});

test('the settings, the choice in the import directory and the refusals speak of no limit for the files together, no area below or above, no acquisition', async ({
  page,
  stack,
}) => {
  const imports = stack.makeDirectory('import');
  stack.makeDirectory('import', 'empty');
  writeFileSync(join(imports, 'EURUSD_H1_202601050000_202601052300.csv'), 'x');
  await putFileSettings(stack.backendUrl, { import: imports, storage: stack.makeDirectory('storage') });
  const screens: string[] = [];
  const read = async (): Promise<void> => {
    screens.push(await page.evaluate(() => document.body.innerText));
    const dialog = page.getByTestId('dialog-import');
    if ((await dialog.count()) > 0) {
      screens.push(await dialog.innerText());
    }
  };
  for (const language of ['de', 'en'] as const) {
    await openApp(page);
    await page.getByTestId(`lang-${language}`).click();
    await chooseView(page, 'settings');
    await read();
    await page.getByTestId('settings-import').fill('relative');
    await page.getByTestId('settings-save').click();
    await expect(page.getByTestId('settings-import-error')).toBeVisible();
    await read();
    await page.getByTestId('settings-discard').click();
    await chooseView(page, 'data');
    await openImportDialog(page);
    await read();
    await page.getByTestId('import-choose-directory').click();
    await expect(page.getByTestId('picker-list')).toBeVisible();
    await read();
    await openPickerDirectory(page, 'empty');
    await expect(page.getByTestId('picker-empty')).toBeVisible();
    await read();
    await page.getByTestId('picker-cancel').click();
    await page.getByTestId('import-close').click();
  }
  for (const text of screens) {
    expect(text).not.toMatch(TOTAL_LIMIT_TEXT);
    expect(text).not.toMatch(AREA_DIRECTIONS);
    expect(text).not.toMatch(/beschaff|acquisition/i);
  }
  expect(screens.length).toBeGreaterThan(8);
});

test('no screen of the data stock has the removed headings or a text about an area below or above', async ({ page, stack }) => {
  await seedStock(stack.backendUrl);
  await openApp(page);
  await chooseView(page, 'data');
  await page.locator('[data-testid="stock-row"][data-instrument="GBPUSD"][data-data="h4"]').click();
  await expect(page.getByTestId('contract-missing')).toBeVisible();

  const text = await page.evaluate(() => document.body.innerText);
  for (const heading of REMOVED_HEADINGS) {
    expect(text).not.toContain(heading);
  }
  expect(text).not.toMatch(/\b(unten|oben)\b/);
  expect(text).not.toMatch(/beschaff/i);
  const headings = await page.getByRole('heading').allInnerTexts();
  expect(headings.map((heading) => heading.trim())).toEqual(
    expect.arrayContaining(['Datenbestand', 'Datenreihen', 'Lücken', 'Kontraktdaten']),
  );

  await openImportDialog(page);
  const dialogText = await page.getByTestId('dialog-import').innerText();
  expect(dialogText).not.toMatch(/\b(unten|oben)\b/);
  expect(dialogText).not.toMatch(/beschaff/i);
  await expect(page.getByRole('heading', { name: 'Datei importieren' })).toBeVisible();
});
