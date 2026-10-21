import { describe, expect, it } from 'vitest';

import type { VisibleName, VisibleProperty } from '../api/objects';
import { buildValueGroups, findOption, matchChoice } from './options';

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
