import { blocksToStored, storedToBlocks } from './fakeExpressions';

/**
 * The endpoint `POST /api/v1/removals` for the tests of the interface (`FakeApi`): who uses an element, a strategy
 * parameter or a rule, and the strategy without it. It reads expressions with the small part of the language the fake
 * knows (`fakeExpressions.ts`); the real backend does this with the library.
 */

type Json = Record<string, unknown>;

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value as Json[]) : [];
}

function asRecord(value: unknown): Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Json) : {};
}

function emptied(block: Json, matches: (path: string[]) => boolean): Json {
  if (block.kind === 'name' && Array.isArray(block.path) && matches(block.path as string[])) {
    return { kind: 'empty' };
  }
  const children = asArray(block.children);
  return children.length === 0 ? block : { ...block, children: children.map((child) => emptied(child, matches)) };
}

function uses(block: Json, matches: (path: string[]) => boolean): boolean {
  if (block.kind === 'name' && Array.isArray(block.path) && matches(block.path as string[])) {
    return true;
  }
  return asArray(block.children).some((child) => uses(child, matches));
}

/** Every text of an expression in a value: bindings of the kind expression and the expression fields of rules. */
function forEachExpression(value: unknown, visit: (holder: Json, field: string) => void): void {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      forEachExpression(item, visit);
    });
    return;
  }
  if (typeof value !== 'object' || value === null) {
    return;
  }
  const record = value as Json;
  if (record.kind === 'expression' && typeof record.value === 'string') {
    visit(record, 'value');
  }
  for (const field of ['expression', 'result_expression']) {
    if (typeof record[field] === 'string') {
      visit(record, field);
    }
  }
  Object.values(record).forEach((item) => {
    forEachExpression(item, visit);
  });
}

function managed(elements: Json[], id: string): Set<string> {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const owner = queue.shift() as string;
    for (const candidate of elements) {
      if (candidate.management_of === owner && !found.has(String(candidate.id))) {
        found.add(String(candidate.id));
        queue.push(String(candidate.id));
      }
    }
  }
  return found;
}

export function removals(body: Json): { status: number; body: unknown } {
  const document = JSON.parse(JSON.stringify(asRecord(body.document))) as Json;
  const kind = String(body.kind);
  const target = String(body.target);
  const elements = asArray(document.elements);
  const gone = new Set<string>();
  const keys = new Set<string>();
  if (kind === 'element') {
    const found = elements.find((candidate) => candidate.id === target);
    if (found === undefined) {
      return { status: 422, body: { detail: 'The element does not exist.', code: 'removal.target_unknown', params: {} } };
    }
    gone.add(target);
    managed(elements, target).forEach((id) => gone.add(id));
    for (const candidate of elements) {
      if (gone.has(String(candidate.id))) {
        const instanceKey = asRecord(candidate.instance).key;
        if (typeof instanceKey === 'string') {
          keys.add(instanceKey.toLowerCase());
        }
        if (typeof candidate.key === 'string' && candidate.key !== '') {
          keys.add(candidate.key.toLowerCase());
        }
      }
    }
  } else if (!asArray(document.parameters).some((parameter) => parameter.key === target) && kind === 'strategy_parameter') {
    return { status: 422, body: { detail: 'The strategy parameter does not exist.', code: 'removal.target_unknown', params: {} } };
  }
  const matches = (path: string[]): boolean =>
    kind === 'strategy_parameter'
      ? path[0]?.toLowerCase() === 'strategie' && path[1]?.toLowerCase() === target.toLowerCase()
      : path[0] !== undefined && keys.has(path[0].toLowerCase());

  const usedBy = new Set<string>();
  const usedByRules = new Set<string>();
  const visit = (owner: string | null, value: unknown): void => {
    forEachExpression(value, (holder, field) => {
      const blocks = storedToBlocks(String(holder[field]));
      if (blocks !== null && uses(blocks, matches)) {
        if (owner === null) {
          usedByRules.add('rule');
        } else {
          usedBy.add(owner);
        }
      }
    });
  };
  visit(null, document.rules);
  for (const candidate of elements) {
    const id = String(candidate.id);
    if (gone.has(id)) {
      continue;
    }
    visit(id, { parameters: candidate.parameters, properties: candidate.properties, rules: candidate.rules });
    for (const input of asArray(candidate.inputs)) {
      if (keys.has(String(input.instance).toLowerCase())) {
        usedBy.add(id);
      }
    }
    for (const binding of Object.values({ ...asRecord(candidate.parameters), ...asRecord(candidate.properties) })) {
      const record = asRecord(binding);
      if (record.kind === 'connection' && keys.has(String(asRecord(record.value).instance).toLowerCase())) {
        usedBy.add(id);
      }
      if (record.kind === 'parameter' && kind === 'strategy_parameter' && record.value === target) {
        usedBy.add(id);
      }
    }
  }
  const order = elements.map((candidate) => String(candidate.id)).filter((id) => usedBy.has(id));
  if (body.apply !== true) {
    return { status: 200, body: { used_by: order, used_by_rules: [...usedByRules], removed: [], document: null } };
  }

  forEachExpression(document, (holder, field) => {
    const blocks = storedToBlocks(String(holder[field]));
    if (blocks !== null && uses(blocks, matches)) {
      holder[field] = blocksToStored(emptied(blocks, matches));
    }
  });
  const dropBindings = (record: Json): void => {
    for (const [name, binding] of Object.entries(record)) {
      const entry = asRecord(binding);
      if (
        (entry.kind === 'connection' && keys.has(String(asRecord(entry.value).instance).toLowerCase())) ||
        (entry.kind === 'parameter' && kind === 'strategy_parameter' && entry.value === target)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete record[name];
      }
    }
  };
  for (const candidate of elements) {
    dropBindings(asRecord(candidate.parameters));
    dropBindings(asRecord(candidate.properties));
    dropBindings(asRecord(asRecord(candidate.instance).parameter_values));
  }
  if (kind === 'element') {
    document.elements = elements
      .filter((candidate) => !gone.has(String(candidate.id)))
      .map((candidate) => {
        const instance = asRecord(candidate.instance);
        return {
          ...candidate,
          inputs: asArray(candidate.inputs).filter((input) => !keys.has(String(input.instance).toLowerCase())),
          instance: typeof instance.key === 'string' && typeof instance.first_use === 'string' && gone.has(instance.first_use) ? { ...instance, first_use: null } : candidate.instance,
        };
      });
    document.connections = asArray(document.connections).filter((connection) => !gone.has(String(connection.source)) && !gone.has(String(connection.target)));
  } else if (kind === 'strategy_parameter') {
    document.parameters = asArray(document.parameters).filter((parameter) => parameter.key !== target);
  } else {
    document.rules = asArray(document.rules).filter((rule) => rule.key !== target);
  }
  return { status: 200, body: { used_by: order, used_by_rules: [...usedByRules], removed: [...gone], document } };
}
