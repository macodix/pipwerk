import { describe, expect, it } from 'vitest';

import { referencesOfBlocks } from '../arrange/input';
import { parseStrategyDocument } from '../document/parse';
import { createI18n } from '../i18n';
import { EMA_ELEMENT_IDS, emaTrendfolge } from '../testing/emaTrendfolge';
import { inventedStrategy, inventedTypes } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { bindingPointer, bindingSlot, cardSubtitle, jsonPointerPart, stepSummary, type DescribeContext } from './describe';

const i18n = createI18n('de');
const document = parseStrategyDocument(emaTrendfolge());
const types = testTypes();

function context(sentences: Record<string, string> = {}): DescribeContext {
  return {
    document,
    types,
    language: 'de',
    t: i18n.t,
    answers: (slot) => (sentences[slot] === undefined ? undefined : { stored: '', display: '', sentence: sentences[slot], blocks: null, findings: [] }),
  };
}

function element(id: string) {
  const found = document.elements.find((candidate) => candidate.id === id);
  if (found === undefined) {
    throw new Error(id);
  }
  return found;
}

describe('texts for the drawing area (specification 5.3)', () => {
  it('says what a condition tests as the sentence of its expression, and that it is empty while there is no expression', () => {
    const condition = element(EMA_ELEMENT_IDS.cross);
    const slot = bindingSlot(condition.id, 'parameters', 'ausdruck');

    expect(stepSummary(condition, types.byId.get(condition.type), context({ [slot]: 'EMA20 kreuzt EMA50' }))).toBe('EMA20 kreuzt EMA50');
    expect(stepSummary(condition, types.byId.get(condition.type), context())).toBe('…');
    const empty = { ...condition, parameters: {} };
    expect(stepSummary(empty, types.byId.get(condition.type), context())).toContain('Noch leer');
  });

  it('names the order type and the assigned properties of a step that places an order', () => {
    const order = element(EMA_ELEMENT_IDS.order);
    const summary = stepSummary(
      order,
      types.byId.get(order.type),
      context({ [bindingSlot(order.id, 'properties', 'richtung')]: 'Richtung ist buy', [bindingSlot(order.id, 'properties', 'stop_loss')]: 'Stop-Loss' }),
    );

    expect(summary).toBe('Marktorder, Richtung: Richtung ist buy, Stop-Loss: Stop-Loss');
  });

  it('shows the values of a trigger with a strategy parameter by its name and value', () => {
    const trigger = element(EMA_ELEMENT_IDS.trigger);

    expect(stepSummary(trigger, types.byId.get(trigger.type), context())).toBe('Zeiteinheit: Zeiteinheit (M15)');
  });

  it('puts the type and the settings that characterise an object on its card', () => {
    const ema = element(EMA_ELEMENT_IDS.ema20);

    expect(cardSubtitle(ema, types.byId.get(ema.type), context())).toBe('EMA · M15 · Periode 20');
  });

  it('names the type of an element that the type descriptions do not know', () => {
    const unknown = { ...element(EMA_ELEMENT_IDS.cross), type: 'niemand.kennt' };

    expect(stepSummary(unknown, undefined, context())).toBe('Unbekannter Typ „niemand.kennt“');
  });

  it('describes a strategy of invented types in the language of the interface', () => {
    const invented = inventedTypes();
    const document2 = inventedStrategy();
    const place = document2.elements.find((candidate) => candidate.type === 'zz.place');
    const english = createI18n('en');

    const text = stepSummary(
      place as NonNullable<typeof place>,
      invented.byId.get('zz.place'),
      { document: document2, types: invented, language: 'en', t: english.t, answers: () => undefined },
    );

    expect(text).toBe('Kind A');
  });
});

describe('places of expressions (JSON Pointer, RFC 6901)', () => {
  it('escapes `~` and `/` in a key', () => {
    expect(jsonPointerPart('a/b~c')).toBe('a~1b~0c');
    expect(bindingPointer(3, 'parameters', 'ausdruck')).toBe('/elements/3/parameters/ausdruck/value');
    expect(bindingPointer(0, 'instance', 'a/b')).toBe('/elements/0/instance/parameter_values/a~1b/value');
  });
});

describe('the values an expression addresses, taken from its blocks', () => {
  it('collects the instance and the property of every name with a path of two, also in nested blocks, and ignores the rest', () => {
    const references = referencesOfBlocks({
      kind: 'function',
      children: [
        { kind: 'comparison', children: [{ kind: 'name', path: ['ema20', 'wert'] }, { kind: 'literal' }] },
        { kind: 'name', path: ['Strategie', 'stop_abstand'] },
        { kind: 'name', path: ['parameter'] },
        { kind: 'name', path: ['trend', 'ema', 'wert'] },
      ],
    });

    expect(references).toEqual([
      { instance: 'ema20', property: 'wert' },
      { instance: 'Strategie', property: 'stop_abstand' },
      { instance: 'trend', property: 'ema' },
    ]);
    expect(referencesOfBlocks(null)).toEqual([]);
  });
});
