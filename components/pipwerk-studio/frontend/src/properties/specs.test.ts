import { describe, expect, it } from 'vitest';

import { realTypes } from '../testing/fixtures';
import { inventedTypes } from '../testing/inventedTypes';
import {
  definitionSpecs,
  instanceParameterSpecs,
  orderPropertySpecs,
  parameterSpecs,
  startBinding,
  visibleSpecs,
} from './specs';

describe('rows of parameters', () => {
  it('come from the type description with label, datatype, kinds of binding and conditions', () => {
    const specs = parameterSpecs(inventedTypes.byId.get('zz.gate')!, 'en');

    expect(specs.map((spec) => spec.key)).toEqual(['formula', 'limit', 'count', 'flag', 'note', 'mode', 'since', 'day']);
    expect(specs[0]).toMatchObject({ label: 'formula (en)', datatype: 'expression', required: true, bindings: ['expression'] });
    expect(specs[1]).toMatchObject({ datatype: 'percent' });
    expect(specs.find((spec) => spec.key === 'since')?.appliesWhen).toEqual({ name: 'mode', value: 'slow' });
  });

  it('are in the language', () => {
    expect(parameterSpecs(inventedTypes.byId.get('zz.gate')!, 'de')[0]?.label).toBe('formula (de)');
    expect(parameterSpecs(realTypes.byId.get('flow.condition')!, 'de')[0]?.label).toBe('Ausdruck');
    expect(parameterSpecs(realTypes.byId.get('flow.condition')!, 'en')[0]?.label).toBe('Expression');
  });
});

describe('rows of the properties of an order', () => {
  const launch = inventedTypes.byId.get('zz.launch')!;

  it('come from the order type that the element selects, and only the ones the user sets', () => {
    const a = orderPropertySpecs(inventedTypes, launch, { parameters: { shape: { kind: 'fixed', value: 'ZzOrderA' } } }, 'de');
    const b = orderPropertySpecs(inventedTypes, launch, { parameters: { shape: { kind: 'fixed', value: 'ZzOrderB' } } }, 'de');

    expect(a.map((spec) => spec.key)).toEqual(['amount', 'reason']);
    expect(b.map((spec) => spec.key)).toEqual(['amount', 'trigger_price']);
    expect(a[0]).toMatchObject({ must: true, bindings: ['fixed', 'parameter', 'expression', 'application'] });
  });

  it('are none without a selection, and none for a type that selects no order', () => {
    expect(orderPropertySpecs(inventedTypes, launch, { parameters: {} }, 'de')).toEqual([]);
    expect(orderPropertySpecs(inventedTypes, inventedTypes.byId.get('zz.gate'), { parameters: {} }, 'de')).toEqual([]);
    expect(orderPropertySpecs(inventedTypes, undefined, { parameters: {} }, 'de')).toEqual([]);
  });

  it('follow the real order types the same way', () => {
    const place = realTypes.byId.get('flow.place_order')!;

    const market = orderPropertySpecs(realTypes, place, { parameters: { ordertyp: { kind: 'fixed', value: 'MarketOrder' } } }, 'de');
    const stop = orderPropertySpecs(realTypes, place, { parameters: { ordertyp: { kind: 'fixed', value: 'StopOrder' } } }, 'de');

    expect(market.map((spec) => spec.key)).toEqual(['bemerkung', 'richtung', 'volumen', 'stop_loss', 'take_profit']);
    expect(stop.map((spec) => spec.key)).toEqual([
      'bemerkung',
      'richtung',
      'volumen',
      'preis',
      'stop_loss',
      'take_profit',
      'gueltigkeit',
      'ablaufzeit',
      'datum',
    ]);
    expect(stop.find((spec) => spec.key === 'richtung')?.label).toBe('Richtung');
  });
});

describe('own parameters of an instance', () => {
  it('become rows with the name as label and all kinds of binding', () => {
    const specs = definitionSpecs([{ name: 'cap', datatype: 'number', required: true, default: 5 }, { name: 'mode', datatype: 'choice', choices: ['a', 'b'] }]);

    expect(specs[0]).toMatchObject({ key: 'cap', label: 'cap', required: true, default: 5 });
    expect(specs[1]?.choices.map((choice) => choice.id)).toEqual(['a', 'b']);
    expect(specs[1]?.bindings).toHaveLength(4);
  });

  it('follow the parameters of the type', () => {
    const specs = instanceParameterSpecs(
      { name: 'z', object_type: 'Zork', parameters: [{ name: 'extra', datatype: 'text' }, { name: 'size', datatype: 'text' }] },
      inventedTypes.byId.get('Zork'),
      'de',
    );

    // The parameter of the type wins over an own parameter with the same name.
    expect(specs.map((spec) => spec.key)).toEqual(['size', 'unit', 'extra']);
    expect(specs[0]?.datatype).toBe('integer');
  });
});

describe('visibleSpecs', () => {
  const specs = parameterSpecs(inventedTypes.byId.get('zz.gate')!, 'de');

  it('shows a conditional row only if the other row has that value', () => {
    expect(visibleSpecs(specs, { mode: { kind: 'fixed', value: 'fast' } }).map((s) => s.key)).not.toContain('since');
    expect(visibleSpecs(specs, { mode: { kind: 'fixed', value: 'slow' } }).map((s) => s.key)).toContain('since');
  });

  it('takes the standard value of the other row if it has no value', () => {
    expect(visibleSpecs(specs, {}).map((s) => s.key)).not.toContain('since');
    const slowByDefault = specs.map((spec) => (spec.key === 'mode' ? { ...spec, default: 'slow' } : spec));
    expect(visibleSpecs(slowByDefault, {}).map((s) => s.key)).toContain('since');
  });

  it('keeps the row if the other value is not fixed and so not known', () => {
    expect(visibleSpecs(specs, { mode: { kind: 'expression', value: 'a' } }).map((s) => s.key)).toContain('since');
    expect(visibleSpecs(specs, { mode: { kind: 'parameter', value: 'p' } }).map((s) => s.key)).toContain('since');
  });

  it('applies to the real conditions of the validity of an order too', () => {
    const modify = parameterSpecs(realTypes.byId.get('flow.modify_order')!, 'de');

    const keys = (value: string) =>
      visibleSpecs(modify, { gueltigkeit: { kind: 'fixed', value } }).map((spec) => spec.key);

    expect(keys('bis_zeitpunkt')).toContain('ablaufzeit');
    expect(keys('bis_zeitpunkt')).not.toContain('datum');
    expect(keys('bis_ende_eines_tages')).toContain('datum');
    expect(keys('bis_auf_widerruf')).not.toContain('ablaufzeit');
  });
});

describe('startBinding', () => {
  const spec = parameterSpecs(inventedTypes.byId.get('zz.gate')!, 'de');
  const by = (key: string) => spec.find((candidate) => candidate.key === key)!;

  it('starts a fixed value from the standard value of the row or from its datatype', () => {
    expect(startBinding('fixed', by('count'), [])).toEqual({ kind: 'fixed', value: 3 });
    expect(startBinding('fixed', by('limit'), [])).toEqual({ kind: 'fixed', value: 0 });
    expect(startBinding('fixed', by('flag'), [])).toEqual({ kind: 'fixed', value: false });
    expect(startBinding('fixed', by('note'), [])).toEqual({ kind: 'fixed', value: '' });
    expect(startBinding('fixed', { ...by('mode'), default: null }, [])).toEqual({ kind: 'fixed', value: 'fast' });
  });

  it('starts the other kinds', () => {
    expect(startBinding('parameter', by('count'), ['p', 'q'])).toEqual({ kind: 'parameter', value: 'p' });
    expect(startBinding('parameter', by('count'), [])).toEqual({ kind: 'parameter', value: '' });
    expect(startBinding('expression', by('count'), [])).toEqual({ kind: 'expression', value: '' });
    expect(startBinding('application', by('count'), [])).toEqual({ kind: 'application' });
  });
});
