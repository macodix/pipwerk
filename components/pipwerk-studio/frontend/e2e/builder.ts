import { expect, type Locator, type Page } from '@playwright/test';

import { card, choose, clickMenu, library, node, settled, showArea } from './support';

/**
 * Helpers to build a strategy only by operating the interface: no step types an expression as text. They follow the
 * steps in `docs/technical/pipwerk-studio-testfaelle.md`.
 */

export type V =
  | { pick: string }
  | { num: number }
  | { text: string }
  | { choice: string }
  | { calc: [V, string, V] }
  | { prev: V }
  | { iff: [C, V, V] }
  | { cond: C }
  | { fn: [string, V[]] };

export type C =
  | { cmp: [V, string, V] }
  | { and: C[] }
  | { or: C[] }
  | { not: C }
  | { truthy: V };

/** The field of a designed list of choices inside `parent` (a direct child of it). */
const trigger = (parent: Locator): Locator => parent.locator(':scope > .select > .select-trigger');

/** Chooses an entry of a list by its label; a label that is not in the list fails with the labels that are. */
async function chooseLabel(field: Locator, label: string): Promise<void> {
  const list = field.page().getByRole('listbox');
  await settled(field);
  await field.click();
  const entry = list.getByRole('option', { name: label, exact: true }).first();
  // the values of the list come from the expression endpoint: they may arrive a moment after the list is shown
  try {
    await expect(entry).toBeVisible({ timeout: 10_000 });
  } catch {
    const labels = (await list.getByRole('option').allTextContents()).map((text) => text.trim());
    throw new Error(`"${label}" is not in the list: ${labels.join(' | ')}`);
  }
  await entry.click();
  await expect(list).toHaveCount(0);
}

/** Sets a value in the block editor: `vb` is the element of the value (`.vb`). */
export async function setValue(vb: Locator, v: V): Promise<void> {
  const sel = trigger(vb);
  if ('pick' in v) {
    await chooseLabel(sel, v.pick);
  } else if ('num' in v) {
    await choose(sel, { value: 'k:num' });
    await vb.locator(':scope > .num-wrap input').fill(String(v.num));
  } else if ('text' in v) {
    await choose(sel, { value: 'k:str' });
    await vb.locator(':scope > input.input').fill(v.text);
  } else if ('choice' in v) {
    await choose(sel, { value: 'k:str' });
    await chooseLabel(vb.locator(':scope > .select').nth(1).locator('.select-trigger'), v.choice);
  } else if ('calc' in v) {
    await choose(sel, { value: 'k:calc' });
    const inner = vb.locator(':scope > .vb-inner.calc');
    await setValue(inner.locator(':scope > .vb').nth(0), v.calc[0]);
    await choose(trigger(inner), v.calc[1]);
    await setValue(inner.locator(':scope > .vb').nth(1), v.calc[2]);
  } else if ('prev' in v) {
    await choose(sel, { value: 'k:prev' });
    await setValue(vb.locator(':scope > .vb-inner > .vb'), v.prev);
  } else if ('iff' in v) {
    await choose(sel, { value: 'k:if' });
    const lines = vb.locator(':scope > .vb-inner.stack > .vb-line');
    await setCond(lines.nth(0).locator(':scope > .cb'), v.iff[0]);
    await setValue(lines.nth(1).locator(':scope > .vb'), v.iff[1]);
    await setValue(lines.nth(2).locator(':scope > .vb'), v.iff[2]);
  } else if ('fn' in v) {
    await choose(sel, { value: 'k:func' });
    const inner = vb.locator(':scope > .vb-inner');
    await choose(trigger(inner), { label: v.fn[0] });
    for (let index = 0; index < v.fn[1].length; index += 1) {
      await setValue(inner.locator(':scope > .vb').nth(index), v.fn[1][index] as V);
    }
  } else {
    await choose(sel, { value: 'k:cond' });
    await setCond(vb.locator(':scope > .vb-inner.stack > .cb'), v.cond);
  }
}

/** Sets a condition in the block editor: `cb` is the element of the condition (`.cb`). */
export async function setCond(cb: Locator, c: C): Promise<void> {
  const kind = cb.locator(':scope > .cb-kind > .select > .select-trigger');
  if ('cmp' in c) {
    await choose(kind, { value: 'compare' });
    const row = cb.locator(':scope > .cb-row');
    await setValue(row.locator(':scope > .vb').nth(0), c.cmp[0]);
    await choose(trigger(row), c.cmp[1]);
    await setValue(row.locator(':scope > .vb').nth(1), c.cmp[2]);
  } else if ('and' in c || 'or' in c) {
    const items = 'and' in c ? c.and : c.or;
    await choose(kind, { value: 'and' in c ? 'and' : 'or' });
    const list = cb.locator(':scope > .cb-list');
    for (let index = 2; index < items.length; index += 1) {
      const add = list.locator(':scope > [data-testid="cond-add"]');
      await settled(add);
      await add.click();
    }
    for (let index = 0; index < items.length; index += 1) {
      await setCond(list.locator(':scope > .cb-item').nth(index).locator(':scope > .cb'), items[index] as C);
    }
  } else if ('not' in c) {
    await choose(kind, { value: 'not' });
    await setCond(cb.locator(':scope > .cb-list > .cb'), c.not);
  } else {
    await choose(kind, { value: 'value' });
    await setValue(cb.locator(':scope > .cb-row > .vb'), c.truthy);
  }
}

export const props = (page: Page): Locator => page.getByTestId('props-element');
export const field = (page: Page, id: string): Locator => props(page).locator(`[data-field="${id}"]`);

/** Inserts an entry of the library behind the selected step and names the new element. */
export async function add(page: Page, entry: string, name?: string): Promise<void> {
  // the properties view of the step that was selected before: the new one is there when it shows another element
  const before = (await props(page).count()) === 0 ? null : await props(page).getAttribute('data-element-id');
  await showArea(page, 'library');
  // an entry by its name; where two entries have one name (the trigger "Tick" and the object "Tick"), by its type
  await (entry.startsWith('type:') ? page.locator(`[data-testid="lib-item"][data-lib="${entry}"]`) : library(page, entry)).click();
  await showArea(page, 'props');
  await expect(props(page)).toBeVisible();
  if (before !== null) {
    await expect(props(page)).not.toHaveAttribute('data-element-id', before);
  }
  if (name !== undefined) {
    await page.getByTestId('element-name').fill(name);
  }
}

/** Selects a step or an object on the drawing area. */
export async function select(page: Page, name: string): Promise<void> {
  await showArea(page, 'canvas');
  const target = node(page, name).or(card(page, name)).first();
  const size = page.viewportSize();
  // the objects lie beside their elements and make the drawing taller: the step may lie outside of the window, so the
  // whole drawing is brought into the window first (scrolling the page cannot move the drawing)
  await page.getByTestId('zoom-fit').click();
  if ((size?.width ?? 1366) < 1100 || (size?.height ?? 768) < 500) {
    await target.click();
  } else {
    await target.click({ position: { x: 44, y: 14 } });
  }
  await showArea(page, 'props');
}

/** "Neue Strategie": an empty drawing area; the strategy gets its name. */
export async function newStrategyFromScratch(page: Page, name: string): Promise<void> {
  await clickMenu(page, 'new');
  await showArea(page, 'props');
  await page.getByTestId('strategy-name').fill(name);
  // the hint of the empty strategy stands in the properties view, not on the drawing area
  await expect(page.getByTestId('empty-strategy-hint')).toBeVisible();
  await showArea(page, 'canvas');
  await expect(page.getByTestId('canvas')).toBeVisible();
}

export async function createParam(page: Page, name: string, type: 'time_unit' | 'number', value: string): Promise<void> {
  await showArea(page, 'canvas');
  await page.getByTestId('param-new').click();
  const popover = page.getByTestId('param-popover');
  await expect(popover).toBeVisible();
  await popover.getByTestId('param-name').fill(name);
  await choose(popover.getByTestId('param-type'), type);
  if (type === 'time_unit') {
    await choose(popover.getByTestId('param-value'), value);
  } else {
    await popover.getByTestId('param-value').fill(value);
  }
  await popover.getByTestId('param-done').click();
  await expect(popover).toHaveCount(0);
}

export async function bindParam(page: Page, fieldId: string, paramName: string): Promise<void> {
  const f = field(page, fieldId);
  // the question "Woher kommt der Wert?" and its answer in the words of the interface
  await choose(f.getByTestId(`kind-${fieldId}`), { label: 'aus einem Strategieparameter' });
  await choose(f.getByTestId('param-select'), { label: paramName });
}

export async function bindFixed(page: Page, fieldId: string, value: string): Promise<void> {
  const f = field(page, fieldId);
  await choose(f.getByTestId(`kind-${fieldId}`), { label: 'fest eingeben' });
  const v = f.getByTestId(`value-${fieldId}`);
  const role = await v.getAttribute('role');
  if (role === 'combobox') {
    await choose(v, value);
  } else {
    await v.fill(value);
  }
}

/** The editor of an expression held by a field of the element (the condition or calculation: the field "ausdruck"). */
export function exprRoot(page: Page, fieldId = 'ausdruck'): Locator {
  return field(page, fieldId).getByTestId(`expression-${fieldId}`);
}

export async function setCondition(page: Page, c: C): Promise<void> {
  await setCond(exprRoot(page).locator(':scope > .cb'), c);
}

export async function setCalculation(page: Page, v: V): Promise<void> {
  await setValue(exprRoot(page).locator(':scope > .vb'), v);
}

/** A field that takes an expression (choosing the kind "Ausdruck" first). */
export async function bindExpr(page: Page, fieldId: string, v: V): Promise<void> {
  const f = field(page, fieldId);
  await choose(f.getByTestId(`kind-${fieldId}`), { label: 'aus einer Formel' });
  await setValue(f.getByTestId(`expression-${fieldId}`).locator(':scope > .vb'), v);
}

/**
 * Switches "Aktualisieren" on for the values of an object that the selected element uses (properties view, "Verwendete
 * Werte"): the object works out its values again at this element before it passes them on.
 */
export async function refreshValue(page: Page, object: string, values = 1): Promise<void> {
  const group = props(page).getByTestId('used-group').filter({ has: page.getByRole('heading', { name: object, exact: true }) });
  // every value of the object that the element uses has its own switch: all of them are switched on, once the
  // properties view lists them
  const switches = group.getByRole('checkbox', { name: 'Aktualisieren' });
  await expect(switches).toHaveCount(values);
  for (const each of await switches.all()) {
    // the box of the switch lies over the real check box (its label passes the click on): the click goes to the box
    await each.check({ force: true });
  }
}

/** Adds an own rule (condition) to the element that is selected, with its name and the condition. */
export async function addOwnRule(page: Page, name: string, c: C): Promise<void> {
  const section = page.getByTestId('sec-element-rules');
  await choose(section.getByTestId('rule-add-select'), { label: 'eigene Regel' });
  const card = section.getByTestId('rule-card').last();
  await card.getByTestId('instance-name').fill(name);
  await setCond(card.getByTestId('rule-expression').locator(':scope > .cb'), c);
}

/** Adds the rule "Risiko je Trade" to the strategy and names it. */
export async function addRiskRule(page: Page, name: string): Promise<void> {
  await showArea(page, 'canvas');
  await page.getByTestId('status-pill').click();
  await showArea(page, 'props');
  const section = page.getByTestId('sec-rules');
  await choose(section.getByTestId('rule-add-select'), { label: 'Risiko je Trade' });
  await section.getByTestId('rule-card').last().getByTestId('instance-name').fill(name);
}
