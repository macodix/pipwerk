import { describe, expect, it } from 'vitest';

import type { Finding } from '../api/objects';
import { addRule } from '../document/ops';
import type { InstanceDocument } from '../document/types';
import { loadTestcase } from '../testing/fixtures';
import { indexFindings, ruleNames } from './findingsModel';

const document = loadTestcase('str-03');
const order = document.elements.find((element) => element.type === 'flow.place_order')!;
const condition = document.elements.find((element) => element.type === 'flow.condition')!;

function finding(level: 'error' | 'hint', code: string, element: string | null, subject: string | null = null): Finding {
  return { level, code, element, subject, details: {} };
}

describe('indexFindings', () => {
  it('counts errors and hints', () => {
    const index = indexFindings([
      finding('error', 'a.b', null),
      finding('error', 'a.c', condition.id),
      finding('hint', 'a.d', condition.id),
    ]);

    expect(index).toMatchObject({ errors: 2, hints: 1 });
    expect(index.all).toHaveLength(3);
  });

  it('has no findings if none were asked for', () => {
    const index = indexFindings(null);

    expect(index.all).toEqual([]);
    expect(index.severityOfElement('x')).toBeNull();
  });

  it('gives an element the worst level of its findings', () => {
    const index = indexFindings([
      finding('hint', 'a.b', condition.id),
      finding('hint', 'a.b', order.id),
      finding('error', 'a.b', order.id),
      finding('hint', 'a.c', order.id),
    ]);

    expect(index.severityOfElement(condition.id)).toBe('hint');
    expect(index.severityOfElement(order.id)).toBe('error');
    expect(index.severityOfElement('other')).toBeNull();
  });

  it('puts findings without an element at the strategy, but not those of one of its rules', () => {
    const index = indexFindings([
      finding('error', 'flow.no_order_reachable', null),
      finding('error', 'expression.invalid', null, 'risiko'),
      finding('hint', 'x.y', condition.id),
    ]);

    expect(index.ofStrategy(document).map((item) => item.code)).toEqual(['flow.no_order_reachable']);
    expect(index.ofRule(document, { owner: { kind: 'strategy' }, indices: [0] }).map((item) => item.code)).toEqual(['expression.invalid']);
  });

  it('puts the findings of an element at the element, but those of its rules at the rule', () => {
    const index = indexFindings([
      finding('error', 'parameter.missing', order.id),
      finding('error', 'expression.invalid', order.id, 'mindestvolumen'),
      finding('error', 'expression.invalid', condition.id, 'mindestvolumen'),
    ]);

    expect(index.ofElement(document, order.id).map((item) => item.code)).toEqual(['parameter.missing']);
    expect(index.ofRule(document, { owner: { kind: 'element', id: order.id }, indices: [0] })).toHaveLength(1);
    expect(index.ofRule(document, { owner: { kind: 'element', id: order.id }, indices: [0] })[0]?.element).toBe(order.id);
  });

  it('puts the findings of a part inside a rule set at that part and at the rule set, not at its sibling', () => {
    const inner = (name: string): InstanceDocument => ({ name, object_type: 'Regel', rules: [] });
    const withSet = addRule(
      document,
      { kind: 'strategy' },
      { name: 'regelwerk', object_type: 'Regelwerk', rules: [inner('regel'), inner('zweite')] },
    );
    const index = indexFindings([finding('error', 'expression.invalid', null, 'regelwerk.regel')]);
    const set = { owner: { kind: 'strategy' } as const, indices: [1] };

    expect(index.ofRule(withSet, set)).toHaveLength(1);
    expect(index.ofRuleItself(withSet, set)).toHaveLength(0);
    expect(index.ofRuleItself(withSet, { ...set, indices: [1, 0] })).toHaveLength(1);
    expect(index.ofRule(withSet, { ...set, indices: [1, 1] })).toHaveLength(0);
    expect(index.ofStrategy(withSet)).toHaveLength(0);
  });

  it('knows the names along a path, or nothing if the path leads nowhere', () => {
    expect(ruleNames(document, { owner: { kind: 'strategy' }, indices: [0] })).toEqual(['risiko']);
    expect(ruleNames(document, { owner: { kind: 'strategy' }, indices: [4] })).toBeNull();
  });
});
