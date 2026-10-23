import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SIZES, STR01, STR03, openApp, runBacktest, startSingle } from './support';

// Acceptance criterion 3: adaptation to the window size (req-system-024) in the six sizes, in the single-step test
// of str-01 and in the result of the backtest of str-03: no horizontal scroll bar of the page, no visible area
// with width or height zero, no overlapping areas, all areas reachable.

interface RegionInfo {
  region: string;
  visible: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

async function regions(page: Page): Promise<RegionInfo[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-region]')).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const visible = cs.display !== 'none' && cs.visibility !== 'hidden';
      return { region: (el as HTMLElement).dataset.region as string, visible, x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
}

async function checkLayout(page: Page, width: number, height: number, where: string, minRegions = 4): Promise<void> {
  const overflow = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    bodyW: document.body.scrollWidth, iw: window.innerWidth, ih: window.innerHeight,
  }));
  expect(overflow.docW, `${where}: page scroll width`).toBeLessThanOrEqual(overflow.iw);
  expect(overflow.bodyW, `${where}: body scroll width`).toBeLessThanOrEqual(overflow.iw);
  expect(overflow.docH, `${where}: page scroll height`).toBeLessThanOrEqual(overflow.ih);
  const rs = (await regions(page)).filter((r) => r.visible);
  expect(rs.length, `${where}: visible areas`).toBeGreaterThanOrEqual(minRegions);
  for (const r of rs) {
    expect(r.w, `${where}: ${r.region} has width`).toBeGreaterThan(40);
    expect(r.h, `${where}: ${r.region} has height`).toBeGreaterThan(20);
    expect(r.x, `${where}: ${r.region} left edge`).toBeGreaterThanOrEqual(-1);
    expect(r.x + r.w, `${where}: ${r.region} right edge`).toBeLessThanOrEqual(width + 1);
    expect(r.y + r.h, `${where}: ${r.region} bottom edge`).toBeLessThanOrEqual(height + 1);
  }
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i];
      const b = rs[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(ox > 1 && oy > 1, `${where}: ${a.region} and ${b.region} overlap`).toBe(false);
    }
  }
}

/** Makes an area visible by the tabs, if it is not visible already, and checks that it lies within the window. */
async function reach(page: Page, name: string, tabs: string[]): Promise<void> {
  const loc = page.locator(`[data-region="${name}"]`).first();
  if (!(await loc.isVisible())) {
    for (const t of tabs) {
      const b = page.locator(`[data-testid="${t}"]:visible`).first();
      if (await b.count()) {
        await b.click();
        if (await loc.isVisible()) break;
      }
    }
  }
  await expect(loc, `${name} is reachable`).toBeVisible();
  const box = (await loc.boundingBox()) as { x: number; y: number; width: number; height: number };
  const vp = page.viewportSize() as { width: number; height: number };
  expect(box.width).toBeGreaterThan(40);
  expect(box.height).toBeGreaterThan(20);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
}

async function reachable(page: Page, testid: string): Promise<void> {
  const loc = page.getByTestId(testid).first();
  await expect(loc, testid).toBeVisible();
  const b = (await loc.boundingBox()) as { x: number; y: number; width: number; height: number };
  const vp = page.viewportSize() as { width: number; height: number };
  expect(b.x).toBeGreaterThanOrEqual(-1);
  expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 1);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height + 1);
}

async function checkMenu(page: Page, width: number): Promise<void> {
  await reachable(page, 'mode-single');
  await reachable(page, 'mode-backtest');
  await reachable(page, 'menu-about');
  await reachable(page, 'lang-de');
  if (width >= 1280) {
    for (const id of ['test', 'data', 'accounts', 'saved']) await reachable(page, `menu-${id}`);
  } else {
    await page.getByTestId('menu-toggle').click();
    for (const id of ['test', 'data', 'accounts', 'saved']) await reachable(page, `cmenu-${id}`);
    await page.getByTestId('menu-toggle').click();
  }
}

for (const size of SIZES) {
  test(`single-step test of str-01 in ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, { width: size.width, height: size.height });
    await checkMenu(page, size.width);
    await startSingle(page, STR01);
    await checkLayout(page, size.width, size.height, 'start');
    await reach(page, 'bar', []);
    await reach(page, 'flow', ['bar-flow']);
    await expect(page.locator('[data-testid="node"]').first()).toBeVisible();
    await checkLayout(page, size.width, size.height, 'flow');
    await reach(page, 'charts', ['bar-charts']);
    await expect(page.getByTestId('chart').first()).toBeVisible();
    await checkLayout(page, size.width, size.height, 'charts');
    await reach(page, 'values', ['tab-values', 'bar-values']);
    await expect(page.getByTestId('val-balance')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'values');
    await reach(page, 'props', ['tab-props', 'bar-props']);
    await expect(page.getByTestId('props-strategy')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'props');
    // a step and a selected element: the properties view shows it
    await reach(page, 'flow', ['bar-flow']);
    await page.getByTestId('btn-step').click();
    await page.locator('[data-testid="node"]').nth(1).click({ position: { x: 44, y: 14 }, force: true });
    await reach(page, 'props', ['tab-props', 'bar-props']);
    await expect(page.getByTestId('props-element')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'selected element');
    expect(errors).toEqual([]);
  });

  test(`result of the backtest of str-03 in ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, { width: size.width, height: size.height });
    await runBacktest(page, STR03);
    await checkLayout(page, size.width, size.height, 'result');
    await reach(page, 'bar', []);
    await reach(page, 'summary', ['bar-summary']);
    await expect(page.getByTestId('fig-net')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'summary');
    await reach(page, 'curve', ['bar-curve']);
    await expect(page.getByTestId('chart-equity')).toBeVisible();
    await expect(page.getByTestId('chart-drawdown')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'curve');
    await reach(page, 'trades', ['bar-trades']);
    await expect(page.getByTestId('trade-row').first()).toBeVisible();
    await checkLayout(page, size.width, size.height, 'trades');
    await reach(page, 'chart', ['bar-chart']);
    await expect(page.getByTestId('chart-trades')).toBeVisible();
    await checkLayout(page, size.width, size.height, 'chart');
    // a click on a trade works in every layout
    await reach(page, 'trades', ['bar-trades']);
    await page.getByTestId('trade-row').nth(2).click();
    await reach(page, 'chart', ['bar-chart']);
    await expect(page.locator('[data-testid="marker-trade"].selected')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

// The view "Datenbestand" and the dialog "Datei importieren" in the six sizes: no horizontal scroll bar of the page,
// none inside the view or the dialog, every area reachable, buttons of the dialog inside the window.

async function gotoData(page: Page, width: number): Promise<void> {
  if (width >= 1280) await page.getByTestId('menu-data').click();
  else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId('cmenu-data').click();
  }
  await expect(page.getByTestId('data')).toBeVisible();
}

/** Scrolls an element into view and checks that it lies inside the window horizontally and is at least partly visible vertically. */
async function inView(page: Page, testid: string): Promise<void> {
  const loc = page.getByTestId(testid).first();
  await loc.scrollIntoViewIfNeeded();
  await expect(loc, testid).toBeVisible();
  const b = (await loc.boundingBox()) as { x: number; y: number; width: number; height: number };
  const vp = page.viewportSize() as { width: number; height: number };
  expect(b.width, `${testid} width`).toBeGreaterThan(20);
  expect(b.height, `${testid} height`).toBeGreaterThan(10);
  expect(b.x, `${testid} left`).toBeGreaterThanOrEqual(-1);
  expect(b.x + b.width, `${testid} right`).toBeLessThanOrEqual(vp.width + 1);
  expect(b.y, `${testid} top`).toBeLessThan(vp.height);
  expect(b.y + b.height, `${testid} bottom`).toBeGreaterThan(0);
}

async function noInnerOverflow(page: Page, selector: string, where: string): Promise<void> {
  const o = await page.evaluate((s) => {
    const el = document.querySelector(s) as HTMLElement | null;
    return el ? { sw: el.scrollWidth, cw: el.clientWidth } : null;
  }, selector);
  expect(o, `${where}: ${selector} exists`).not.toBeNull();
  expect((o as { sw: number }).sw, `${where}: ${selector} scroll width`).toBeLessThanOrEqual((o as { cw: number }).cw + 1);
}

for (const size of SIZES) {
  test(`data stock in ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, { width: size.width, height: size.height });
    await gotoData(page, size.width);
    await checkLayout(page, size.width, size.height, 'data stock', 2);
    for (const id of ['import-open', 'select-test-broker', 'filter-broker', 'filter-instrument', 'filter-data', 'stock-table', 'stock-pager', 'page-next']) await inView(page, id);
    await noInnerOverflow(page, '.page-scroll', 'data stock');
    await noInnerOverflow(page, '.stock-table-wrap', 'data stock');
    // details of a series with gaps and contract data
    await page.getByTestId('filter-instrument').selectOption('XAUUSD');
    await page.getByTestId('filter-data').selectOption('candles:h1');
    await page.getByTestId('stock-row').first().click();
    for (const id of ['stock-detail', 'detail-gaps', 'detail-contract', 'contract-kontraktgroesse']) await inView(page, id);
    await noInnerOverflow(page, '.page-scroll', 'details');
    await noInnerOverflow(page, '.stock-table-wrap', 'details');
    await checkLayout(page, size.width, size.height, 'details', 2);
    expect(errors).toEqual([]);
  });

  test(`dialog import file in ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, { width: size.width, height: size.height });
    await gotoData(page, size.width);
    await page.getByTestId('import-open').click();
    const check = async (where: string) => {
      const o = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight, iw: window.innerWidth, ih: window.innerHeight }));
      expect(o.docW, `${where}: page width`).toBeLessThanOrEqual(o.iw);
      expect(o.docH, `${where}: page height`).toBeLessThanOrEqual(o.ih);
      const m = (await page.getByTestId('dialog-import').boundingBox()) as { x: number; y: number; width: number; height: number };
      expect(m.x, `${where}: dialog left`).toBeGreaterThanOrEqual(-1);
      expect(m.y, `${where}: dialog top`).toBeGreaterThanOrEqual(-1);
      expect(m.x + m.width, `${where}: dialog right`).toBeLessThanOrEqual(o.iw + 1);
      expect(m.y + m.height, `${where}: dialog bottom`).toBeLessThanOrEqual(o.ih + 1);
      await noInnerOverflow(page, '.modal-body', where);
      for (const id of ['import-run', 'import-close']) {
        const b = (await page.getByTestId(id).boundingBox()) as { x: number; y: number; width: number; height: number };
        expect(b.x, `${where}: ${id} left`).toBeGreaterThanOrEqual(m.x - 1);
        expect(b.x + b.width, `${where}: ${id} right`).toBeLessThanOrEqual(m.x + m.width + 1);
        expect(b.y + b.height, `${where}: ${id} bottom`).toBeLessThanOrEqual(m.y + m.height + 1);
      }
    };
    await check('empty');
    await page.getByTestId('import-sample-1').click();
    await page.getByTestId('import-sample-2').click();
    await expect(page.getByTestId('import-item')).toHaveCount(2);
    await check('two files');
    for (const id of ['import-broker', 'import-tz', 'import-list']) await inView(page, id);
    await page.getByTestId('import-item').last().scrollIntoViewIfNeeded();
    await check('two files, scrolled');
    await page.getByTestId('import-run').click();
    await expect(page.getByTestId('import-result')).toHaveCount(2);
    await page.getByTestId('import-result').last().scrollIntoViewIfNeeded();
    await check('result');
    await inView(page, 'import-rejected');
    expect(errors).toEqual([]);
  });
}
