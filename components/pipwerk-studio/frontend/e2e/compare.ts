import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The comparison of a strategy built in the interface with a test case document of the repository: the documents are
 * equal without identifiers, names, positions and times (specification 7). The keys that expressions use are formed
 * from the names, so they differ when the names differ; every key is replaced by a number in the order of its first
 * appearance, in the documents and in the expressions.
 */

type Json = Record<string, unknown>;

const here = dirname(fileURLToPath(import.meta.url));

/** A test case document `contracts/strategies/v2/testcases/<name>.strategy.json` of the repository. */
export function testCase(name: 'str-01' | 'str-03'): Json {
  const file = resolve(here, '../../../..', 'contracts/strategies/v2/testcases', `${name}.strategy.json`);
  return JSON.parse(readFileSync(file, 'utf-8')) as Json;
}

/** Fields that hold a name or a time and are left out of the comparison. */
const DROPPED = new Set(['name', 'description', 'position', 'template_name']);

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The keys of a document in the order of their first appearance, as `k1`, `k2`, … (lower case). */
function keyMap(document: Json): Map<string, string> {
  const map = new Map<string, string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) {
      return;
    }
    if (typeof value.key === 'string' && value.key !== '' && !map.has(value.key.toLowerCase())) {
      map.set(value.key.toLowerCase(), `k${map.size + 1}`);
    }
    for (const [name, inner] of Object.entries(value)) {
      if (name !== 'key') {
        visit(inner);
      }
    }
  };
  visit(document);
  return map;
}

/** The expression with every key replaced and the white space made uniform; texts in quotes stay as they are. */
export function canonicalExpression(text: string, keys: ReadonlyMap<string, string>): string {
  const parts = text.split(/("(?:[^"]|"")*")/);
  const rewritten = parts
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (word) => keys.get(word.toLowerCase()) ?? word).replace(/\s+/g, ' ')))
    .join('');
  return rewritten.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

/** The document without identifiers, names, positions and times, with numbered keys; the same for equal strategies. */
export function canonical(document: Json): Json {
  const keys = keyMap(document);
  const elementIds = new Map<string, string>();
  (document.elements as Json[]).forEach((element, index) => {
    elementIds.set(String(element.id), `e${index}`);
  });
  const mapId = (value: unknown): unknown => (typeof value === 'string' ? (elementIds.get(value) ?? value) : value);
  const mapKey = (value: string): string => keys.get(value.toLowerCase()) ?? value;

  const copy = (value: unknown, field: string | null, parent: Json | null): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => copy(item, field, parent));
    }
    if (isRecord(value)) {
      const result: Json = {};
      for (const [name, inner] of Object.entries(value)) {
        if (DROPPED.has(name) || name === 'id') {
          continue;
        }
        result[name] = name === 'source' || name === 'target' || name === 'management_of' || name === 'flow' ? mapId(inner) : copy(inner, name, value);
      }
      return result;
    }
    if (typeof value !== 'string') {
      return value;
    }
    if (field === 'key' || field === 'instance') {
      return mapKey(value);
    }
    if (field === 'expression' || field === 'result_expression') {
      return canonicalExpression(value, keys);
    }
    if (field === 'value' && parent !== null) {
      if (parent.kind === 'expression') {
        return canonicalExpression(value, keys);
      }
      if (parent.kind === 'parameter') {
        return mapKey(value);
      }
    }
    return value;
  };

  const result = copy(document, null, null) as Json;
  const connections = ((result.connections as Json[] | undefined) ?? []).map(
    (connection) => `${String(connection.source)}|${String(connection.output)}|${String(connection.target)}`,
  );
  result.connections = connections.sort();
  return result;
}
