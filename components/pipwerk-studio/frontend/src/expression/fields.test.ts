import { describe, expect, it } from 'vitest';

import { loadTestcase } from '../testing/fixtures';
import { expressionText, placeKey, placeOf } from './fields';

const document = loadTestcase('str-03');
const condition = document.elements.find((element) => element.type === 'flow.condition')!;
const order = document.elements.find((element) => element.type === 'flow.place_order')!;

describe('the place of an expression', () => {
  it('finds the expression of a parameter and of a property of an element', () => {
    expect(expressionText(document, { element: condition.id, subject: null, field: 'parameter:ausdruck' })).toBe(
      condition.parameters.ausdruck?.value,
    );
    expect(expressionText(document, { element: order.id, subject: null, field: 'property:richtung' })).toBe('richtung.ergebnis');
  });

  it('finds the expression of a rule of the strategy and of a rule of an element', () => {
    expect(expressionText(document, { element: null, subject: 'risiko', field: 'expression' })).toBe(document.rules[0]?.expression);
    expect(expressionText(document, { element: order.id, subject: 'mindestvolumen', field: 'expression' })).toBe(
      'Order.volumen >= Instrument.mindestvolumen',
    );
  });

  it('finds the value of a parameter of an instance when the subject is the instance', () => {
    const ema = document.elements.find((element) => element.type === 'EMA')!;
    const changed = {
      ...document,
      elements: document.elements.map((element) =>
        element.id === ema.id
          ? { ...element, instance: { ...ema.instance!, parameter_values: { periode: { kind: 'expression' as const, value: '5 + 5' } } } }
          : element,
      ),
    };

    expect(expressionText(changed, { element: ema.id, subject: ema.instance!.name, field: 'parameter:periode' })).toBe('5 + 5');
  });

  it('finds a rule inside a rule set by the names joined with points', () => {
    const inner = { name: 'regel', object_type: 'Regel', expression: 'a + b', rules: [] };
    const nested = { ...document, rules: [{ name: 'regelwerk', object_type: 'Regelwerk', rules: [inner], result_expression: 'regel.ergebnis' }] };

    expect(expressionText(nested, { element: null, subject: 'regelwerk.regel', field: 'expression' })).toBe('a + b');
    expect(expressionText(nested, { element: null, subject: 'regelwerk', field: 'result_expression' })).toBe('regel.ergebnis');
  });

  it('finds the expression of an own property of an instance', () => {
    const trend = {
      name: 'trend_h1',
      object_type: 'Trend',
      properties: [{ name: 'richtung', datatype: 'text' as const, expression: '"buy"' }],
    };
    const withTrend = { ...document, rules: [trend] };

    expect(expressionText(withTrend, { element: null, subject: 'trend_h1', field: 'property_definition:richtung' })).toBe('"buy"');
  });

  it('is none where there is no expression: a fixed value, an unknown element, an unknown rule, a field that does not exist', () => {
    const ema = document.elements.find((element) => element.type === 'EMA')!;

    expect(expressionText(document, { element: ema.id, subject: ema.instance!.name, field: 'parameter:periode' })).toBeUndefined();
    expect(expressionText(document, { element: 'unknown', subject: null, field: 'parameter:ausdruck' })).toBeUndefined();
    expect(expressionText(document, { element: null, subject: 'unknown', field: 'expression' })).toBeUndefined();
    expect(expressionText(document, { element: condition.id, subject: null, field: 'expression' })).toBeUndefined();
    expect(expressionText(document, { element: null, subject: 'risiko', field: 'nothing' })).toBeUndefined();
    expect(expressionText(document, { element: null, subject: null, field: 'parameter:ausdruck' })).toBeUndefined();
  });

  it('has a key that tells places apart', () => {
    const a = { element: 'e', subject: null, field: 'parameter:x' };

    expect(placeKey(a)).not.toBe(placeKey({ ...a, subject: 's' }));
    expect(placeKey(a)).not.toBe(placeKey({ ...a, element: null }));
    expect(placeKey(a)).toBe(placeKey({ ...a }));
    expect(placeOf({ ...a, names: [] })).toEqual(a);
  });
});
