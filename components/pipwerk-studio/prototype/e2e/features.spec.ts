import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { add, clickNode, field, newStrategyFromScratch, props, reveal, setCalculation, wire } from './builder';
import { card, lib, node, openApp } from './support';

const viewOf = async (page: Page) => (await page.getByTestId('canvas').getAttribute('data-view')) as string;
const box = async (loc: ReturnType<Page['locator']>) => (await loc.first().boundingBox()) as { x: number; y: number; width: number; height: number };

test.describe('library, explanations, names', () => {
  test('groups and contents as the client defined them (M8, M9), every entry has an explanation', async ({ page }) => {
    await openApp(page);
    const groups = await page.locator('[data-testid="lib-group"]').evaluateAll((els) =>
      els.map((g) => ({
        id: (g as HTMLElement).dataset.group,
        title: g.querySelector('.lib-group-head span')?.textContent,
        items: Array.from(g.querySelectorAll('[data-testid="lib-item"]')).map((i) => (i as HTMLElement).dataset.label),
        tips: Array.from(g.querySelectorAll('[data-testid="lib-item"]')).map((i) => (i as HTMLElement).dataset.tip ?? ''),
      })),
    );
    // req-ui-018: by task; the visible names are the technical group names without a common heading
    expect(groups.map((g) => g.title)).toEqual([
      'Ablaufsteuerung', 'Berechnung', 'Indikatoren', 'Trends', 'Marktdaten', 'Konto', 'Aktionen', 'Regeln und Regelwerke',
    ]);
    expect(groups[0].items).toEqual(['Kerzenschluss', 'Tick', 'Bedingung', 'Verbindung']);
    expect(groups[1].items).toEqual(['Berechnung', 'Strategieparameter ändern']);
    expect(groups[2].items).toEqual(['EMA', 'ATR', 'ZigZag', 'eigener Indikator', 'Schneller EMA 9']);
    expect(groups[3].items).toEqual(['1-2-3-Trend (Markttechnik)', 'eigener Trend', 'Trend H1']);
    expect(groups[4].items).toEqual(['Instrument', 'Kerze', 'Tick']);
    expect(groups[5].items).toEqual(['Konto']);
    expect(groups[6].items).toEqual(['Order aufgeben', 'Order ändern', 'Order löschen', 'Position ändern', 'Position schließen']);
    expect(groups[7].items).toEqual(['Risiko je Trade', 'eigene Regel', 'eigenes Regelwerk', 'Order-Check']);
    for (const g of groups) for (const t of g.tips) expect(t.length, `explanation in ${g.title}`).toBeGreaterThan(20);
    // stored templates stand in their group, marked as own
    await expect(page.locator('[data-testid="lib-item"][data-label="Schneller EMA 9"] .tag-own')).toHaveText('eigene');
    // the explanation appears on hover
    await lib(page, 'ZigZag').hover();
    await expect(page.getByTestId('tooltip')).toContainText('Wendepunkte');
  });

  test('every field of every element has an explanation, objects show what they deliver (M7)', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Erklärungen');
    const keys = [
      'trigger.candle_close', 'trigger.tick', 'flow.condition', 'flow.calculation', 'flow.set_parameter', 'flow.place_order', 'flow.modify_order',
      'flow.delete_order', 'flow.modify_position', 'flow.close_position', 'Konto', 'Instrument', 'Kerze', 'Tick', 'EMA', 'ATR', 'ZigZag',
      'Markttechnik', 'Trend', 'Indikator',
    ];
    for (const k of keys) {
      await lib(page, k).click();
      await expect(props(page)).toBeVisible();
      const labels = await props(page).locator('.field-label').evaluateAll((els) => els.map((e) => ({ t: e.textContent, tip: (e as HTMLElement).dataset.tip ?? '' })));
      for (const l of labels) expect(l.tip.length, `explanation for field ${l.t} of ${k}`).toBeGreaterThan(10);
      const rows = await props(page).locator('.prop-row').evaluateAll((els) => els.map((e) => ({ t: e.textContent, tip: (e as HTMLElement).dataset.tip ?? '' })));
      for (const r of rows) expect(r.tip.length, `explanation for property ${r.t} of ${k}`).toBeGreaterThan(5);
    }
    // an instance shows its properties with label, data type and possible values
    await lib(page, 'Markttechnik').click();
    await expect(props(page).locator('.prop-row')).toHaveCount(6);
    await expect(props(page).locator('.prop-row').filter({ hasText: 'Trendrichtung' })).toContainText('aufwärts · abwärts · kein Trend');
    await expect(props(page).getByTestId('element-origin')).toContainText('aus Objekttyp 1-2-3-Trend (Markttechnik)');
    await lib(page, 'ZigZag').click();
    await expect(props(page).locator('.prop-row')).toHaveCount(9);
  });

  test('parameters: visible label for the kind of assignment, hint when no strategy parameter exists (M5), trend fully assignable (M6)', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Trend');
    await lib(page, 'Trend').click();
    const unit = field(page, 'zeiteinheit');
    await expect(unit.locator('.kind-cap')).toHaveText('Belegung');
    await expect(unit.getByTestId('kind-zeiteinheit')).toHaveValue('unset');
    await expect(unit.getByTestId('kind-zeiteinheit').locator('option:checked')).toHaveText('nicht belegt');
    await expect(unit.getByTestId('kind-zeiteinheit').locator('option')).toContainText(['nicht belegt', 'Fester Wert', 'Strategieparameter', 'Wert eines Objekts', 'Berechnung aus Bausteinen']);
    await unit.getByTestId('kind-zeiteinheit').selectOption('param');
    await expect(unit.getByTestId('param-hint')).toContainText('Es ist noch kein Strategieparameter angelegt');
    await unit.getByTestId('new-param-name').fill('Zeiteinheit');
    await unit.getByTestId('new-param-create').click();
    await expect(unit.getByTestId('param-select').locator('option:checked')).toHaveText('Zeiteinheit');
    await expect(page.getByTestId('param-chip')).toContainText('Zeiteinheit');
    // calculation procedure and the expression for the direction
    await expect(field(page, 'methode').getByTestId('value-methode').locator('option:checked')).toHaveText('Ausdruck');
    const dir = page.locator('#own-direction-expr');
    await expect(dir).toBeVisible();
    // an indicator inside of the trend, its value decides the direction
    await page.getByTestId('own-includes').locator('select').selectOption('EMA');
    await setCalculationIn(page, dir, { iff: [{ cmp: [{ pick: 'EMA › Wert' }, '>', { num: 0 }] }, { text: 'aufwärts' }, { text: 'abwärts' }] });
    await expect(dir.getByTestId('expr-sentence')).toContainText('wenn EMA ist größer als 0, dann „aufwärts“, sonst „abwärts“');
    await expect(props(page).locator('.prop-row').filter({ hasText: 'Richtung' })).toBeVisible();
  });

  test('strategy parameter: selection instead of free text in "change strategy parameter" (M12)', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Parameter');
    await lib(page, 'flow.set_parameter').click();
    await expect(page.getByTestId('param-hint')).toContainText('noch kein Strategieparameter');
    await page.getByTestId('new-param-name').fill('Handelszeiteinheit');
    await page.getByTestId('new-param-create').click();
    await expect(page.getByTestId('param-select').locator('option:checked')).toHaveText('Handelszeiteinheit');
    await expect(page.getByTestId('param-strip')).toContainText('Handelszeiteinheit');
  });
});

async function setCalculationIn(page: Page, panel: ReturnType<Page['locator']>, v: Parameters<typeof setCalculation>[1]): Promise<void> {
  const { setValue } = await import('./builder');
  await setValue(panel.locator(':scope > .vb'), v);
  void page;
}

test.describe('canvas', () => {
  test('the view does not jump when elements are placed, nothing outside the management lies in its frame (M3)', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Ansicht');
    const v0 = await viewOf(page);
    // the first element is dragged from the library onto the canvas
    await lib(page, 'trigger.candle_close').dragTo(page.getByTestId('viewport'), { targetPosition: { x: 300, y: 200 } });
    await expect(page.locator('[data-testid="node"]')).toHaveCount(1);
    expect(await viewOf(page)).toBe(v0);
    await add(page, 'flow.condition', 'Prüfung');
    await add(page, 'flow.place_order');
    expect(await viewOf(page)).toBe(v0);
    // main-flow elements after the order do not end up in the frame of its management
    await add(page, 'flow.calculation', 'Danach');
    await add(page, 'flow.delete_order', 'Wieder weg');
    const frame = await box(page.getByTestId('frame'));
    for (const name of ['Kerzenschluss', 'Prüfung', 'Order aufgeben', 'Danach', 'Wieder weg']) {
      const n = node(page, name).first();
      if ((await n.count()) === 0) continue;
      const b = await box(n);
      const overlap = Math.min(b.x + b.width, frame.x + frame.width) > Math.max(b.x, frame.x) && Math.min(b.y + b.height, frame.y + frame.height) > Math.max(b.y, frame.y);
      expect(overlap, `${name} lies in the frame`).toBe(false);
    }
  });

  test('orientation can be switched, in both directions the flow runs from entry to exit', async ({ page }) => {
    await openApp(page);
    const a = await box(node(page, 'Kerzenschluss').first());
    const b = await box(node(page, 'Kreuzen'));
    expect(b.y).toBeGreaterThan(a.y + a.height - 1);
    expect(Math.abs(b.x - a.x)).toBeLessThan(5);
    await page.getByTestId('orient-h').click();
    await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'h');
    const a2 = await box(node(page, 'Kerzenschluss').first());
    const b2 = await box(node(page, 'Kreuzen'));
    expect(b2.x).toBeGreaterThan(a2.x + a2.width - 1);
    expect(Math.abs(b2.y - a2.y)).toBeLessThan(5);
    await page.getByTestId('orient-v').click();
    await expect(page.getByTestId('canvas')).toHaveAttribute('data-orient', 'v');
  });

  test('sections and the management frame can be collapsed and expanded, an element can be moved', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('band')).toHaveCount(3);
    await page.locator('[data-testid="band"][data-section="Einstieg"] [data-testid="section-collapse"]').click();
    await expect(page.getByTestId('section-node')).toHaveCount(1);
    await expect(node(page, 'Kreuzen')).toHaveCount(0);
    await expect(page.getByTestId('section-node')).toContainText('Einstieg');
    await page.getByTestId('section-expand').click();
    await expect(node(page, 'Kreuzen')).toHaveCount(1);
    const before = await page.locator('[data-testid="node"]').count();
    await page.getByTestId('frame-toggle').click();
    await expect(page.locator('[data-testid="node"]')).toHaveCount(before - 7);
    await page.getByTestId('frame-toggle').click();
    await expect(page.locator('[data-testid="node"]')).toHaveCount(before);
    // move "Richtung" a bit
    const n = node(page, 'Richtung');
    await reveal(page, n);
    const b0 = await box(n);
    await page.mouse.move(b0.x + 40, b0.y + 14);
    await page.mouse.down();
    await page.mouse.move(b0.x + 90, b0.y + 44, { steps: 6 });
    await page.mouse.up();
    const b1 = await box(n);
    expect(Math.round(b1.x - b0.x)).toBeGreaterThan(30);
    await page.getByTestId('arrange').click();
    const b2 = await box(n);
    expect(Math.abs(b2.x - b0.x)).toBeLessThan(3);
  });

  test('further uses: the connection to the first use is always shown, further uses are shown and hidden, a dragged value is a further use (req-ui-014, req-ui-017)', async ({ page }) => {
    await openApp(page, { width: 1920, height: 1080 });
    const further = wire(page, 'EMA50', 'Richtung');
    // the switch starts at "Selection": nothing selected, so no further use; the first use is there
    await expect(page.getByTestId('wires-sel')).toHaveClass(/on/);
    await expect(further).toHaveCount(0);
    await expect(wire(page, 'EMA50', 'Kreuzen')).toHaveAttribute('data-first', '1');
    await clickNode(page, 'Richtung');
    await expect(further).toHaveAttribute('data-first', '0');
    await page.getByTestId('wires-off').click();
    await expect(further).toHaveCount(0);
    await expect(wire(page, 'EMA50', 'Kreuzen')).toHaveCount(1);
    await page.getByTestId('wires-all').click();
    await expect(further).toHaveCount(1);
    // dragging a value from the row of a card onto another element: a further use, listed in its properties
    const port = card(page, 'ATR14').locator('[data-port-prop="wert"]');
    const target = node(page, 'Kreuzen');
    await reveal(page, port);
    await reveal(page, target);
    const pb = await box(port);
    const tb = await box(target);
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
    await page.mouse.down();
    await page.mouse.move(tb.x + 60, tb.y + 30, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId('toast')).toContainText('Eingang');
    await expect(wire(page, 'ATR14', 'Kreuzen')).toHaveAttribute('data-first', '0');
    await expect(page.getByTestId('use-row').filter({ hasText: 'ATR14' })).toHaveCount(1);
    // the first use of ATR14 stays where it is
    await expect(wire(page, 'ATR14', 'StopLoss')).toHaveAttribute('data-first', '1');
  });

  test('a parameter of an object can take the value of another object, the line leads from card to card', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'EMA20');
    const period = field(page, 'periode');
    await period.getByTestId('kind-periode').selectOption('ref');
    await period.getByTestId('ref-object').selectOption({ label: 'ATR14' });
    await period.getByTestId('ref-prop').selectOption({ label: 'Wert' });
    const w = page.locator('[data-testid="wire"][data-src="ATR14"][data-dst="EMA20"]');
    await expect(w).toHaveCount(1);
    await expect(w).toHaveAttribute('data-first', '0');
    await expect(card(page, 'EMA20').locator('.card-sub')).toContainText('Periode');
  });

  test('renaming a connected object renames its uses, deleting asks and leaves empty blocks that the check reports', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'EMA20');
    await page.getByTestId('element-name').fill('Schnelle Linie');
    await expect(node(page, 'Kreuzen')).toContainText('Schnelle Linie kreuzt EMA50 in beide Richtungen');
    await clickNode(page, 'Kreuzen');
    await page.getByTestId('view-formula').click();
    await expect(page.getByTestId('formula-input')).toHaveValue(/\[Schnelle Linie\]\.Wert/);
    // delete the connected object
    await clickNode(page, 'EMA50');
    await page.getByTestId('remove-element').click();
    const dlg = page.getByTestId('dialog-remove-element');
    await expect(dlg).toContainText('Diese Elemente verwenden seine Werte');
    await expect(dlg.locator('.usage-list li')).toContainText(['Kreuzen', 'Richtung']);
    await page.getByTestId('remove-confirm').click();
    await expect(card(page, 'EMA50')).toHaveCount(0);
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-count')).toContainText(/Befund/);
    await clickNode(page, 'Kreuzen');
    await expect(page.getByTestId('findings-box')).toContainText('Ein Baustein des Ausdrucks ist noch leer');
    await expect(page.getByTestId('findings-box')).toContainText('So beheben Sie es');
  });

  test('a section is formed from the properties of an element', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'Kreuzen');
    await page.getByTestId('section-select').selectOption('__new');
    await page.getByTestId('section-name').fill('Signal');
    await page.getByTestId('section-create').click();
    await expect(page.locator('[data-testid="band"][data-section="Signal"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="band"][data-section="Einstieg"]')).toHaveCount(1);
  });

  test('wires of Markttechnik show their bundle (str-01)', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-open').click();
    await page.locator('[data-testid="open-row"][data-sample="str01"]').click();
    const w = page.locator('[data-testid="wire"][data-src="Markttechnik Signal"][data-dst="Intakter Trend in der Bewegung"]');
    await expect(w).toHaveCount(1);
    // one line, its label names both values the element uses
    await expect(w).toHaveAttribute('data-label', 'Trend intakt, Phase');
    // the line to the first use is short (order 06): the picture shortens a long label, the full text is in data-label
    await expect(w).toHaveAttribute('data-label', 'Trend intakt, Phase');
    await card(page, 'Markttechnik Handel').getByTestId('card-more').click();
    await expect(card(page, 'Markttechnik Handel').locator('.card-row')).toHaveCount(6);
  });
});

test.describe('assistant, findings, rules', () => {
  test('the assistant creates trigger, indicators, condition and order and can be left at any time', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-new').click();
    await expect(page.getByTestId('wz-step-1')).toBeVisible();
    await page.getByTestId('wz-name').fill('Assistent-Strategie');
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-unit').selectOption('h4');
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-add-EMA').click();
    await page.getByTestId('wz-add-EMA').click();
    await expect(page.getByTestId('wz-indicator')).toHaveCount(2);
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-a').selectOption({ index: 1 });
    await page.getByTestId('wz-b').selectOption({ index: 2 });
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-ordertype').selectOption('MarketOrder');
    await page.getByTestId('wz-next').click();
    await expect(page.getByTestId('wizard')).toHaveCount(0);
    await expect(page.locator('[data-testid="node"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="card"]')).toHaveCount(2);
    // both indicators lie at the condition, the first use, nothing waits to be connected
    await expect(page.getByTestId('card-free')).toHaveCount(0);
    await expect(page.locator('[data-testid="wire"][data-first="1"]')).toHaveCount(2);
    await expect(page.getByTestId('param-chip')).toContainText('Zeiteinheit');
    await expect(page.getByTestId('findings-count')).toBeVisible();
    // leaving works at any step, what was created stays
    await page.getByTestId('menu-new').click();
    await page.getByTestId('dirty-discard').click();
    await page.getByTestId('wz-next').click();
    await page.getByTestId('wz-leave').click();
    await expect(page.getByTestId('wizard')).toHaveCount(0);
    await expect(page.getByTestId('empty-hint')).toContainText('Nächster Schritt');
  });

  test('findings: no message to click away, marked element, text with the way to fix it, click leads to the place', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Befunde');
    await lib(page, 'trigger.candle_close').click();
    await lib(page, 'flow.condition').click();
    await page.getByTestId('element-name').fill('Prüfung');
    // an element that nothing leads to, an object without its required time unit
    await page.getByTestId('status-pill').click();
    await lib(page, 'flow.calculation').click();
    await page.getByTestId('element-name').fill('Lose Berechnung');
    await page.getByTestId('status-pill').click();
    await lib(page, 'Kerze').click();
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('modal-back')).toHaveCount(0);
    await expect(node(page, 'Lose Berechnung')).toHaveClass(/err/);
    await expect(card(page, 'Kerze')).toHaveClass(/err/);
    await clickNode(page, 'Lose Berechnung');
    await expect(props(page).getByTestId('finding').first()).toContainText('Element ohne Verbindung');
    await expect(props(page).getByTestId('finding').first()).toContainText('So beheben Sie es');
    await clickNode(page, 'Kerze');
    await expect(props(page).getByTestId('finding').first()).toContainText('Pflichtparameter ohne Wert');
    await expect(props(page).getByTestId('finding').filter({ hasText: 'Instanz ohne Verbindung zum Element ihrer ersten Verwendung' })).toHaveCount(1);
    // faulty expression: set by the formula view
    await clickNode(page, 'Prüfung');
    await page.getByTestId('view-formula').click();
    await page.getByTestId('formula-input').fill('EMA20.Wert >');
    await expect(page.getByTestId('formula-error')).toBeVisible();
    await expect(props(page).getByTestId('finding').filter({ hasText: 'Fehlerhafter Ausdruck' })).toHaveCount(1);
    // the strategy has no "place order": a hint
    await page.getByTestId('status-pill').click();
    await expect(page.getByTestId('findings-box').filter({ hasText: 'Keine Order erreichbar' })).toBeVisible();
    await page.getByTestId('findings-box').getByTestId('finding').filter({ hasText: 'Pflichtparameter ohne Wert' }).first().getByTestId('finding-goto').click();
    await expect(props(page).getByTestId('element-name')).toBeVisible();
  });

  test('rules: "Risiko je Trade" at the strategy, own rule at an element, template with Save, Check, Close, Delete', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('sec-rules').locator('.rule-edit')).toHaveCount(1);
    await expect(page.getByTestId('risk-limit')).toHaveValue('1');
    // template view of the delivered rule: no change, no delete
    await page.locator('[data-testid="lib-item"][data-label="Risiko je Trade"] [data-testid="lib-open-template"]').click();
    await expect(page.getByTestId('template-readonly')).toBeVisible();
    await expect(page.getByTestId('template-save')).toBeDisabled();
    await expect(page.getByTestId('template-delete')).toBeDisabled();
    await expect(node(page, 'Kreuzen')).toBeVisible();
    await page.getByTestId('template-close').click();
    // a new own rule as a template
    await page.getByTestId('new-object').click();
    await page.getByTestId('new-rule').click();
    await expect(page.getByTestId('template-view')).toBeVisible();
    await page.getByTestId('template-name').fill('Mein Mindestvolumen');
    await page.getByTestId('template-check').click();
    await expect(page.getByTestId('template-view').getByTestId('finding')).toContainText('noch leer');
    await page.getByTestId('rule-expr').locator('[data-testid="expr-panel"] > .cb').first().locator(':scope > .cb-kind select').selectOption('compare');
    await page.getByTestId('template-save').click();
    await expect(page.locator('[data-testid="lib-item"][data-label="Mein Mindestvolumen"] .tag-own')).toHaveText('eigene');
    // closing with unsaved changes asks
    await page.getByTestId('template-name').fill('Mein Mindestvolumen 2');
    await page.getByTestId('template-close').click();
    await expect(page.getByTestId('dialog-dirty')).toBeVisible();
    await page.getByTestId('dirty-discard').click();
    await expect(page.getByTestId('template-view')).toHaveCount(0);
  });

  test('templates: save an instance as a template, delete a template shows where it is used', async ({ page }) => {
    await openApp(page);
    await clickNode(page, 'EMA20');
    await page.getByTestId('save-as-template').click();
    await page.getByTestId('save-template-name').fill('EMA schnell');
    await page.getByTestId('save-template-ok').click();
    await expect(page.locator('[data-testid="lib-item"][data-label="EMA schnell"] .tag-own')).toBeVisible();
    // use it in the open strategy, save the strategy
    await page.locator('[data-testid="lib-item"][data-label="EMA schnell"]').click();
    await expect(props(page).getByTestId('element-origin')).toContainText('aus Vorlage EMA schnell, Objekttyp EMA');
    await page.getByTestId('menu-save').click();
    // delete: the strategy with an instance from it is listed, the instance stays
    await page.locator('[data-testid="lib-item"][data-label="EMA schnell"] [data-testid="lib-open-template"]').click();
    await expect(node(page, 'Kreuzen')).toBeVisible();
    await page.getByTestId('template-delete').click();
    const dlg = page.getByTestId('dialog-delete-template');
    await expect(dlg.getByTestId('usages')).toContainText('EMA-Trendfolge');
    await page.getByTestId('delete-confirm').click();
    await expect(page.locator('[data-testid="lib-item"][data-label="EMA schnell"]')).toHaveCount(0);
    await expect(card(page, 'EMA schnell')).toHaveCount(1);
  });

  test('the actions on orders and positions can be inserted into the management and set', async ({ page }) => {
    await openApp(page);
    await newStrategyFromScratch(page, 'Aktionen');
    await lib(page, 'trigger.tick').click();
    await lib(page, 'flow.place_order').click();
    const head = page.locator('[data-testid="frame"] .frame-head');
    await reveal(page, head);
    await head.click({ position: { x: 120, y: 12 } });
    await lib(page, 'trigger.tick').click();
    await lib(page, 'flow.modify_order').click();
    await expect(field(page, 'stop_loss')).toBeVisible();
    await expect(field(page, 'take_profit')).toBeVisible();
    await field(page, 'gueltigkeit').getByTestId('kind-gueltigkeit').selectOption('fixed');
    await field(page, 'gueltigkeit').getByTestId('value-gueltigkeit').selectOption('bis_zeitpunkt');
    await expect(field(page, 'ablaufzeit')).toBeVisible();
    await lib(page, 'flow.delete_order').click();
    await lib(page, 'flow.modify_position').click();
    await lib(page, 'flow.close_position').click();
    await expect(field(page, 'volumen')).toContainText('leer: ganz schließen');
    await expect(page.locator('[data-testid="node"]')).toHaveCount(7);
    // the management elements lie inside the frame
    const frame = await box(page.getByTestId('frame'));
    const close = await box(node(page, 'Position schließen'));
    expect(close.x).toBeGreaterThanOrEqual(frame.x);
    expect(close.x + close.width).toBeLessThanOrEqual(frame.x + frame.width);
  });
});

test.describe('lifecycle and settings', () => {
  test('open, save, close, delete with the questions, the client strategy and the test cases come back after reloading', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-open').click();
    const rows = page.getByTestId('open-row');
    await expect(rows).toHaveCount(3);
    await expect(page.locator('[data-testid="open-row"][data-sample="auftraggeber"]')).toContainText('emma ist die 2 EMA Strategie');
    await expect(page.locator('[data-testid="open-row"][data-sample="str01"]')).toContainText('Testfall str-01');
    await page.locator('[data-testid="open-row"][data-sample="str03"]').click();
    await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
    await expect(page.getByTestId('param-chip').first()).toContainText('H1');
    // changing makes it unsaved; closing asks
    await page.getByTestId('status-pill').click();
    await page.getByTestId('strategy-name').fill('Test geändert');
    await expect(page.getByTestId('status-pill')).toContainText('ungespeichert');
    await page.getByTestId('menu-close').click();
    await expect(page.getByTestId('dialog-dirty')).toBeVisible();
    await page.getByTestId('dirty-cancel').click();
    await expect(page.getByTestId('status-pill')).toContainText('Test geändert');
    await page.getByTestId('menu-close').click();
    await page.getByTestId('dirty-save').click();
    await expect(page.getByTestId('props-none')).toContainText('Nächster Schritt');
    // open the saved one, delete it with confirmation
    await page.getByTestId('empty-open').click();
    await page.locator('[data-testid="open-row"][data-name="Test geändert"]').click();
    await page.getByTestId('menu-delete').click();
    await page.getByTestId('delete-cancel').click();
    await expect(page.getByTestId('status-pill')).toContainText('Test geändert');
    await page.getByTestId('menu-delete').click();
    await page.getByTestId('delete-confirm').click();
    await expect(page.getByTestId('props-none')).toBeVisible();
    // new strategy, save, reload: the saved one is there, and the start shows the client strategy again
    await page.getByTestId('empty-new').click();
    await page.getByTestId('wz-leave').click();
    await page.getByTestId('strategy-name').fill('Neu gespeichert');
    await page.getByTestId('menu-save').click();
    await page.reload();
    await expect(page.getByTestId('status-pill')).toContainText('EMA-Trendfolge');
    await expect(page.getByTestId('param-chip').first()).toContainText('M15');
    await page.getByTestId('menu-open').click();
    await expect(page.locator('[data-testid="open-row"][data-name="Neu gespeichert"]')).toHaveCount(1);
    await expect(page.getByTestId('open-row')).toHaveCount(4);
  });

  test('settings: language of all texts, object directory with the question "Move files?"', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('menu-settings').click();
    await page.getByTestId('lang-en').click();
    await page.getByTestId('settings-apply').click();
    await expect(page.getByTestId('menu-new')).toContainText('New strategy');
    await expect(page.locator('[data-testid="lib-group"] .lib-group-head span').first()).toHaveText('Flow control');
    await expect(page.locator('[data-testid="lib-item"][data-lib="tpl-risiko"]')).toHaveAttribute('data-label', 'Risk per trade');
    await expect(node(page, 'Kreuzen')).toContainText('EMA20 crosses EMA50 in either direction');
    await expect(page.getByTestId('param-strip')).toContainText('Strategy parameters');
    await page.getByTestId('menu-check').click();
    await clickNode(page, 'Kreuzen');
    await page.getByTestId('view-formula').click();
    const text = await page.locator('body').innerText();
    for (const de of ['Elementbibliothek', 'Strategieparameter', 'Speichern', 'Eigenschaften', 'Bedingung', 'Berechnung', 'Öffnen', 'Löschen', 'Wert wählen']) {
      expect(text.includes(de), `German text "${de}" in the English interface`).toBe(false);
    }
    // a finding in English
    await lib(page, 'flow.condition').click();
    await page.getByTestId('menu-check').click();
    await expect(page.getByTestId('findings-box').first()).toContainText('How to fix it');
    // object directory
    await page.getByTestId('menu-settings').click();
    await page.getByTestId('settings-dir').fill('/data/pipwerk/objects');
    await page.getByTestId('settings-apply').click();
    await expect(page.getByTestId('dialog-move')).toContainText('Should the existing files be moved');
    await page.getByTestId('move-no').click();
    await page.reload();
    await page.getByTestId('menu-settings').click();
    await expect(page.getByTestId('settings-dir')).toHaveValue('/data/pipwerk/objects');
    await expect(page.getByTestId('lang-en')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('lang-de').click();
    await page.getByTestId('settings-apply').click();
    await expect(page.getByTestId('menu-new')).toContainText('Neue Strategie');
    await expect(page.getByTestId('menu-about')).toContainText('Über pipwerk Studio');
  });
});

test('English interface: no German text in the areas, the dialogs, the assistant and every element', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('menu-settings').click();
  await page.getByTestId('lang-en').click();
  await page.getByTestId('settings-apply').click();
  const german = /[äöüß]|\b(der|die|das|und|nicht|oder|wird|Sie|ist|Wert|wählen|Zeiteinheit|Bedingung|Berechnung|Eigenschaft\w*|Auslöser|Strategie\w*|Elemente|Vorlage\w*)\b/;
  const scan = async (where: string) => {
    const text = await page.locator('body').innerText();
    const m = german.exec(text);
    expect(m, `German text "${m?.[0]}" in: ${where}`).toBeNull();
  };
  // the assistant, step by step
  const ifThere = async (id: string) => { if ((await page.getByTestId(id).count()) > 0) await page.getByTestId(id).click(); };
  await page.getByTestId('menu-new').click();
  await ifThere('dirty-discard');
  for (let step = 1; step <= 5; step++) {
    await scan(`assistant step ${step}`);
    if (step === 3) { await page.getByTestId('wz-add-EMA').click(); await page.getByTestId('wz-add-EMA').click(); }
    if (step < 5) await page.getByTestId('wz-next').click();
  }
  await page.getByTestId('menu-new').click();
  await ifThere('dirty-discard');
  await page.getByTestId('wz-leave').click();
  await scan('empty strategy');
  // every library entry: its properties, its findings
  const keys = await page.locator('[data-testid="lib-item"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.lib as string));
  for (const k of keys) {
    await page.locator(`[data-testid="lib-item"][data-lib="${k}"]`).click();
    await scan(`element ${k}`);
  }
  await page.getByTestId('menu-check').click();
  await scan('findings');
  for (const dlg of ['menu-settings', 'menu-about']) {
    await page.getByTestId(dlg).click();
    if (dlg === 'menu-about') await page.getByTestId('license-text').evaluate((e) => e.remove());
    await scan(dlg);
    await page.keyboard.press('Escape');
  }
  await page.getByTestId('new-object').click();
  await scan('new object');
  await page.getByTestId('new-ruleset').click();
  await scan('template view of a rule set');
  await page.getByTestId('template-check').click();
  await scan('template check');
});

test('delivered types can be looked at but not changed or deleted, a rule set opens with its rules', async ({ page }) => {
  await openApp(page);
  await page.locator('[data-testid="lib-item"][data-lib="ZigZag"] [data-testid="lib-open-template"]').click();
  await expect(page.getByTestId('template-readonly')).toBeVisible();
  await expect(page.getByTestId('template-name')).toHaveValue('ZigZag');
  await expect(page.getByTestId('template-save')).toBeDisabled();
  await expect(page.getByTestId('template-delete')).toBeDisabled();
  await expect(page.getByTestId('tpl-delivers').locator('.prop-row')).toHaveCount(9);
  await page.getByTestId('template-close').click();
  await page.getByTestId('status-pill').click();
  await page.getByTestId('sec-rules').getByTestId('rule-add-select').selectOption('__ruleset');
  await page.getByTestId('sec-rules').locator('.rule-edit').last().getByTestId('rule-open').click();
  await expect(page.getByTestId('props-rule')).toBeVisible();
  await page.getByTestId('props-rule').getByTestId('rule-add-select').selectOption('tpl-risiko');
  await expect(page.getByTestId('props-rule').locator('.rule-edit')).toHaveCount(1);
});

test('"About" dialog is locked until closed, shows name, version, licence and address', async ({ page }) => {
  await openApp(page);
  await page.getByTestId('menu-about').click();
  const dlg = page.getByTestId('dialog-about');
  await expect(dlg).toContainText('pipwerk Studio');
  await expect(dlg).toContainText('GNU General Public License, Version 3');
  await expect(dlg.getByRole('link')).toHaveAttribute('href', 'https://github.com/macodix/pipwerk');
  await expect(dlg.getByRole('link')).toHaveAttribute('target', '_blank');
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
});

test('triggers carry the instrument of the application and their parameters', async ({ page }) => {
  await openApp(page);
  await newStrategyFromScratch(page, 'Auslöser');
  await lib(page, 'trigger.candle_close').click();
  await expect(field(page, 'instrument').locator('option:checked')).toHaveText('Instrument der Anwendung');
  await expect(field(page, 'zeiteinheit')).toBeVisible();
  await lib(page, 'trigger.tick').click();
  await expect(field(page, 'instrument').locator('option:checked')).toHaveText('Instrument der Anwendung');
});
