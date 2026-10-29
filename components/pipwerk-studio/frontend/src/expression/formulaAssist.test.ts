import { describe, expect, it } from 'vitest';

import type { FunctionDescription } from '../api/elementTypes';
import type { ExpressionToken, VisibleName } from '../api/objects';
import { callAt, completionsAt, displayName, matchingBrackets, methodCallAt } from './formulaAssist';

const label = (de: string, en: string = de) => ({ de, en });

const ema: VisibleName = {
  display: 'ema20',
  path: ['ema20'],
  kind: 'instance',
  datatype: null,
  propertiesTruncated: false,
  methods: [],
  contents: [],
  properties: [
    { key: 'wert', label: label('Wert', 'Value'), datatype: 'number', explanation: label('Der Wert.', 'The value.'), choices: [], previousValue: true },
    { key: 'steigung', label: label('Steigung'), datatype: 'number', explanation: null, choices: [], previousValue: false },
  ],
};

const berechnung: VisibleName = {
  display: 'Stop-Loss',
  path: ['stop'],
  kind: 'result',
  datatype: null,
  propertiesTruncated: false,
  methods: [],
  contents: [],
  properties: [{ key: 'ergebnis', label: label('Ergebnis', 'Result'), datatype: 'number', explanation: null, choices: [], previousValue: false }],
};

const functions: FunctionDescription[] = [
  { name: 'IF', label: label('Wenn', 'If'), explanation: label('Wählt einen Wert.', 'Chooses a value.'), minArguments: 2, maxArguments: 3, arguments: [], variadic: null, result: 'any' },
  { name: 'MIN', label: label('Minimum', 'Minimum'), explanation: label('Der kleinste.', 'The smallest.'), minArguments: 1, maxArguments: null, arguments: [], variadic: 'number', result: 'number' },
];

describe('the suggestions while a formula is typed', () => {
  it('suggests the properties after the name of an object and filters by what is typed', () => {
    const result = completionsAt('ema20.', 6, [ema], functions, null, 'de');
    expect(result?.from).toBe(6);
    expect(result?.items.map((item) => item.label)).toEqual(['Wert', 'Steigung']);
    const filtered = completionsAt('ema20.St', 8, [ema], functions, null, 'de');
    expect(filtered?.from).toBe(6);
    expect(filtered?.items.map((item) => item.label)).toEqual(['Steigung']);
  });

  it('writes the names of the language of the display', () => {
    const result = completionsAt('ema20.', 6, [ema], functions, null, 'en');
    expect(result?.items[0]).toMatchObject({ label: 'Value', insert: 'Value', tip: 'The value.' });
  });

  it('suggests the results of calculations by the name they show', () => {
    const result = completionsAt('Stop-Loss.', 10, [berechnung], functions, null, 'de');
    expect(result).toBeNull();
    const bracketed = completionsAt('[Stop-Loss].', 12, [berechnung], functions, null, 'de');
    expect(bracketed?.items.map((item) => item.label)).toEqual(['Ergebnis']);
  });

  it('suggests names and functions for a word being typed', () => {
    const result = completionsAt('mi', 2, [ema], functions, null, 'de');
    expect(result?.items.map((item) => item.insert)).toEqual(['MIN(']);
    const names = completionsAt('em', 2, [ema], functions, null, 'de');
    expect(names?.items.map((item) => item.insert)).toEqual(['ema20']);
  });

  it('suggests nothing after a space or an unknown object', () => {
    expect(completionsAt('ema20 ', 6, [ema], functions, null, 'de')).toBeNull();
    expect(completionsAt('gibtesnicht.', 12, [ema], functions, null, 'de')).toBeNull();
  });

  it('brackets a name that is not simple', () => {
    expect(displayName('ema20')).toBe('ema20');
    expect(displayName('Stop-Loss')).toBe('[Stop-Loss]');
  });
});

const token = (start: number, end: number, kind: ExpressionToken['kind'], partner: number | null = null): ExpressionToken => ({ start, end, kind, partner });

// IF(a; MIN(b; c))
const text = 'IF(a; MIN(b; c))';
const tokens: ExpressionToken[] = [
  token(0, 2, 'function'),
  token(2, 3, 'bracket', 10),
  token(3, 4, 'name'),
  token(4, 5, 'separator'),
  token(6, 9, 'function'),
  token(9, 10, 'bracket', 9),
  token(10, 11, 'name'),
  token(11, 12, 'separator'),
  token(13, 14, 'name'),
  token(14, 15, 'bracket', 5),
  token(15, 16, 'bracket', 1),
  // index 9 is the inner closing bracket, index 10 the outer one
];

describe('the explanation of the arguments', () => {
  it('names the function and the argument the caret is at', () => {
    expect(callAt(tokens, text, 4, functions)).toMatchObject({ fn: { name: 'IF' }, argument: 0 });
    expect(callAt(tokens, text, 7, functions)).toMatchObject({ fn: { name: 'IF' }, argument: 1 });
    expect(callAt(tokens, text, 13, functions)).toMatchObject({ fn: { name: 'MIN' }, argument: 1 });
  });

  it('names no function outside of all brackets', () => {
    expect(callAt(tokens, text, 0, functions)).toBeNull();
    expect(callAt(tokens, text, 16, functions)).toBeNull();
  });
});

const gauge: VisibleName = {
  display: 'Pegel',
  path: ['pegel'],
  kind: 'instance',
  datatype: null,
  propertiesTruncated: false,
  contents: [],
  properties: [
    { key: 'stand', label: label('Stand', 'Reading'), datatype: 'number', datatypeLabel: label('Zahl', 'number'), explanation: null, choices: [], previousValue: false },
  ],
  methods: [
    {
      key: 'mittel',
      label: label('Mittel', 'Average'),
      datatype: 'number',
      explanation: label('Der Mittelwert der letzten Kerzen.', 'The mean of the last candles.'),
      choices: [],
      previousValue: false,
      arguments: [
        { key: 'anzahl', label: label('Anzahl', 'Count'), datatype: 'integer', required: true, default: null, explanation: label('Wie viele Kerzen.', 'How many candles.'), choices: [] },
        { key: 'gewicht', label: label('Gewicht', 'Weight'), datatype: 'number', required: false, default: 1, explanation: null, choices: [] },
      ],
    },
  ],
};

describe('methods in the formula view (specification 5.4)', () => {
  it('suggests the properties and the methods of an object after its name, a method with its opening bracket', () => {
    const result = completionsAt('pegel.', 6, [gauge], functions, null, 'de');
    // beside a property stands the word of the library for its data type (E11), beside a method the word "Methode"
    expect(result?.items.map((item) => [item.label, item.insert, item.detail, item.method])).toEqual([
      ['Stand', 'Stand', 'Zahl', false],
      ['Mittel', 'Mittel(', '', true],
    ]);
    expect(completionsAt('pegel.', 6, [gauge], functions, null, 'en')?.items[0]?.detail).toBe('number');
    expect(result?.items[1]?.tip).toBe('Der Mittelwert der letzten Kerzen.');
    expect(completionsAt('pegel.Mi', 8, [gauge], functions, null, 'de')?.items.map((item) => item.label)).toEqual(['Mittel']);
    expect(completionsAt('pegel.', 6, [gauge], functions, null, 'en')?.items[1]).toMatchObject({ label: 'Average', insert: 'Average(' });
  });

  // pegel.Mittel(3; 0.5)
  const call = 'pegel.Mittel(3; 0.5)';
  const callTokens: ExpressionToken[] = [
    token(0, 12, 'name'),
    token(12, 13, 'bracket', 5),
    token(13, 14, 'value'),
    token(14, 15, 'separator'),
    token(16, 19, 'value'),
    token(19, 20, 'bracket', 1),
  ];

  it('names the method and the argument the caret is at, so that the arguments are explained while they are typed', () => {
    expect(methodCallAt(callTokens, call, 14, [gauge])).toMatchObject({ method: { key: 'mittel' }, argument: 0 });
    expect(methodCallAt(callTokens, call, 17, [gauge])).toMatchObject({ method: { key: 'mittel' }, argument: 1 });
    expect(methodCallAt(callTokens, call, 20, [gauge])).toBeNull();
    expect(methodCallAt(callTokens, call, 5, [gauge])).toBeNull();
    // a function is no method
    expect(methodCallAt(tokens, text, 4, [gauge])).toBeNull();
    // the name of the method is found by its label in either language and by its key, also in square brackets
    const bracketed = '[Pegel].[Average](1)';
    expect(methodCallAt([token(0, 17, 'name'), token(17, 18, 'bracket', 4), token(18, 19, 'value'), token(19, 20, 'bracket', 1)], bracketed, 19, [gauge])).toMatchObject({ method: { key: 'mittel' } });
  });
});

describe('the brackets that belong together', () => {
  it('gives the positions of both brackets at the caret', () => {
    expect(matchingBrackets(tokens, 2)).toEqual([2, 15]);
    expect(matchingBrackets(tokens, 16)).toEqual([15, 2]);
    expect(matchingBrackets(tokens, 4)).toBeNull();
  });
});
