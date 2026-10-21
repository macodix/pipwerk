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

async function checkLayout(page: Page, width: number, height: number, where: string): Promise<void> {
  const overflow = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    bodyW: document.body.scrollWidth, iw: window.innerWidth, ih: window.innerHeight,
  }));
  expect(overflow.docW, `${where}: page scroll width`).toBeLessThanOrEqual(overflow.iw);
  expect(overflow.bodyW, `${where}: body scroll width`).toBeLessThanOrEqual(overflow.iw);
  expect(overflow.docH, `${where}: page scroll height`).toBeLessThanOrEqual(overflow.ih);
  const rs = (await regions(page)).filter((r) => r.visible);
  expect(rs.length, `${where}: visible areas`).toBeGreaterThanOrEqual(4);
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
