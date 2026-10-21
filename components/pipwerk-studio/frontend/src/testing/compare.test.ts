import { describe, expect, it } from 'vitest';

import { canonical, canonicalExpression, namesOf, testCase } from '../../e2e/compare';

type Json = Record<string, unknown>;

/** The same strategy with other identifiers, names, places and keys (the keys of the steps and objects renamed alike everywhere). */
function renamed(document: Json): Json {
  const text = JSON.stringify(document)
    .replaceAll('"ema20"', '"schnell"')
    .replaceAll('ema20.', 'schnell.')
    .replaceAll('(ema20.', '(schnell.')
    .replaceAll('PREVIOUS(ema20', 'PREVIOUS(schnell');
  const copy = JSON.parse(text) as Json;
  const ids = new Map<string, string>();
  const fresh = (id: string): string => {
    if (!ids.has(id)) {
      ids.set(id, `neu-${ids.size}`);
    }
    return ids.get(id) as string;
  };
  const elements = copy.elements as Json[];
  for (const element of elements) {
    element.id = fresh(String(element.id));
    element.name = element.name === null ? null : 'anderer Name';
    element.position = { x: 5, y: 7 };
    if (typeof element.management_of === 'string') {
      element.management_of = fresh(element.management_of);
    }
  }
  for (const connection of copy.connections as Json[]) {
    connection.id = fresh(String(connection.id));
    connection.source = fresh(String(connection.source));
    connection.target = fresh(String(connection.target));
  }
  copy.name = 'anders';
  copy.id = 'neue-id';
  return copy;
}

describe('the comparison with a test case (specification 7)', () => {
  it('ignores identifiers, names and places', () => {
    const original = testCase('str-03');
    expect(canonical(renamed(original))).toEqual(canonical(original));
  });

  it('notices a changed expression, a changed value and a missing connection', () => {
    const original = testCase('str-03');
    const changed = JSON.parse(JSON.stringify(original)) as Json;
    ((changed.elements as Json[])[4]?.parameters as Json).ausdruck = { kind: 'expression', value: 'ema20.wert > 3' };
    expect(canonical(changed)).not.toEqual(canonical(original));
    const fewer = JSON.parse(JSON.stringify(original)) as Json;
    (fewer.connections as Json[]).pop();
    expect(canonical(fewer)).not.toEqual(canonical(original));
  });

  it('replaces the keys of steps and objects in expressions, but not the properties of the objects of the application', () => {
    const keys = new Map([
      ['ema20', 'k1'],
      ['richtung', 'k2'],
      ['stop_abstand', 'k3'],
    ]);
    expect(canonicalExpression('IF(richtung.ergebnis = "richtung"; ema20.wert; Position.richtung)', keys)).toBe('IF(k2.ergebnis = "richtung"; k1.wert; Position.richtung)');
    expect(canonicalExpression('Strategie.stop_abstand *  2', keys)).toBe('Strategie.k3 * 2');
  });

  it('lists the names of a document in its order', () => {
    expect(namesOf(testCase('str-03')).slice(0, 4)).toEqual(['Zeiteinheit', 'Stop-Abstand', 'Risiko', 'EMA 20']);
  });
});
