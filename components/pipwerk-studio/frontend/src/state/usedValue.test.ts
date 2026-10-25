import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseStrategyDocument } from '../document/parse';
import type { ElementDocument, StrategyDocument } from '../document/types';
import { comparisonBlock, functionBlock, literalBlock, methodBlock, nameBlock, numberBlock } from '../expression/blocks';
import { mockApi } from '../testing/backend';
import { inventedStrategy, inventedTypesWithMethodJson } from '../testing/inventedTypes';
import { memberBlockOf, replaceMemberIn, rewriteMember } from './usedValue';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('naming another value in an expression (specification 5.4, "Verwendete Werte")', () => {
  it('forms the block of a property and of a method with its fixed arguments', () => {
    expect(memberBlockOf({ instance: 'messer', property: 'stand' })).toEqual(nameBlock(['messer', 'stand']));
    expect(memberBlockOf({ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 'x', true] })).toEqual(
      methodBlock(['pegel', 'mittel'], [numberBlock(3), literalBlock('x', 'text'), literalBlock(true, 'boolean')]),
    );
  });

  it('replaces every block that names the value and keeps the rest, also inside PREVIOUS', () => {
    const tree = comparisonBlock('>', functionBlock('PREVIOUS', [nameBlock(['Messer', 'Stand'])]), nameBlock(['messer', 'stand']));
    const replaced = replaceMemberIn(tree, { instance: 'messer', property: 'stand' }, { instance: 'messer', property: 'hoch' });
    expect(replaced).toEqual(comparisonBlock('>', functionBlock('PREVIOUS', [nameBlock(['messer', 'hoch'])]), nameBlock(['messer', 'hoch'])));
  });

  it('tells a property from a method of the same name, and gives nothing back if the value is not named', () => {
    const tree = comparisonBlock('>', methodBlock(['pegel', 'stand'], []), nameBlock(['pegel', 'stand']));
    const replaced = replaceMemberIn(tree, { instance: 'pegel', property: 'stand', kind: 'method' }, { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [2] });
    expect(replaced?.children).toEqual([methodBlock(['pegel', 'mittel'], [numberBlock(2)]), nameBlock(['pegel', 'stand'])]);
    expect(replaceMemberIn(tree, { instance: 'andere', property: 'stand' }, { instance: 'andere', property: 'x' })).toBeNull();
  });
});

describe('the expressions of an element after another value was chosen', () => {
  function document(): StrategyDocument {
    const base = inventedStrategy();
    return {
      ...base,
      elements: base.elements.map((element: ElementDocument) =>
        element.name === 'Tun' ? { ...element, parameters: { menge: { kind: 'expression', value: 'messer.stand * 2' } } } : element,
      ),
    };
  }

  it('asks the endpoint for the blocks of the expressions of the element and writes them back through it', async () => {
    const api = mockApi({ types: inventedTypesWithMethodJson });
    const doc = parseStrategyDocument(JSON.parse(JSON.stringify(document())));
    const owner = doc.elements.find((element) => element.name === 'Tun')?.id as string;

    const rewrites = await rewriteMember(doc, 'de', owner, { instance: 'messer', property: 'stand' }, { instance: 'messer', property: 'hoch' });

    expect(rewrites).toHaveLength(1);
    expect(rewrites[0]?.stored).toBe('messer.hoch * 2');
    // one request for the blocks, one for the text of the changed blocks; the interface formed no text
    const sent = api.requests('POST', /expressions/).flatMap((call) => (call.body as { items: { stored?: string; blocks?: unknown }[] }).items);
    expect(sent.map((item) => (item.stored !== undefined ? 'stored' : 'blocks'))).toEqual(['stored', 'blocks']);
  });

  it('asks for nothing if the element has no expression, and changes nothing if no expression names the value', async () => {
    const api = mockApi({ types: inventedTypesWithMethodJson });
    const doc = parseStrategyDocument(JSON.parse(JSON.stringify(document())));
    const noExpression = doc.elements.find((element) => element.name === 'Ausführen')?.id as string;
    const owner = doc.elements.find((element) => element.name === 'Tun')?.id as string;

    expect(await rewriteMember(doc, 'de', noExpression, { instance: 'messer', property: 'stand' }, { instance: 'messer', property: 'hoch' })).toEqual([]);
    expect(api.requests('POST', /expressions/)).toHaveLength(0);
    expect(await rewriteMember(doc, 'de', owner, { instance: 'messer', property: 'tief' }, { instance: 'messer', property: 'hoch' })).toEqual([]);
    expect(api.requests('POST', /expressions/)).toHaveLength(1);
  });
});
