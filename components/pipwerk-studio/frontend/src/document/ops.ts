import { isCardElement, managementOwner, ownsManagement } from '../model/elements';
import { managementOutput, type TypeIndex } from '../model/typeIndex';
import { clone, withOrderDefaults } from './build';
import { newUuid } from './ids';
import { getOwn, removeOwn, setOwn } from './own';
import {
  isConnectionValue,
  type Binding,
  type Bindings,
  type ConnectionDocument,
  type ElementDocument,
  type InputArgument,
  type InputDocument,
  type InputKind,
  type InstanceDocument,
  type Position,
  type StrategyDocument,
  type StrategyParameter,
} from './types';

/**
 * Changes of the strategy document. Every function returns a new document and leaves its argument as it is. The user
 * interface changes the document only through these functions (specification E3: the document is authoritative).
 */

function element(document: StrategyDocument, id: string): ElementDocument | undefined {
  return document.elements.find((candidate) => candidate.id === id);
}

export function setStrategyName(document: StrategyDocument, name: string): StrategyDocument {
  return { ...document, name };
}

export function setStrategyDescription(document: StrategyDocument, description: string): StrategyDocument {
  return { ...document, description };
}

export function setOrientation(document: StrategyDocument, orientation: StrategyDocument['orientation']): StrategyDocument {
  return { ...document, orientation };
}

// ---- the flow of an element ------------------------------------------------------------------------------------

/** The element that owns the management the element belongs to, or `null` for the main flow. */
export function flowOf(document: StrategyDocument, types: TypeIndex, id: string): string | null {
  const found = element(document, id);
  return found === undefined ? null : managementOwner(found, document, types);
}

/** Whether the management of the element has a trigger of its own (specification 3.3). */
export function managementHasTrigger(document: StrategyDocument, types: TypeIndex, owner: string): boolean {
  return document.elements.some(
    (candidate) =>
      types.byId.get(candidate.type)?.kind === 'trigger' && managementOwner(candidate, document, types) === owner,
  );
}

export type ConnectionProblem =
  | 'unknown_element'
  | 'same_element'
  | 'target_is_trigger'
  | 'instance'
  | 'unknown_type'
  | 'unknown_output'
  | 'across_flows'
  | 'management_has_triggers';

export type ConnectResult = { document: StrategyDocument } | { problem: ConnectionProblem };

/**
 * Connects the output of a step with another step (specification 3.3): a trigger has no input, instances have no
 * connection of the flow, only steps of the same flow are connected. The output with the management of the step may
 * be connected to a step of this management if the management has no trigger of its own. An output has at most one
 * connection; a new one replaces the old.
 */
export function connect(
  document: StrategyDocument,
  types: TypeIndex,
  from: string,
  output: string,
  to: string,
): ConnectResult {
  const source = element(document, from);
  const target = element(document, to);
  if (source === undefined || target === undefined) {
    return { problem: 'unknown_element' };
  }
  if (from === to) {
    return { problem: 'same_element' };
  }
  const sourceType = types.byId.get(source.type);
  const targetType = types.byId.get(target.type);
  if (isCardElement(source, types) || isCardElement(target, types)) {
    return { problem: 'instance' };
  }
  if (sourceType === undefined) {
    return { problem: 'unknown_type' };
  }
  if (targetType?.kind === 'trigger') {
    return { problem: 'target_is_trigger' };
  }
  const description = sourceType.outputs.find((candidate) => candidate.id === output);
  if (description === undefined) {
    return { problem: 'unknown_output' };
  }
  if (description.holdsManagement) {
    if (flowOf(document, types, to) !== from) {
      return { problem: 'across_flows' };
    }
    if (managementHasTrigger(document, types, from)) {
      return { problem: 'management_has_triggers' };
    }
  } else if (flowOf(document, types, from) !== flowOf(document, types, to)) {
    return { problem: 'across_flows' };
  }
  const next = clone(document);
  next.connections = next.connections.filter((candidate) => !(candidate.source === from && candidate.output === output));
  next.connections.push({ id: newUuid(), source: from, output, target: to });
  return { document: next };
}

export function disconnect(document: StrategyDocument, connectionId: string): StrategyDocument {
  return { ...document, connections: document.connections.filter((candidate) => candidate.id !== connectionId) };
}

/** Whether a connection may stand where its ends lie now (used after an element changes its flow). */
function connectionAllowed(document: StrategyDocument, types: TypeIndex, connection: ConnectionDocument): boolean {
  const source = element(document, connection.source);
  const target = element(document, connection.target);
  if (source === undefined || target === undefined) {
    return false;
  }
  const targetFlow = managementOwner(target, document, types);
  const sourceType = types.byId.get(source.type);
  const holds = sourceType?.outputs.find((candidate) => candidate.id === connection.output)?.holdsManagement === true;
  if (holds) {
    return targetFlow === connection.source && !managementHasTrigger(document, types, connection.source);
  }
  if (types.byId.get(target.type)?.kind === 'trigger' && sourceType !== undefined) {
    return false;
  }
  return managementOwner(source, document, types) === targetFlow;
}

function dropInvalidConnections(document: StrategyDocument, types: TypeIndex): void {
  document.connections = document.connections.filter((candidate) => connectionAllowed(document, types, candidate));
}

/** The connections from the management output of an element to the first steps of its management. */
function startConnections(document: StrategyDocument, types: TypeIndex, owner: string): ConnectionDocument[] {
  const output = managementOutput(types.byId.get(element(document, owner)?.type ?? ''));
  if (output === null) {
    return [];
  }
  return document.connections.filter((candidate) => candidate.source === owner && candidate.output === output.id);
}

// ---- adding and removing ---------------------------------------------------------------------------------------

function freeOutput(document: StrategyDocument, types: TypeIndex, source: ElementDocument): string | null {
  const type = types.byId.get(source.type);
  if (type === undefined) {
    return null;
  }
  for (const output of type.outputs) {
    if (output.holdsManagement) {
      continue;
    }
    if (!document.connections.some((candidate) => candidate.source === source.id && candidate.output === output.id)) {
      return output.id;
    }
  }
  return null;
}

/**
 * Adds an element. A step of the flow is connected behind the step `after` if that step is in the same flow and has a
 * free output (specification 5.2). The first step of a management without a trigger of its own is connected with the
 * management output of its element; a trigger that arrives in a management removes that connection (3.3).
 */
export function addElement(
  document: StrategyDocument,
  types: TypeIndex,
  added: ElementDocument,
  after: string | null,
): StrategyDocument {
  const next = clone(document);
  next.elements.push(added);
  const type = types.byId.get(added.type);
  if (isCardElement(added, types) || type === undefined) {
    return next;
  }
  const owner = managementOwner(added, next, types);
  if (type.kind === 'trigger') {
    if (owner !== null) {
      const starts = new Set(startConnections(next, types, owner).map((candidate) => candidate.id));
      next.connections = next.connections.filter((candidate) => !starts.has(candidate.id));
    }
    return next;
  }
  const source = after === null ? undefined : element(next, after);
  if (source !== undefined && !isCardElement(source, types) && managementOwner(source, next, types) === owner) {
    const output = freeOutput(next, types, source);
    if (output !== null) {
      next.connections.push({ id: newUuid(), source: source.id, output, target: added.id });
      return next;
    }
  }
  if (owner !== null && !managementHasTrigger(next, types, owner) && startConnections(next, types, owner).length === 0) {
    const output = managementOutput(types.byId.get(element(next, owner)?.type ?? ''));
    if (output !== null) {
      next.connections.push({ id: newUuid(), source: owner, output: output.id, target: added.id });
    }
  }
  return next;
}

/** Every element that belongs to the management of the element, also inside managements of those. */
function managedBy(document: StrategyDocument, id: string): string[] {
  const found: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const owner = queue.pop();
    for (const candidate of document.elements) {
      if (candidate.management_of === owner && !found.includes(candidate.id) && candidate.id !== id) {
        found.push(candidate.id);
        queue.push(candidate.id);
      }
    }
  }
  return found;
}

/** The elements that go with an element when it is removed: those of its management. */
export function removalSet(document: StrategyDocument, id: string): string[] {
  return managedBy(document, id);
}

function visitBindings(instance: InstanceDocument, visit: (bindings: Bindings) => void): void {
  if (instance.parameter_values !== undefined) {
    visit(instance.parameter_values);
  }
  for (const child of [...(instance.instances ?? []), ...(instance.rules ?? [])]) {
    visitBindings(child, visit);
  }
}

/** Visits every record of bindings of the document: elements, their instances and rules, rules of the strategy. */
function forEachBindings(document: StrategyDocument, visit: (bindings: Bindings) => void): void {
  for (const rule of document.rules) {
    visitBindings(rule, visit);
  }
  for (const candidate of document.elements) {
    visit(candidate.parameters);
    visit(candidate.properties);
    if (candidate.instance !== undefined && candidate.instance !== null) {
      visitBindings(candidate.instance, visit);
    }
    for (const rule of candidate.rules) {
      visitBindings(rule, visit);
    }
  }
}

/** Removes the bindings that satisfy `drop`; the entry is "not assigned" afterwards. */
function dropBindings(document: StrategyDocument, drop: (binding: Binding) => boolean): void {
  forEachBindings(document, (bindings) => {
    for (const key of Object.keys(bindings)) {
      const binding = getOwn(bindings, key);
      if (binding !== undefined && drop(binding)) {
        removeOwn(bindings, key);
      }
    }
  });
}

/**
 * Removes an element with the elements of its management. A step with exactly one way in and one way out is bridged:
 * its predecessor is connected with its successor (specification 5.4). Inputs and assignments that took values from a
 * removed instance are removed; expressions stay as they are, the check reports them.
 */
export function removeElement(document: StrategyDocument, types: TypeIndex, id: string): StrategyDocument {
  const removed = element(document, id);
  if (removed === undefined) {
    return document;
  }
  const next = clone(document);
  const ids = new Set<string>([id, ...managedBy(next, id)]);
  const into = next.connections.filter((candidate) => candidate.target === id);
  const out = next.connections.filter((candidate) => candidate.source === id);
  const keys = new Set<string>();
  for (const gone of next.elements) {
    if (ids.has(gone.id) && gone.instance !== undefined && gone.instance !== null) {
      keys.add(gone.instance.key.toLowerCase());
    }
  }
  next.connections = next.connections.filter((candidate) => !ids.has(candidate.source) && !ids.has(candidate.target));
  const ownsOthers = ids.size > 1 || ownsManagement(removed, next, types);
  const bridgeFrom = into[0];
  const bridgeTo = out[0];
  if (into.length === 1 && out.length === 1 && !ownsOthers && bridgeFrom !== undefined && bridgeTo !== undefined) {
    next.connections.push({ id: newUuid(), source: bridgeFrom.source, output: bridgeFrom.output, target: bridgeTo.target });
  }
  next.elements = next.elements.filter((candidate) => !ids.has(candidate.id));
  for (const other of next.elements) {
    other.inputs = other.inputs.filter((input) => !keys.has(input.instance.toLowerCase()));
    // an instance whose first use was a removed element has no element of its first use any more (specification 3.3)
    const firstUse = other.instance?.first_use;
    if (other.instance !== undefined && other.instance !== null && typeof firstUse === 'string' && ids.has(firstUse)) {
      other.instance.first_use = null;
    }
  }
  if (keys.size > 0) {
    dropBindings(next, (binding) => isConnectionValue(binding.value) && keys.has(binding.value.instance.toLowerCase()));
  }
  next.sections = next.sections
    .map((section) => ({ ...section, elements: section.elements.filter((candidate) => !ids.has(candidate)) }))
    .filter((section) => section.elements.length > 0 && (section.flow === null || !ids.has(section.flow)));
  next.collapsed_managements = next.collapsed_managements.filter((candidate) => !ids.has(candidate));
  dropInvalidConnections(next, types);
  return next;
}

/**
 * The strategy the backend returned after it removed an element (`/api/v1/removals` with `apply`), with the gap closed
 * the way `removeElement` does it: a step with exactly one way in and one way out leaves its predecessor connected with
 * its successor (specification 5.4). `before` is the strategy as it was.
 */
export function closeGapAfterRemoval(before: StrategyDocument, after: StrategyDocument, types: TypeIndex, id: string): StrategyDocument {
  const removed = element(before, id);
  if (removed === undefined) {
    return after;
  }
  const into = before.connections.filter((candidate) => candidate.target === id);
  const out = before.connections.filter((candidate) => candidate.source === id);
  const from = into[0];
  const to = out[0];
  if (into.length !== 1 || out.length !== 1 || from === undefined || to === undefined || managedBy(before, id).length > 0 || ownsManagement(removed, before, types)) {
    return after;
  }
  if (element(after, from.source) === undefined || element(after, to.target) === undefined) {
    return after;
  }
  const next = clone(after);
  next.connections.push({ id: newUuid(), source: from.source, output: from.output, target: to.target });
  dropInvalidConnections(next, types);
  return next;
}

// ---- place and flow --------------------------------------------------------------------------------------------

/** The place the user gave a step; `null` hands the place back to the arrangement. */
export function setPosition(document: StrategyDocument, id: string, position: Position | null): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) => (candidate.id === id ? { ...candidate, position } : candidate)),
  };
}

export function clearPositions(document: StrategyDocument): StrategyDocument {
  return { ...document, elements: document.elements.map((candidate) => ({ ...candidate, position: null })) };
}

/** Whether `owner` lies in the management of `id` (directly or deeper): then `id` must not move into it. */
function lies(document: StrategyDocument, id: string, owner: string | null): boolean {
  if (owner === null) {
    return false;
  }
  return owner === id || managedBy(document, id).includes(owner);
}

/**
 * Moves a step into the management of `owner` (or the main flow with `null`). Its place goes back to the
 * arrangement, connections that would lie between flows are removed, and the step leaves its section (specification
 * 3.3, 5.3). A trigger that arrives in a management removes the connection from the management output.
 */
export function setManagement(
  document: StrategyDocument,
  types: TypeIndex,
  id: string,
  owner: string | null,
): StrategyDocument {
  const moved = element(document, id);
  if (moved === undefined || isCardElement(moved, types) || lies(document, id, owner)) {
    return document;
  }
  if (owner !== null) {
    const target = element(document, owner);
    if (target === undefined || !ownsManagement(target, document, types)) {
      return document;
    }
  }
  if ((moved.management_of ?? null) === owner) {
    return document;
  }
  const next = clone(document);
  const changed = element(next, id);
  if (changed === undefined) {
    return document;
  }
  changed.management_of = owner;
  changed.position = null;
  next.sections = next.sections
    .map((section) => ({ ...section, elements: section.elements.filter((candidate) => candidate !== id) }))
    .filter((section) => section.elements.length > 0);
  if (owner !== null && types.byId.get(changed.type)?.kind === 'trigger') {
    const starts = new Set(startConnections(next, types, owner).map((candidate) => candidate.id));
    next.connections = next.connections.filter((candidate) => !starts.has(candidate.id));
  }
  dropInvalidConnections(next, types);
  return next;
}

export function toggleManagementCollapsed(document: StrategyDocument, owner: string): StrategyDocument {
  const collapsed = document.collapsed_managements.includes(owner)
    ? document.collapsed_managements.filter((candidate) => candidate !== owner)
    : [...document.collapsed_managements, owner];
  return { ...document, collapsed_managements: collapsed };
}

// ---- sections --------------------------------------------------------------------------------------------------

export function sectionOf(document: StrategyDocument, id: string): string | null {
  return document.sections.find((section) => section.elements.includes(id))?.id ?? null;
}

/** Puts a step into a section of its flow, or into none (`null`). */
export function setSection(document: StrategyDocument, id: string, sectionId: string | null): StrategyDocument {
  const sections = document.sections
    .map((section) => ({
      ...section,
      elements:
        section.id === sectionId
          ? section.elements.includes(id)
            ? section.elements
            : [...section.elements, id]
          : section.elements.filter((candidate) => candidate !== id),
    }))
    .filter((section) => section.elements.length > 0);
  return { ...document, sections };
}

/** A new section with one step. The section belongs to the flow of the step. */
export function createSection(
  document: StrategyDocument,
  types: TypeIndex,
  id: string,
  name: string,
): StrategyDocument {
  const flow = flowOf(document, types, id);
  const withoutOld = setSection(document, id, null);
  return {
    ...withoutOld,
    sections: [...withoutOld.sections, { id: newUuid(), name, flow, elements: [id], collapsed: false }],
  };
}

export function renameSection(document: StrategyDocument, sectionId: string, name: string): StrategyDocument {
  return {
    ...document,
    sections: document.sections.map((section) => (section.id === sectionId ? { ...section, name } : section)),
  };
}

export function setSectionCollapsed(document: StrategyDocument, sectionId: string, collapsed: boolean): StrategyDocument {
  return {
    ...document,
    sections: document.sections.map((section) => (section.id === sectionId ? { ...section, collapsed } : section)),
  };
}

/** Removes a section; its steps stay. */
export function removeSection(document: StrategyDocument, sectionId: string): StrategyDocument {
  return { ...document, sections: document.sections.filter((section) => section.id !== sectionId) };
}

// ---- names, assignments, inputs --------------------------------------------------------------------------------

/** Renames an element or its instance. The identifier in expressions stays as it is (specification 3.3). */
export function setElementName(document: StrategyDocument, id: string, name: string): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) => {
      if (candidate.id !== id) {
        return candidate;
      }
      if (candidate.instance !== undefined && candidate.instance !== null) {
        return { ...candidate, instance: { ...candidate.instance, name } };
      }
      return { ...candidate, name };
    }),
  };
}

export type BindingScope = 'parameters' | 'properties' | 'instance';

/**
 * Sets or removes (`null`) the assignment of a parameter or property of an element. A new order type brings the
 * standard values of the properties it newly needs.
 */
export function setBinding(
  document: StrategyDocument,
  types: TypeIndex,
  id: string,
  scope: BindingScope,
  key: string,
  binding: Binding | null,
): StrategyDocument {
  const next = clone(document);
  const target = element(next, id);
  if (target === undefined) {
    return document;
  }
  let record: Bindings;
  if (scope === 'instance') {
    if (target.instance === undefined || target.instance === null) {
      return document;
    }
    target.instance.parameter_values ??= {};
    record = target.instance.parameter_values;
  } else {
    record = target[scope];
  }
  if (binding === null) {
    removeOwn(record, key);
  } else {
    setOwn(record, key, binding);
  }
  const index = next.elements.findIndex((candidate) => candidate.id === id);
  return scope === 'parameters'
    ? { ...next, elements: next.elements.map((candidate, position) => (position === index ? withOrderDefaults(candidate, types) : candidate)) }
    : next;
}

/** The value an input or a use names: an instance and its property, or its method with the values of the arguments. */
export type InputRef = { instance: string; property: string; kind?: InputKind; arguments?: readonly InputArgument[] };

/** Whether two inputs name the same value: the same instance (without regard to case), property or method, arguments. */
export function sameInput(a: InputRef, b: InputRef): boolean {
  return (
    a.instance.toLowerCase() === b.instance.toLowerCase() &&
    a.property.toLowerCase() === b.property.toLowerCase() &&
    (a.kind ?? 'property') === (b.kind ?? 'property') &&
    JSON.stringify(a.arguments ?? []) === JSON.stringify(b.arguments ?? [])
  );
}

function inputOf(ref: InputRef, refresh: boolean): InputDocument {
  const method = ref.kind === 'method';
  return {
    instance: ref.instance,
    property: ref.property,
    kind: method ? 'method' : 'property',
    arguments: method ? [...(ref.arguments ?? [])] : [],
    refresh,
  };
}

/**
 * Adds the input of a property or method of an instance to an element (specification 3.3). The input is written with
 * all five fields; without `kind` it is a property with no arguments and no "Aktualisieren". An input of a method of
 * the same name or with other arguments is another input and stays as it is.
 */
export function addInput(document: StrategyDocument, id: string, input: InputRef, refresh = false): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) =>
      candidate.id === id && !candidate.inputs.some((existing) => sameInput(existing, input))
        ? { ...candidate, inputs: [...candidate.inputs, inputOf(input, refresh)] }
        : candidate,
    ),
  };
}

export function removeInput(document: StrategyDocument, id: string, input: InputRef): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) =>
      candidate.id === id ? { ...candidate, inputs: candidate.inputs.filter((existing) => !sameInput(existing, input)) } : candidate,
    ),
  };
}

/**
 * Changes the value an input names (property or method, arguments) or its "Aktualisieren". An input that is not there
 * is added at the end; an input that would equal another one of the element takes the place of that one.
 */
export function changeInput(document: StrategyDocument, id: string, from: InputRef, to: InputRef, refresh: boolean): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) => {
      if (candidate.id !== id) {
        return candidate;
      }
      const at = candidate.inputs.findIndex((existing) => sameInput(existing, from));
      const inputs = candidate.inputs.filter((existing) => !sameInput(existing, from) && !sameInput(existing, to));
      inputs.splice(at < 0 ? inputs.length : Math.min(at, inputs.length), 0, inputOf(to, refresh));
      return { ...candidate, inputs };
    }),
  };
}

// ---- strategy parameters ---------------------------------------------------------------------------------------

export function addStrategyParameter(document: StrategyDocument, parameter: StrategyParameter): StrategyDocument {
  return { ...document, parameters: [...document.parameters, parameter] };
}

export function updateStrategyParameter(
  document: StrategyDocument,
  key: string,
  patch: Partial<StrategyParameter>,
): StrategyDocument {
  return {
    ...document,
    parameters: document.parameters.map((candidate) => (candidate.key === key ? { ...candidate, ...patch } : candidate)),
  };
}

/** Removes a strategy parameter. Assignments that used it are "not assigned" afterwards; the check reports expressions. */
export function removeStrategyParameter(document: StrategyDocument, key: string): StrategyDocument {
  const next = clone(document);
  next.parameters = next.parameters.filter((candidate) => candidate.key !== key);
  dropBindings(next, (binding) => binding.kind === 'parameter' && binding.value === key);
  return next;
}

// ---- first use of an instance ----------------------------------------------------------------------------------

/**
 * Sets the element with which the user connected an instance first (specification 3.3): the interface writes it when
 * the user connects an instance that no element uses yet. `elementId` is `null` to clear it.
 */
export function setFirstUse(document: StrategyDocument, id: string, elementId: string | null): StrategyDocument {
  return {
    ...document,
    elements: document.elements.map((candidate) =>
      candidate.id === id && candidate.instance !== undefined && candidate.instance !== null
        ? { ...candidate, instance: { ...candidate.instance, first_use: elementId } }
        : candidate,
    ),
  };
}

// ---- rules -----------------------------------------------------------------------------------------------------

/** Adds a rule to the strategy (`owner` is `null`) or to an element. */
export function addRule(document: StrategyDocument, owner: string | null, rule: InstanceDocument): StrategyDocument {
  if (owner === null) {
    return { ...document, rules: [...document.rules, rule] };
  }
  return {
    ...document,
    elements: document.elements.map((candidate) =>
      candidate.id === owner ? { ...candidate, rules: [...candidate.rules, rule] } : candidate,
    ),
  };
}

export function removeRule(document: StrategyDocument, owner: string | null, key: string): StrategyDocument {
  if (owner === null) {
    return { ...document, rules: document.rules.filter((rule) => rule.key !== key) };
  }
  return {
    ...document,
    elements: document.elements.map((candidate) =>
      candidate.id === owner ? { ...candidate, rules: candidate.rules.filter((rule) => rule.key !== key) } : candidate,
    ),
  };
}
