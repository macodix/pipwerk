import { describe, expect, it } from 'vitest';

import { resources, supportedLanguages } from './i18n';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    collectKeys(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

function textOf(language: 'de' | 'en', key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)[part],
      resources[language].translation,
    );
}

/** The placeholders `{{name}}` of a text. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1] ?? '').sort();
}

describe('translations', () => {
  it('provides German and English', () => {
    expect(supportedLanguages).toEqual(['de', 'en']);
  });

  it('uses the same translation keys in every language', () => {
    const germanKeys = collectKeys(resources.de.translation).sort();
    const englishKeys = collectKeys(resources.en.translation).sort();

    expect(englishKeys).toEqual(germanKeys);
  });

  it('has no empty translation texts', () => {
    for (const language of supportedLanguages) {
      for (const key of collectKeys(resources[language].translation)) {
        const text = textOf(language, key);
        expect(typeof text === 'string' && text.trim() !== '').toBe(true);
      }
    }
  });

  it('uses the same placeholders in German and English', () => {
    for (const key of collectKeys(resources.de.translation)) {
      expect(placeholders(String(textOf('en', key))), key).toEqual(placeholders(String(textOf('de', key))));
    }
  });

  it('has no German characters in the English texts', () => {
    for (const key of collectKeys(resources.en.translation)) {
      expect(String(textOf('en', key)), key).not.toMatch(/[äöüÄÖÜß]/);
    }
  });
});
