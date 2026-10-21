import { describe, expect, it } from 'vitest';

import {
  EMPTY,
  arithmeticBlock,
  blockForKey,
  comparisonBlock,
  convertCondition,
  conditionKind,
  crossingBlock,
  emptyWhere,
  functionBlock,
  ifBlock,
  instanceReferences,
  literalBlock,
  logicBlock,
  nameBlock,
  namesIn,
  numberBlock,
  usesName,
  valueKey,
  withChild,
} from './blocks';

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
    const tree = crossingBlock('any', nameBlock(['ema20', 'wert']), nameBlock(['ema50', 'wert']));
    expect(instanceReferences(tree)).toEqual([
      { instance: 'ema20', property: 'wert' },
      { instance: 'ema50', property: 'wert' },
    ]);
    expect(instanceReferences(null)).toEqual([]);
    expect(instanceReferences(nameBlock(['risikogrenze']))).toEqual([]);
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
    expect(valueKey(crossingBlock('up', EMPTY, EMPTY))).toBe('k:cond');
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
    expect(conditionKind(crossingBlock('any', EMPTY, EMPTY))).toBe('cross');
    expect(conditionKind(logicBlock('or', []))).toBe('or');
    expect(conditionKind(logicBlock('not', []))).toBe('not');
    expect(conditionKind(logicBlock('and', []))).toBe('and');
    expect(conditionKind(EMPTY)).toBe('compare');
    expect(conditionKind(nameBlock(['a', 'b']))).toBe('value');
  });

  it('turns "and" into "or" without losing the conditions, and wraps a single one otherwise', () => {
    const both = logicBlock('and', [comparisonBlock('>', EMPTY, EMPTY), comparisonBlock('<', EMPTY, EMPTY)]);
    expect(convertCondition('or', both)).toEqual({ ...both, operator: 'or' });
    const single = comparisonBlock('=', nameBlock(['a', 'b']), numberBlock(1));
    const wrapped = convertCondition('and', single);
    expect(wrapped.operator).toBe('and');
    expect(wrapped.children?.[0]).toEqual(single);
    expect(wrapped.children).toHaveLength(2);
    expect(convertCondition('not', single).children).toEqual([single]);
    expect(convertCondition('compare', single)).toBe(single);
    expect(convertCondition('cross', single).kind).toBe('crossing');
  });
});
