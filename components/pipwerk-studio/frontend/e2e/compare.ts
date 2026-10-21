import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page } from '@playwright/test';

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

/** The stored document of the strategy with the name, fetched from the backend; it is deleted by `removeStored`. */
export async function storedStrategy(page: Page, name: string): Promise<Json> {
  const list = (await (await page.request.get('/api/v1/strategies')).json()) as { items: { id: string; name: string | null }[] };
  const entry = list.items.find((candidate) => candidate.name === name);
  if (entry === undefined) {
    throw new Error(`The strategy "${name}" is not stored`);
  }
  return (await (await page.request.get(`/api/v1/strategies/${entry.id}`)).json()) as Json;
}

/** Deletes the strategy with the name from the backend: the tests share one backend and leave nothing behind. */
export async function removeStored(page: Page, name: string): Promise<void> {
  const list = (await (await page.request.get('/api/v1/strategies')).json()) as { items: { id: string; name: string | null }[] };
  for (const entry of list.items.filter((candidate) => candidate.name === name)) {
    await page.request.delete(`/api/v1/strategies/${entry.id}`);
  }
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

/**
 * The name `a.b.c` with its keys replaced: the first part is a key (or an object of the application, which stays), a
 * part after a key is a key again only in the objects that contain others, and after `Strategie` it is the key of a
 * strategy parameter. The properties (`Position.richtung`) stay as they are, even where a step has the same key.
 */
function canonicalName(name: string, keys: ReadonlyMap<string, string>): string {
  const parts = name.split('.');
  let container = true;
  return parts
    .map((part, index) => {
      const mapped = keys.get(part.toLowerCase());
      if (index === 0) {
        container = mapped !== undefined;
        return mapped ?? part;
      }
      if (parts[0]?.toLowerCase() === 'strategie' && index === 1) {
        return mapped ?? part;
      }
      if (container && mapped !== undefined && index < parts.length - 1) {
        return mapped;
      }
      container = false;
      return part;
    })
    .join('.');
}

/** The expression with every key replaced and the white space made uniform; texts in quotes stay as they are. */
export function canonicalExpression(text: string, keys: ReadonlyMap<string, string>): string {
  const parts = text.split(/("(?:[^"]|"")*")/);
  const rewritten = parts
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/g, (name) => canonicalName(name, keys)).replace(/\s+/g, ' '),
    )
    .join('');
  return rewritten.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

/** The names of the elements, of the objects and of the rules of a document, in the order of the document. */
export function namesOf(document: Json): string[] {
  const names: string[] = [];
  const instance = (value: unknown): void => {
    if (isRecord(value)) {
      names.push(String(value.name));
      ((value.rules as unknown[] | undefined) ?? []).forEach(instance);
      ((value.instances as unknown[] | undefined) ?? []).forEach(instance);
    }
  };
  ((document.parameters as Json[] | undefined) ?? []).forEach((parameter) => names.push(String(parameter.name)));
  ((document.rules as unknown[] | undefined) ?? []).forEach(instance);
  for (const element of (document.elements as Json[] | undefined) ?? []) {
    if (isRecord(element.instance)) {
      instance(element.instance);
    } else {
      names.push(String(element.name));
    }
    ((element.rules as unknown[] | undefined) ?? []).forEach(instance);
  }
  return names;
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
