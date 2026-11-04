import { describe, expect, it } from 'vitest';

import de from './locales/de.json';
import en from './locales/en.json';
import fakeTypes from './testing/element-types.json';

// Specification 5.4, point "Begriffe" (defect F4 of the fourth acceptance): the words of the specification and of the
// technical documentation do not appear in any visible text. The words are the values of the translation files and the
// labels of the type descriptions (`de` and `en` of a label). Names of fields, identifiers and the values of binding
// kinds ("expression") are not texts and are not searched; there is no exception for a text.

const excluded: Record<'de' | 'en', RegExp> = {
  de: /Objekte? der Anwendung|Objekttyp|Einstellungen des Objekts|Ausdruck|Ausdrücke|\bexpressions?\b/i,
  en: /objects? of the application|object type|settings of the object|\bexpressions?\b/i,
};

function leafTexts(value: unknown, path: string, out: { path: string; text: string }[]): void {
  if (typeof value === 'string') {
    out.push({ path, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      leafTexts(item, `${path}[${index}]`, out);
    });
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      leafTexts(item, `${path}.${key}`, out);
    }
  }
}

/** The texts of the labels in the fake answer: every string under a key `de` or `en`. */
function labelTexts(value: unknown, path: string, out: { language: 'de' | 'en'; path: string; text: string }[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      labelTexts(item, `${path}[${index}]`, out);
    });
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if ((key === 'de' || key === 'en') && typeof item === 'string') {
        out.push({ language: key, path: `${path}.${key}`, text: item });
      } else {
        labelTexts(item, `${path}.${key}`, out);
      }
    }
  }
}

describe('the visible words (specification 5.4, "Begriffe")', () => {
  it.each([
    ['de', de],
    ['en', en],
  ] as const)('are free of the words of the specification in the translation file %s', (language, file) => {
    const texts: { path: string; text: string }[] = [];
    leafTexts(file, language, texts);

    expect(texts.length).toBeGreaterThan(100);
    expect(texts.filter(({ text }) => excluded[language].test(text))).toEqual([]);
  });

  it('are free of the words of the specification in the labels of the fake answer of the library', () => {
    const texts: { language: 'de' | 'en'; path: string; text: string }[] = [];
    labelTexts(fakeTypes, 'element-types', texts);

    expect(texts.length).toBeGreaterThan(100);
    expect(texts.filter(({ language, text }) => excluded[language].test(text))).toEqual([]);
  });

  it('use the words of the table in German and English', () => {
    expect(de.expression.groups.application).toBe('Handelsdaten');
    expect(en.expression.groups.application).toBe('Trading data');
    expect(de.properties.applicationObjects).toBe('Handelsdaten: Order, Position, Strategie');
    expect(en.properties.applicationObjects).toBe('Trading data: order, position, strategy');
    expect(de.properties.applicationObjectsHint).toBe(
      'Diese Werte brauchen kein Element auf der Zeichenfläche. Sie stehen in Formeln und Regeln zur Wahl, wo sie verwendbar sind.',
    );
    expect(en.properties.applicationObjectsHint).toBe(
      'These values need no element on the canvas. They are offered in formulas and rules wherever they can be used.',
    );
    expect(de.properties.settingsOfName).toBe('Einstellungen von „{{name}}“');
    expect(en.properties.settingsOfName).toBe('Settings of “{{name}}”');
    expect(de.properties.originTemplate).toBe('{{name}} – aus der Vorlage „{{template}}“');
    expect(en.properties.originTemplate).toBe('{{name}} – from the template “{{template}}”');
    expect(de.strategy.unnamed).toBe('(noch ohne Name)');
    expect(en.strategy.unnamed).toBe('(no name yet)');
    expect(de.expression.formula).toBe('Formel');
    expect(en.expression.formula).toBe('Formula');
  });

  it('explain the main flow and the rules of the strategy in the words of the specification', () => {
    expect(de.properties.mainFlowExplanation).toBe(
      'Der Hauptablauf ist der Ablauf der Strategie ab ihren Auslösern, ohne die Schritte in den Order- und Positionsverwaltungen.',
    );
    expect(en.properties.mainFlowExplanation).toBe(
      'The main flow is the flow of the strategy from its triggers, without the steps inside the order and position managements.',
    );
    expect(de.properties.rulesOfStrategyHint).toBe('Regeln sind freiwillig. Eine Regel der Strategie gilt für jede Order der Strategie.');
    expect(en.properties.rulesOfStrategyHint).toBe('Rules are optional. A rule of the strategy applies to every order of the strategy.');
  });
});
