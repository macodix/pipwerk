import { select } from './builder';
import { boxOf, clickMenu, expect, openApp, openStrategy, overlap, showArea, SIZES, test, type Box } from './support';
import type { Page } from '@playwright/test';

// Specification 5.1 and 5.3: the arrangement in the six window sizes with the open strategy "EMA-Trendfolge". In every size
// no area lies over another, none has width or height zero, the page has no horizontal scroll bar, and the library,
// the drawing area, the properties view and the strategy parameters can be reached.

type Region = { region: string; x: number; y: number; w: number; h: number };

async function regions(page: Page): Promise<Region[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-region]'))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { region: element.dataset.region ?? '', x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      }),
  );
}

async function checkLayout(page: Page, width: number, height: number): Promise<void> {
  const page_ = await page.evaluate(() => ({
    docWidth: document.documentElement.scrollWidth,
    docHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));
  const wide =
    page_.docWidth <= page_.innerWidth
      ? []
      : await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('body *'))
            .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1 && element.getBoundingClientRect().width > 0)
            .slice(0, 8)
            .map((element) => `${element.tagName.toLowerCase()}.${element.className.toString().slice(0, 40)}`),
        );
  expect(page_.docWidth, `page scroll width, wide elements: ${wide.join(' | ')}`).toBeLessThanOrEqual(page_.innerWidth);
  expect(page_.bodyWidth, 'body scroll width').toBeLessThanOrEqual(page_.innerWidth);
  expect(page_.docHeight, 'page scroll height').toBeLessThanOrEqual(page_.innerHeight);
  const visible = await regions(page);
  expect(visible.length).toBeGreaterThanOrEqual(4);
  for (const region of visible) {
    expect(region.w, `${region.region} has width`).toBeGreaterThan(40);
    expect(region.h, `${region.region} has height`).toBeGreaterThan(20);
    expect(region.x, `${region.region} left edge`).toBeGreaterThanOrEqual(-1);
    expect(region.x + region.w, `${region.region} right edge`).toBeLessThanOrEqual(width + 1);
    expect(region.y + region.h, `${region.region} bottom edge`).toBeLessThanOrEqual(height + 1);
  }
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const a = visible[i] as Region;
      const b = visible[j] as Region;
      const box = (r: Region): Box => ({ x: r.x, y: r.y, width: r.w, height: r.h });
      expect(overlap(box(a), box(b)), `${a.region} and ${b.region} overlap`).toBe(false);
    }
  }
}

async function inViewport(page: Page, testId: string): Promise<void> {
  const target = page.getByTestId(testId).first();
  await expect(target).toBeVisible();
  const box = await boxOf(target);
  const size = page.viewportSize() as { width: number; height: number };
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(size.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
}

for (const size of SIZES) {
  test(`window size ${size.width} x ${size.height} (${size.name})`, async ({ page, errors }) => {
    await openApp(page, { width: size.width, height: size.height });
    await openStrategy(page, 'EMA-Trendfolge');
    await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
    await checkLayout(page, size.width, size.height);

    // the strategy parameters are always visible and can be changed
    await inViewport(page, 'param-strip');
    await expect(page.getByTestId('param-chip')).toHaveCount(2);
    await page.getByTestId('param-chip').first().click();
    await inViewport(page, 'param-popover');
    await page.getByTestId('param-done').click();

    // the menu: all entries can be reached
    const ids = ['new', 'open', 'save', 'check', 'close', 'delete', 'settings'];
    if (size.width >= 1280) {
      for (const id of ids) {
        await inViewport(page, `menu-${id}`);
      }
    } else {
      await page.getByTestId('menu-toggle').click();
      for (const id of ids) {
        await inViewport(page, `cmenu-${id}`);
      }
      await page.getByTestId('menu-toggle').click();
    }
    await inViewport(page, 'menu-about');

    // the drawing area, the library and the properties view: side by side or one after the other
    await showArea(page, 'canvas');
    await inViewport(page, 'canvas');
    await expect(page.locator('[data-testid="node"]').first()).toBeVisible();
    await expect(page.getByTestId('zoom-fit')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    await showArea(page, 'library');
    await inViewport(page, 'library');
    await expect(page.getByTestId('lib-item').first()).toBeVisible();
    await expect(page.getByTestId('library-search')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    await showArea(page, 'props');
    await inViewport(page, 'props');
    await expect(page.getByTestId('props-strategy')).toBeVisible();
    await checkLayout(page, size.width, size.height);

    // a step on the drawing area: select it, its properties appear
    await showArea(page, 'canvas');
    await page.locator('[data-testid="node"]').first().click({ position: { x: 44, y: 14 } });
    if (size.width < 700) {
      await page.getByTestId('open-props').click();
    } else if (size.width < 1100) {
      await page.locator('[data-testid="tab-props"]:visible').click();
    }
    await expect(page.getByTestId('props-element')).toBeVisible();
    await checkLayout(page, size.width, size.height);
    expect(errors).toEqual([]);
  });
}

// In the two sizes of a smartphone the menu and the dialogs are reachable and lie within the window (specification 5.1).
for (const size of SIZES.filter((candidate) => candidate.width === 390 || candidate.width === 844)) {
  test(`menu and dialogs in ${size.width} x ${size.height}`, async ({ page, errors }) => {
    await openApp(page, { width: size.width, height: size.height });
    await openStrategy(page, 'EMA-Trendfolge');

    const withinWindow = async (testId: string | null): Promise<void> => {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const box = await boxOf(dialog);
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(size.width + 1);
      expect(box.y).toBeGreaterThanOrEqual(-1);
      expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1);
      if (testId !== null) {
        await expect(page.getByTestId(testId)).toBeVisible();
      }
    };

    // open
    await clickMenu(page, 'open');
    await withinWindow('open-list');
    await page.getByTestId('dialog-cancel').click();

    // settings
    await clickMenu(page, 'settings');
    await withinWindow(null);
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();

    // the question about unsaved changes
    await page.getByTestId('strategy-name').count();
    await showArea(page, 'canvas');
    await page.getByTestId('status-pill').click();
    await showArea(page, 'props');
    await page.getByTestId('strategy-name').fill('EMA-Trendfolge geändert');
    await clickMenu(page, 'close');
    await withinWindow(null);
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();

    // the question before deleting
    await clickMenu(page, 'delete');
    await withinWindow(null);
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();

    // the question "Dateien verschieben?" in the settings
    await clickMenu(page, 'settings');
    await withinWindow(null);
    await page.getByRole('dialog').getByLabel('Verzeichnis (absoluter Pfad)').fill('/pfad/gibt/es/nicht');
    await page.getByRole('dialog').getByRole('button', { name: 'Verzeichnis ändern' }).click();
    await expect(page.getByRole('dialog').getByText('Dateien verschieben?')).toBeVisible();
    await withinWindow(null);
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Ja, Dateien verschieben' })).toBeInViewport();
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' })).toBeInViewport();
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();

    // the question before removing an object that steps use
    await select(page, 'EMA20');
    await page.getByTestId('remove-element').click();
    await withinWindow('remove-users');
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();

    // about
    await page.getByTestId('menu-about').click();
    await withinWindow(null);
    await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
    expect(errors).toEqual([]);
  });
}
