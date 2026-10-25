import { afterEach, describe, expect, it, vi } from 'vitest';

import { addInput } from '../document/ops';
import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import { mockApi } from '../testing/backend';
import { emaTrendfolge, EMA_ELEMENT_IDS } from '../testing/emaTrendfolge';
import { testTypes } from '../testing/typeDescriptions';
import { planRemoval, removeWithBackend } from './removal';

const document = (): StrategyDocument => parseStrategyDocument(emaTrendfolge());
const index = testTypes();

afterEach(() => {
  vi.unstubAllGlobals();
});

const text = (doc: StrategyDocument): string => JSON.stringify(doc);

describe('removing an object that expressions use (specification 5.4)', () => {
  it('names the steps that use it, by their expressions', async () => {
    const api = mockApi();
    const plan = await planRemoval(document(), { kind: 'element', id: EMA_ELEMENT_IDS.ema50 });
    expect(plan.users).toEqual(expect.arrayContaining([EMA_ELEMENT_IDS.cross, EMA_ELEMENT_IDS.direction, EMA_ELEMENT_IDS.crossAgainst]));
    expect(plan.users).not.toContain(EMA_ELEMENT_IDS.stop);
    expect(api.requests('POST', /\/api\/v1\/removals$/)).toHaveLength(1);
  });

  it('leaves an empty place where the object was named and keeps the rest of the expression', async () => {
    mockApi();
    const doc = document();
    const next = await removeWithBackend(doc, index, { kind: 'element', id: EMA_ELEMENT_IDS.ema50 });
    expect(next.elements.some((element) => element.id === EMA_ELEMENT_IDS.ema50)).toBe(false);
    expect(text(next)).not.toContain('ema50');
    expect(text(next)).toContain('ema20.wert');
    const direction = next.elements.find((element) => element.id === EMA_ELEMENT_IDS.direction);
    expect(direction?.parameters.ausdruck?.value).toBe('IF(ema20.wert > ; "buy"; "sell")');
  });

  it('asks nothing for a step that nobody uses', async () => {
    mockApi();
    const plan = await planRemoval(document(), { kind: 'element', id: EMA_ELEMENT_IDS.closePosition });
    expect(plan).toEqual({ users: [] });
  });

  it('removes the inputs of the removed object and no other', async () => {
    mockApi();
    const doc = addInput(addInput(document(), EMA_ELEMENT_IDS.cross, { instance: 'ema50', property: 'wert' }), EMA_ELEMENT_IDS.cross, {
      instance: 'ema20',
      property: 'wert',
    });
    const next = await removeWithBackend(doc, index, { kind: 'element', id: EMA_ELEMENT_IDS.ema50 });
    expect(next.elements.every((element) => element.inputs.every((input) => input.instance !== 'ema50'))).toBe(true);
    expect(next.elements.some((element) => element.inputs.some((input) => input.instance === 'ema20'))).toBe(true);
  });
});

describe('removing a strategy parameter that expressions use', () => {
  it('names the steps that use it and writes them without it', async () => {
    mockApi();
    const doc = document();
    const target = { kind: 'parameter', key: 'stop_abstand' } as const;
    const plan = await planRemoval(doc, target);
    expect(plan.users).toEqual(expect.arrayContaining([EMA_ELEMENT_IDS.stop, EMA_ELEMENT_IDS.newStop]));
    const next = await removeWithBackend(doc, index, target);
    expect(next.parameters.some((parameter) => parameter.key === 'stop_abstand')).toBe(false);
    expect(text(next)).not.toContain('stop_abstand');
  });

  it('makes an assignment that used it "not assigned"', async () => {
    mockApi();
    const doc = document();
    const target = { kind: 'parameter', key: 'zeiteinheit' } as const;
    const plan = await planRemoval(doc, target);
    expect(plan.users).toContain(EMA_ELEMENT_IDS.trigger);
    const next = await removeWithBackend(doc, index, target);
    expect(next.elements.find((element) => element.id === EMA_ELEMENT_IDS.trigger)?.parameters.zeiteinheit).toBeUndefined();
  });
});
