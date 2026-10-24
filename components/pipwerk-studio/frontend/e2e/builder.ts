import { expect, type Locator, type Page } from '@playwright/test';

import { card, clickMenu, library, node, showArea } from './support';

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
  | { cross: [V, V, 'up' | 'down' | 'any'] }
  | { and: C[] }
  | { or: C[] }
  | { not: C }
  | { truthy: V };

/** Chooses an entry of a list by its label; a label that is not in the list fails with the labels that are. */
async function chooseLabel(list: Locator, label: string): Promise<void> {
  const labelsOf = async (): Promise<string[]> => (await list.locator('option').allTextContents()).map((text) => text.trim());
  // the values of the list come from the expression endpoint: they may arrive a moment after the list is shown
  try {
    await expect.poll(labelsOf, { timeout: 10_000 }).toContain(label);
  } catch {
    throw new Error(`"${label}" is not in the list: ${(await labelsOf()).join(' | ')}`);
  }
  await list.selectOption({ label });
}

/** Sets a value in the block editor: `vb` is the element of the value (`.vb`). */
export async function setValue(vb: Locator, v: V): Promise<void> {
  const sel = vb.locator(':scope > .select select');
  if ('pick' in v) {
    await chooseLabel(sel, v.pick);
  } else if ('num' in v) {
    await sel.selectOption('k:num');
    await vb.locator(':scope > .num-wrap input').fill(String(v.num));
  } else if ('text' in v) {
    await sel.selectOption('k:str');
    await vb.locator(':scope > input.input').fill(v.text);
  } else if ('choice' in v) {
    await sel.selectOption('k:str');
    await chooseLabel(vb.locator(':scope > .select').nth(1).locator('select'), v.choice);
  } else if ('calc' in v) {
    await sel.selectOption('k:calc');
    const inner = vb.locator(':scope > .vb-inner.calc');
    await setValue(inner.locator(':scope > .vb').nth(0), v.calc[0]);
    await inner.locator(':scope > .select select').selectOption(v.calc[1]);
    await setValue(inner.locator(':scope > .vb').nth(1), v.calc[2]);
  } else if ('prev' in v) {
    await sel.selectOption('k:prev');
    await setValue(vb.locator(':scope > .vb-inner > .vb'), v.prev);
  } else if ('iff' in v) {
    await sel.selectOption('k:if');
    const lines = vb.locator(':scope > .vb-inner.stack > .vb-line');
    await setCond(lines.nth(0).locator(':scope > .cb'), v.iff[0]);
    await setValue(lines.nth(1).locator(':scope > .vb'), v.iff[1]);
    await setValue(lines.nth(2).locator(':scope > .vb'), v.iff[2]);
  } else if ('fn' in v) {
    await sel.selectOption('k:func');
    const inner = vb.locator(':scope > .vb-inner');
    await inner.locator(':scope > .select select').selectOption({ label: v.fn[0] });
    for (let index = 0; index < v.fn[1].length; index += 1) {
      await setValue(inner.locator(':scope > .vb').nth(index), v.fn[1][index] as V);
    }
  } else {
    await sel.selectOption('k:cond');
    await setCond(vb.locator(':scope > .vb-inner.stack > .cb'), v.cond);
  }
}

/** Sets a condition in the block editor: `cb` is the element of the condition (`.cb`). */
export async function setCond(cb: Locator, c: C): Promise<void> {
  const kind = cb.locator(':scope > .cb-kind select');
  if ('cmp' in c) {
    await kind.selectOption('compare');
    const row = cb.locator(':scope > .cb-row');
    await setValue(row.locator(':scope > .vb').nth(0), c.cmp[0]);
    await row.locator(':scope > .select select').selectOption(c.cmp[1]);
    await setValue(row.locator(':scope > .vb').nth(1), c.cmp[2]);
  } else if ('cross' in c) {
    await kind.selectOption('cross');
    const row = cb.locator(':scope > .cb-row');
    await setValue(row.locator(':scope > .vb').nth(0), c.cross[0]);
    await setValue(row.locator(':scope > .vb').nth(1), c.cross[1]);
    await row.locator(':scope > .select select').selectOption(c.cross[2]);
  } else if ('and' in c || 'or' in c) {
    const items = 'and' in c ? c.and : c.or;
    await kind.selectOption('and' in c ? 'and' : 'or');
    const list = cb.locator(':scope > .cb-list');
    for (let index = 2; index < items.length; index += 1) {
      await list.locator(':scope > [data-testid="cond-add"]').click();
    }
    for (let index = 0; index < items.length; index += 1) {
      await setCond(list.locator(':scope > .cb-item').nth(index).locator(':scope > .cb'), items[index] as C);
    }
  } else if ('not' in c) {
    await kind.selectOption('not');
    await setCond(cb.locator(':scope > .cb-list > .cb'), c.not);
  } else {
    await kind.selectOption('value');
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
  if ((size?.width ?? 1366) < 1100 || (size?.height ?? 768) < 500) {
    // on a narrow window the step may lie outside of it: the whole drawing is brought into the window first
    await page.getByTestId('zoom-fit').click();
    await target.click();
  } else {
    await target.scrollIntoViewIfNeeded();
    await target.click({ position: { x: 44, y: 14 } });
  }
  await showArea(page, 'props');
}

/** "Neue Strategie": the guided setup is left, the strategy gets its name. */
export async function newStrategyFromScratch(page: Page, name: string): Promise<void> {
  await clickMenu(page, 'new');
  await showArea(page, 'props');
  await expect(page.getByTestId('wizard')).toBeVisible();
  await page.getByTestId('wz-leave').click();
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
  await popover.getByTestId('param-type').selectOption(type);
  if (type === 'time_unit') {
    await popover.getByTestId('param-value').selectOption(value);
  } else {
    await popover.getByTestId('param-value').fill(value);
  }
  await popover.getByTestId('param-done').click();
  await expect(popover).toHaveCount(0);
}

export async function bindParam(page: Page, fieldId: string, paramName: string): Promise<void> {
  const f = field(page, fieldId);
  await f.getByTestId(`kind-${fieldId}`).selectOption('parameter');
  await f.getByTestId('param-select').selectOption({ label: paramName });
}

export async function bindFixed(page: Page, fieldId: string, value: string): Promise<void> {
  const f = field(page, fieldId);
  await f.getByTestId(`kind-${fieldId}`).selectOption('fixed');
  const v = f.getByTestId(`value-${fieldId}`);
  const tag = await v.evaluate((element) => element.tagName);
  if (tag === 'SELECT') {
    await v.selectOption(value);
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
  await f.getByTestId(`kind-${fieldId}`).selectOption('expression');
  await setValue(f.getByTestId(`expression-${fieldId}`).locator(':scope > .vb'), v);
}

/** Adds an own rule (condition) to the element that is selected, with its name and the condition. */
export async function addOwnRule(page: Page, name: string, c: C): Promise<void> {
  const section = page.getByTestId('sec-element-rules');
  await section.getByTestId('rule-add-select').selectOption({ label: 'eigene Regel' });
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
  await section.getByTestId('rule-add-select').selectOption({ label: 'Risiko je Trade' });
  await section.getByTestId('rule-card').last().getByTestId('instance-name').fill(name);
}
