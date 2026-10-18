import { describe, expect, it } from 'vitest';

import type { DataType } from '../api/elementTypes';
import type { ElementDocument, InstanceDocument, StrategyDocument } from '../document/types';
import { loadTestcase, realTypes } from '../testing/fixtures';
import { inventedTypes } from '../testing/inventedTypes';
import { completionsAt, applySuggestion, displayExpression } from './completions';
import { findMember, rootMembers } from './scope';

const strategy = loadTestcase('str-03');

function instance(name: string, objectType: string, extra: Partial<InstanceDocument> = {}): InstanceDocument {
  return {
    name,
    object_type: objectType,
    origin: { object_type: objectType, template_id: null, template_title: null },
    parameter_values: {},
    parameters: [],
    properties: [],
    instances: [],
    rules: [],
    expression: null,
    determined_property: null,
    comparison: null,
    result_expression: null,
    ...extra,
  };
}

function objectElement(id: string, inst: InstanceDocument): ElementDocument {
  return { id, type: inst.object_type, title: inst.name, name: null, x: 0, y: 0, parameters: {}, properties: {}, rules: [], management_of: null, instance: inst };
}

/** The strategy with a trend that holds an indicator, and a rule set with a rule. */
const document: StrategyDocument = {
  ...strategy,
  elements: [
    ...strategy.elements,
    objectElement(
      '00000000-0000-4000-8000-000000000001',
      instance('trend_h1', 'Trend', {
        instances: [instance('ema21', 'EMA')],
        rules: [instance('trendregel', 'Regel')],
        properties: [{ name: 'zusatz', datatype: 'number', expression: 'ema21.wert' }],
      }),
    ),
  ],
  rules: [...strategy.rules, instance('regelwerk', 'Regelwerk', { rules: [instance('regel', 'Regel'), instance('zweite', 'Regel')] })],
};

const functions = [
  { name: 'IF', description: 'Fallunterscheidung' },
  { name: 'IFNA', description: 'Ersatzwert' },
  { name: 'MAX', description: 'Maximum' },
];

function roots(context: Parameters<typeof rootMembers>[3], language: 'de' | 'en' = 'de') {
  return rootMembers(document, realTypes, language, context);
}

function suggest(text: string, context: Parameters<typeof rootMembers>[3] = { kind: 'element', elementId: strategy.elements[0]!.id }, caret = text.length) {
  return completionsAt(text, caret, roots(context), functions);
}

function ids(text: string, context?: Parameters<typeof rootMembers>[3]): string[] {
  return suggest(text, context)?.suggestions.map((item) => item.id) ?? [];
}

describe('names an expression of an element sees', () => {
  const names = roots({ kind: 'element', elementId: strategy.elements[0]!.id }).map((member) => member.id);

  it('are the instances, the named results, the rules of the strategy and the objects of the application', () => {
    expect(names).toEqual(
      expect.arrayContaining(['ema20', 'ema50', 'atr14', 'richtung', 'stop', 'stop_neu', 'risiko', 'trend_h1', 'regelwerk']),
    );
    expect(names).toEqual(expect.arrayContaining(['Konto', 'Instrument', 'Kerze', 'Tick', 'Order', 'Position', 'Strategie']));
  });

  it('do not include the rules of an element or the rules inside a rule set', () => {
    expect(names).not.toContain('mindestvolumen');
    expect(names).not.toContain('regel');
    expect(names).not.toContain('ema21');
  });
});

describe('suggestions after a point', () => {
  it('give the properties of an object of the application from its type description', () => {
    expect(ids('Konto.')).toEqual(['kapital', 'freie_margin', 'waehrung']);
    expect(ids('Kerze.sch')).toEqual(['schluss']);
  });

  it('give the properties of an instance from its object type', () => {
    expect(ids('ema20.')).toEqual(['wert']);
    expect(ids('atr14.W')).toEqual(['wert']);
  });

  it('give the properties of the order types after Order, not only those of the object', () => {
    const found = ids('Order.');

    expect(found).toEqual(expect.arrayContaining(['status', 'volumen', 'limitpreis', 'stop_loss', 'richtung']));
    expect(ids('Order.vol')).toEqual(['volumen']);
  });

  it('follow an object-valued property to the object (Order.konto.kapital)', () => {
    expect(ids('Order.konto.')).toEqual(['kapital', 'freie_margin', 'waehrung']);
    expect(ids('Position.instrument.tick')).toEqual(['tickgroesse', 'tickwert']);
  });

  it('give the result of a calculation and of a rule', () => {
    expect(ids('richtung.')).toEqual(['ergebnis']);
    expect(ids('risiko.')).toEqual(['ergebnis']);
  });

  it('give for names inside an indicator or a trend their own properties and what they contain (hint S19)', () => {
    expect(ids('trend_h1.')).toEqual(expect.arrayContaining(['richtung', 'zusatz', 'ema21', 'trendregel']));
    expect(ids('trend_h1.ema21.')).toEqual(['wert']);
    expect(ids('trend_h1.ema21.we')).toEqual(['wert']);
    expect(ids('trend_h1.trendregel.')).toEqual(['ergebnis']);
  });

  it('give for a rule set its rules, and for those the result (hint S19: ruleset.rule.result)', () => {
    expect(ids('regelwerk.')).toEqual(['ergebnis', 'regel', 'zweite']);
    expect(ids('regelwerk.regel.')).toEqual(['ergebnis']);
  });

  it('are the same without regard to case, and after any text', () => {
    expect(ids('KONTO.KAP')).toEqual(['kapital']);
    expect(ids('IF(Konto.kap')).toEqual(['kapital']);
    expect(ids('a + Order.ric')).toEqual(['richtung']);
  });

  it('are none for an unknown name or inside a text or a number', () => {
    expect(suggest('unbekannt.')).toBeNull();
    expect(suggest('"Konto.')).toBeNull();
    expect(suggest('Konto.xyz')).toBeNull();
    expect(suggest('3.')).toBeNull();
    expect(suggest('IF(')).toBeNull();
    expect(suggest('a..b')).toBeNull();
  });

  it('start at the place the typed prefix starts', () => {
    const result = suggest('Konto.kap')!;

    expect(result).toMatchObject({ start: 6, end: 9 });
  });

  it('use the caret and not the end of the text', () => {
    const result = suggest('Konto.kap + 1', undefined, 9)!;

    expect(result.suggestions.map((item) => item.id)).toEqual(['kapital']);
    expect(applySuggestion('Konto.kap + 1', result, result.suggestions[0]!)).toEqual({ text: 'Konto.kapital + 1', caret: 13 });
  });
});

describe('suggestions without a point', () => {
  it('offer names and functions that begin with what is typed', () => {
    const found = suggest('I')!.suggestions;

    expect(found.map((item) => `${item.kind}:${item.id}`)).toEqual(['name:Instrument', 'function:IF', 'function:IFNA']);
    expect(found.find((item) => item.id === 'IF')?.insert).toBe('IF(');
  });

  it('offer nothing for an empty token', () => {
    expect(suggest('')).toBeNull();
    expect(suggest('a ')).toBeNull();
  });

  it('are in the language: the label of an object, the identifier is what is written', () => {
    const english = completionsAt('Ko', 2, roots({ kind: 'element', elementId: strategy.elements[0]!.id }, 'en'), functions)!;

    expect(english.suggestions.map((item) => [item.id, item.label])).toEqual([['Konto', 'Account']]);
    expect(english.suggestions[0]?.insert).toBe('Konto');
  });
});

describe('names in a rule', () => {
  const owner = { kind: 'strategy' } as const;

  it('are its parameters, the other rules and the names of the strategy', () => {
    const names = roots({ kind: 'rule', path: { owner, indices: [0] } }).map((member) => member.id);

    expect(names).toEqual(expect.arrayContaining(['risikogrenze', 'risiko', 'regelwerk', 'ema20', 'Konto']));
  });

  it('are in a rule set only its own parameters, the rules of the rule set and the objects of the application', () => {
    const names = roots({ kind: 'rule', path: { owner, indices: [1, 0] } }).map((member) => member.id);

    expect(names).toContain('zweite');
    expect(names).toContain('Konto');
    expect(names).not.toContain('ema20');
    expect(names).not.toContain('risiko');
  });

  it('are for the result of a rule set its rules and the objects of the application', () => {
    const names = roots({ kind: 'rulesetResult', path: { owner, indices: [1] } }).map((member) => member.id);

    expect(names).toEqual(expect.arrayContaining(['regel', 'zweite', 'Konto']));
    expect(names).not.toContain('ema20');
  });

  it('are in a rule of an element also the rules of that element', () => {
    const order = strategy.elements.find((element) => element.type === 'flow.place_order')!;

    const names = roots({ kind: 'rule', path: { owner: { kind: 'element', id: order.id }, indices: [0] } }).map((member) => member.id);

    expect(names).toContain('mindestvolumen');
    expect(names).toContain('ema20');
  });
});

describe('a name closer to the expression hides one further out', () => {
  it('shows each name once', () => {
    const shadow: StrategyDocument = { ...document, rules: [...document.rules, instance('konto', 'Regel')] };

    const members = rootMembers(shadow, realTypes, 'de', { kind: 'element', elementId: 'x' }).filter(
      (member) => member.id.toLowerCase() === 'konto',
    );

    expect(members).toHaveLength(1);
    expect(members[0]?.id).toBe('konto');
  });
});

describe('names in the language of the interface', () => {
  const place = roots({ kind: 'element', elementId: strategy.elements[0]!.id }, 'en');
  const text = 'ema20.wert > Konto.kapital';
  const names = [
    {
      start: 0,
      end: 10,
      identifier: 'ema20.wert',
      resolved: true,
      previous: false,
      segments: [
        { identifier: 'ema20', start: 0, end: 5 },
        { identifier: 'wert', start: 6, end: 10 },
      ],
    },
    {
      start: 13,
      end: 26,
      identifier: 'Konto.kapital',
      resolved: true,
      previous: false,
      segments: [
        { identifier: 'Konto', start: 13, end: 18 },
        { identifier: 'kapital', start: 19, end: 26 },
      ],
    },
  ];

  it('shows the type names and property names in English and leaves the names of the user as they are', () => {
    const labelOfValue = realTypes.byId.get('EMA')!.properties[0]!.label.en;
    const labelOfCapital = realTypes.byId.get('Konto')!.properties[0]!.label.en;

    expect(displayExpression(text, names, place)).toBe(`ema20.${labelOfValue} > Account.${labelOfCapital}`);
  });

  it('shows German names in German', () => {
    const german = roots({ kind: 'element', elementId: strategy.elements[0]!.id }, 'de');

    expect(displayExpression(text, names, german)).toBe(`ema20.${realTypes.byId.get('EMA')!.properties[0]!.label.de} > Konto.${realTypes.byId.get('Konto')!.properties[0]!.label.de}`);
  });

  it('leaves a part that is not known as it is written, and an expression without names unchanged', () => {
    const partly = [{ start: 0, end: 12, identifier: 'ema20', resolved: false, previous: false, segments: [{ identifier: 'ema20', start: 0, end: 5 }] }];

    expect(displayExpression('ema20.unknown', partly, place)).toBe('ema20.unknown');
    expect(displayExpression('1 + 2', [], place)).toBe('1 + 2');
  });

  it('finds a member without regard to case', () => {
    expect(findMember(place, 'KONTO')?.id).toBe('Konto');
    expect(findMember(place, 'nothing')).toBeUndefined();
  });
});

describe('names of types it cannot know', () => {
  it('are offered from the descriptions too', () => {
    const empty: StrategyDocument = { ...strategy, elements: [], rules: [], parameters: [] };
    const members = rootMembers(empty, inventedTypes, 'en', { kind: 'element', elementId: 'x' });

    expect(members.map((member) => member.id)).toEqual(['Planet']);
    expect(findMember(members, 'Planet')?.children().map((member) => member.id)).toEqual(['mass']);
  });

  it('offer the strategy parameters after the object that the description marks for them, whatever it is called', () => {
    const withParameters: StrategyDocument = {
      ...strategy,
      elements: [],
      rules: [],
      parameters: [
        { name: 'speed', datatype: 'number', value: 1 },
        { name: 'x', datatype: 'text', value: 'a' },
      ],
    };
    const members = rootMembers(withParameters, inventedTypes, 'en', { kind: 'element', elementId: 'x' });
    const planet = findMember(members, 'Planet')!;

    expect(planet.children().map((member) => member.id)).toEqual(['mass', 'speed', 'x']);
    expect(planet.children().find((member) => member.id === 'speed')?.detail).toBe('Number');
    // Counter test: the same names of the strategy are not offered after an object that is not marked.
    const withoutMark = {
      ...inventedTypes,
      list: inventedTypes.list.map((type) => (type.id === 'Planet' ? { ...type, strategyParameters: false } : type)),
    };
    const unmarked = rootMembers(withParameters, withoutMark, 'en', { kind: 'element', elementId: 'x' });
    expect(findMember(unmarked, 'Planet')?.children().map((member) => member.id)).toEqual(['mass']);
  });
});

describe('the datatype shown with a suggestion', () => {
  const rule = instance('r1', 'ZzRule', {
    parameters: [{ name: 'limit', datatype: 'time_unit' }],
  });
  const holder = instance('holder', 'ZzRule', { properties: [{ name: 'extra', datatype: 'integer', expression: '1' }] });
  const withAll: StrategyDocument = {
    ...strategy,
    elements: [objectElement('00000000-0000-4000-8000-0000000000aa', holder)],
    rules: [rule],
    parameters: [{ name: 'speed', datatype: 'number', value: 1 }],
  };
  const details = (language: 'de' | 'en') => {
    const outside = rootMembers(withAll, inventedTypes, language, { kind: 'element', elementId: 'x' });
    const insideRule = rootMembers(withAll, inventedTypes, language, {
      kind: 'rule',
      path: { owner: { kind: 'strategy' }, indices: [0] },
    });
    const planet = findMember(outside, 'Planet')!.children();
    return {
      typeProperty: findMember(planet, 'mass')?.detail,
      strategyParameter: findMember(planet, 'speed')?.detail,
      ownProperty: findMember(findMember(outside, 'holder')!.children(), 'extra')?.detail,
      ruleParameter: findMember(insideRule, 'limit')?.detail,
    };
  };

  it('is in German and in English, at every place', () => {
    expect(details('de')).toEqual({
      typeProperty: 'Zahl',
      strategyParameter: 'Zahl',
      ownProperty: 'Ganzzahl',
      ruleParameter: 'Zeiteinheit',
    });
    expect(details('en')).toEqual({
      typeProperty: 'Number',
      strategyParameter: 'Number',
      ownProperty: 'Integer',
      ruleParameter: 'Time unit',
    });
  });

  it('stays as written for a datatype without a translation, also one named like a field of every object', () => {
    const odd = instance('odd', 'ZzRule', {
      properties: [
        { name: 'a', datatype: 'constructor' as DataType, expression: '1' },
        { name: 'b', datatype: 'mystery' as DataType, expression: '1' },
      ],
    });
    const other: StrategyDocument = { ...withAll, elements: [objectElement('00000000-0000-4000-8000-0000000000bb', odd)] };
    const members = findMember(rootMembers(other, inventedTypes, 'de', { kind: 'element', elementId: 'x' }), 'odd')!.children();

    expect(findMember(members, 'a')?.detail).toBe('constructor');
    expect(findMember(members, 'b')?.detail).toBe('mystery');
  });
});

describe('strategy parameters of the real descriptions', () => {
  it('follow "Strategie" and a point, from the parameters of the open strategy', () => {
    // The object has properties of its own too (the description lists them); the strategy parameters come with them.
    expect(ids('Strategie.')).toEqual(expect.arrayContaining(strategy.parameters.map((parameter) => parameter.name)));
    expect(strategy.parameters.length).toBeGreaterThan(0);
    expect(ids('Strategie.zeit')).toEqual(['zeiteinheit']);
  });

  it('follow a point after a change of the parameters', () => {
    const changed: StrategyDocument = { ...strategy, parameters: [...strategy.parameters, { name: 'neu', datatype: 'number', value: 2 }] };
    const members = rootMembers(changed, realTypes, 'de', { kind: 'element', elementId: strategy.elements[0]!.id });

    expect(findMember(members, 'Strategie')?.children().map((member) => member.id)).toContain('neu');
  });
});
