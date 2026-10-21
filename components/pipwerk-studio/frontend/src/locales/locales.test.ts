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
        'about.repository',
        'canvas.zoom',
        'datatype.text',
        'dialogs.error.ok',
        'expression.arithmetic.+',
        'expression.arithmetic.-',
        'expression.text',
        'instances.name',
        'library.groups.trends',
        'openDialog.columnName',
        'properties.name',
        'revision.commit',
        'wizard.steps.name',
        'wizard.steps.order',
      ].sort(),
    );
  });

  it('have no German word in an English text', () => {
    const words = /\b(der|die|das|und|oder|nicht|Strategie|Elemente|Verwaltung|Eigenschaften|Wert|Werte|Ablauf|Bedingung|Berechnung)\b/;
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

describe('texts of the causes of errors (specification 4.2, M4)', () => {
  it('have a text for the cause named in the specification in both languages', () => {
    for (const language of ['de', 'en'] as const) {
      expect(createI18n(language).exists('errors.codes.object_directory.not_absolute')).toBe(true);
    }
  });
});
