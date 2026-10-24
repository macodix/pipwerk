import { describe, expect, it } from 'vitest';

import { groupIds, parseElementTypes } from '../api/elementTypes';
import type { ObjectListEntry } from '../api/objects';
import { createTypeIndex } from '../model/typeIndex';
import { UNKNOWN_GROUP, inventedTypes, inventedTypesJson, inventedTypesWithMethod, methodTypeJson } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { CONNECTION_ENTRY_KEY, buildLibrary, filterLibrary, findEntry } from './libraryModel';

const stored = (id: string, name: string, objectType: string | null, unreadable = false): ObjectListEntry => ({
  id,
  name,
  description: `Beschreibung von ${name}`,
  objectType,
  modified: '2026-10-20T10:00:00Z',
  unreadable,
});

const connection = { name: 'Verbindung', explanation: 'Verbindet einen Schritt mit dem nächsten.' };

describe('the element library (specification 5.2)', () => {
  const types = inventedTypes();

  it('has the groups that have an entry, in the order of the specification, taken from the field "group" of the type descriptions', () => {
    const groups = buildLibrary(types, {}, 'de');

    expect(groups.map((group) => group.id)).toEqual(['flow', 'indicators', 'trends', 'market', 'actions', 'rules']);
    const names = (id: string) => groups.find((group) => group.id === id)?.entries.map((entry) => entry.name);
    expect(names('flow')).toEqual(['Beginn']);
    expect(names('actions')).toEqual(['Weiche', 'Tun', 'Ausführen']);
    expect(names('market')).toEqual(['Welt']);
    expect(names('indicators')).toEqual(['Messer']);
    expect(names('trends')).toEqual(['Kette']);
  });

  it('shows a group without an entry no more than the interface knows a name for', () => {
    const groups = buildLibrary(types, {}, 'de');

    expect(groups.some((group) => group.entries.length === 0)).toBe(false);
    expect(groups.map((group) => group.id)).not.toContain('calculation');
    expect(groups.map((group) => group.id)).not.toContain('account');
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

  it('puts stored indicators and trends into the group of their object type as entries for the drawing area', () => {
    const groups = buildLibrary(types, { indicators: [stored('i1', 'Mein Messer', 'zz.meter')], trends: [stored('t1', 'Meine Kette', 'zz.chain')] }, 'de');

    const own = (id: string) => groups.find((group) => group.id === id)?.entries.filter((entry) => entry.own);
    expect(own('indicators')).toEqual([expect.objectContaining({ name: 'Mein Messer', target: 'canvas', source: { kind: 'storedTemplate', art: 'indicators', id: 'i1' } })]);
    expect(own('trends')).toEqual([expect.objectContaining({ name: 'Meine Kette', target: 'canvas' })]);
  });

  it('puts a stored template into the group its object type names, whatever kind of template it is', () => {
    const groups = buildLibrary(inventedTypesWithMethod(), { indicators: [stored('i3', 'Mein Pegel', 'zz.gauge')] }, 'de');

    const own = groups.find((group) => group.id === UNKNOWN_GROUP)?.entries.filter((entry) => entry.own);
    expect(own?.map((entry) => entry.name)).toEqual(['Mein Pegel']);
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

  it('shows a type of a group it does not know behind the known groups, and a type with a method like any other', () => {
    const groups = buildLibrary(inventedTypesWithMethod(), {}, 'de');

    expect(groups.map((group) => group.id)).toEqual(['flow', 'indicators', 'trends', 'market', 'actions', 'rules', UNKNOWN_GROUP]);
    expect(groups.at(-1)?.entries.map((entry) => [entry.name, entry.explanation, entry.target])).toEqual([['Pegel', 'Erklärung Pegel', 'canvas']]);
  });

  it('reads the methods and "can refresh" of a type description and keeps the unknown group', () => {
    const gauge = createTypeIndex(parseElementTypes({ ...inventedTypesJson, types: [methodTypeJson] })).byId.get('zz.gauge');

    expect(gauge?.group).toBe(UNKNOWN_GROUP);
    expect(gauge?.canRefresh).toBe(true);
    expect(gauge?.methods).toHaveLength(1);
    const method = gauge?.methods[0];
    expect(method).toMatchObject({ id: 'mittel', datatype: 'number', label: { de: 'Mittel', en: 'Average' } });
    expect(method?.arguments.map((argument) => [argument.id, argument.required, argument.default])).toEqual([
      ['anzahl', true, null],
      ['gewicht', false, 1],
    ]);
  });

  it('takes the delivered types as they are: no methods, "can refresh" only where the description says so', () => {
    const index = testTypes();

    expect(index.list.every((type) => type.methods.length === 0)).toBe(true);
    expect(index.byId.get('EMA')?.canRefresh).toBe(true);
    expect(index.byId.get('flow.condition')?.canRefresh).toBe(false);
  });

  it('has the entry "Verbindung" in the group of the flow control, behind its types, when it is asked for', () => {
    const groups = buildLibrary(types, {}, 'de', connection);

    const flow = groups.find((group) => group.id === 'flow');
    expect(flow?.entries.map((entry) => entry.name)).toEqual(['Beginn', 'Verbindung']);
    expect(findEntry(groups, CONNECTION_ENTRY_KEY)).toMatchObject({
      target: 'connection',
      source: { kind: 'connection' },
      explanation: 'Verbindet einen Schritt mit dem nächsten.',
      own: false,
    });
  });

  it('builds the library from the type descriptions of the product in the groups of the specification', () => {
    const groups = buildLibrary(testTypes(), {}, 'de', connection);

    expect(groups.map((group) => group.id)).toEqual([...groupIds]);
    const names = (id: string) => groups.find((group) => group.id === id)?.entries.map((entry) => entry.name);
    expect(names('flow')).toEqual(['Kerzenschluss', 'Tick', 'Manuell', 'Bedingung', 'Verbindung']);
    expect(names('calculation')).toEqual(['Berechnung']);
    expect(names('indicators')).toEqual(['eigener Indikator', 'EMA', 'ATR', 'ZigZag']);
    expect(names('trends')).toEqual(['eigener Trend']);
    expect(names('market')).toEqual(['Instrument', 'Kerze', 'Tick']);
    expect(names('account')).toEqual(['Konto']);
    expect(names('actions')).toEqual(['Order aufgeben', 'Order ändern', 'Order löschen', 'Position ändern', 'Position schließen']);
    expect(names('rules')).toEqual(['Risiko je Trade', 'eigene Regel', 'eigenes Regelwerk']);
  });

  it('lists "Tick" twice, as a trigger and as an object, with different entries', () => {
    const groups = buildLibrary(testTypes(), {}, 'de', connection);

    const ticks = groups.flatMap((group) => group.entries.filter((entry) => entry.name === 'Tick').map((entry) => [group.id, entry.key]));
    expect(ticks).toEqual([
      ['flow', 'type:trigger.tick'],
      ['market', 'type:Tick'],
    ]);
  });

  it('names and explains the delivered rule template in the language of the interface (order 07, B2)', () => {
    const rules = (language: 'de' | 'en') => buildLibrary(testTypes(), {}, language).find((group) => group.id === 'rules')?.entries[0];

    expect(rules('de')).toMatchObject({ name: 'Risiko je Trade', explanation: expect.stringMatching(/^Begrenzt den Verlust/) });
    expect(rules('en')).toMatchObject({ name: 'Risk per trade', explanation: expect.stringMatching(/^Limits the loss up to the stop loss/) });
    expect(rules('en')?.explanation).not.toMatch(/Begrenzt/);
    // the entry that adds a rule to a list of rules is this very entry: it carries the same texts
    expect(rules('en')?.target).toBe('rules');
  });

  it('puts the delivered rule template into the group the answer names for it', () => {
    const json = JSON.parse(JSON.stringify(inventedTypesJson)) as typeof inventedTypesJson & { template_texts: unknown };
    json.template_texts = [{ id: 'tpl-1', name: { de: 'Vorgabe Regel', en: 'Rule template' }, explanation: { de: 'E', en: 'E' }, group: 'calculation' }];
    const groups = buildLibrary(createTypeIndex(parseElementTypes(json)), {}, 'de');

    expect(groups.find((group) => group.id === 'calculation')?.entries.map((entry) => entry.name)).toEqual(['Vorgabe Regel']);
  });
});
