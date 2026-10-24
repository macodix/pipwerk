import { expect, library, newStrategy, node, openApp, openStrategy, showArea, test } from './support';

// Specification 5.2: groups from the type descriptions in the order of the specification, search, explanation of every
// entry when it is pointed at and when it has the keyboard focus.

test('has the groups of the specification in their order, and the entries that the type descriptions assign to them', async ({ page, api }) => {
  void api;
  await openApp(page);

  const groups = page.getByTestId('lib-group');
  await expect(groups).toHaveCount(8);
  await expect(groups.nth(0)).toContainText('Ablaufsteuerung');
  await expect(groups.nth(1)).toContainText('Berechnung');
  await expect(groups.nth(2)).toContainText('Indikatoren');
  await expect(groups.nth(3)).toContainText('Trends');
  await expect(groups.nth(4)).toContainText('Marktdaten');
  await expect(groups.nth(5)).toContainText('Konto');
  await expect(groups.nth(6)).toContainText('Aktionen');
  await expect(groups.nth(7)).toContainText('Regeln und Regelwerke');
  // "Verbindung" is the way to connect without dragging; "Tick" stands twice, as a trigger and as an object
  await expect(groups.nth(0).getByTestId('lib-item')).toHaveText([/Kerzenschluss/, /Tick/, /Manuell/, /Bedingung/, /Verbindung/]);
  await expect(groups.nth(1).getByTestId('lib-item')).toHaveText([/Berechnung/]);
  await expect(groups.nth(2).getByTestId('lib-item')).toHaveText([/eigener Indikator/, /EMA/, /ATR/, /ZigZag/]);
  await expect(groups.nth(3).getByTestId('lib-item')).toHaveText([/eigener Trend/]);
  await expect(groups.nth(4).getByTestId('lib-item')).toHaveText([/Instrument/, /Kerze/, /Tick/]);
  await expect(groups.nth(5).getByTestId('lib-item')).toHaveText([/Konto/]);
  await expect(groups.nth(6).getByTestId('lib-item')).toHaveText([/Order aufgeben/, /Order ändern/, /Order löschen/, /Position ändern/, /Position schließen/]);
  await expect(groups.nth(7).getByTestId('lib-item')).toHaveText([/Risiko je Trade/, /eigene Regel/, /eigenes Regelwerk/]);
  // no "Neues Objekt": it belongs to a later package
  await expect(page.getByTestId('library')).not.toContainText('Neues Objekt');
});

test('shows the explanation of an entry when it is pointed at and when it has the focus with the keyboard', async ({ page, api }) => {
  void api;
  await openApp(page, { width: 1366, height: 768 });

  const first = library(page, 'Kerzenschluss');
  const explanation = (await first.getAttribute('data-tip')) ?? '';
  expect(explanation).not.toBe('');
  await first.hover();
  await expect(page.getByTestId('tooltip')).toHaveText(explanation);

  await page.mouse.move(700, 400);
  await expect(page.getByTestId('tooltip')).toHaveCount(0);
  const second = library(page, 'Berechnung');
  const other = (await second.getAttribute('data-tip')) ?? '';
  expect(other).not.toBe('');
  await second.focus();
  await expect(page.getByTestId('tooltip')).toHaveText(other);
});

test('searches names and explanations, and shows what to do when nothing is found', async ({ page, api }) => {
  void api;
  await openApp(page);

  await page.getByTestId('library-search').fill('indikator');
  await expect(page.getByTestId('lib-item')).toHaveText([/eigener Indikator/]);

  await page.getByTestId('library-search').fill('xyz-gibt-es-nicht');
  await expect(page.getByTestId('lib-item')).toHaveCount(0);
  await expect(page.getByTestId('library')).toContainText('Nichts gefunden');
});

test('does not insert without a strategy and says what to do', async ({ page, api }) => {
  void api;
  await openApp(page);
  // the hint stands in the properties view and nowhere else (specification 5.5)
  await showArea(page, 'props');
  await expect(page.getByTestId('props-none')).toContainText('Nächster Schritt');
  await expect(page.getByTestId('canvas')).not.toContainText('Nächster Schritt');

  await library(page, 'Kerzenschluss').click();

  await showArea(page, 'props');
  await expect(page.getByTestId('message')).toContainText('Öffnen Sie zuerst eine Strategie');
  await expect(page.getByTestId('canvas')).not.toContainText('Öffnen Sie zuerst');
});

test('inserts a trigger and a step: the second is connected behind the first', async ({ page, api }) => {
  void api;
  await openApp(page);
  await newStrategy(page);

  await library(page, 'Kerzenschluss').click();
  await expect(node(page, 'Kerzenschluss')).toHaveCount(1);
  await showArea(page, 'library');
  await library(page, 'Bedingung').click();

  await expect(node(page, 'Bedingung')).toHaveCount(1);
  await expect(page.getByTestId('flow-edge')).toHaveCount(1);
  await expect(page.getByTestId('lane-empty')).toBeVisible();
  // the parameter of the trigger is "nicht belegt" and required: the properties view says so
  await node(page, 'Kerzenschluss').click({ position: { x: 40, y: 14 } });
  await expect(page.getByTestId('field-zeiteinheit').getByLabel('Pflicht')).toBeVisible();
});

test('lets the user assign a strategy parameter to a field, creating it on the spot', async ({ page, api }) => {
  void api;
  await openApp(page);
  await newStrategy(page);
  await library(page, 'Kerzenschluss').click();
  await showArea(page, 'props');

  await page.getByTestId('kind-zeiteinheit').selectOption({ label: 'Strategieparameter' });
  await expect(page.getByTestId('param-hint')).toContainText('noch kein Strategieparameter');
  await page.getByTestId('new-param-name').fill('Meine Zeiteinheit');
  await page.getByTestId('new-param-create').click();

  await expect(page.getByTestId('param-chip')).toContainText('Meine Zeiteinheit');
  await expect(page.getByTestId('param-select')).toHaveValue('meine_zeiteinheit');
  await expect(node(page, 'Kerzenschluss')).toContainText('Meine Zeiteinheit');
});

test('lets the user change the order type: the new properties get their standard values', async ({ page, api }) => {
  void api;
  await openApp(page);
  await openStrategy(page, 'EMA-Trendfolge');
  await node(page, 'Order aufgeben').click({ position: { x: 40, y: 14 } });

  await expect(page.getByTestId('field-gueltigkeit')).toHaveCount(0);
  await page.getByTestId('value-ordertyp').selectOption({ label: 'Stop-Order' });

  await expect(page.getByTestId('field-preis')).toBeVisible();
  await expect(page.getByTestId('value-gueltigkeit')).toHaveValue('bis_auf_widerruf');
  // the properties that were already assigned stay
  await expect(page.getByTestId('kind-richtung')).toHaveValue('expression');
});
