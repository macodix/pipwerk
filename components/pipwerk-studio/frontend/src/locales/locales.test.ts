import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  BINDING_REASONS,
  CONNECTION_REASONS,
  DATA_REASONS,
  EXPRESSION_ISSUES,
  LAYOUT_REASONS,
  REFERENCE_KINDS,
  RESULT_REASONS,
  SYNTAX_REASONS,
} from '../findings/findingText';
import { createI18n } from '../i18n';
import de from './de.json';
import en from './en.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') {
      result.set(path, value);
    } else {
      for (const [inner, text] of flatten(value, path)) {
        result.set(inner, text);
      }
    }
  }
  return result;
}

const german = flatten(de as Tree);
const english = flatten(en as Tree);

describe('translations (specification 5.1)', () => {
  it('have the same keys in German and English', () => {
    expect([...english.keys()].sort()).toEqual([...german.keys()].sort());
  });

  it('have no empty text', () => {
    for (const [key, text] of [...german, ...english]) {
      expect(text.trim(), key).not.toBe('');
    }
  });

  it('use the same data in both languages', () => {
    const variables = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? '').sort();
    for (const [key, text] of german) {
      expect(variables(english.get(key) ?? ''), key).toEqual(variables(text));
    }
  });

  it('have no German text in the English interface: every English text differs from the German one, except the ones that are the same in both languages', () => {
    const same = [...english.entries()].filter(([key, text]) => german.get(key) === text).map(([key]) => key);

    // Names and words that are written alike in both languages.
    expect(same.sort()).toEqual(
      [
        'canvas.zoom',
        'dialogs.error.ok',
        'expression.arithmetic.+',
        'expression.arithmetic.-',
        'findings.whereElement',
        'library.groups.trends',
      ].sort(),
    );
  });

  it('have no label, heading, button or answer that is a single word without a statement (F11)', () => {
    // Words that say nothing without the sentence around them. A label is a question, a request or a noun phrase that
    // says what to enter or choose: "Wert des Objekts wählen", not "Wert".
    const emptyWords = {
      de: ['Art', 'Typ', 'Wert', 'Name', 'Zahl', 'Text', 'Vergleich', 'Funktion', 'Pflicht', 'Inhalt', 'Nicht', 'Ausdruck', 'Rechenart', 'Auswahlwert'],
      en: ['Kind', 'Type', 'Value', 'Name', 'Number', 'Text', 'Comparison', 'Function', 'Required', 'Content', 'Not', 'Expression', 'Operation', 'Choice value'],
    };
    for (const [language, texts] of [['de', german], ['en', english]] as const) {
      const empty = new Set(emptyWords[language].map((word) => word.toLowerCase()));
      for (const [key, text] of texts) {
        expect(empty.has(text.trim().toLowerCase()), `${language}: ${key} = "${text}"`).toBe(false);
      }
    }
  });

  it('ask the kind of a condition as a question and answer in whole words, in both languages (F11)', () => {
    expect(german.get('expression.conditionKind')).toBe('Was soll geprüft werden?');
    expect(english.get('expression.conditionKind')).toBe('What should be checked?');
    expect(['compare', 'and', 'or', 'not', 'value'].map((kind) => german.get(`expression.conditionKinds.${kind}`))).toEqual([
      'Zwei Werte vergleichen',
      'Alle Bedingungen müssen gelten (und)',
      'Mindestens eine Bedingung muss gelten (oder)',
      'Eine Bedingung umkehren (nicht)',
      'Prüfen, ob ein Wert wahr ist',
    ]);
    expect(['compare', 'and', 'or', 'not', 'value'].map((kind) => english.get(`expression.conditionKinds.${kind}`))).toEqual([
      'Compare two values',
      'All conditions must hold (and)',
      'At least one condition must hold (or)',
      'Reverse a condition (not)',
      'Check whether a value is true',
    ]);
  });

  it('call the part of the flow at the output "gestellt" only "Order- und Positionsverwaltung" / "order and position management" (E1), and know no assistant (E9)', () => {
    for (const [key, text] of german) {
      // the short form of the name: the word without "Order- und Positions" in front of it
      expect(text, key).not.toMatch(/(?<!Positions)[Vv]erwaltung/);
      expect(text, key).not.toMatch(/Assist/);
    }
    for (const [key, text] of english) {
      expect(text, key).not.toMatch(/(?<!position )management/i);
      expect(text, key).not.toMatch(/assist/i);
    }
    expect(german.get('canvas.management')).toBe('Order- und Positionsverwaltung · {{name}}');
    expect(english.get('canvas.management')).toBe('Order and position management · {{name}}');
  });

  it('use the words of the traders and not those of the programming (E10): the review rules of the texts', () => {
    // Words that the user does not know or that mislead. No text is excepted: not even the places that identify the
    // build ("Stand" in the footer and "Über pipwerk Studio") use "Commit" or "Repository".
    const germanWords =
      /\bParameter|\bInstanz|Kennung|Namensraum|\bPort\b|Belegung|Bindungsart|\bDatentyp|\bTooltip|\bCursor|\bFokus|OpenFormula|\brechnet\b|\bAusdruck|\bAusdrücke|\bCommit|\bRepository|\bBackend|\bAPI\b|\bSchema|\bToken/;
    const englishWords =
      /\binstance\b|\bnamespace\b|\bport\b|\bassignment\b|\bbinding\b|\bdata type\b|\btooltip\b|\bcursor\b|\bfocus\b|OpenFormula|\bexpressions?\b|\bcommit\b|\brepository\b|\bbackend\b|\bapi\b|\bschema\b|\btoken\b|\bidentifier\b/i;
    const shown = (text: string): string => text.replace(/\{\{\w+\}\}/g, '');
    for (const [key, text] of german) {
      expect(shown(text), key).not.toMatch(germanWords);
    }
    for (const [key, text] of english) {
      expect(shown(text), key).not.toMatch(englishWords);
    }
  });

  it('name the build and the connection without the words of the programming', () => {
    expect(german.get('revision.commit')).toBe('Stand {{commit}}');
    expect(english.get('revision.commit')).toBe('Revision {{commit}}');
    expect(german.get('about.repository')).toBe('Quelltext');
    expect(english.get('about.repository')).toBe('Source code');
    expect(german.get('backend.connected')).toBe('Verbindung zum Server: hergestellt');
    expect(english.get('backend.connected')).toBe('Connection to the server: established');
  });

  it('ask "Woher kommt der Wert?" and name the five possible answers as the specification does (5.4, E11)', () => {
    expect(german.get('fields.source')).toBe('Woher kommt der Wert?');
    expect(english.get('fields.source')).toBe('Where does the value come from?');
    expect(
      ['fixed', 'parameter', 'connection', 'expression', 'application'].map((kind) => german.get(`binding.${kind}`)),
    ).toEqual([
      'fest eingeben',
      'aus einem Strategieparameter',
      'von einem anderen Element',
      'aus einer Formel',
      'beim Start der Strategie festlegen',
    ]);
    expect(
      ['fixed', 'parameter', 'connection', 'expression', 'application'].map((kind) => english.get(`binding.${kind}`)),
    ).toEqual(['enter a value', 'from a strategy parameter', 'from another element', 'from a formula', 'set when the strategy starts']);
    // the field with a preset (F5): the label, the example and the explanation, for an element and for an order
    const de = createI18n('de');
    const en = createI18n('en');
    expect(german.get('fields.preset.label')).toBe('Instrument wählen (optional)');
    expect(english.get('fields.preset.label')).toBe('Choose instrument (optional)');
    expect(german.get('fields.preset.example')).toBe('zum Beispiel EURUSD');
    expect(english.get('fields.preset.example')).toBe('for example EURUSD');
    expect(de.t('fields.preset.explanation', { subject: de.t('fields.preset.thisElement') })).toBe(
      'Ohne eigene Wahl gilt das voreingestellte Instrument aus der Strategie. Das ist das Instrument, auf dem die Strategie läuft; es wird erst beim Start der Strategie festgelegt. Wählen Sie hier nur ein Instrument, wenn dieses Element ein anderes verwenden soll.',
    );
    expect(de.t('fields.preset.explanation', { subject: de.t('fields.preset.thisOrder') })).toContain('wenn diese Order ein anderes verwenden soll.');
    expect(en.t('fields.preset.explanation', { subject: en.t('fields.preset.thisElement') })).toBe(
      'Without your own choice, the default instrument from the strategy applies. This is the instrument the strategy runs on; it is set only when the strategy starts. Choose an instrument here only if this element is to use a different one.',
    );
    expect(en.t('fields.preset.explanation', { subject: en.t('fields.preset.thisOrder') })).toContain('only if this order is to use a different one.');
    // the strategy parameters in the properties view of the strategy (F6)
    expect(german.get('params.none')).toBe(
      'Ein Strategieparameter ist ein Wert, den Sie hier einmal festlegen und in mehreren Feldern verwenden, zum Beispiel eine Zeiteinheit.',
    );
    expect(english.get('params.none')).toBe(
      'A strategy parameter is a value you set here once and use in several fields, for example a timeframe.',
    );
    expect([german.get('params.new'), english.get('params.new')]).toEqual(['Neuer Strategieparameter', 'New strategy parameter']);
    expect([german.get('fields.goToStrategy'), english.get('fields.goToStrategy')]).toEqual(['Zur Strategie', 'Go to strategy']);
    expect(de.t('params.backTo', { name: 'EMA 20' })).toBe('Zurück zu „EMA 20“');
    expect(en.t('params.backTo', { name: 'EMA 20' })).toBe('Back to “EMA 20”');
    expect(de.t('fields.noParameterFor', { word: 'Zeiteinheit' })).toBe(
      'Es gibt noch keinen Strategieparameter für „Zeiteinheit“. Strategieparameter legen Sie in der Strategie an.',
    );
  });

  it('offer no crossing and no word list for the data types of the interface: the library delivers them (E11, E12)', () => {
    expect([...german.keys()].filter((key) => key.startsWith('datatype.'))).toEqual([]);
    const crossingKeys = (key: string): boolean => /(^|\.)(cross\w*|directions)(\.|$)|conditionKinds\.cross/.test(key);
    expect([...german.keys()].filter(crossingKeys)).toEqual([]);
    expect([...english.keys()].filter(crossingKeys)).toEqual([]);
  });

  it('have no keys of the removed assistant', () => {
    expect([...german.keys()].filter((key) => key.startsWith('wiz'))).toEqual([]);
    expect([...english.keys()].filter((key) => key.startsWith('wiz'))).toEqual([]);
  });

  it('have no German word in an English text', () => {
    const words = /\b(der|die|das|und|oder|nicht|Strategie|Elemente|Positionsverwaltung|Eigenschaften|Wert|Werte|Ablauf|Bedingung|Berechnung)\b/;
    for (const [key, text] of english) {
      if (key === 'datatype.object' || key.endsWith('Placeholder')) {
        continue;
      }
      expect(words.test(text), `${key}: ${text}`).toBe(false);
    }
  });

  it('give the interface in English no German text when it is rendered with the English translations', () => {
    const instance = createI18n('en');
    const germanTexts = new Set([...german.values()].filter((text) => text.length > 6));
    for (const [key, original] of english) {
      if (german.get(key) === original) {
        continue;
      }
      const text = instance.t(key, { count: 1, name: 'x' });
      expect(germanTexts.has(text), key).toBe(false);
    }
  });
});

function domainFindingCodes(): string[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const documentation = readFileSync(join(here, '../../../../../docs/technical/pipwerk-domain.md'), 'utf-8');
  const start = documentation.indexOf('## 9. Konsistenzprüfung');
  const end = documentation.indexOf('### 9.3');
  const section = documentation.slice(start, end);
  return [...section.matchAll(/^\| `([a-z_]+\.[a-z_]+)` \|/gm)].map((match) => match[1] ?? '');
}

describe('texts of the findings (specification 3.6, 5.5)', () => {
  const codes = domainFindingCodes();

  it('read the list of identifiers of the library documentation', () => {
    expect(codes.length).toBeGreaterThan(10);
    expect(codes).toContain('flow.not_reached');
  });

  it.each(['de', 'en'] as const)('give every identifier of the library a text and a way to fix it in %s', (language) => {
    const instance = createI18n(language);
    const missing = codes.flatMap((code) => [`findings.${code}`, `findingFixes.${code}`]).filter((key) => !instance.exists(key));

    expect(missing).toEqual([]);
  });

  it.each(['de', 'en'] as const)('give every kind of problem of an expression, every reason and every kind a text in %s', (language) => {
    const instance = createI18n(language);
    const keys = [
      ...EXPRESSION_ISSUES.flatMap((issue) => [`findings.issues.${issue}`, `findingFixes.issues.${issue}`]),
      ...SYNTAX_REASONS.map((reason) => `findings.syntax.${reason}`),
      ...CONNECTION_REASONS.map((reason) => `findings.connectionReasons.${reason}`),
      ...BINDING_REASONS.map((reason) => `findings.bindingReasons.${reason}`),
      ...RESULT_REASONS.map((reason) => `findings.resultReasons.${reason}`),
      ...REFERENCE_KINDS.map((kind) => `findings.referenceKinds.${kind}`),
      ...DATA_REASONS.map((reason) => `findings.dataReasons.${reason}`),
      ...LAYOUT_REASONS.map((reason) => `findings.layoutReasons.${reason}`),
    ];

    expect(keys.filter((key) => !instance.exists(key))).toEqual([]);
  });

  it('say how to fix the finding in every text of the fixes (they are instructions and name an action)', () => {
    for (const [key, text] of german) {
      if (key.startsWith('findingFixes.') && key !== 'findingFixes.unknown') {
        expect(text.endsWith('.'), key).toBe(true);
      }
    }
  });
});

function backendErrorCodes(): { codes: string[]; withParams: Map<string, string[]> } {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(join(here, '../../../backend/src/pipwerk_studio/errors.py'), 'utf-8');
  const table = source.slice(source.indexOf('ERROR_CODES: dict'), source.indexOf('class ApiException'));
  const codes = [...table.matchAll(/^ {4}"([a-z_]+\.[a-z_]+)": ErrorCodeInfo\(/gm)].map((match) => match[1] ?? '');
  const withParams = new Map<string, string[]>();
  for (const block of table.split(/^ {4}"/m).slice(1)) {
    const code = block.slice(0, block.indexOf('"'));
    // the names of the params stand in a tuple of identifiers behind the text: ("limit_bytes",)
    const params = /,\s*\(((?:\s*"[a-z_]+",?)+)\s*\)/.exec(block);
    const names = params === null ? [] : [...(params[1] ?? '').matchAll(/"([a-z_]+)"/g)].map((match) => match[1] ?? '');
    withParams.set(code, names);
  }
  return { codes, withParams };
}

describe('texts of the causes of errors (specification 4.2, M4)', () => {
  it('have a text for the cause named in the specification in both languages', () => {
    for (const language of ['de', 'en'] as const) {
      expect(createI18n(language).exists('errors.codes.object_directory.not_absolute')).toBe(true);
    }
  });

  it('read the list of the identifiers of the causes from the backend', () => {
    const { codes } = backendErrorCodes();

    expect(codes.length).toBeGreaterThan(30);
    expect(codes).toContain('document.invalid');
    expect(codes).toContain('object_directory.move_not_restored');
  });

  it.each(['de', 'en'] as const)('give every cause of an error answer of the backend a text of its own in %s', (language) => {
    const instance = createI18n(language);
    const { codes } = backendErrorCodes();

    expect(codes.filter((code) => !instance.exists(`errors.codes.${code}`))).toEqual([]);
  });

  it.each(['de', 'en'] as const)('use only data that the cause carries and show no path and no identifier of the programming in %s', (language) => {
    const instance = createI18n(language);
    const { codes, withParams } = backendErrorCodes();
    for (const code of codes) {
      const raw = instance.getResource(language, 'translation', `errors.codes.${code}`) as string;
      for (const name of [...raw.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? '')) {
        expect(withParams.get(code) ?? [], `${code}: ${name}`).toContain(name);
      }
      const text = instance.t(`errors.codes.${code}`, { limit_bytes: 2097152 });
      expect(text, code).not.toMatch(/\/[a-z]+\/|[A-Za-z]+_[a-z_]+|\bJSON\b|\bHTTP\b|\bHost\b/);
    }
  });
});
