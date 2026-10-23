// Helpers to build a strategy only by operating the interface. No step types an expression as text.
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { card, lib, node } from './support';

export type V =
  | { pick: string }
  | { num: number }
  | { text: string }
  | { choice: string }
  | { calc: [V, string, V] }
  | { prev: V }
  | { iff: [C, V, V] }
  | { cond: C };
export type C =
  | { cmp: [V, string, V] }
  | { cross: [V, V, 'up' | 'down' | 'any'] }
  | { and: C[] }
  | { or: C[] }
  | { not: C }
  | { truthy: V };

export async function setValue(vb: Locator, v: V): Promise<void> {
  const sel = vb.locator(':scope > .select select');
  if ('pick' in v) {
    await sel.selectOption({ label: v.pick });
  } else if ('num' in v) {
    await sel.selectOption('k:num');
    await vb.locator(':scope > .num-wrap input').fill(String(v.num));
  } else if ('text' in v) {
    await sel.selectOption('k:str');
    await vb.locator(':scope > input.input').fill(v.text);
  } else if ('choice' in v) {
    await sel.selectOption('k:str');
    await vb.locator(':scope > .select').nth(1).locator('select').selectOption({ label: v.choice });
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
  } else {
    await sel.selectOption('k:cond');
    await setCond(vb.locator(':scope > .vb-inner.stack > .cb'), v.cond);
  }
}

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
    for (let i = 2; i < items.length; i++) await list.locator(':scope > [data-testid="cond-add"]').click();
    for (let i = 0; i < items.length; i++) {
      await setCond(list.locator(':scope > .cb-item').nth(i).locator(':scope > .cb'), items[i]);
    }
  } else if ('not' in c) {
    await kind.selectOption('not');
    await setCond(cb.locator(':scope > .cb-list > .cb'), c.not);
  } else {
    await kind.selectOption('value');
    await setValue(cb.locator(':scope > .cb-row > .vb'), c.truthy);
  }
}

/** Moves the view like a user does (mouse wheel) until the element is well inside the canvas. */
export async function reveal(page: Page, loc: Locator): Promise<void> {
  const canvas = page.getByTestId('canvas');
  for (let i = 0; i < 14; i++) {
    const cb = await canvas.boundingBox();
    const b = await loc.first().boundingBox();
    if (!cb || !b) return;
    const mx = 70;
    const top = 80;
    let dx = 0;
    let dy = 0;
    if (b.x < cb.x + mx) dx = b.x - (cb.x + mx);
    else if (b.x + b.width > cb.x + cb.width - mx) dx = b.x + b.width - (cb.x + cb.width - mx);
    if (b.y < cb.y + top) dy = b.y - (cb.y + top);
    else if (b.y + b.height > cb.y + cb.height - 50) dy = b.y + b.height - (cb.y + cb.height - 50);
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
    await page.mouse.wheel(dx, dy);
    await page.waitForTimeout(40);
  }
}

export async function clickNode(page: Page, name: string, nth = 0): Promise<void> {
  const n = node(page, name).or(card(page, name)).nth(nth);
  await expect(n).toBeVisible();
  await reveal(page, n);
  await n.click({ position: { x: 44, y: 14 } });
}

export const wire = (page: Page, src: string, dst: string): Locator => page.locator(`[data-testid="wire"][data-src="${src}"][data-dst="${dst}"]`);

export const props = (page: Page): Locator => page.getByTestId('props-element');
export const field = (page: Page, id: string): Locator => props(page).locator(`[data-field="${id}"]`);

export async function add(page: Page, key: string, name?: string): Promise<void> {
  await lib(page, key).click();
  await expect(props(page)).toBeVisible();
  if (name !== undefined) await page.getByTestId('element-name').fill(name);
}

export async function newStrategyFromScratch(page: Page, name: string): Promise<void> {
  await page.getByTestId('menu-new').click();
  await expect(page.getByTestId('wizard')).toBeVisible();
  await page.getByTestId('wz-leave').click();
  await expect(page.getByTestId('empty-hint')).toBeVisible();
  await page.getByTestId('strategy-name').fill(name);
}

export async function createParam(page: Page, name: string, type: 'time_unit' | 'number', value: string): Promise<void> {
  await page.getByTestId('param-new').click();
  const pop = page.getByTestId('param-popover');
  await expect(pop).toBeVisible();
  await pop.getByTestId('param-name').fill(name);
  await pop.getByTestId('param-type').selectOption(type);
  if (type === 'time_unit') await pop.getByTestId('param-value').selectOption(value);
  else await pop.getByTestId('param-value').fill(value);
  await pop.getByRole('button', { name: /Fertig|Done/ }).click();
  await expect(pop).toHaveCount(0);
}

export async function bindParam(page: Page, fieldId: string, paramName: string): Promise<void> {
  const f = field(page, fieldId);
  await f.getByTestId(`kind-${fieldId}`).selectOption('param');
  await f.getByTestId('param-select').selectOption({ label: paramName });
}

export async function bindFixed(page: Page, fieldId: string, value: string): Promise<void> {
  const f = field(page, fieldId);
  await f.getByTestId(`kind-${fieldId}`).selectOption('fixed');
  const v = f.getByTestId(`value-${fieldId}`);
  const tag = await v.evaluate((e) => e.tagName);
  if (tag === 'SELECT') await v.selectOption(value);
  else await v.fill(value);
}

/** The block editor of the element condition or calculation (field "ausdruck"). */
export function exprRoot(page: Page, fieldId = 'ausdruck'): Locator {
  return field(page, fieldId).locator('[data-testid="expr-panel"]').first();
}

export async function setCondition(page: Page, c: C): Promise<void> {
  await setCond(exprRoot(page).locator(':scope > .cb'), c);
}
export async function setCalculation(page: Page, v: V): Promise<void> {
  await setValue(exprRoot(page).locator(':scope > .vb'), v);
}
export async function bindExpr(page: Page, fieldId: string, v: V): Promise<void> {
  const f = field(page, fieldId);
  await f.getByTestId(`kind-${fieldId}`).selectOption('expr');
  await setValue(f.locator('[data-testid="expr-panel"] > .vb').first(), v);
}

export async function addOwnRule(page: Page, name: string, c: C): Promise<void> {
  const sec = page.getByTestId('sec-element-rules');
  await sec.getByTestId('rule-add-select').selectOption('__rule');
  const row = sec.locator('.rule-edit').last();
  await row.locator('.rule-head input').fill(name);
  await row.locator('summary').click();
  await setCond(row.locator('[data-testid="expr-panel"] > .cb').first(), c);
}

/** Reads the saved strategy from the local storage of the page. */
export async function savedStrategy(page: Page, id?: string, name?: string): Promise<unknown> {
  return page.evaluate(([sid, sname]) => {
    const raw = window.localStorage.getItem('pipwerk-studio-prototype-v2');
    const data = JSON.parse(raw ?? '{}') as { saved: { id: string; name: string }[] };
    return data.saved.find((s) => (sid ? s.id === sid : s.name === sname));
  }, [id ?? '', name ?? '']);
}

// ---- comparison with a test case document ----

interface RawEl {
  id: string; name: string; type: string; mgmt: string | null; bind: Record<string, unknown>;
  rules: { name: string; e: unknown; kind: string; determines: string | null; builtin?: string; params: Record<string, unknown> }[];
  own: unknown; origin: { tplId: string | null; type: string } | null;
}
interface RawStrategy {
  params: { id: string; name: string; dtype: string; value: unknown; atApplication: boolean }[];
  rules: RawEl['rules'];
  els: RawEl[];
  conns: { from: string; out: string; to: string }[];
}

export function normalize(s: RawStrategy): unknown {
  const names = new Map(s.els.map((e) => [e.id, e.name]));
  const pnames = new Map(s.params.map((p) => [p.id, p.name]));
  const mapId = (v: unknown, key?: string): unknown => {
    if (Array.isArray(v)) return v.map((x) => mapId(x));
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(o)) {
        if (k === 'obj' && typeof x === 'string') out[k] = names.get(x) ?? x;
        else if (k === 'id' && typeof x === 'string' && (o.t === 'sp' || o.k === 'param')) out[k] = pnames.get(x) ?? x;
        else out[k] = mapId(x, k);
      }
      return out;
    }
    void key;
    return v;
  };
  const rule = (r: RawEl['rules'][number]) => ({
    name: r.name, kind: r.kind, builtin: r.builtin ?? null, e: mapId(r.e), determines: r.determines, params: mapId(r.params),
  });
  // an unset field and a missing field mean the same
  const bindOf = (b: Record<string, unknown>) =>
    mapId(Object.fromEntries(Object.entries(b).filter(([, v]) => (v as { k?: string }).k !== 'unset')));
  const els = s.els.map((e) => ({
    name: e.name, type: e.type, flow: e.mgmt ? names.get(e.mgmt) : null, bind: bindOf(e.bind), rules: e.rules.map(rule),
    origin: e.origin ? { tplId: e.origin.tplId, type: e.origin.type } : null,
  }));
  els.sort((a, b) => `${a.flow ?? ''}|${a.name}|${a.type}`.localeCompare(`${b.flow ?? ''}|${b.name}|${b.type}`));
  const conns = s.conns.map((c) => `${names.get(c.from)}|${c.out}|${names.get(c.to)}`).sort();
  return {
    params: s.params.map((p) => ({ name: p.name, dtype: p.dtype, value: p.value, atApplication: p.atApplication })),
    rules: s.rules.map(rule), els, conns,
  };
}
