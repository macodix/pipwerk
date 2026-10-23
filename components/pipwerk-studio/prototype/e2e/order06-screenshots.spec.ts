import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measure } from './geometry';
import { lib, openApp } from './support';
import { FREE_WAYS, WAYS, showCanvas } from './paths';

// Order 06: pictures of every way in which instances get onto the canvas, vertical and horizontal.
// The prefix names the state: "vorher" before the change of order 06, "nachher" after it.
const PREFIX = 'nachher';
const here = dirname(fileURLToPath(import.meta.url));
const out = (name: string) => join(here, '..', 'screenshots', name);
const shot = async (page: Page, name: string) => {
  const vp = page.viewportSize() as { width: number; height: number };
  await page.mouse.move(1, vp.height - 1);
  await page.waitForTimeout(450);
  await page.screenshot({ path: out(name) });
};

// the properties view of an EMA with the description of what it delivers (not part of the before/after comparison)
for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
  test(`properties view of an EMA, ${size.width} x ${size.height}`, async ({ page }) => {
    await openApp(page, size);
    if (size.width >= 1280) await page.getByTestId('menu-new').click();
    else {
      await page.getByTestId('menu-toggle').click();
      await page.getByTestId('cmenu-new').click();
    }
    await page.getByTestId('wz-leave').click();
    if (size.width < 700) await page.getByTestId('bar-library').click();
    await lib(page, 'EMA').click();
    if (size.width < 700) await page.getByTestId('bar-props').click();
    await expect(page.getByTestId('toast')).toHaveCount(0, { timeout: 8000 });
    await page.getByTestId('sec-delivers').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(page, `ema-eigenschaften-${size.width}x${size.height}.png`);
  });
}

for (const way of [...WAYS, ...FREE_WAYS]) {
  for (const dir of ['v', 'h'] as const) {
    test(`${PREFIX}: ${way.id}, ${dir}`, async ({ page }) => {
      const size = { width: 1366, height: 768 };
      await way.open(page, size);
      await showCanvas(page, size);
      await page.getByTestId(dir === 'v' ? 'orient-v' : 'orient-h').click();
      await page.getByTestId('zoom-fit').click();
      await shot(page, `${PREFIX}-${way.id}-${dir === 'v' ? 'senkrecht' : 'waagerecht'}-1366x768.png`);
      const m = await measure(page);
      console.log(`MEASURE ${way.id} ${dir} flowGap=${m.flowGap} onlyInstanceBoxes=${m.onlyInstanceBoxes}`);
      for (const f of m.first) console.log(`  ${f.src} > ${f.dst}: gap ${Math.round(f.gap)} crossLines [${f.crossLines.join('; ')}] crossBoxes [${f.crossBoxes.join('; ')}]`);
    });
  }
}
