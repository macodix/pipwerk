import { describe, expect, it } from 'vitest';

import type { ObjectListEntry } from '../api/objects';
import { realTypes } from '../testing/fixtures';
import { inventedTypes } from '../testing/inventedTypes';
import { buildLibrary, findEntry, parseSource, serializeSource, type LibrarySource } from './libraryModel';

function stored(id: string, title: string, objectType: string, unreadable = false): ObjectListEntry {
  return { id, title, description: 'desc', objectType, modified: '2026-10-17T10:00:00Z', unreadable };
}

describe('buildLibrary', () => {
  it('groups the real types as the specification says (5.1)', () => {
    const groups = buildLibrary(realTypes, {}, 'de');

    expect(groups.map((group) => group.id)).toEqual([
      'triggers',
      'flow',
      'applicationObjects',
      'objectTypes',
      'builtinTemplates',
      'storedTemplates',
    ]);
    const labels = (id: string) => groups.find((group) => group.id === id)!.entries.map((entry) => entry.label);
    expect(labels('triggers')).toEqual(['Kerzenschluss', 'Tick']);
    expect(labels('flow')).toContain('Order aufgeben');
    // Only the objects of the application that can lie on the drawing area.
    expect(labels('applicationObjects')).toEqual(['Konto', 'Instrument', 'Kerze', 'Tick']);
    expect(labels('objectTypes')).toEqual(['Indikator', 'EMA', 'ATR', 'Markttechnik', 'Trend', 'Regel', 'Regelwerk']);
    expect(labels('builtinTemplates')).toEqual(['Risiko je Trade']);
    expect(labels('storedTemplates')).toEqual([]);
  });

  it('shows no type that is no element: order types, calculation methods, order and position', () => {
    const all = buildLibrary(realTypes, {}, 'de').flatMap((group) => group.entries.map((entry) => entry.label));

    for (const hidden of ['Marktorder', 'Stop-Order', 'Order', 'Position', 'Strategie']) {
      expect(all).not.toContain(hidden);
    }
  });

  it('is built from types it cannot know (specification E2)', () => {
    const groups = buildLibrary(inventedTypes, {}, 'en');
    const labels = (id: string) => groups.find((group) => group.id === id)!.entries.map((entry) => entry.label);

    expect(labels('triggers')).toEqual(['zz.pulse (en)']);
    expect(labels('flow')).toEqual(['zz.gate (en)', 'zz.launch (en)', 'zz.sweep (en)']);
    expect(labels('applicationObjects')).toEqual(['Planet (en)']);
    expect(labels('objectTypes')).toEqual(['Zork (en)', 'ZzRule (en)', 'ZzRuleset (en)']);
    expect(labels('builtinTemplates')).toEqual(['Zz limit']);
  });

  it('shows the names in the language', () => {
    const german = buildLibrary(realTypes, {}, 'de').flatMap((group) => group.entries.map((entry) => entry.label));
    const english = buildLibrary(realTypes, {}, 'en').flatMap((group) => group.entries.map((entry) => entry.label));

    expect(german).toContain('Bedingung');
    expect(english).toContain('Condition');
    expect(english).not.toContain('Bedingung');
  });

  it('marks what is for rules: the object types rule and rule set and the templates of them', () => {
    const entries = buildLibrary(realTypes, {}, 'de').flatMap((group) => group.entries);

    const forRules = entries.filter((entry) => entry.target === 'rules').map((entry) => entry.label);
    expect(forRules).toEqual(['Regel', 'Regelwerk', 'Risiko je Trade']);
    expect(entries.find((entry) => entry.label === 'EMA')?.target).toBe('canvas');
  });

  it('adds the stored templates with their object type, and marks those that cannot be read', () => {
    const groups = buildLibrary(
      realTypes,
      {
        indicators: [stored('i1', 'Mein Indikator', 'Indikator')],
        rules: [stored('r1', 'Meine Regel', 'Regel'), stored('r2', 'kaputt', 'Regel', true)],
        trends: [stored('t1', 'Mein Trend', 'Trend')],
        rulesets: [stored('s1', 'Mein Regelwerk', 'Regelwerk')],
      },
      'de',
    );

    const entries = groups.find((group) => group.id === 'storedTemplates')!.entries;
    expect(entries.map((entry) => entry.label)).toEqual(['Mein Indikator', 'Mein Trend', 'Meine Regel', 'kaputt', 'Mein Regelwerk']);
    expect(entries.map((entry) => entry.target)).toEqual(['canvas', 'canvas', 'rules', 'rules', 'rules']);
    expect(entries.find((entry) => entry.label === 'kaputt')?.unreadable).toBe(true);
    expect(entries[0]?.objectTypeName).toBe('Indikator');
    expect(entries[0]?.source).toEqual({ kind: 'storedTemplate', art: 'indicators', id: 'i1' });
  });
});

describe('dragging', () => {
  const sources: LibrarySource[] = [
    { kind: 'type', typeId: 'EMA' },
    { kind: 'builtinTemplate', templateId: 'abc' },
    { kind: 'storedTemplate', art: 'trends', id: 'def' },
  ];

  it.each(sources)('reads back what it wrote: %j', (source) => {
    expect(parseSource(serializeSource(source))).toEqual(source);
  });

  it.each([
    [''],
    ['not json'],
    ['null'],
    ['3'],
    ['{"kind":"type"}'],
    ['{"kind":"type","typeId":3}'],
    ['{"kind":"storedTemplate","art":"strategies","id":"x"}'],
    ['{"kind":"storedTemplate","art":"rules"}'],
    ['{"kind":"other","typeId":"x"}'],
  ])('does not take %j for an entry', (text) => {
    expect(parseSource(text)).toBeNull();
  });

  it('finds the entry of a source', () => {
    const groups = buildLibrary(realTypes, {}, 'de');

    expect(findEntry(groups, { kind: 'type', typeId: 'EMA' })?.label).toBe('EMA');
    expect(findEntry(groups, { kind: 'type', typeId: 'unknown' })).toBeUndefined();
  });
});
