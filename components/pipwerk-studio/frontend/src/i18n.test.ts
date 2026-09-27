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
      const texts = collectKeys(resources[language].translation).map((key) =>
        key.split('.').reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)[part],
          resources[language].translation,
        ),
      );
      for (const text of texts) {
        expect(typeof text === 'string' && text.trim() !== '').toBe(true);
      }
    }
  });
});
