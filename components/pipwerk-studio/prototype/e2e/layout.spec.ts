import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SIZES, openApp } from './support';

// Acceptance criterion 3: adaptation to the window size (req-system-024) in all six sizes, with "EMA-Trendfolge" open.

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

async function checkLayout(page: Page, width: number, height: number): Promise<void> {
  // no horizontal scroll bar of the page, nothing wider than the window
  const overflow = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
    bodyW: document.body.scrollWidth, iw: window.innerWidth, ih: window.innerHeight,
  }));
  expect(overflow.docW, 'page scroll width').toBeLessThanOrEqual(overflow.iw);
  expect(overflow.bodyW, 'body scroll width').toBeLessThanOrEqual(overflow.iw);
  expect(overflow.docH, 'page scroll height').toBeLessThanOrEqual(overflow.ih);
  const rs = (await regions(page)).filter((r) => r.visible);
  expect(rs.length).toBeGreaterThanOrEqual(4);
  for (const r of rs) {
    expect(r.w, `${r.region} has width`).toBeGreaterThan(40);
    expect(r.h, `${r.region} has height`).toBeGreaterThan(20);
    expect(r.x, `${r.region} left edge`).toBeGreaterThanOrEqual(-1);
    expect(r.x + r.w, `${r.region} right edge`).toBeLessThanOrEqual(width + 1);
    expect(r.y + r.h, `${r.region} bottom edge`).toBeLessThanOrEqual(height + 1);
  }
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i];
      const b = rs[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(ox > 1 && oy > 1, `${a.region} and ${b.region} overlap`).toBe(false);
    }
  }
}

async function inViewport(page: Page, testid: string): Promise<void> {
  const loc = page.getByTestId(testid).first();
  await expect(loc).toBeVisible();
  const b = (await loc.boundingBox()) as { x: number; y: number; width: number; height: number };
  const vp = page.viewportSize() as { width: number; height: number };
  expect(b.width).toBeGreaterThan(0);
  expect(b.height).toBeGreaterThan(0);
  expect(b.x).toBeGreaterThanOrEqual(-1);
  expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 1);
  expect(b.y + b.height).toBeLessThanOrEqual(vp.height + 1);
}

for (const size of SIZES) {
  test(`window size ${size.width} x ${size.height} (${size.name})`, async ({ page }) => {
    const errors = await openApp(page, { width: size.width, height: size.height });
    await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
    await checkLayout(page, size.width, size.height);

    // the strategy parameters are always visible and can be changed
    await inViewport(page, 'param-strip');
    await expect(page.getByTestId('param-chip')).toHaveCount(2);
    await page.getByTestId('param-chip').first().click();
    await inViewport(page, 'param-popover');
    await page.getByTestId('param-popover').getByRole('button', { name: /Fertig/ }).click();

    // menu: all entries reachable
    if (size.width >= 1280) {
      for (const id of ['new', 'open', 'save', 'check', 'close', 'delete', 'settings']) await inViewport(page, `menu-${id}`);
    } else {
      await page.getByTestId('menu-toggle').click();
      for (const id of ['new', 'open', 'save', 'check', 'close', 'delete', 'settings']) await inViewport(page, `cmenu-${id}`);
      await page.getByTestId('menu-toggle').click();
    }
    await inViewport(page, 'menu-about');

    // canvas, element library and properties view are reachable one after the other or side by side
    const narrow = size.width < 700;
    const mid = size.width >= 700 && size.width < 1100;
    const goLibrary = async () => {
      if (narrow) await page.getByTestId('bar-library').click();
      else if (mid) await page.locator('[data-testid="tab-library"]:visible').click();
    };
    const goProps = async () => {
      if (narrow) await page.getByTestId('bar-props').click();
      else if (mid) await page.locator('[data-testid="tab-props"]:visible').click();
    };
    const goCanvas = async () => {
      if (narrow) await page.getByTestId('bar-canvas').click();
    };

    await goCanvas();
    await inViewport(page, 'canvas');
    await expect(page.locator('[data-testid="node"]').first()).toBeVisible();
    await expect(page.getByTestId('zoom-fit')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    await goLibrary();
    await inViewport(page, 'library');
    await expect(page.getByTestId('lib-item').first()).toBeVisible();
    await expect(page.getByTestId('library-search')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    await goProps();
    await inViewport(page, 'props');
    await expect(page.getByTestId('props-strategy')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    // at last a step on the canvas: select an element, its properties appear
    await goCanvas();
    const first = page.locator('[data-testid="node"]').first();
    await first.click({ position: { x: 44, y: 14 } });
    if (narrow) await page.getByTestId('open-props').click();
    else if (mid) await page.locator('[data-testid="tab-props"]:visible').click();
    await expect(page.getByTestId('props-element')).toBeVisible();
    await checkLayout(page, size.width, size.height);
    expect(errors).toEqual([]);
  });
}
