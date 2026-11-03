import { describe, expect, it } from 'vitest';

import {
  EMPTY,
  arithmeticBlock,
  blankComparison,
  blockForKey,
  comparisonBlock,
  convertCondition,
  convertConditionWithLoss,
  conditionKind,
  emptyWhere,
  functionBlock,
  hasEmptyPlace,
  hasInput,
  ifBlock,
  instanceReferences,
  isEmptyBlock,
  isMember,
  literalBlock,
  logicBlock,
  mapBlocks,
  methodBlock,
  nameBlock,
  namesIn,
  numberBlock,
  usesName,
  valueKey,
  withChild,
  withoutPart,
  type Block,
} from './blocks';
import * as blocksModule from './blocks';

/** "a crosses b upwards" as the blocks make it: the earlier values compared, then the present ones (specification 3.4). */
function crossingUp(a: ReturnType<typeof nameBlock>, b: ReturnType<typeof nameBlock>) {
  return logicBlock('and', [
    comparisonBlock('<=', functionBlock('PREVIOUS', [a]), functionBlock('PREVIOUS', [b])),
    comparisonBlock('>', a, b),
  ]);
}

describe('the tree of blocks', () => {
  it('collects every name in the order of the expression', () => {
    const tree = ifBlock(
      comparisonBlock('>', nameBlock(['ema20', 'wert']), nameBlock(['ema50', 'wert'])),
      arithmeticBlock('-', nameBlock(['Kerze', 'schluss']), numberBlock(2)),
      EMPTY,
    );
    expect(namesIn(tree)).toEqual([['ema20', 'wert'], ['ema50', 'wert'], ['Kerze', 'schluss']]);
  });

  it('names the instance and the property an expression addresses', () => {
    const tree = crossingUp(nameBlock(['ema20', 'wert']), nameBlock(['ema50', 'wert']));
    expect(instanceReferences(tree)).toEqual([
      { instance: 'ema20', property: 'wert', kind: 'property', arguments: [] },
      { instance: 'ema50', property: 'wert', kind: 'property', arguments: [] },
      { instance: 'ema20', property: 'wert', kind: 'property', arguments: [] },
      { instance: 'ema50', property: 'wert', kind: 'property', arguments: [] },
    ]);
    expect(instanceReferences(null)).toEqual([]);
    expect(instanceReferences(nameBlock(['risikogrenze']))).toEqual([]);
  });

  it('names a method with the fixed values of its arguments, and none if an argument is no fixed value', () => {
    const fixed = comparisonBlock('>', methodBlock(['pegel', 'mittel'], [numberBlock(3), literalBlock('x', 'text')]), numberBlock(1));
    expect(instanceReferences(fixed)).toEqual([{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 'x'] }]);
    const open = methodBlock(['pegel', 'mittel'], [nameBlock(['Strategie', 'n'])]);
    expect(instanceReferences(open)).toEqual(
      expect.arrayContaining([{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: null }]),
    );
  });

  it('replaces the blocks that name a value and leaves the others', () => {
    const tree = comparisonBlock('>', functionBlock('PREVIOUS', [nameBlock(['Pegel', 'Stand'])]), nameBlock(['pegel', 'stand_alt']));
    const next = mapBlocks(tree, (current) => (isMember(current, 'pegel', 'stand', 'property') ? nameBlock(['pegel', 'mittel']) : undefined));
    expect(next.children?.[0]).toEqual(functionBlock('PREVIOUS', [nameBlock(['pegel', 'mittel'])]));
    expect(next.children?.[1]).toEqual(nameBlock(['pegel', 'stand_alt']));
    expect(isMember(methodBlock(['pegel', 'stand'], []), 'pegel', 'stand', 'property')).toBe(false);
    expect(isMember(methodBlock(['pegel', 'stand'], []), 'pegel', 'stand', 'method')).toBe(true);
  });

  it('puts an empty place where a removed name stood and leaves the rest alone', () => {
    const tree = comparisonBlock('=', nameBlock(['a', 'wert']), nameBlock(['b', 'wert']));
    const emptied = emptyWhere(tree, (path) => path[0] === 'a');
    expect(emptied.children).toEqual([EMPTY, nameBlock(['b', 'wert'])]);
    expect(usesName(emptied, (path) => path[0] === 'a')).toBe(false);
    expect(usesName(emptied, (path) => path[0] === 'b')).toBe(true);
  });

  it('replaces a child and adds the missing ones as empty places', () => {
    const tree = withChild(functionBlock('MIN', []), 2, numberBlock(3));
    expect(tree.children).toEqual([EMPTY, EMPTY, numberBlock(3)]);
  });

  it('knows whether an empty place is left in the tree', () => {
    expect(hasEmptyPlace(crossingUp(nameBlock(['a', 'wert']), EMPTY))).toBe(true);
    expect(hasEmptyPlace(crossingUp(nameBlock(['a', 'wert']), nameBlock(['b', 'wert'])))).toBe(false);
    expect(hasEmptyPlace(EMPTY)).toBe(true);
  });

  it('forms whole numbers as integers and others as numbers', () => {
    expect(numberBlock(3)).toEqual(literalBlock(3, 'integer'));
    expect(numberBlock(0.5)).toEqual(literalBlock(0.5, 'number'));
  });
});

describe('the kinds of value', () => {
  it('gives every block a key under which the choice of values shows it', () => {
    expect(valueKey(nameBlock(['Kerze', 'schluss']))).toBe('n:Kerze\u001fschluss');
    expect(valueKey(numberBlock(1))).toBe('k:num');
    expect(valueKey(literalBlock('buy', 'text'))).toBe('k:str');
    expect(valueKey(literalBlock(true, 'boolean'))).toBe('k:bool');
    expect(valueKey(arithmeticBlock('+', EMPTY, EMPTY))).toBe('k:calc');
    expect(valueKey(crossingUp(nameBlock(['a', 'wert']), nameBlock(['b', 'wert'])))).toBe('k:cond');
    expect(valueKey(ifBlock(EMPTY, EMPTY, EMPTY))).toBe('k:if');
    expect(valueKey(functionBlock('PREVIOUS', [EMPTY]))).toBe('k:prev');
    expect(valueKey(functionBlock('MIN', [EMPTY]))).toBe('k:func');
    expect(valueKey(EMPTY)).toBe('');
  });

  it('keeps the value that was there as the first operand of the kind chosen', () => {
    const current = nameBlock(['ema20', 'wert']);
    expect(blockForKey('k:calc', current)).toEqual(arithmeticBlock('+', current, EMPTY));
    expect(blockForKey('k:prev', current)).toEqual(functionBlock('PREVIOUS', [current]));
    expect(blockForKey('k:if', current)).toEqual(ifBlock(EMPTY, current, EMPTY));
    expect(blockForKey('k:num', current)).toEqual(numberBlock(0));
    expect(blockForKey('n:b\u001fwert', current)).toEqual(nameBlock(['b', 'wert']));
    expect(blockForKey('k:calc', EMPTY)).toEqual(arithmeticBlock('+', EMPTY, EMPTY));
  });
});

describe('the kinds of condition', () => {
  it('names the kind of a condition', () => {
    expect(conditionKind(comparisonBlock('>', EMPTY, EMPTY))).toBe('compare');
    expect(conditionKind(logicBlock('or', []))).toBe('or');
    expect(conditionKind(logicBlock('not', []))).toBe('not');
    expect(conditionKind(logicBlock('and', []))).toBe('and');
    expect(conditionKind(EMPTY)).toBe('compare');
    expect(conditionKind(nameBlock(['a', 'b']))).toBe('value');
  });

  it('turns "and" into "or" and back without losing the conditions', () => {
    const both = logicBlock('and', [comparisonBlock('>', EMPTY, EMPTY), comparisonBlock('<', EMPTY, EMPTY)]);
    expect(convertCondition('or', both)).toEqual({ ...both, operator: 'or' });
    expect(convertCondition('and', convertCondition('or', both))).toEqual(both);
  });

  it('replaces the condition by a new one of the kind chosen, in both directions: nothing of the old one stays behind (E13)', () => {
    const single = comparisonBlock('=', nameBlock(['a', 'b']), numberBlock(1));
    const negated = logicBlock('not', [comparisonBlock('=', nameBlock(['a', 'b']), nameBlock(['c', 'd']))]);

    // from "Nicht" to "und" and "oder": two new comparisons, nothing of the negated condition behind them
    for (const kind of ['and', 'or'] as const) {
      const next = convertCondition(kind, negated);
      expect(next.operator).toBe(kind);
      expect(next.children).toEqual([blankComparison(), blankComparison()]);
      expect(namesIn(next)).toEqual([]);
    }
    // from a comparison to "und" and "oder": the comparison is the first part (F10), a new comparison the second
    for (const kind of ['and', 'or'] as const) {
      expect(convertCondition(kind, single)).toEqual(logicBlock(kind, [single, blankComparison()]));
    }
    // to "Nicht": a new "Nicht" with a blank comparison (the table asks first where the comparison has entries)
    expect(convertCondition('not', single).children).toEqual([blankComparison()]);

    // and back: a new comparison, not the "and" with the old condition inside
    const both = logicBlock('and', [single, negated]);
    expect(convertCondition('compare', both)).toEqual(blankComparison());
    expect(convertCondition('compare', negated)).toEqual(blankComparison());
    expect(convertCondition('value', both)).toEqual(EMPTY);

    // the kind that is already there stays as it is
    expect(convertCondition('compare', single)).toBe(single);
  });

  it('changes from every kind of condition to every kind, keeps what the table of the documentation says and asks only where entries would be lost (F10)', () => {
    const compared = comparisonBlock('=', nameBlock(['a', 'b']), numberBlock(1));
    const otherSign = comparisonBlock('<', EMPTY, EMPTY);
    const kinds = ['compare', 'and', 'or', 'not', 'value'] as const;
    type Row = { from: string; block: Block; loses: Record<(typeof kinds)[number], boolean>; keeps?: Partial<Record<(typeof kinds)[number], Block>> };
    // per kind of the condition shown: whether the change to each kind loses entries (and the part that is kept, if any)
    const rows: Row[] = [
      { from: 'empty condition', block: EMPTY, loses: { compare: false, and: false, or: false, not: false, value: false } },
      { from: 'blank comparison', block: blankComparison(), loses: { compare: false, and: false, or: false, not: false, value: false }, keeps: { and: logicBlock('and', [blankComparison(), blankComparison()]) } },
      { from: 'comparison with values', block: compared, loses: { compare: false, and: false, or: false, not: true, value: true }, keeps: { compare: compared, and: logicBlock('and', [compared, blankComparison()]), or: logicBlock('or', [compared, blankComparison()]) } },
      { from: 'comparison with only another sign', block: otherSign, loses: { compare: false, and: false, or: false, not: true, value: true } },
      { from: 'and, blank parts', block: logicBlock('and', [blankComparison(), blankComparison()]), loses: { compare: false, and: false, or: false, not: false, value: false } },
      { from: 'and, parts with values', block: logicBlock('and', [compared, blankComparison()]), loses: { compare: true, and: false, or: false, not: true, value: true }, keeps: { or: logicBlock('or', [compared, blankComparison()]) } },
      { from: 'and, one comparison', block: logicBlock('and', [compared]), loses: { compare: false, and: false, or: false, not: true, value: true }, keeps: { compare: compared } },
      { from: 'or, parts with values', block: logicBlock('or', [compared, compared]), loses: { compare: true, and: false, or: false, not: true, value: true }, keeps: { and: logicBlock('and', [compared, compared]) } },
      { from: 'not, blank part', block: logicBlock('not', [blankComparison()]), loses: { compare: false, and: false, or: false, not: false, value: false } },
      { from: 'not, part with values', block: logicBlock('not', [compared]), loses: { compare: true, and: true, or: true, not: false, value: true } },
      { from: 'value is true', block: nameBlock(['a', 'wahr']), loses: { compare: true, and: true, or: true, not: true, value: false } },
    ];
    for (const row of rows) {
      for (const kind of kinds) {
        const conversion = convertConditionWithLoss(kind, row.block);
        expect(conversion.loses, `${row.from} -> ${kind}`).toBe(row.loses[kind]);
        // the result is a condition of the kind chosen
        expect(conditionKind(conversion.result), `${row.from} -> ${kind}`).toBe(kind === 'value' ? (isEmptyBlock(conversion.result) ? 'compare' : 'value') : kind);
        const keeps = row.keeps?.[kind];
        if (keeps !== undefined) {
          expect(conversion.result, `${row.from} -> ${kind}`).toEqual(keeps);
        }
        // what is kept is never lost: a change that keeps all entries does not ask, one that loses entries leaves none behind
        if (conversion.loses) {
          expect(hasInput(conversion.result), `${row.from} -> ${kind}`).toBe(false);
        }
      }
    }
  });

  it('knows which trees hold entries of the user', () => {
    expect(hasInput(EMPTY)).toBe(false);
    expect(hasInput(blankComparison())).toBe(false);
    expect(hasInput(logicBlock('and', [blankComparison(), logicBlock('not', [blankComparison()])]))).toBe(false);
    expect(hasInput(comparisonBlock('<', EMPTY, EMPTY))).toBe(true);
    expect(hasInput(comparisonBlock('>', nameBlock(['a', 'b']), EMPTY))).toBe(true);
    expect(hasInput(literalBlock('x', 'text'))).toBe(true);
  });

  it('removes a part of "und" and "oder" and leaves a condition that can be edited (F9)', () => {
    const first = comparisonBlock('=', nameBlock(['a', 'b']), numberBlock(1));
    const second = comparisonBlock('<', nameBlock(['c', 'd']), numberBlock(2));
    const third = comparisonBlock('>', nameBlock(['e', 'f']), numberBlock(3));
    const three = logicBlock('and', [first, second, third]);

    expect(withoutPart(three, 1, blankComparison).children).toEqual([first, third]);
    expect(withoutPart(three, 0, blankComparison).children).toEqual([second, third]);
    // one part is left: "und" with that part
    expect(withoutPart(logicBlock('or', [first, second]), 0, blankComparison)).toEqual(logicBlock('or', [second]));
    // no part is left: a blank comparison stands in its place
    expect(withoutPart(logicBlock('and', [first]), 0, blankComparison)).toEqual(logicBlock('and', [blankComparison()]));
    expect(hasEmptyPlace(withoutPart(logicBlock('and', [first]), 0, blankComparison))).toBe(true);
    // a function that needs two arguments keeps two places
    expect(withoutPart(functionBlock('MIN', [numberBlock(1), numberBlock(2), numberBlock(3)]), 0, () => EMPTY, 2).children).toEqual([numberBlock(2), numberBlock(3)]);
    expect(withoutPart(functionBlock('MIN', [numberBlock(1), numberBlock(2)]), 0, () => EMPTY, 2).children).toEqual([numberBlock(2), EMPTY]);
  });

  it('offers no crossing, and a crossing is made of "previous value of", comparisons and "and" (E12, specification 3.4)', () => {
    const a = nameBlock(['ema20', 'wert']);
    const b = nameBlock(['ema50', 'wert']);
    // the way of the user: "Alle gelten (und)", then two comparisons, the first side of the first one "Vorheriger Wert von"
    let tree = convertCondition('and', EMPTY);
    tree = withChild(tree, 0, comparisonBlock('<=', blockForKey('k:prev', a), blockForKey('k:prev', b)));
    tree = withChild(tree, 1, comparisonBlock('>', a, b));

    expect(tree).toEqual(crossingUp(a, b));
    expect(hasEmptyPlace(tree)).toBe(false);
    expect(conditionKind(tree)).toBe('and');
    expect(valueKey(tree)).toBe('k:cond');
    // a block for the crossing does not exist any more
    expect(Object.keys(blocksModule).filter((name) => /cross/i.test(name))).toEqual([]);
  });
});
