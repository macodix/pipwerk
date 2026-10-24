import { describe, expect, it } from 'vitest';

import type { Finding } from '../api/objects';
import { createI18n, type SupportedLanguage } from '../i18n';
import { inventedStrategy, inventedTypes } from '../testing/inventedTypes';
import { findingTexts, type FindingTextContext } from './findingText';

// Specification 3.6, 5.5: every finding has a text in the language of the interface, in the words of a trader, and the
// way to fix it. The data of the finding is put in; an object is named by its name, never by its identifier.

const strategy = inventedStrategy();
const types = inventedTypes();
const trigger = strategy.elements.find((element) => element.name === 'Beginn');
const step = strategy.elements.find((element) => element.name === 'Tun');
const inside = strategy.elements.find((element) => element.name === 'Beginn innen');

function texts(language: SupportedLanguage, finding: Finding) {
  const i18n = createI18n(language);
  const context: FindingTextContext = { document: strategy, types, language };
  return findingTexts(i18n.t.bind(i18n), i18n, finding, context);
}

function finding(code: string, details: Record<string, unknown>, extra: Partial<Finding> = {}): Finding {
  return { level: 'error', code, element: step?.id ?? null, subject: null, details, ...extra };
}

describe('the texts of the findings that came with the new interface of the library (order 11)', () => {
  it('say what is wrong with a value that is refreshed though the object cannot refresh, and name the object and the value', () => {
    const f = finding('input.refresh_not_allowed', { instance: 'messer', property: 'stand', object_type: 'zz.meter' }, { subject: 'messer' });

    const de = texts('de', f);
    expect(de.message).toBe(
      'Der Wert „Stand“ von „Messer“ soll bei diesem Element aktualisiert werden. Ein Objekt dieser Art kann seine Werte aber nicht neu ermitteln.',
    );
    expect(de.fix).toContain('weiteres Objekt mit eigenem Namen');
    const en = texts('en', f);
    expect(en.message).toContain('"Reading" of "Messer"');
    expect(en.fix).toContain('another object with a name of its own');
  });

  it('say where an object is worked out and offer another object with its own name as the way out, when it is used where it may not be', () => {
    const f = finding(
      'instance.not_usable',
      { instance: 'messer', first_use: step?.id, use: 'expression', by_instance: null, property: 'stand' },
      { subject: 'messer' },
    );

    const de = texts('de', f);
    expect(de.message).toBe(
      '„Messer“ darf an diesem Element nicht verwendet werden. Das Objekt wird bei „Tun“ ermittelt, und nicht jeder Weg hierher führt dort vorbei.',
    );
    expect(de.fix).toContain('weiteres Objekt mit eigenem Namen');
    const en = texts('en', f);
    expect(en.message).toContain('is worked out at "Tun", and not every way');
    expect(en.fix).toContain('another object with a name of its own');
  });

  it('still make sense when the element of the first use is not known', () => {
    const f = finding('instance.not_usable', { instance: 'messer', first_use: null, use: 'rule', by_instance: null, property: null });

    expect(texts('de', f).message).toContain('wird bei dem Element, das es zuerst verwendet, ermittelt, und nicht jeder Weg');
    expect(texts('en', f).message).toContain('is worked out at the element that uses it first, and not every way');
  });

  it('name the object that no element uses', () => {
    const f = finding('instance.unconnected', { instance: 'messer' }, { subject: 'messer' });

    expect(texts('de', f).message).toBe('„Messer“ ist mit keinem Element verbunden. Es wird nirgends verwendet.');
    expect(texts('de', f).fix).toContain('Verbinden Sie das Objekt');
    expect(texts('en', f).message).toContain('"Messer" is not connected with any element');
  });

  it('name the trigger "Manuell" in the management of an order and say what to do', () => {
    const f = finding('trigger.manual_in_management', {}, { element: inside?.id ?? null });

    const de = texts('de', f);
    expect(de.message).toContain('„Beginn innen“');
    expect(de.message).toContain('in der Verwaltung einer Order');
    expect(de.fix).toContain('Hauptablauf');
    expect(texts('en', f).message).toContain('"Beginn innen"');
  });

  it.each([
    ['unknown_method', 'das Objekt hat diese Methode nicht', 'the object does not have this method'],
    ['arguments', 'die Angaben passen nicht zur Methode', 'the entries do not fit the method'],
    ['unknown_property', 'das Objekt hat diese Eigenschaft nicht', 'the object does not have this property'],
  ])('tell the reason %s of a data connection that is wrong', (reason, german, english) => {
    const f = finding('data.unknown', { where: 'input', reason, instance: 'messer', property: 'mittel' });

    expect(texts('de', f).message).toBe(`Die Datenverbindung ist ungültig: ${german}.`);
    expect(texts('en', f).message).toBe(`The data connection is invalid: ${english}.`);
  });

  it('say "Hauptablauf ohne Auslöser" as a hint, with the way to fix it', () => {
    const f = finding('flow.main_without_trigger', {}, { level: 'hint', element: null });

    expect(texts('de', f).message).toMatch(/^Hauptablauf ohne Auslöser: Die Strategie startet nie/);
    expect(texts('de', f).fix).toContain('Auslöser an');
    expect(texts('en', f).message).toMatch(/^Main flow without a trigger: the strategy never starts/);
  });

  it('say that a name is taken twice, with the name', () => {
    const f = finding('name.duplicate', { name: 'Messer', key: 'messer', namespace: 'strategy', what: 'name' }, { element: trigger?.id ?? null });

    expect(texts('de', f).message).toBe('Der Name „Messer“ ist doppelt vergeben.');
    expect(texts('de', f).fix).toContain('anderen Namen');
    expect(texts('en', f).message).toContain('"Messer" is used twice');
  });

  it('name the value of a connected object that no expression uses', () => {
    const f = finding('input.unused', { instance: 'messer', property: 'stand' }, { level: 'hint' });

    expect(texts('de', f).message).toBe('Der Wert „Stand“ von „Messer“ ist mit diesem Element verbunden, wird aber nicht verwendet.');
  });

  it.each(['de', 'en'] as const)('leave no gap and no identifier of the programming in a text in %s', (language) => {
    const all: Finding[] = [
      finding('input.refresh_not_allowed', { instance: 'messer', property: 'stand', object_type: 'zz.meter' }),
      finding('instance.not_usable', { instance: 'messer', first_use: step?.id, use: 'input', by_instance: null, property: 'stand' }),
      finding('instance.unconnected', { instance: 'messer' }),
      finding('trigger.manual_in_management', {}),
      finding('data.unknown', { where: 'input', reason: 'arguments', instance: 'messer', property: 'mittel' }),
      finding('flow.main_without_trigger', {}, { level: 'hint' }),
    ];
    for (const item of all) {
      const result = texts(language, item);
      for (const text of [result.message, result.fix]) {
        expect(text, item.code).not.toMatch(/\{\{|undefined|\[object/);
        expect(text, item.code).not.toMatch(/[a-z]+_[a-z_]+/);
        expect(text.trim(), item.code).not.toBe('');
      }
    }
  });
});
