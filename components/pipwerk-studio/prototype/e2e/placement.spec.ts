import { expect, test } from '@playwright/test';
import { measure } from './geometry';
import { WAYS, showCanvas } from './paths';
import { card, openApp } from './support';

// Order 06, point 1 (req-ui-017): every instance lies next to (vertical flow) or above or below (horizontal flow) the
// element of its first use, close to it, with a line that is always shown; no box collects instances; the line to
// the first use crosses no other line and no element; an instance can be moved like an element.

const SIZES = [{ width: 1366, height: 768 }, { width: 390, height: 844 }];

for (const way of WAYS) {
  for (const size of SIZES) {
    for (const dir of ['v', 'h'] as const) {
      test(`${way.id}: instances at the first use, ${dir === 'v' ? 'vertical' : 'horizontal'}, ${size.width} x ${size.height}`, async ({ page }) => {
        await way.open(page, size);
        await showCanvas(page, size);
        await page.getByTestId(dir === 'v' ? 'orient-v' : 'orient-h').click();
        await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', dir);
        const m = await measure(page);
        expect(Object.keys(m.cards).sort(), 'instances on the canvas').toEqual([...way.cards].sort());
        expect(m.flowGap, 'there is a flow with at least two elements').toBeGreaterThan(0);
        expect(m.onlyInstanceBoxes, 'no box, group or area that only collects instances').toBe(0);
        for (const name of way.cards) {
          const c = m.cards[name];
          expect(c.free, `${name} is connected`).toBe(false);
          const f = m.first.find((x) => x.src === name);
          expect(f, `${name} has a line to the element of its first use`).toBeDefined();
          if (!f) continue;
          const host = m.nodes[f.dst] ?? m.cards[f.dst];
          // close: not farther away than two consecutive elements of the flow are from each other
          expect(f.gap, `${name} is close to ${f.dst}`).toBeLessThanOrEqual(m.flowGap);
          if (dir === 'v') {
            expect(c.x + c.w, `${name} lies next to ${f.dst}`).toBeLessThanOrEqual(host.x + 1);
            expect(c.y + c.h, `${name} is level with ${f.dst}`).toBeGreaterThan(host.y - 3 * host.h);
            expect(c.y, `${name} is level with ${f.dst}`).toBeLessThan(host.y + 4 * host.h);
          } else {
            expect(c.y + c.h <= host.y + 1 || c.y >= host.y + host.h - 1, `${name} lies above or below ${f.dst}`).toBe(true);
            expect(Math.abs(c.x + c.w / 2 - (host.x + host.w / 2)), `${name} is over ${f.dst}`).toBeLessThan(2.5 * host.w);
          }
          expect(f.crossLines, `the line of ${name} crosses no other line`).toEqual([]);
          expect(f.crossBoxes, `the line of ${name} crosses no element`).toEqual([]);
        }
        // the line is always shown, with its label
        await expect(page.locator('[data-testid="wire"][data-first="1"]')).toHaveCount(way.cards.length);
        await expect(page.locator('[data-testid="wire"][data-first="1"] [data-testid="wire-label"]').first()).toBeVisible();
      });
    }
  }
}

test('an instance can be moved like an element, its line follows', async ({ page }) => {
  await openApp(page, { width: 1366, height: 768 });
  const c = card(page, 'EMA20');
  const b0 = (await c.boundingBox()) as { x: number; y: number };
  await page.mouse.move(b0.x + 60, b0.y + 14);
  await page.mouse.down();
  await page.mouse.move(b0.x + 60, b0.y - 60, { steps: 6 });
  await page.mouse.up();
  const b1 = (await c.boundingBox()) as { x: number; y: number };
  expect(Math.round(b0.y - b1.y), 'the card moved up').toBeGreaterThan(30);
  await expect(page.locator('[data-testid="wire"][data-src="EMA20"][data-first="1"]')).toHaveCount(1);
  const m = await measure(page);
  expect(m.cards.EMA20.free).toBe(false);
});
