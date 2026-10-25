import { describe, expect, it } from 'vitest';

import type { VisibleMethod, VisibleName, VisibleProperty } from '../api/objects';
import { blockOfOption, buildValueGroups, findOption, matchChoice, methodKey, selectKeyOf } from './options';

const label = (de: string, en: string = de) => ({ de, en });

const property = (key: string, de: string, en: string = de, patch: Partial<VisibleProperty> = {}): VisibleProperty => ({
  key,
  label: label(de, en),
  datatype: 'number',
  explanation: null,
  choices: [],
  previousValue: false,
  ...patch,
});

const name = (display: string, path: string[], kind: VisibleName['kind'], properties: VisibleProperty[] = [], patch: Partial<VisibleName> = {}): VisibleName => ({
  display,
  path,
  kind,
  datatype: null,
  properties,
  methods: [],
  propertiesTruncated: false,
  contents: [],
  ...patch,
});

const names: VisibleName[] = [
  name('EMA 20', ['ema20'], 'instance', [property('wert', 'Wert', 'Value', { previousValue: true })]),
  name('Kerze', ['Kerze'], 'application_object', [property('schluss', 'Schluss', 'Close')]),
  name('Stop-Loss', ['stop'], 'result', [property('ergebnis', 'Ergebnis', 'Result')]),
  name('Risiko', ['risiko'], 'rule', [property('ergebnis', 'Ergebnis', 'Result')]),
  name('Stop-Abstand', ['Strategie', 'stop_abstand'], 'strategy_parameter', [], { datatype: 'number' }),
  name('Risikogrenze', ['risikogrenze'], 'parameter', [], { datatype: 'percent' }),
];

describe('the values an expression can use at a place', () => {
  it('orders the groups: objects, application, results, strategy, parameters', () => {
    const groups = buildValueGroups(names, [], null, null, 'de');
    expect(groups.map((group) => group.id)).toEqual(['objects', 'application', 'results', 'strategy', 'parameters']);
  });

  it('labels a value with the name of its object and the label of the property in the language of the interface', () => {
    const german = buildValueGroups(names, [], null, null, 'de');
    const english = buildValueGroups(names, [], null, null, 'en');
    expect(german[0]?.options[0]?.label).toBe('EMA 20 › Wert');
    expect(english[0]?.options[0]?.label).toBe('EMA 20 › Value');
    expect(german[0]?.options[0]).toMatchObject({ path: ['ema20', 'wert'], previousValue: true });
  });

  it('puts the values connected with the element first and shows them only there', () => {
    const groups = buildValueGroups(names, [{ instance: 'EMA20', property: 'wert' }], null, null, 'de');
    expect(groups[0]?.id).toBe('connected');
    expect(groups[0]?.options.map((option) => option.label)).toEqual(['EMA 20 › Wert']);
    expect(groups.find((group) => group.id === 'objects')).toBeUndefined();
  });

  it('leaves out the result of the calculation the expression belongs to', () => {
    const groups = buildValueGroups(names, [], 'stop', null, 'de');
    const results = groups.find((group) => group.id === 'results');
    expect(results?.options.map((option) => option.label)).toEqual(['Risiko › Ergebnis']);
  });

  it('offers a strategy parameter and a parameter of a rule as one value each', () => {
    const groups = buildValueGroups(names, [], null, null, 'de');
    expect(groups.find((group) => group.id === 'strategy')?.options.map((option) => option.path)).toEqual([['Strategie', 'stop_abstand']]);
    expect(groups.find((group) => group.id === 'parameters')?.options.map((option) => option.path)).toEqual([['risikogrenze']]);
  });

  it('finds an option by its path without regard to case', () => {
    const groups = buildValueGroups(names, [], null, null, 'de');
    expect(findOption(groups, ['EMA20', 'WERT'])?.label).toBe('EMA 20 › Wert');
    expect(findOption(groups, ['gibts', 'nicht'])).toBeUndefined();
    expect(findOption(groups, undefined)).toBeUndefined();
  });

  it('shows the properties an object property leads to, from the description of the application object', () => {
    const order = name('Order', ['Order'], 'application_object', [property('instrument', 'Instrument', 'Instrument', { datatype: 'object' })]);
    const instrument = name('Instrument', ['Instrument'], 'application_object', [property('mindestvolumen', 'Mindestvolumen', 'Minimum volume')]);
    const types = {
      list: [{ properties: [{ id: 'instrument', datatype: 'object', objectType: 'Instrument' }] }],
    } as never;
    const groups = buildValueGroups([order, instrument], [], null, types, 'de');
    const labels = groups.flatMap((group) => group.options.map((option) => option.label));
    expect(labels).toContain('Order › Instrument › Mindestvolumen');
  });
});

describe('the methods an expression can use', () => {
  const average: VisibleMethod = {
    key: 'mittel',
    label: label('Mittel', 'Average'),
    datatype: 'number',
    explanation: label('Der Mittelwert.', 'The mean.'),
    choices: [],
    previousValue: false,
    arguments: [
      { key: 'anzahl', label: label('Anzahl', 'Count'), datatype: 'integer', required: true, default: null, explanation: null, choices: [] },
      { key: 'gewicht', label: label('Gewicht', 'Weight'), datatype: 'number', required: false, default: 1, explanation: null, choices: [] },
    ],
  };
  const gauge = name('Pegel', ['pegel'], 'instance', [property('stand', 'Stand', 'Reading')], { methods: [average] });

  it('lists a method after the properties of its object, as a value with the standard values of its arguments', () => {
    const groups = buildValueGroups([gauge], [], null, null, 'de');
    const options = groups[0]?.options ?? [];
    expect(options.map((option) => [option.key, option.label, option.method === null])).toEqual([
      ['n:pegel\u001fstand', 'Pegel › Stand', true],
      ['m:pegel\u001fmittel', 'Pegel › Mittel', false],
    ]);
    expect(blockOfOption(options[0] as never)).toEqual({ kind: 'name', path: ['pegel', 'stand'] });
    expect(blockOfOption(options[1] as never)).toEqual({
      kind: 'name',
      path: ['pegel', 'mittel'],
      call: true,
      children: [
        { kind: 'literal', value: 1, datatype: 'integer' },
        { kind: 'literal', value: 1, datatype: 'integer' },
      ],
    });
  });

  it('shows a method that the user connected with the element first, with the arguments of the input, and keeps the plain entry', () => {
    const groups = buildValueGroups([gauge], [{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5] }], null, null, 'de');
    expect(groups[0]?.id).toBe('connected');
    const connected = groups[0]?.options[0];
    expect(connected).toMatchObject({ label: 'Pegel › Mittel (3; 0.5)', args: [3, 0.5] });
    expect(blockOfOption(connected as never).children?.map((child) => child.value)).toEqual([3, 0.5]);
    expect(groups.find((group) => group.id === 'objects')?.options.map((option) => option.key)).toEqual(['n:pegel\u001fstand', 'm:pegel\u001fmittel']);
  });

  it('finds the entry of a block: a call is a method, the same name without a call is a property', () => {
    const groups = buildValueGroups([gauge], [{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5] }], null, null, 'de');
    expect(findOption(groups, ['PEGEL', 'Mittel'], true)?.method?.key).toBe('mittel');
    expect(findOption(groups, ['pegel', 'mittel'])).toBeUndefined();
    expect(findOption(groups, ['pegel', 'stand'])?.method).toBeNull();
    const call = (args: number[]) => ({ kind: 'name' as const, path: ['pegel', 'mittel'], call: true, children: args.map((value) => ({ kind: 'literal' as const, value, datatype: 'number' as const })) });
    // exactly the connected variant is shown as such; any other arguments show the plain entry
    expect(selectKeyOf(call([3, 0.5]), groups)).toBe(methodKey(['pegel', 'mittel'], [3, 0.5]));
    expect(selectKeyOf(call([9, 9]), groups)).toBe('m:pegel\u001fmittel');
    expect(selectKeyOf({ kind: 'name', path: ['pegel', 'stand'] }, groups)).toBe('n:pegel\u001fstand');
  });

  it('knows a value with an earlier value from the entry of a method', () => {
    const previous = name('Pegel', ['pegel'], 'instance', [], { methods: [{ ...average, previousValue: true }] });
    expect(buildValueGroups([previous], [], null, null, 'de')[0]?.options[0]?.previousValue).toBe(true);
  });
});

describe('the choice of a text', () => {
  const choices = [
    { id: 'buy', label: label('Kauf', 'Buy') },
    { id: 'sell', label: label('Verkauf', 'Sell') },
  ];

  it('finds the choice by its identifier', () => {
    expect(matchChoice('buy', choices)?.id).toBe('buy');
    expect(matchChoice('hold', choices)).toBeUndefined();
    expect(matchChoice(3, choices)).toBeUndefined();
  });
});
