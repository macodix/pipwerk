import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import { mockApi } from '../testing/backend';
import { emaTrendfolge, EMA_ELEMENT_IDS } from '../testing/emaTrendfolge';
import { testTypes } from '../testing/typeDescriptions';
import { planRemoval, removeWithPlan } from './removal';

const document = (): StrategyDocument => parseStrategyDocument(emaTrendfolge());
const index = testTypes();

afterEach(() => {
  vi.unstubAllGlobals();
});

const text = (doc: StrategyDocument): string => JSON.stringify(doc);

describe('removing an object that expressions use (specification 5.4)', () => {
  it('names the steps that use it, by their expressions', async () => {
    mockApi();
    const plan = await planRemoval(document(), 'de', { kind: 'element', id: EMA_ELEMENT_IDS.ema50 });
    expect(plan.users).toEqual(expect.arrayContaining([EMA_ELEMENT_IDS.cross, EMA_ELEMENT_IDS.direction, EMA_ELEMENT_IDS.crossAgainst]));
    expect(plan.users).not.toContain(EMA_ELEMENT_IDS.stop);
    expect(plan.edits.length).toBeGreaterThan(0);
  });

  it('leaves an empty place where the object was named and keeps the rest of the expression', async () => {
    mockApi();
    const doc = document();
    const target = { kind: 'element', id: EMA_ELEMENT_IDS.ema50 } as const;
    const next = await removeWithPlan(doc, index, 'de', target, await planRemoval(doc, 'de', target));
    expect(next.elements.some((element) => element.id === EMA_ELEMENT_IDS.ema50)).toBe(false);
    expect(text(next)).not.toContain('ema50');
    expect(text(next)).toContain('ema20.wert');
    const direction = next.elements.find((element) => element.id === EMA_ELEMENT_IDS.direction);
    expect(direction?.parameters.ausdruck?.value).toBe('IF(ema20.wert > ; "buy"; "sell")');
  });

  it('asks nothing for a step that nobody uses', async () => {
    mockApi();
    const plan = await planRemoval(document(), 'de', { kind: 'element', id: EMA_ELEMENT_IDS.closePosition });
    expect(plan).toEqual({ users: [], edits: [] });
  });
});

describe('removing a strategy parameter that expressions use', () => {
  it('names the steps that use it and writes them without it', async () => {
    mockApi();
    const doc = document();
    const target = { kind: 'parameter', key: 'stop_abstand' } as const;
    const plan = await planRemoval(doc, 'de', target);
    expect(plan.users).toEqual(expect.arrayContaining([EMA_ELEMENT_IDS.stop, EMA_ELEMENT_IDS.newStop]));
    const next = await removeWithPlan(doc, index, 'de', target, plan);
    expect(next.parameters.some((parameter) => parameter.key === 'stop_abstand')).toBe(false);
    expect(text(next)).not.toContain('stop_abstand');
  });

  it('makes an assignment that used it "not assigned"', async () => {
    mockApi();
    const doc = document();
    const target = { kind: 'parameter', key: 'zeiteinheit' } as const;
    const plan = await planRemoval(doc, 'de', target);
    expect(plan.users).toContain(EMA_ELEMENT_IDS.trigger);
    const next = await removeWithPlan(doc, index, 'de', target, plan);
    expect(next.elements.find((element) => element.id === EMA_ELEMENT_IDS.trigger)?.parameters.zeiteinheit).toBeUndefined();
  });
});
