import { describe, expect, it } from 'vitest';

import { blocksToStored, namesOf, storedToBlocks } from './fakeExpressions';

describe('the expressions of the test backend', () => {
  it('turns blocks into the stored text and back', () => {
    const stored = 'IF(ema20.wert > ema50.wert; "buy"; "sell")';
    const blocks = storedToBlocks(stored);
    expect(blocks).toMatchObject({ kind: 'if' });
    expect(blocksToStored(blocks)).toBe(stored);
  });

  it('writes a crossing as the comparisons of the earlier values and of the present ones, joined by "and" (no block of its own)', () => {
    const name = (key: string) => ({ kind: 'name', path: [key, 'wert'] });
    const stored = blocksToStored({
      kind: 'logic',
      operator: 'and',
      children: [
        { kind: 'comparison', operator: '<=', children: [{ kind: 'function', function: 'PREVIOUS', children: [name('a')] }, { kind: 'function', function: 'PREVIOUS', children: [name('b')] }] },
        { kind: 'comparison', operator: '>', children: [name('a'), name('b')] },
      ],
    });
    expect(stored).toBe('AND(PREVIOUS(a.wert) <= PREVIOUS(b.wert); a.wert > b.wert)');
    expect(storedToBlocks(stored)).toMatchObject({ kind: 'logic', operator: 'and', children: [{ kind: 'comparison', operator: '<=' }, { kind: 'comparison', operator: '>' }] });
  });

  it('reads the precedence of the operators and brackets', () => {
    expect(storedToBlocks('1 + 2 * 3')).toMatchObject({ kind: 'arithmetic', operator: '+', children: [{ kind: 'literal', value: 1 }, { kind: 'arithmetic', operator: '*' }] });
    expect(storedToBlocks('(1 + 2) * 3')).toMatchObject({ kind: 'arithmetic', operator: '*' });
  });

  it('reads nothing for text outside of the part of the language it knows', () => {
    expect(storedToBlocks('1 +')).toBeNull();
    expect(storedToBlocks('')).toEqual({ kind: 'empty' });
  });

  it('names the instances, the results, the strategy parameters and the candle of a document', () => {
    const names = namesOf({
      parameters: [{ key: 'stop_abstand', name: 'Stop-Abstand', datatype: 'number' }],
      elements: [
        { instance: { name: 'EMA 20', key: 'ema20' }, key: null },
        { instance: null, key: 'stop', name: 'Stop-Loss' },
        { instance: null, key: null, name: 'Kerzenschluss' },
      ],
    });
    expect(names.map((name) => name.path)).toEqual([['ema20'], ['stop'], ['Strategie', 'stop_abstand'], ['Kerze']]);
  });
});
