import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { Finding } from '../api/objects';
import { createI18n, resources, supportedLanguages, type SupportedLanguage } from '../i18n';
import { loadTestcase, realTypes } from '../testing/fixtures';
import {
  BINDING_REASONS,
  CONNECTION_REASONS,
  EXPRESSION_ISSUES,
  REFERENCE_KINDS,
  RESULT_REASONS,
  SYNTAX_REASONS,
  findingText,
  missingFindingTexts,
  type FindingTextContext,
} from './findingText';

function readText(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
}

/** The identifiers of the findings: the first column of the tables in sections 9.1 and 9.2 of the documentation of the library. */
function codesInDocumentation(): string[] {
  const text = readText('../../../../../docs/technical/pipwerk-domain.md');
  return Array.from(text.matchAll(/^\| `([a-z_]+\.[a-z_]+)` \| (?:Fehler|Hinweis) \|/gm), (match) => match[1] as string);
}

/** The identifiers as the library defines them. */
function codesInLibrary(): string[] {
  const text = readText('../../../../../packages/domain-core/src/pipwerk_domain/consistency/findings.py');
  return Array.from(text.matchAll(/^[A-Z_]+ = "([a-z_]+\.[a-z_]+)"/gm), (match) => match[1] as string);
}

function finding(code: string, details: Record<string, unknown> = {}, extra: Partial<Finding> = {}): Finding {
  return { level: 'error', code, element: null, subject: null, details, ...extra };
}

function context(language: SupportedLanguage, document = loadTestcase('str-03')): FindingTextContext {
  return { document, types: realTypes, language };
}

function textOf(language: SupportedLanguage, item: Finding, document = loadTestcase('str-03')): string {
  const i18n = createI18n(language);
  return findingText(i18n.t, i18n, item, context(language, document));
}

describe('the identifiers of the findings', () => {
  const codes = codesInDocumentation();

  it('are the ones the library defines', () => {
    expect(codes.length).toBeGreaterThanOrEqual(26);
    // The finding "strategy without trigger" is gone from the library and from the documentation (specification 3.6).
    expect(codes).not.toContain('strategy.no_trigger');
    expect([...codes].sort()).toEqual([...codesInLibrary()].sort());
  });

  it.each(supportedLanguages)('all have a text in %s', (language) => {
    const i18n = createI18n(language);

    expect(missingFindingTexts(codes, (key) => i18n.exists(key))).toEqual([]);
  });

  it('are checked against both translation files', () => {
    for (const language of supportedLanguages) {
      expect(missingFindingTexts(codes, (key) => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], resources[language].translation) !== undefined)).toEqual([]);
    }
  });

  it('counter test: a text that is missing is found', () => {
    const i18n = createI18n('de');

    expect(missingFindingTexts([...codes, 'vendor.fantasy'], (key) => i18n.exists(key))).toEqual(['findings.vendor.fantasy']);
    expect(missingFindingTexts(['trigger.unconnected'], () => false)).toEqual(['findings.trigger.unconnected']);
    // A copy of the German texts without one text: the check names it.
    const damaged = JSON.parse(JSON.stringify(resources.de.translation)) as { findings: { trigger: Record<string, string> } };
    delete damaged.findings.trigger.unconnected;
    const has = (key: string): boolean =>
      key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], damaged) !== undefined;
    expect(missingFindingTexts(codes, has)).toEqual(['findings.trigger.unconnected']);
  });

  it.each(supportedLanguages)('have no text for the finding that no longer exists, in %s', (language) => {
    const i18n = createI18n(language);

    expect(i18n.exists('findings.strategy.no_trigger')).toBe(false);
  });

  it.each(supportedLanguages)('give a text without a gap in %s, even if the finding brings no data', (language) => {
    for (const code of codes) {
      const text = textOf(language, finding(code));

      expect(text, code).not.toMatch(/\{\{|\}\}/);
      expect(text.trim(), code).not.toBe('');
      expect(text, code).not.toBe(textOf(language, finding('vendor.fantasy')));
    }
  });

  it.each(supportedLanguages)('have texts in %s for every kind of problem in an expression and every reason', (language) => {
    const i18n = createI18n(language);
    const keys = [
      ...EXPRESSION_ISSUES.map((kind) => `findings.issues.${kind}`),
      ...SYNTAX_REASONS.map((reason) => `findings.syntax.${reason}`),
      ...CONNECTION_REASONS.map((reason) => `findings.connectionReasons.${reason}`),
      ...BINDING_REASONS.map((reason) => `findings.bindingReasons.${reason}`),
      ...RESULT_REASONS.map((reason) => `findings.resultReasons.${reason}`),
      ...REFERENCE_KINDS.map((kind) => `findings.referenceKinds.${kind}`),
    ];

    expect(keys.filter((key) => !i18n.exists(key))).toEqual([]);
  });

  it('name kinds of problems that the documentation of the library names', () => {
    const text = readText('../../../../../docs/technical/pipwerk-domain.md');

    for (const kind of EXPRESSION_ISSUES) {
      expect(text, kind).toContain(`| \`${kind}\` |`);
    }
    for (const reason of SYNTAX_REASONS) {
      expect(text, reason).toContain(`\`${reason}\``);
    }
  });
});

describe('the text of a finding', () => {
  it('has the same words in the two languages for the same finding, in the language asked for', () => {
    const unconnected = finding('trigger.unconnected');

    expect(textOf('de', unconnected)).toBe('Der Auslöser ist mit keinem Element des Ablaufs verbunden.');
    expect(textOf('en', unconnected)).toMatch(/^The trigger/);
  });

  it('shows an identifier that is unknown, also the one that was removed, with the general text and the identifier', () => {
    expect(textOf('de', finding('strategy.no_trigger'))).toBe('Befund strategy.no_trigger');
  });

  it('uses the data of the finding', () => {
    expect(textOf('de', finding('name.duplicate', { name: 'ema20', namespace: 'strategy' }))).toBe('Der Name „ema20“ ist doppelt vergeben.');
    expect(textOf('en', finding('type.unknown', { kind: 'element', type: 'vendor.mystery' }))).toBe('The type “vendor.mystery” is unknown.');
  });

  it('names a parameter by its label in the language', () => {
    const document = loadTestcase('str-03');
    const trigger = document.elements.find((element) => element.type === 'trigger.candle_close')!;
    const missing = finding('parameter.missing', { parameter: 'zeiteinheit' }, { element: trigger.id });

    expect(textOf('de', missing, document)).toBe('Der Pflichtparameter „Zeiteinheit“ hat keinen Wert.');
    expect(textOf('en', missing, document)).toBe('The required parameter “Time unit” has no value.');
  });

  it('names a property of an order by its label from the order type that the element selects', () => {
    const document = loadTestcase('str-03');
    const order = document.elements.find((element) => element.type === 'flow.place_order')!;

    const text = textOf('en', finding('order.property_missing', { property: 'volumen', order_type: 'MarketOrder' }, { element: order.id }), document);

    expect(text).toBe('The property “Volume” of the order is not set and no determining rule supplies it.');
  });

  it('names the type of an element by its name', () => {
    expect(textOf('de', finding('flow.management_only', { type: 'flow.delete_order' }))).toBe(
      '„Order löschen“ darf nur in einer Verwaltung stehen, nicht im Hauptablauf.',
    );
  });

  it('describes a faulty expression with its place and the problem', () => {
    const document = loadTestcase('str-03');
    const condition = document.elements.find((element) => element.type === 'flow.condition')!;
    const invalid = finding(
      'expression.invalid',
      { field: 'parameter:ausdruck', start: 3, end: 8, issue: 'unknown_name', name: 'xyz' },
      { element: condition.id },
    );

    expect(textOf('de', invalid, document)).toBe(
      'Der Ausdruck in Parameter „Ausdruck“ ist fehlerhaft: Unbekannter Name „xyz“ (Stelle 3 bis 8).',
    );
    expect(textOf('en', invalid, document)).toBe(
      'The expression in parameter “Expression” is invalid: Unknown name “xyz” (position 3 to 8).',
    );
  });

  it('describes a typing error with its reason', () => {
    const invalid = finding('expression.invalid', {
      field: 'expression',
      start: 4,
      end: 5,
      issue: 'syntax',
      reason: 'unexpected_token',
      found: ')',
    });

    expect(textOf('de', invalid)).toBe(
      'Der Ausdruck in Ausdruck ist fehlerhaft: Schreibfehler an Stelle 4 bis 5: unerwartetes Zeichen „)“',
    );
  });

  it('describes a reference between rules, a loop and a connection with translated words', () => {
    expect(textOf('de', finding('ruleset.reference_order', { kind: 'cycle', list: 'regelwerk' }))).toBe('Regelwerk mit Zirkelbezug.');
    expect(textOf('en', finding('flow.unending_loop', { elements: ['a', 'b', 'c'] }))).toBe(
      'Loop without a condition that ends it (on 3 elements).',
    );
    expect(textOf('de', finding('connection.invalid', { reason: 'target_is_trigger' }))).toBe(
      'Ungültige Verbindung: ein Auslöser hat keinen Eingang.',
    );
  });

  it('shows a finding with an unknown identifier with a general text and the identifier', () => {
    expect(textOf('de', finding('vendor.fantasy'))).toBe('Befund vendor.fantasy');
    expect(textOf('en', finding('vendor.fantasy'))).toBe('Finding vendor.fantasy');
  });

  it('shows an issue of an expression that it does not know with a general text', () => {
    const invalid = finding('expression.invalid', { field: 'expression', start: 1, end: 2, issue: 'new_kind' });

    expect(textOf('de', invalid)).toBe('Der Ausdruck in Ausdruck ist fehlerhaft: Der Ausdruck ist an Stelle 1 bis 2 fehlerhaft.');
  });

  it('does not translate what the user wrote: names stay as they are in both languages', () => {
    const text = textOf('en', finding('name.duplicate', { name: 'Größe äß' }));

    expect(text).toBe('The name “Größe äß” is used twice.');
  });

  it('treats a text from the finding as text, never as markup', () => {
    const text = textOf('en', finding('name.duplicate', { name: '<img src=x onerror=alert(1)>' }));

    expect(text).toBe('The name “<img src=x onerror=alert(1)>” is used twice.');
  });
});
