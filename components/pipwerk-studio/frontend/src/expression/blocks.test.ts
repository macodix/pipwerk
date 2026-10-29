import { describe, expect, it } from 'vitest';

import {
  EMPTY,
  arithmeticBlock,
  blankComparison,
  blockForKey,
  comparisonBlock,
  convertCondition,
  conditionKind,
  emptyWhere,
  functionBlock,
  hasEmptyPlace,
  ifBlock,
  instanceReferences,
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

    // to "Alle gelten (und)" and to "Eine gilt (oder)": two new comparisons, not the old condition with a second one
    for (const old of [single, negated]) {
      for (const kind of ['and', 'or'] as const) {
        const next = convertCondition(kind, old);
        expect(next.operator).toBe(kind);
        expect(next.children).toEqual([blankComparison(), blankComparison()]);
        expect(namesIn(next)).toEqual([]);
      }
      expect(convertCondition('not', old).children).toEqual([blankComparison()]);
    }

    // and back: a new comparison, not the "and" with the old condition inside
    const both = logicBlock('and', [single, negated]);
    expect(convertCondition('compare', both)).toEqual(blankComparison());
    expect(convertCondition('compare', negated)).toEqual(blankComparison());
    expect(convertCondition('value', both)).toEqual(EMPTY);

    // the kind that is already there stays as it is
    expect(convertCondition('compare', single)).toBe(single);
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
