import type { Page } from '@playwright/test';

import {
  FAULTY_CSV,
  GAPPY_CSV,
  WINDOW_SIZES,
  chooseImportFiles,
  chooseView,
  csvFile,
  expect,
  fillImportBasics,
  importItem,
  jsonFile,
  candlesDocument,
  openApp,
  openImportDialog,
  seedStock,
  test,
} from './fixtures';

// Specification 8.4, point 1: in the six window sizes nothing lies on top of something else,
// and every area, the menu and the dialogs can be reached.

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };

async function box(page: Page, selector: string): Promise<Box> {
  return page.locator(selector).first().evaluate((element) => {
    const r = element.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  });
}

function overlap(a: Box, b: Box): boolean {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 1 && height > 1;
}

function inside(inner: Box, outer: { width: number; height: number }): boolean {
  return inner.left >= -0.5 && inner.top >= -0.5 && inner.right <= outer.width + 0.5 && inner.bottom <= outer.height + 0.5;
}

async function expectShell(page: Page, width: number, height: number): Promise<void> {
  const scroll = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    inner: window.innerWidth,
    innerHeight: window.innerHeight,
  }));
  // No scroll bar of the page itself.
  expect(scroll.document).toBeLessThanOrEqual(scroll.inner);
  expect(scroll.body).toBeLessThanOrEqual(scroll.inner);
  expect(scroll.documentHeight).toBeLessThanOrEqual(scroll.innerHeight);

  const header = await box(page, '[data-testid="header"]');
  const main = await box(page, '[data-testid="main"]');
  const footer = await box(page, '[data-testid="footer"]');
  for (const region of [header, main, footer]) {
    expect(region.width).toBeGreaterThan(0);
    expect(region.height).toBeGreaterThan(0);
    expect(inside(region, { width, height })).toBe(true);
  }
  expect(overlap(header, main)).toBe(false);
  expect(overlap(main, footer)).toBe(false);
  expect(overlap(header, footer)).toBe(false);
  // The main area gets a usable part of the window.
  expect(main.height).toBeGreaterThan(height * 0.4);

  // The controls of the header lie side by side and in the window.
  const parts = await page.evaluate(() => {
    const items: { name: string; left: number; top: number; right: number; bottom: number; width: number; height: number }[] = [];
    const visible = (element: Element) => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const add = (name: string, selector: string) => {
      for (const element of document.querySelectorAll(selector)) {
        if (visible(element)) {
          const r = element.getBoundingClientRect();
          items.push({ name, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
        }
      }
    };
    add('brand', '.header .brand');
    add('menu', '.header .menu-full');
    add('menu-toggle', '[data-testid="menu-toggle"]');
    add('about', '[data-testid="menu-about"]');
    add('language', '[data-testid="lang-switch"]');
    return items;
  });
  const names = parts.map((part) => part.name);
  expect(names).toContain('brand');
  expect(names).toContain('about');
  expect(names).toContain('language');
  expect(names.includes('menu') || names.includes('menu-toggle')).toBe(true);
  for (const part of parts) {
    expect(inside(part, { width, height }), part.name).toBe(true);
  }
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      expect(overlap(parts[i] as Box, parts[j] as Box), `${parts[i]?.name ?? ''} / ${parts[j]?.name ?? ''}`).toBe(false);
    }
  }
}

/** The cards of the view do not overlap, no control leaves its card and every card can be scrolled into view. */
async function expectCards(page: Page, view: string): Promise<void> {
  const area = page.locator(`[data-testid="${view}"] .page-scroll`);
  const metrics = await area.evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  const cards = page.locator(`[data-testid="${view}"] .card-box`);
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    // The heading of the card is in the main area after scrolling to it (a card can be taller
    // than the window; the rest of it is reached by scrolling on). The bar of the data stock
    // has no heading; the card itself stands for it.
    const headings = card.locator('h2');
    const heading = (await headings.count()) > 0 ? headings.first() : card;
    await heading.scrollIntoViewIfNeeded();
    const mainBox = await box(page, '[data-testid="main"]');
    const headingBox = await heading.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
    expect(headingBox.top).toBeGreaterThanOrEqual(mainBox.top - 1);
    expect(headingBox.bottom).toBeLessThanOrEqual(mainBox.bottom + 1);
    expect(headingBox.width).toBeGreaterThan(0);
    const cardBox = await card.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
    expect(cardBox.width).toBeGreaterThan(0);

    // No control lies outside its card (the tables scroll inside their own frame).
    const outside = await card.evaluate((element) => {
      const frame = element.getBoundingClientRect();
      const bad: string[] = [];
      for (const control of element.querySelectorAll('input:not(.visually-hidden), select, button, textarea')) {
        if (control.closest('.tbl-wrap') !== null || control.closest('.visually-hidden') !== null) {
          continue;
        }
        const r = control.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
          continue;
        }
        if (r.left < frame.left - 1 || r.right > frame.right + 1) {
          bad.push(control.getAttribute('data-testid') ?? control.tagName);
        }
      }
      return bad;
    });
    expect(outside, `controls outside of a card of ${view}`).toEqual([]);
  }
  // The cards sit below each other or side by side, but never on top of each other. The boxes are
  // compared in the coordinates of the page at the time of the scrolling, so compare the vertical
  // order in the coordinates of the scrolled area instead.
  const positions = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const area = element.closest('.page-scroll') as HTMLElement;
      const r = element.getBoundingClientRect();
      const a = area.getBoundingClientRect();
      return {
        left: r.left - a.left,
        top: r.top - a.top + area.scrollTop,
        right: r.right - a.left,
        bottom: r.bottom - a.top + area.scrollTop,
        width: r.width,
        height: r.height,
      };
    }),
  );
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      expect(overlap(positions[i] as Box, positions[j] as Box), `cards ${String(i)} and ${String(j)} of ${view}`).toBe(false);
    }
  }
  // The end of the area can be reached.
  await area.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const end = await area.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop);
  expect(end).toBeLessThanOrEqual(1);
}

async function expectDialog(page: Page, testid: string, width: number, height: number): Promise<void> {
  const dialog = page.getByTestId(testid);
  await expect(dialog).toBeVisible();
  const dialogBox = await box(page, `[data-testid="${testid}"]`);
  expect(inside(dialogBox, { width, height }), `${testid} lies in the window`).toBe(true);
  expect(dialogBox.width).toBeGreaterThan(200);
  // Every button of the dialog is in the window and can be pressed.
  const buttons = dialog.locator('.modal-foot button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    await expect(button).toBeVisible();
    const buttonBox = await button.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
    expect(inside(buttonBox, { width, height })).toBe(true);
  }
  // The head, the body and the foot lie below each other.
  const head = await box(page, `[data-testid="${testid}"] .modal-head`);
  const body = await box(page, `[data-testid="${testid}"] .modal-body`);
  const foot = await box(page, `[data-testid="${testid}"] .modal-foot`);
  expect(overlap(head, body)).toBe(false);
  expect(overlap(body, foot)).toBe(false);
}

/** Nothing in the elements scrolls sideways: the content fits their width. */
async function expectNoInnerScroll(page: Page, selector: string): Promise<void> {
  const widths = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })),
  );
  expect(widths.length).toBeGreaterThan(0);
  for (const { scrollWidth, clientWidth } of widths) {
    expect(scrollWidth, `${selector} scrolls sideways`).toBeLessThanOrEqual(clientWidth + 1);
  }
}

/**
 * The dialog "Datei importieren": the body scrolls only downwards, every control lies inside the
 * dialog, the entries of the list lie below each other without overlap, and the end of the body
 * (the last entry) can be reached by scrolling.
 */
async function expectImportDialog(page: Page, width: number, height: number): Promise<void> {
  await expectNoInnerScroll(page, '[data-testid="dialog-import"] .modal-body');
  const dialog = await box(page, '[data-testid="dialog-import"]');
  expect(inside(dialog, { width, height })).toBe(true);
  const outside = await page.locator('[data-testid="dialog-import"]').evaluate((element) => {
    const frame = element.getBoundingClientRect();
    const bad: string[] = [];
    for (const control of element.querySelectorAll('.modal-body input, .modal-body select, .modal-body button, .modal-foot button')) {
      if (control.closest('.visually-hidden') !== null || control.classList.contains('visually-hidden')) {
        continue;
      }
      const r = control.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        continue;
      }
      if (r.left < frame.left - 1 || r.right > frame.right + 1) {
        bad.push(control.getAttribute('data-testid') ?? control.tagName);
      }
    }
    return bad;
  });
  expect(outside, 'controls outside of the dialog').toEqual([]);

  const items = page.locator('[data-testid="dialog-import"] .imp-item');
  const count = await items.count();
  if (count > 0) {
    const positions = await items.evaluateAll((elements) =>
      elements.map((element) => {
        const body = element.closest('.modal-body') as HTMLElement;
        const r = element.getBoundingClientRect();
        const b = body.getBoundingClientRect();
        return {
          left: r.left - b.left,
          top: r.top - b.top + body.scrollTop,
          right: r.right - b.left,
          bottom: r.bottom - b.top + body.scrollTop,
          width: r.width,
          height: r.height,
        };
      }),
    );
    for (let i = 0; i < positions.length; i += 1) {
      expect(positions[i]?.width).toBeGreaterThan(0);
      for (let j = i + 1; j < positions.length; j += 1) {
        expect(overlap(positions[i] as Box, positions[j] as Box), `entries ${String(i)} and ${String(j)}`).toBe(false);
      }
    }
    // Scrolled to its end, the body shows the last entry down to its lower edge.
    await page.locator('[data-testid="dialog-import"] .modal-body').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const lastGap = await items.last().evaluate((element) => {
      const r = element.getBoundingClientRect();
      const b = (element.closest('.modal-body') as HTMLElement).getBoundingClientRect();
      return b.bottom - r.bottom;
    });
    expect(lastGap).toBeGreaterThanOrEqual(-1);
  }
  // The end of the body can be reached.
  const end = await page.locator('[data-testid="dialog-import"] .modal-body').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    return element.scrollHeight - element.clientHeight - element.scrollTop;
  });
  expect(end).toBeLessThanOrEqual(1);
}

for (const { width, height } of WINDOW_SIZES) {
  test.describe(`window ${String(width)} x ${String(height)}`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(async ({ page, stack }) => {
      await seedStock(stack.backendUrl);
      await openApp(page);
    });

    test('data stock: nothing lies on top of something else and everything can be reached', async ({ page }) => {
      await chooseView(page, 'data');
      await expect(page.getByTestId('stock-row')).toHaveCount(5);

      await expectShell(page, width, height);
      await expectCards(page, 'data');
      await expectNoInnerScroll(page, '[data-testid="data"] .tbl-wrap');
      // The bar lies above the table, the controls of the bar side by side or below each other.
      const bar = await box(page, '[data-testid="data-bar"]');
      const stock = await box(page, '[data-testid="stock"]');
      expect(bar.bottom).toBeLessThanOrEqual(stock.top + 1);
      const importButton = await box(page, '[data-testid="import-open"]');
      const testBroker = await box(page, '[data-testid="field-test-broker"]');
      expect(overlap(importButton, testBroker)).toBe(false);
      for (const id of ['stock-pager', 'page-prev', 'page-next']) {
        await page.getByTestId(id).scrollIntoViewIfNeeded();
        await expect(page.getByTestId(id)).toBeInViewport();
      }
    });

    test('data stock with the details of rows and the filter', async ({ page }) => {
      await chooseView(page, 'data');
      await page.getByTestId('filter-broker').fill('Test');
      await expect(page.getByTestId('stock-row')).toHaveCount(3);
      await page.locator('[data-testid="stock-row"][data-data="h1"]').click();
      await expect(page.getByTestId('contract-contractSize')).toBeVisible();
      await expect(page.getByTestId('gap-item')).toHaveCount(1);

      await expectShell(page, width, height);
      await expectCards(page, 'data');
      await expectNoInnerScroll(page, '[data-testid="data"] .tbl-wrap');
      // The details lie inside the table card and below their row, not over other rows.
      const row = await box(page, '[data-testid="stock-row"][aria-expanded="true"]');
      const detail = await box(page, '[data-testid="stock-detail-row"]');
      expect(row.bottom).toBeLessThanOrEqual(detail.top + 1);
      const rows = page.getByTestId('stock-row');
      for (let index = 0; index < (await rows.count()); index += 1) {
        const other = await rows.nth(index).evaluate((element) => {
          const r = element.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        });
        expect(overlap(other, detail), `row ${String(index)} and the details`).toBe(false);
      }
      // The contract data and the gaps do not overlap.
      const gaps = await box(page, '[data-testid="detail-gaps"]');
      const contract = await box(page, '[data-testid="detail-contract"]');
      expect(overlap(gaps, contract)).toBe(false);
    });

    test('dialog "Datei importieren": empty, with files that need an entry, and with the result per file', async ({ page }) => {
      await chooseView(page, 'data');
      await openImportDialog(page);

      await expectDialog(page, 'dialog-import', width, height);
      await expectImportDialog(page, width, height);

      const known = csvFile('EURUSD_H1_202601050000_202601050300.csv', FAULTY_CSV);
      const unknown = csvFile('export.csv', GAPPY_CSV);
      const broken = { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{ not json', 'utf-8') };
      const valid = jsonFile('gbpusd.json', candlesDocument({ broker: 'Egal', instrument: 'GBPUSD', unit: 'h1', hours: [8, 9] }));
      await chooseImportFiles(page, [known, unknown, broken, valid]);
      await expect(importItem(page, unknown.name)).toHaveAttribute('data-state', 'needs');
      await expectDialog(page, 'dialog-import', width, height);
      await expectImportDialog(page, width, height);

      await importItem(page, unknown.name).getByTestId('import-instrument').fill('EURUSD');
      await importItem(page, unknown.name).getByTestId('import-data').selectOption('h1');
      await fillImportBasics(page, { broker: 'Test-Broker', timezone: 'UTC' });
      await page.getByTestId('import-run').click();
      await expect(page.getByTestId('import-summary')).toBeVisible();
      await expect(page.getByTestId('import-result')).toHaveCount(4);
      await expectDialog(page, 'dialog-import', width, height);
      await expectImportDialog(page, width, height);

      // The explanation of a field is above the dialog and in the window.
      await page.getByTestId('field-import-broker').locator('.info').focus();
      await expect(page.getByTestId('tooltip')).toBeVisible();
      const tip = await box(page, '[data-testid="tooltip"]');
      expect(inside(tip, { width, height })).toBe(true);
      await page.getByTestId('field-import-broker').locator('.info').blur();

      await page.getByTestId('import-close').click();
      await expect(page.getByTestId('dialog-import')).toHaveCount(0);
      await expectShell(page, width, height);
    });

    test('test accounts: list, form and dialog', async ({ page }) => {
      await chooseView(page, 'accounts');
      await expect(page.getByTestId('account-item')).toHaveCount(1);
      await page.getByTestId('account-leverage').fill('0');
      await expect(page.getByTestId('account-invalid')).toBeVisible();
      await page.getByTestId('account-spread-fixed').click();

      await expectShell(page, width, height);
      await expectCards(page, 'accounts');
      // The buttons of the form can be reached after scrolling.
      for (const id of ['account-save', 'account-revert', 'account-delete', 'account-new']) {
        await page.getByTestId(id).scrollIntoViewIfNeeded();
        await expect(page.getByTestId(id)).toBeInViewport();
      }
      await page.getByTestId('account-leverage').fill('30');
      await page.getByTestId('account-delete').click();
      await expectDialog(page, 'dialog-delete-account', width, height);
      await page.getByTestId('delete-cancel').click();
      await expect(page.getByTestId('dialog-delete-account')).toBeHidden();
    });

    test('menu and About dialog can be reached and closed', async ({ page }) => {
      await chooseView(page, 'accounts');
      await chooseView(page, 'data');
      await page.getByTestId('menu-about').click();

      await expectDialog(page, 'dialog-about', width, height);
      // The license text scrolls inside the dialog.
      const license = page.getByTestId('license-text');
      await license.scrollIntoViewIfNeeded();
      await expect(license).toBeVisible();
      await page.getByTestId('about-close').click();
      await expect(page.getByTestId('dialog-about')).toBeHidden();
      await expect(page.getByTestId('menu-about')).toBeFocused();
      // After closing, the page is operable again.
      await chooseView(page, 'accounts');
    });
  });
}
