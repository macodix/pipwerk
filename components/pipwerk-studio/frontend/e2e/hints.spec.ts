import type { Page } from '@playwright/test';

import { add, newStrategyFromScratch } from './builder';
import { clickMenu, expect, openApp, showArea, SIZES, test } from './support';

// Specification 5.3 (no hints on the drawing area, req-ui-016) and 5.5 (empty states): hints, the guided setup and short
// messages stand in the properties view and nowhere else; "Keine Strategie geöffnet" is shown exactly once.

/** Words of the hints of the interface: none of them stands on the drawing area. */
const HINT_WORDS = /Nächster Schritt|Beginnen Sie|Hier beginnt|ziehen Sie|Klicken Sie|Öffnen Sie|Assistent|Noch keine|noch kein/;

async function expectNoHintOnCanvas(page: Page, situation: string): Promise<void> {
  await showArea(page, 'canvas');
  const canvas = page.getByTestId('canvas');
  await expect(canvas, situation).toBeVisible();
  const text = (await canvas.innerText()).replace(/\s+/g, ' ');
  expect(text, `${situation}: text on the drawing area`).not.toMatch(HINT_WORDS);
  await expect(canvas.locator('[data-testid*="hint"], [class*="hint"], [data-testid="lane-empty"], [data-testid="message"]'), situation).toHaveCount(0);
}

for (const size of SIZES) {
  test(`"Keine Strategie geöffnet" is shown once, in the properties view, and the drawing area has no hint (${size.width} x ${size.height})`, async ({ page }) => {
    await openApp(page, size);
    await expect(page.getByText('Keine Strategie geöffnet')).toHaveCount(1);
    await showArea(page, 'props');
    await expect(page.getByTestId('props-none').getByText('Keine Strategie geöffnet')).toBeVisible();
    await expectNoHintOnCanvas(page, 'without a strategy');
    await expect(page.getByText('Keine Strategie geöffnet')).toHaveCount(1);
  });
}

for (const size of [SIZES[0], SIZES[4]]) {
  test(`no hint stands on the drawing area for an empty strategy, a management without steps and an object without a line (${size.width} x ${size.height})`, async ({ page }) => {
    await openApp(page, size);
    await newStrategyFromScratch(page, `Ohne Hinweise ${size.width} ${test.info().project.name}`);
    await expect(page.getByText('Keine Strategie geöffnet')).toHaveCount(0);
    await expectNoHintOnCanvas(page, 'empty strategy');

    // a step that places an order has a frame for its management; the frame has no steps
    await add(page, 'Kerzenschluss');
    await add(page, 'Order aufgeben');
    await showArea(page, 'canvas');
    await expect(page.getByTestId('frame')).toHaveCount(1);
    await expectNoHintOnCanvas(page, 'management without steps');

    // an object that no element uses has a card and no line
    await add(page, 'EMA', 'EMA ohne Verbindung');
    await showArea(page, 'canvas');
    await expect(page.getByTestId('card')).toHaveCount(1);
    await expectNoHintOnCanvas(page, 'object without a line');

    // the hint of the empty strategy and the guided setup belong to the properties view: they come back there
    await clickMenu(page, 'close');
    const discard = page.getByRole('dialog').getByRole('button', { name: 'Verwerfen' });
    if (await discard.isVisible()) {
      await discard.click();
    }
    await showArea(page, 'props');
    await expect(page.getByTestId('props-none').getByText('Keine Strategie geöffnet')).toBeVisible();
    await expect(page.getByText('Keine Strategie geöffnet')).toHaveCount(1);
  });
}
