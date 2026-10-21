import { describe, expect, it } from 'vitest';

import { groupIds } from '../api/elementTypes';
import type { ObjectListEntry } from '../api/objects';
import { inventedTypes } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { buildLibrary, filterLibrary, findEntry } from './libraryModel';

const stored = (id: string, name: string, objectType: string | null, unreadable = false): ObjectListEntry => ({
  id,
  name,
  description: `Beschreibung von ${name}`,
  objectType,
  modified: '2026-10-20T10:00:00Z',
  unreadable,
});

describe('the element library (specification 5.2)', () => {
  const types = inventedTypes();

  it('has the groups of the specification in their order, taken from the field "group" of the type descriptions', () => {
    const groups = buildLibrary(types, {}, 'de');

    expect(groups.map((group) => group.id)).toEqual([...groupIds]);
    const names = (id: string) => groups.find((group) => group.id === id)?.entries.map((entry) => entry.name);
    expect(names('when')).toEqual(['Beginn']);
    expect(names('actions')).toEqual(['Weiche', 'Tun', 'Ausführen']);
    expect(names('market')).toEqual(['Welt']);
    expect(names('indicators')).toEqual(['Messer']);
    expect(names('trends')).toEqual(['Kette']);
  });

  it('lists a type only if it has a group: order types and the like stay out', () => {
    const entries = buildLibrary(types, {}, 'de').flatMap((group) => group.entries);

    expect(entries.some((entry) => entry.key === 'type:zz.kind_a')).toBe(false);
  });

  it('shows names and explanations in the language of the interface', () => {
    const german = findEntry(buildLibrary(types, {}, 'de'), 'type:zz.start');
    const english = findEntry(buildLibrary(types, {}, 'en'), 'type:zz.start');

    expect(german?.name).toBe('Beginn');
    expect(german?.explanation).toBe('Erklärung Beginn');
    expect(english?.name).toBe('Start');
    expect(english?.explanation).toBe('Explanation Start');
  });

  it('puts the delivered template before the types of its group, and a stored template of the user last and marked as own', () => {
    const groups = buildLibrary(types, { rules: [stored('r1', 'Meine Regel', 'zz.rule')], rulesets: [stored('s1', 'Mein Satz', 'zz.ruleset')] }, 'de');

    const rules = groups.find((group) => group.id === 'rules');
    expect(rules?.entries.map((entry) => [entry.name, entry.own])).toEqual([
      ['Vorgabe Regel', false],
      ['Regel', false],
      ['Regelsatz', false],
      ['Meine Regel', true],
      ['Mein Satz', true],
    ]);
    expect(rules?.entries.every((entry) => entry.target === 'rules')).toBe(true);
  });

  it('puts stored indicators and trends into the group of their kind as entries for the drawing area', () => {
    const groups = buildLibrary(types, { indicators: [stored('i1', 'Mein Messer', 'zz.meter')], trends: [stored('t1', 'Meine Kette', 'zz.chain')] }, 'de');

    const own = (id: string) => groups.find((group) => group.id === id)?.entries.filter((entry) => entry.own);
    expect(own('indicators')).toEqual([expect.objectContaining({ name: 'Mein Messer', target: 'canvas', source: { kind: 'storedTemplate', art: 'indicators', id: 'i1' } })]);
    expect(own('trends')).toEqual([expect.objectContaining({ name: 'Meine Kette', target: 'canvas' })]);
  });

  it('marks a stored template that cannot be read', () => {
    const groups = buildLibrary(types, { indicators: [stored('i2', 'Kaputt', null, true)] }, 'de');

    expect(findEntry(groups, 'stored:indicators:i2')?.unreadable).toBe(true);
  });

  it('searches names and explanations without regard to case and leaves out groups without a hit', () => {
    const groups = buildLibrary(types, {}, 'de');

    expect(filterLibrary(groups, 'weiche').map((group) => group.id)).toEqual(['actions']);
    expect(filterLibrary(groups, 'ERKLÄRUNG MESSER').flatMap((group) => group.entries.map((entry) => entry.name))).toEqual(['Messer']);
    expect(filterLibrary(groups, 'xyz')).toEqual([]);
    expect(filterLibrary(groups, '  ')).toHaveLength(6);
  });

  it('builds the library from the type descriptions of the product as well, in the order of the groups, without a group that is empty', () => {
    const groups = buildLibrary(testTypes(), {}, 'de');

    expect(groups.map((group) => group.id)).toEqual([...groupIds]);
    expect(groups.find((group) => group.id === 'when')?.entries.map((entry) => entry.name)).toEqual(['Kerzenschluss', 'Tick', 'Start von Hand']);
    expect(groups.find((group) => group.id === 'trends')?.entries.map((entry) => entry.name)).toEqual(['1-2-3-Trend (Markttechnik)', 'eigener Trend']);
    expect(groups.find((group) => group.id === 'rules')?.entries.map((entry) => entry.name)).toEqual(['Risiko je Trade', 'eigene Regel', 'eigenes Regelwerk']);
  });

  it('names and explains the delivered rule template in the language of the interface (order 07, B2)', () => {
    const rules = (language: 'de' | 'en') => buildLibrary(testTypes(), {}, language).find((group) => group.id === 'rules')?.entries[0];

    expect(rules('de')).toMatchObject({ name: 'Risiko je Trade', explanation: expect.stringMatching(/^Begrenzt den Verlust/) });
    expect(rules('en')).toMatchObject({ name: 'Risk per trade', explanation: expect.stringMatching(/^Limits the loss up to the stop loss/) });
    expect(rules('en')?.explanation).not.toMatch(/Begrenzt/);
    // the entry that adds a rule to a list of rules is this very entry: it carries the same texts
    expect(rules('en')?.target).toBe('rules');
  });
});
