import { ACQUISITION_IN_BUILD, REMOVED_HEADINGS } from '../checks/forbiddenTexts';

import { chooseView, expect, openApp, openImportDialog, seedStock, test } from './fixtures';

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
  }
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
