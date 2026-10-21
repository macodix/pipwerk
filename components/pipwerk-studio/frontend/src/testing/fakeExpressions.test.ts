import { describe, expect, it } from 'vitest';

import { blocksToStored, namesOf, storedToBlocks } from './fakeExpressions';

describe('the expressions of the test backend', () => {
  it('turns blocks into the stored text and back', () => {
    const stored = 'IF(ema20.wert > ema50.wert; "buy"; "sell")';
    const blocks = storedToBlocks(stored);
    expect(blocks).toMatchObject({ kind: 'if' });
    expect(blocksToStored(blocks)).toBe(stored);
  });

  it('writes a crossing as the two comparisons with the earlier values', () => {
    const stored = blocksToStored({
      kind: 'crossing',
      direction: 'up',
      children: [
        { kind: 'name', path: ['a', 'wert'] },
        { kind: 'name', path: ['b', 'wert'] },
      ],
    });
    expect(stored).toBe('AND(PREVIOUS(a.wert) <= PREVIOUS(b.wert); a.wert > b.wert)');
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
