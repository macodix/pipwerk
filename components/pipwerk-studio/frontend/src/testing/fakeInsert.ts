import { identifierFromName } from './keys';

/**
 * The endpoint `POST /api/v1/insert` for the tests of the interface (`FakeApi`), made the way the backend makes it
 * (`insert_instance` of `pipwerk_domain.operations`, specification 3.3, 4.2): a complete copy of a template or an instance
 * of an object type; its name is free in the namespace of the document (a number appended: "Kerze 2"); each instance and
 * rule inside it is named "<name of the instance that contains it> <former name>" (a number appended where that is
 * taken), gets its own key, and the expressions inside the instance are written on the new keys. The fake has no naming
 * rule of its own; it repeats the one of the backend, so that a test of the interface sees the instance the backend would
 * deliver. It reads expressions with a small pattern (`rewrite`), not with the lexer of the library.
 */

type Json = Record<string, unknown>;

const MAX_NAME_LENGTH = 200;
const MAX_KEY_LENGTH = 200;

export type InsertAnswer = { status: number; body: unknown };

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value as unknown[]).filter(isRecord) : [];
}

function failure(code: string, detail: string): InsertAnswer {
  return { status: 422, body: { detail, code, params: {} } };
}

const normalized = (text: string): string => text.trim().replace(/\s+/g, ' ').toLowerCase();

/** The instances and rules inside `root` at any depth, `root` not included. */
function nested(root: Json): Json[] {
  const found: Json[] = [];
  const stack: Json[] = [root];
  for (let item = stack.pop(); item !== undefined; item = stack.pop()) {
    const children = [...asArray(item.instances), ...asArray(item.rules)];
    found.push(...children);
    stack.push(...children);
  }
  return found;
}

/** Every instance and rule of the namespace of a strategy, at any depth. */
function namespaceContents(document: Json): Json[] {
  const found: Json[] = [];
  for (const rule of asArray(document.rules)) {
    found.push(rule, ...nested(rule));
  }
  for (const element of asArray(document.elements)) {
    for (const rule of asArray(element.rules)) {
      found.push(rule, ...nested(rule));
    }
    if (isRecord(element.instance)) {
      found.push(element.instance, ...nested(element.instance));
    }
  }
  return found;
}

function takenOf(document: Json, types: ReadonlyMap<string, Json>, functions: readonly string[]): { names: Set<string>; keys: Set<string> } {
  const names = new Set<string>();
  const keys = new Set<string>();
  for (const element of asArray(document.elements)) {
    if (!isRecord(element.instance)) {
      if (typeof element.name === 'string' && element.name !== '') {
        names.add(normalized(element.name));
      }
      if (typeof element.key === 'string' && element.key !== '') {
        keys.add(element.key.toLowerCase());
      }
    }
  }
  for (const content of namespaceContents(document)) {
    if (typeof content.name === 'string') {
      names.add(normalized(content.name));
    }
    if (typeof content.key === 'string') {
      keys.add(content.key.toLowerCase());
    }
    for (const parameter of asArray(content.parameters)) {
      names.add(normalized(String(parameter.name)));
      keys.add(String(parameter.key).toLowerCase());
    }
  }
  for (const [id, type] of types) {
    if (type.kind === 'application_object') {
      const label = isRecord(type.name) ? type.name : {};
      names.add(normalized(String(label.de)));
      names.add(normalized(String(label.en)));
      names.add(normalized(id));
      keys.add(id.toLowerCase());
    }
  }
  for (const name of functions) {
    keys.add(name.toLowerCase());
  }
  return { names, keys };
}

function suggest(base: string, taken: ReadonlySet<string>): string {
  const cut = base.slice(0, MAX_NAME_LENGTH);
  if (!taken.has(normalized(cut))) {
    return cut;
  }
  const stem = cut.slice(0, MAX_NAME_LENGTH - 12);
  let number = 2;
  while (taken.has(normalized(`${stem} ${number}`))) {
    number += 1;
  }
  return `${stem} ${number}`;
}

function formKey(name: string, taken: ReadonlySet<string>, fallback: string): string {
  let base = identifierFromName(name);
  if (base === 'n_') {
    base = identifierFromName(fallback);
  }
  base = base.slice(0, MAX_KEY_LENGTH - 12);
  let key = base;
  for (let number = 2; taken.has(key.toLowerCase()); number += 1) {
    key = `${base}_${number}`;
  }
  return key;
}

type Rewrite = (text: string) => string;

const identity: Rewrite = (text) => text;

/**
 * Replaces the first part of a name in an expression that equals a key of `mapping` (lower case) by the new key. Texts in
 * quotes, names in brackets, parts behind a point and function names stay as they are.
 */
function renamer(mapping: ReadonlyMap<string, string>): Rewrite {
  if (mapping.size === 0) {
    return identity;
  }
  return (text) =>
    text.replace(/"(?:[^"\\]|\\.)*"|\[[^\]]*\]|(?<![\w.])([A-Za-z_]\w*)(?!\w)(?!\s*\()/g, (match: string, name: string | undefined) =>
      name === undefined ? match : (mapping.get(name.toLowerCase()) ?? match),
    );
}

function rewriteBindings(values: unknown, rewrite: Rewrite): void {
  if (rewrite === identity || !isRecord(values)) {
    return;
  }
  for (const binding of Object.values(values)) {
    if (isRecord(binding) && binding.kind === 'expression' && typeof binding.value === 'string') {
      binding.value = rewrite(binding.value);
    }
  }
}

/** Gives the instances and rules inside `content` new names and keys and writes the expressions on the new keys. */
function localize(content: Json, names: Set<string>, keys: Set<string>, ruleType: string | null): void {
  const work: { item: Json; outer: Rewrite; list: Rewrite }[] = [{ item: content, outer: identity, list: identity }];
  for (let entry = work.pop(); entry !== undefined; entry = work.pop()) {
    const { item, outer, list } = entry;
    const mapping = new Map<string, string>();
    const children = [...asArray(item.instances), ...asArray(item.rules)];
    for (const child of children) {
      const name = suggest(`${String(item.name)} ${String(child.name)}`, names);
      names.add(normalized(name));
      const key = formKey(name, keys, String(child.object_type));
      keys.add(key.toLowerCase());
      mapping.set(String(child.key).toLowerCase(), key);
      child.name = name;
      child.key = key;
      child.first_use = null;
    }
    const inside = renamer(mapping);
    rewriteBindings(item.parameter_values, outer);
    if (item.object_type === ruleType && typeof item.expression === 'string') {
      item.expression = list(item.expression);
    }
    if (typeof item.result_expression === 'string') {
      item.result_expression = inside(item.result_expression);
    }
    for (const own of asArray(item.properties)) {
      if (typeof own.expression === 'string') {
        own.expression = inside(own.expression);
      }
    }
    for (const child of children) {
      work.push({ item: child, outer: inside, list: inside });
    }
  }
}

/** The answer of `POST /api/v1/insert` for the request `body`. */
export function insert(body: Json, types: Json, typeById: ReadonlyMap<string, Json>): InsertAnswer {
  const template = body.template;
  const objectType = body.object_type;
  const language = body.language === 'en' ? 'en' : 'de';
  if (!isRecord(body.document) || (isRecord(template) ? 1 : 0) + (typeof objectType === 'string' ? 1 : 0) !== 1) {
    return failure('request.invalid', 'The request is not valid.');
  }
  const functions = asArray(types.functions).map((item) => String(item.name));
  const { names, keys } = takenOf(body.document, typeById, functions);
  // the identifier of the object type "rule": the type of the rules whose expression is written with the keys of the list
  const ruleType = [...typeById.values()].find((type) => type.category === 'rule')?.id;

  let sourceType: string;
  let base: string;
  let origin: Json;
  if (isRecord(template)) {
    sourceType = String(template.object_type);
    base = String(template.name);
    const builtin = asArray(types.templates).some((item) => item.id === template.id);
    origin = { object_type: sourceType, template_id: template.id, ...(builtin ? {} : { template_name: template.name }) };
  } else {
    const description = typeById.get(String(objectType));
    if (description === undefined) {
      return failure('insert.type_unknown', 'The object type of the request is not registered.');
    }
    sourceType = String(objectType);
    const label = isRecord(description.name) ? description.name : {};
    base = String(language === 'en' ? label.en : label.de);
    origin = { object_type: sourceType, template_id: null };
  }
  const wanted = typeof body.name === 'string' && body.name !== '' ? body.name : base;
  const name = suggest(wanted, names);
  names.add(normalized(name));
  const key = formKey(name, keys, sourceType.replace(/[^A-Za-z0-9_]/g, '') || 'objekt');
  keys.add(key.toLowerCase());
  const instance: Json = {
    name,
    key,
    object_type: sourceType,
    origin,
    parameter_values: {},
    parameters: [],
    properties: [],
    instances: [],
    rules: [],
    expression: null,
    determined_property: null,
    comparison: null,
    result_expression: null,
  };
  if (isRecord(template)) {
    for (const field of ['parameter_values', 'parameters', 'properties', 'instances', 'rules', 'expression', 'determined_property', 'comparison', 'result_expression']) {
      if (template[field] !== undefined) {
        instance[field] = JSON.parse(JSON.stringify(template[field])) as unknown;
      }
    }
    localize(instance, names, keys, ruleType === undefined ? null : String(ruleType));
  }
  return { status: 200, body: { instance } };
}
