import { describe, expect, it } from 'vitest';

import type { FunctionDescription } from '../api/elementTypes';
import type { ExpressionToken, VisibleName } from '../api/objects';
import { callAt, completionsAt, displayName, matchingBrackets } from './formulaAssist';

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

describe('the brackets that belong together', () => {
  it('gives the positions of both brackets at the caret', () => {
    expect(matchingBrackets(tokens, 2)).toEqual([2, 15]);
    expect(matchingBrackets(tokens, 16)).toEqual([15, 2]);
    expect(matchingBrackets(tokens, 4)).toBeNull();
  });
});
