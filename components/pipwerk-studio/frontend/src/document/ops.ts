import type { DataType, Scalar } from '../api/elementTypes';
import type {
  Binding,
  Bindings,
  ConnectionDocument,
  ElementDocument,
  InstanceDocument,
  RuleOwner,
  RulePath,
  StrategyDocument,
  StrategyParameter,
} from './types';
import { uniqueName } from './ids';
import { removeOwn, setOwn } from './own';

/** Pure operations on the strategy document. Each returns a new document; the argument stays as it is. */

/**
 * Changes the datatype of a definition (strategy parameter, own parameter of a
 * rule) together with the fields `patch` that depend on it. The user fixes own
 * `choices` only for the datatype choice: when the datatype changes to another
 * one, the `choices` of the definition are removed in the same step. A change to
 * the datatype it already has leaves the definition as it is.
 */
export function withDatatype<T extends { datatype: DataType; choices?: string[] }>(
  definition: T,
  datatype: DataType,
  patch: Partial<T>,
): T {
  if (definition.datatype === datatype) {
    return definition;
  }
  const changed: T = { ...definition, ...patch, datatype };
  if (datatype !== 'choice') {
    removeOwn(changed, 'choices');
  }
  return changed;
}

export function findElement(document: StrategyDocument, id: string): ElementDocument | undefined {
  return document.elements.find((element) => element.id === id);
}

export function setStrategyText(
  document: StrategyDocument,
  field: 'title' | 'description',
  value: string,
): StrategyDocument {
  return { ...document, [field]: value };
}

// --- strategy parameters --------------------------------------------------------

export function addStrategyParameter(document: StrategyDocument, baseName: string): StrategyDocument {
  const name = uniqueName(
    baseName,
    document.parameters.map((parameter) => parameter.name),
  );
  const parameter: StrategyParameter = {
    name,
    datatype: 'number',
    value: 0,
    at_application: false,
    choices: [],
  };
  return { ...document, parameters: [...document.parameters, parameter] };
}

export function updateStrategyParameter(
  document: StrategyDocument,
  index: number,
  patch: Partial<StrategyParameter>,
): StrategyDocument {
  return {
    ...document,
    parameters: document.parameters.map((parameter, position) =>
      position === index ? { ...parameter, ...patch } : parameter,
    ),
  };
}

/** Changes the datatype of a strategy parameter and sets its value; see `withDatatype` for the `choices`. */
export function changeStrategyParameterType(
  document: StrategyDocument,
  index: number,
  datatype: DataType,
  value: StrategyParameter['value'],
): StrategyDocument {
  return {
    ...document,
    parameters: document.parameters.map((parameter, position) =>
      position === index ? withDatatype(parameter, datatype, { value }) : parameter,
    ),
  };
}

export function removeStrategyParameter(document: StrategyDocument, index: number): StrategyDocument {
  return { ...document, parameters: document.parameters.filter((_, position) => position !== index) };
}

// --- elements --------------------------------------------------------------------

export function updateElement(
  document: StrategyDocument,
  id: string,
  patch: Partial<ElementDocument>,
): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((element) => (element.id === id ? { ...element, ...patch } : element)),
  };
}

export function addElement(document: StrategyDocument, element: ElementDocument): StrategyDocument {
  return { ...document, elements: [...document.elements, element] };
}

/**
 * Removes elements and the connections that touch them. The elements of the
 * management of a removed element stay and move to the main flow.
 */
export function removeElements(document: StrategyDocument, ids: ReadonlySet<string>): StrategyDocument {
  return {
    ...document,
    elements: document.elements
      .filter((element) => !ids.has(element.id))
      .map((element) =>
        element.management_of !== null && ids.has(element.management_of)
          ? { ...element, management_of: null }
          : element,
      ),
    connections: document.connections.filter(
      (connection) => !ids.has(connection.source) && !ids.has(connection.target),
    ),
  };
}

export function setBindingIn(bindings: Bindings, key: string, binding: Binding | null): Bindings {
  const next: Bindings = { ...bindings };
  if (binding === null) {
    removeOwn(next, key);
  } else {
    setOwn(next, key, binding);
  }
  return next;
}

/** Sets or removes (`null`) the binding of a parameter or property of an element. */
export function setElementBinding(
  document: StrategyDocument,
  id: string,
  section: 'parameters' | 'properties',
  key: string,
  binding: Binding | null,
): StrategyDocument {
  const element = findElement(document, id);
  if (element === undefined) {
    return document;
  }
  return updateElement(document, id, { [section]: setBindingIn(element[section], key, binding) });
}

// --- connections -----------------------------------------------------------------

export function hasConnection(document: StrategyDocument, connection: ConnectionDocument): boolean {
  return document.connections.some(
    (item) =>
      item.source === connection.source && item.output === connection.output && item.target === connection.target,
  );
}

export function addConnection(document: StrategyDocument, connection: ConnectionDocument): StrategyDocument {
  if (hasConnection(document, connection)) {
    return document;
  }
  return { ...document, connections: [...document.connections, connection] };
}

export function removeConnections(document: StrategyDocument, indices: ReadonlySet<number>): StrategyDocument {
  return { ...document, connections: document.connections.filter((_, index) => !indices.has(index)) };
}

// --- rules and instances -----------------------------------------------------------

/** The rules or rule sets of an owner: of the strategy or of an element. */
export function rulesOf(document: StrategyDocument, owner: RuleOwner): InstanceDocument[] {
  if (owner.kind === 'strategy') {
    return document.rules;
  }
  return findElement(document, owner.id)?.rules ?? [];
}

/** The rule or rule set at a path, or `undefined` if the path leads nowhere. */
export function getRule(document: StrategyDocument, path: RulePath): InstanceDocument | undefined {
  let list = rulesOf(document, path.owner);
  let instance: InstanceDocument | undefined;
  for (const index of path.indices) {
    instance = list[index];
    if (instance === undefined) {
      return undefined;
    }
    list = instance.rules ?? [];
  }
  return instance;
}

function replaceRulesOf(
  document: StrategyDocument,
  owner: RuleOwner,
  change: (rules: InstanceDocument[]) => InstanceDocument[],
): StrategyDocument {
  if (owner.kind === 'strategy') {
    return { ...document, rules: change(document.rules) };
  }
  return {
    ...document,
    elements: document.elements.map((element) =>
      element.id === owner.id ? { ...element, rules: change(element.rules) } : element,
    ),
  };
}

function changeAt(
  rules: InstanceDocument[],
  indices: readonly number[],
  change: (list: InstanceDocument[], index: number) => InstanceDocument[],
): InstanceDocument[] {
  const [first, ...rest] = indices;
  if (first === undefined) {
    return rules;
  }
  if (rest.length === 0) {
    return change(rules, first);
  }
  return rules.map((rule, position) =>
    position === first ? { ...rule, rules: changeAt(rule.rules ?? [], rest, change) } : rule,
  );
}

/** Applies `change` to the list that holds the rule at `path` (its owner's list or the rule list of a rule set). */
function changeListOf(
  document: StrategyDocument,
  path: RulePath,
  change: (list: InstanceDocument[], index: number) => InstanceDocument[],
): StrategyDocument {
  return replaceRulesOf(document, path.owner, (rules) => changeAt(rules, path.indices, change));
}

export function updateRule(
  document: StrategyDocument,
  path: RulePath,
  patch: Partial<InstanceDocument>,
): StrategyDocument {
  return changeListOf(document, path, (list, index) =>
    list.map((rule, position) => (position === index ? { ...rule, ...patch } : rule)),
  );
}

/** Appends a rule or rule set to the list of an owner, or, with `inside`, to the list of a rule set. */
export function addRule(
  document: StrategyDocument,
  owner: RuleOwner,
  rule: InstanceDocument,
  inside: readonly number[] = [],
): StrategyDocument {
  if (inside.length === 0) {
    return replaceRulesOf(document, owner, (rules) => [...rules, rule]);
  }
  return changeListOf(document, { owner, indices: [...inside] }, (list, index) =>
    list.map((item, position) =>
      position === index ? { ...item, rules: [...(item.rules ?? []), rule] } : item,
    ),
  );
}

export function removeRule(document: StrategyDocument, path: RulePath): StrategyDocument {
  return changeListOf(document, path, (list, index) => list.filter((_, position) => position !== index));
}

/** Moves a rule by `delta` places inside its list (the order is the order of evaluation). */
export function moveRule(document: StrategyDocument, path: RulePath, delta: -1 | 1): StrategyDocument {
  return changeListOf(document, path, (list, index) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) {
      return list;
    }
    const next = [...list];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) {
      return list;
    }
    next.splice(target, 0, moved);
    return next;
  });
}

// --- instances ---------------------------------------------------------------------

/** The instance whose parameters a view edits: the instance of an element or a rule. */
export type InstanceTarget = { kind: 'element'; id: string } | { kind: 'rule'; path: RulePath };

export function getInstance(document: StrategyDocument, target: InstanceTarget): InstanceDocument | undefined {
  if (target.kind === 'rule') {
    return getRule(document, target.path);
  }
  return findElement(document, target.id)?.instance ?? undefined;
}

export function updateInstance(
  document: StrategyDocument,
  target: InstanceTarget,
  patch: Partial<InstanceDocument>,
): StrategyDocument {
  if (target.kind === 'rule') {
    return updateRule(document, target.path, patch);
  }
  const element = findElement(document, target.id);
  if (element?.instance === undefined || element.instance === null) {
    return document;
  }
  return updateElement(document, target.id, { instance: { ...element.instance, ...patch } });
}

export function setInstanceBinding(
  document: StrategyDocument,
  target: InstanceTarget,
  key: string,
  binding: Binding | null,
): StrategyDocument {
  const instance = getInstance(document, target);
  if (instance === undefined) {
    return document;
  }
  return updateInstance(document, target, {
    parameter_values: setBindingIn(instance.parameter_values ?? {}, key, binding),
  });
}

/** A fixed value as binding. */
export function fixed(value: Scalar): Binding {
  return { kind: 'fixed', value };
}
