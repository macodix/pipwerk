import { boxOf, card, clickMenu, dragBy, expect, expectSaved, library, newStrategy, node, openApp, openStrategy, showArea, SIZES, test } from './support';

// Order 20 (F3, F8; specification 5.2, 5.3, 5.5): the triggers are marked in the library, a strategy begins with a trigger,
// steps and suppliers of values are told apart in the library, on the drawing area and in the legend, and a connection that
// is refused says why.

for (const size of SIZES) {
  test(`marks the triggers in the library and tells steps from suppliers of values (${size.name})`, async ({ page }) => {
    await openApp(page, size);
    await showArea(page, 'library');

    const marked = page.locator('[data-testid="lib-item"]:has([data-testid="lib-trigger"])');
    await expect(marked).toHaveText([/Kerzenschluss/, /Tick/, /Manuell/]);
    await expect(page.getByTestId('lib-trigger').first()).toBeVisible();
    await expect(page.getByTestId('lib-trigger').first()).toHaveText('Auslöser');
    // only the triggers: "Tick" as an object of the market data carries no mark
    await expect(page.locator('[data-group="market"] [data-testid="lib-trigger"]')).toHaveCount(0);
    // the groups and their order stay
    await expect(page.getByTestId('lib-group')).toHaveCount(8);

    for (const [group, role] of [
      ['flow', 'Schritt im Ablauf'],
      ['calculation', 'Schritt im Ablauf'],
      ['actions', 'Schritt im Ablauf'],
      ['indicators', 'liefert Werte'],
      ['trends', 'liefert Werte'],
      ['market', 'liefert Werte'],
      ['account', 'liefert Werte'],
      ['rules', 'liefert Werte'],
    ] as const) {
      await expect(page.locator(`[data-group="${group}"] [data-testid="lib-group-role"]`), group).toHaveText(role);
    }
  });
}

test('the mark of a trigger is reachable with the keyboard: the entry has the focus and shows its explanation', async ({ page }) => {
  await openApp(page);
  const entry = library(page, 'Manuell');

  await entry.focus();

  await expect(page.getByTestId('tooltip')).toHaveText((await entry.getAttribute('data-tip')) ?? '');
  await expect(entry).toContainText('Auslöser');
  await expect(entry).toHaveAccessibleName(/Auslöser/);
});

test('says that a strategy begins with a trigger when the first element is none; the element stays and so does the finding', async ({ page }) => {
  await openApp(page);
  await newStrategy(page);

  await library(page, 'Bedingung').click();

  await showArea(page, 'props');
  await expect(page.getByTestId('message')).toContainText('Eine Strategie beginnt mit einem Auslöser. Wählen Sie zuerst Kerzenschluss, Tick oder Manuell in der Elementbibliothek.');
  await expect(page.getByTestId('canvas')).not.toContainText('beginnt mit einem Auslöser');
  await showArea(page, 'canvas');
  await expect(node(page, 'Bedingung')).toHaveCount(1);
  await clickMenu(page, 'check');
  await page.getByTestId('findings-count').click();
  await expect(page.locator('[data-testid="finding"][data-code="flow.main_without_trigger"]')).toHaveCount(1);
});

test('says it for a step that is dropped onto the empty drawing area, and for "Verbindung"', async ({ page }) => {
  await openApp(page);
  await newStrategy(page);
  await library(page, 'Verbindung').click();
  await expect(page.getByTestId('message')).toContainText('Eine Strategie beginnt mit einem Auslöser.');
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);

  const box = await boxOf(page.getByTestId('viewport'));
  await library(page, 'Berechnung').dragTo(page.getByTestId('viewport'), { targetPosition: { x: box.width / 2, y: box.height / 2 } });

  await expect(node(page, 'Berechnung')).toHaveCount(1);
  await expect(page.getByTestId('message')).toContainText('Eine Strategie beginnt mit einem Auslöser.');
});

test('says nothing about the trigger when the strategy begins with one', async ({ page }) => {
  await openApp(page);
  await newStrategy(page);

  await library(page, 'Kerzenschluss').click();
  await expect(node(page, 'Kerzenschluss')).toHaveCount(1);
  await library(page, 'Bedingung').click();

  await expect(node(page, 'Bedingung')).toHaveCount(1);
  await expect(page.getByTestId('message')).toHaveCount(0);
});

test('shows steps and objects in different shapes, and the legend explains both', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await page.getByTestId('zoom-fit').click();

  // different shape without colour: the corners of a step are almost square, those of a card are strongly rounded
  const radius = (locator: ReturnType<typeof node>) => locator.evaluate((item) => parseFloat(getComputedStyle(item).borderTopLeftRadius));
  const stepRadius = await radius(node(page, 'Kreuzen'));
  const cardRadius = await radius(card(page, 'EMA50'));
  expect(stepRadius).toBeLessThanOrEqual(6);
  expect(cardRadius).toBeGreaterThanOrEqual(18);
  // a step has a way in and a way out, a card has a row of values
  await expect(node(page, 'Kreuzen').getByTestId('port-in')).toHaveCount(1);
  await expect(card(page, 'EMA50').getByTestId('port-in')).toHaveCount(0);
  await expect(card(page, 'EMA50').getByTestId('card-row').first()).toBeVisible();

  await page.locator('details.legend summary').click();
  await expect(page.getByTestId('legend-step')).toContainText('Schritt im Ablauf: Rechteck mit Eingang oben und Ausgang unten');
  await expect(page.getByTestId('legend-object')).toContainText('Objekt, liefert Werte: abgerundete Karte');
});

test('says why an object cannot be the next step: by clicking and by dragging', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await page.getByTestId('zoom-fit').click();
  const source = node(page, 'Richtung');
  const port = source.locator('[data-testid^="port-out-"]').first();

  // by clicking: the output, then an object
  await port.click();
  await expect(page.getByTestId('armed-banner')).toBeVisible();
  await card(page, 'EMA50').click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('message')).toContainText('„EMA50“ liefert Werte und gehört nicht in den Ablauf.');
  await expect(page.getByTestId('message')).toContainText('Verbinden Sie einen seiner Werte mit dem Schritt, der ihn braucht');
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);

  // by dragging: from the output onto an object
  const portBox = await boxOf(port);
  const cardBox = await boxOf(card(page, 'EMA50'));
  await dragBy(page, port, cardBox.x + cardBox.width / 2 - (portBox.x + portBox.width / 2), cardBox.y + 14 - (portBox.y + portBox.height / 2));
  await expect(page.getByTestId('message')).toContainText('„EMA50“ liefert Werte und gehört nicht in den Ablauf.');
  // the refusal stays what it was: nothing was connected
  await expectSaved(page);
});

test('says why no connection starts from an object: "Verbindung" with an object chosen', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await page.getByTestId('zoom-fit').click();
  await card(page, 'EMA50').click({ position: { x: 40, y: 14 } });

  await library(page, 'Verbindung').click();

  await expect(page.getByTestId('message')).toContainText('„EMA50“ liefert Werte und gehört nicht in den Ablauf.');
  await expect(page.getByTestId('message')).toContainText('Ziehen Sie eine Linie von einem seiner Werte');
  await expect(page.getByTestId('armed-banner')).toHaveCount(0);
});

test('says why a value cannot be given to another object', async ({ page }) => {
  await openApp(page, { width: 1920, height: 1080 });
  await openStrategy(page, 'EMA-Trendfolge');
  await page.getByTestId('zoom-fit').click();

  await card(page, 'EMA50').getByTestId('port-prop-wert').click();
  await card(page, 'ATR14').click({ position: { x: 40, y: 14 } });

  await expect(page.getByTestId('armed-banner')).toContainText('„ATR14“ nimmt keinen Wert an.');
  await page.getByTestId('armed-banner').getByRole('button', { name: 'Abbrechen' }).click();
});
