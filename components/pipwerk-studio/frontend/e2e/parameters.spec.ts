import { add, bindParam, createParam, newStrategyFromScratch } from './builder';
import { removeStored, storedStrategy } from './compare';
import { choose, clickMenu, expect, expectChosen, node, openApp, showArea, SIZES, test } from './support';

// Order 24 (acceptance report 4, F5, F6; specification 5.4): the strategy parameters stand in the properties view of
// the strategy and are created, changed and removed only there; a field chooses among them, and "Zur Strategie" leads from
// a field to them and "Zurück zu …" back. They run against the real backend. In 390 x 844 everything is done with clicks.

test.use({ actionTimeout: 10_000 });

type Stored = { parameters: { name: string; datatype: string; value: unknown }[] };

test('a strategy parameter is created, changed and removed in the properties view of the strategy, and removing asks first', async ({ page }, testInfo) => {
  const name = `Strategieparameter ${testInfo.project.name}`;
  await openApp(page);
  try {
    await newStrategyFromScratch(page, name);
    await expect(page.getByTestId('param-strip')).toHaveCount(0);
    await showArea(page, 'props');
    // none yet: the properties view says what a strategy parameter is
    await expect(page.getByTestId('param-empty')).toHaveText(
      'Ein Strategieparameter ist ein Wert, den Sie hier einmal festlegen und in mehreren Feldern verwenden, zum Beispiel eine Zeiteinheit.',
    );
    // it stands right after name and description
    const sections = await page.getByTestId('props-strategy').locator('.psec').evaluateAll((all) => all.map((each) => each.getAttribute('data-testid')));
    expect(sections.indexOf('sec-parameters')).toBe(2);

    await createParam(page, 'Zeiteinheit', 'time_unit', 'h1');
    await createParam(page, 'Abstand', 'number', '2');
    await showArea(page, 'props');
    const rows = page.getByTestId('param-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Zeiteinheit' }).getByTestId('param-datatype')).toHaveText('Zeiteinheit');
    await expect(rows.filter({ hasText: 'Zeiteinheit' }).getByTestId('param-shown-value')).toHaveText('H1');
    await expect(rows.filter({ hasText: 'Abstand' }).getByTestId('param-datatype')).toHaveText('Zahl');
    await expect(rows.filter({ hasText: 'Abstand' }).getByTestId('param-shown-value')).toHaveText('2');

    // a click opens name and value
    await rows.filter({ hasText: 'Abstand' }).click();
    await page.getByTestId('param-name').fill('Weite');
    await page.getByTestId('param-value').fill('4');
    await page.getByTestId('param-done').click();
    await expect(rows.filter({ hasText: 'Weite' }).getByTestId('param-shown-value')).toHaveText('4');
    await clickMenu(page, 'save');
    const stored = (await storedStrategy(page, name)) as Stored;
    expect(stored.parameters.map((parameter) => [parameter.name, parameter.datatype, parameter.value])).toEqual([
      ['Zeiteinheit', 'time_unit', 'h1'],
      ['Weite', 'number', 4],
    ]);

    // "Entfernen" asks first: "Abbrechen" keeps it, "Entfernen" removes it
    await rows.filter({ hasText: 'Weite' }).click();
    await page.getByTestId('param-delete').click();
    await page.getByRole('dialog', { name: 'Strategieparameter entfernen?' }).getByRole('button', { name: 'Abbrechen' }).click();
    await expect(rows).toHaveCount(2);
    await page.getByTestId('param-delete').click();
    await page.getByRole('dialog', { name: 'Strategieparameter entfernen?' }).getByRole('button', { name: 'Entfernen' }).click();
    await expect(rows).toHaveCount(1);
  } finally {
    await removeStored(page, name);
  }
});

for (const size of [SIZES[0], { name: 'notebook', width: 1366, height: 768 }]) {
  test(`a field without a fitting strategy parameter leads to the strategy and back, and the new one is chosen (${size.width} x ${size.height}, with clicks)`, async ({ page }, testInfo) => {
    const name = `Zur Strategie ${size.width} ${testInfo.project.name}`;
    await openApp(page, size);
    try {
      await newStrategyFromScratch(page, name);
      await add(page, 'Kerzenschluss', 'Start');

      const field = page.getByTestId('field-zeiteinheit');
      await choose(field.getByTestId('kind-zeiteinheit'), { label: 'aus einem Strategieparameter' });
      // the field creates nothing: a sentence that names the data type of the field, and "Zur Strategie"
      await expect(field.getByTestId('param-hint')).toHaveText(
        'Es gibt noch keinen Strategieparameter für „Zeiteinheit“. Strategieparameter legen Sie in der Strategie an.',
      );
      await expect(field.getByRole('textbox')).toHaveCount(0);
      await expect(field.getByRole('button', { name: /Anlegen/ })).toHaveCount(0);
      await field.getByTestId('param-go').click();

      // the strategy parameters, visible, with the time unit preselected, and the way back
      await expect(page.getByTestId('props-strategy')).toBeVisible();
      await expect(page.getByTestId('param-new-form')).toBeInViewport();
      await expect(page.getByTestId('param-new-type')).toHaveText('Zeiteinheit');
      await expect(page.getByTestId('param-back')).toHaveText('Zurück zu „Start“');
      await page.getByTestId('param-new-name').fill('Handelszeiteinheit');
      await choose(page.getByTestId('param-new-value'), 'h4');
      await page.getByTestId('param-new-create').click();
      await expect(page.getByTestId('param-row').filter({ hasText: 'Handelszeiteinheit' })).toHaveCount(1);

      // back to the field of the element: the new strategy parameter stands there to choose
      await page.getByTestId('param-back').click();
      await expect(page.getByTestId('element-name')).toHaveValue('Start');
      await expect(page.getByTestId('field-zeiteinheit')).toBeInViewport();
      await bindParam(page, 'zeiteinheit', 'Handelszeiteinheit');
      await expectChosen(page.getByTestId('param-select'), 'handelszeiteinheit');
      await showArea(page, 'canvas');
      await expect(node(page, 'Start')).toContainText('Handelszeiteinheit');
      await clickMenu(page, 'save');
      const stored = (await storedStrategy(page, name)) as Stored;
      expect(stored.parameters.map((parameter) => [parameter.name, parameter.datatype, parameter.value])).toEqual([
        ['Handelszeiteinheit', 'time_unit', 'h4'],
      ]);

      // the way back lapses when another element is chosen
      await showArea(page, 'canvas');
      await page.getByTestId('status-pill').click();
      await showArea(page, 'props');
      await expect(page.getByTestId('param-back')).toHaveCount(0);
      await expect(page.getByTestId('param-new-form')).toHaveCount(0);
    } finally {
      await removeStored(page, name);
    }
  });
}
