import { clone } from './build';
import { removeOwn, setOwn } from './own';
import { resolveInstance, type InstanceRef, type InstanceRoot, type InstanceStep } from './places';
import type { Binding, InstanceDocument, ParameterDefinition, PropertyDefinition, StrategyDocument } from './types';

/**
 * Changes of the instances in a strategy: rules and rulesets of the strategy and of elements, and everything an
 * instance contains (specification 3.3, 5.4). Like `ops.ts` every function returns a new document and leaves its
 * argument as it is.
 */

/** A list of instances: the rules of the strategy or of an element, or one of the lists of an instance. */
export type ListRef = { root: InstanceRoot; steps: readonly InstanceStep[]; list: 'rules' | 'instances' };

/** The list with its owner; `null` if the owner is not in the document. */
function listIn(document: StrategyDocument, ref: ListRef): InstanceDocument[] | null {
  const atRoot = ref.steps.length === 0;
  if (atRoot && ref.root.kind === 'strategy') {
    return ref.list === 'rules' ? document.rules : null;
  }
  if (atRoot && ref.root.kind === 'element') {
    const id = ref.root.id;
    const element = document.elements.find((candidate) => candidate.id === id);
    return element === undefined || ref.list !== 'rules' ? null : element.rules;
  }
  const found = resolveInstance(document, { root: ref.root, steps: ref.steps });
  if (found === null) {
    return null;
  }
  found.instance[ref.list] ??= [];
  return found.instance[ref.list] ?? null;
}

/** The list of a copy of the document, changed by `change`; the document itself if the list is missing. */
function changeList(document: StrategyDocument, ref: ListRef, change: (list: InstanceDocument[]) => void): StrategyDocument {
  const next = clone(document);
  const list = listIn(next, ref);
  if (list === null) {
    return document;
  }
  change(list);
  return next;
}

/** The entries of a list for reading; empty if the owner is not in the document. */
export function readList(document: StrategyDocument, ref: ListRef): readonly InstanceDocument[] {
  if (ref.steps.length === 0 && ref.root.kind === 'strategy') {
    return ref.list === 'rules' ? document.rules : [];
  }
  if (ref.steps.length === 0 && ref.root.kind === 'element') {
    const id = ref.root.id;
    return document.elements.find((candidate) => candidate.id === id)?.rules ?? [];
  }
  return resolveInstance(document, { root: ref.root, steps: ref.steps })?.instance[ref.list] ?? [];
}

/** The reference to an entry of a list. */
export function entryRef(list: ListRef, key: string): InstanceRef {
  return { root: list.root, steps: [...list.steps, { list: list.list, key }] };
}

export function addToList(document: StrategyDocument, ref: ListRef, instance: InstanceDocument): StrategyDocument {
  return changeList(document, ref, (list) => {
    list.push(instance);
  });
}

export function removeFromList(document: StrategyDocument, ref: ListRef, key: string): StrategyDocument {
  return changeList(document, ref, (list) => {
    const index = list.findIndex((candidate) => candidate.key === key);
    if (index >= 0) {
      list.splice(index, 1);
    }
  });
}

/** Moves an entry one place up or down in its list (the order of rules matters, specification 3.3). */
export function moveInList(document: StrategyDocument, ref: ListRef, key: string, delta: -1 | 1): StrategyDocument {
  return changeList(document, ref, (list) => {
    const index = list.findIndex((candidate) => candidate.key === key);
    const target = index + delta;
    const moved = list[index];
    const other = list[target];
    if (index < 0 || moved === undefined || other === undefined) {
      return;
    }
    list[index] = other;
    list[target] = moved;
  });
}

export function keysIn(document: StrategyDocument, ref: ListRef): string[] {
  const list = listIn(clone(document), ref);
  return (list ?? []).map((candidate) => candidate.key);
}

function changeInstance(document: StrategyDocument, ref: InstanceRef, change: (instance: InstanceDocument) => void): StrategyDocument {
  const next = clone(document);
  const found = resolveInstance(next, ref);
  if (found === null) {
    return document;
  }
  change(found.instance);
  return next;
}

export function renameInstance(document: StrategyDocument, ref: InstanceRef, name: string): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.name = name;
  });
}

/** Sets or removes (`null`) the assignment of a parameter of an instance. */
export function setInstanceBinding(document: StrategyDocument, ref: InstanceRef, key: string, binding: Binding | null): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.parameter_values ??= {};
    if (binding === null) {
      removeOwn(instance.parameter_values, key);
    } else {
      setOwn(instance.parameter_values, key, binding);
    }
  });
}

export function setDeterminedProperty(document: StrategyDocument, ref: InstanceRef, property: string | null): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.determined_property = property;
    if (property === null) {
      instance.comparison = null;
    } else {
      instance.comparison ??= 'hoechstens';
    }
  });
}

export function setComparison(document: StrategyDocument, ref: InstanceRef, comparison: string | null): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.comparison = comparison;
  });
}

// ---- own parameters and properties -----------------------------------------------------------------------------------

export function addParameterDefinition(document: StrategyDocument, ref: InstanceRef, definition: ParameterDefinition): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.parameters = [...(instance.parameters ?? []), definition];
    if (definition.default !== undefined && definition.default !== null) {
      instance.parameter_values ??= {};
      setOwn(instance.parameter_values, definition.key, { kind: 'fixed', value: definition.default });
    }
  });
}

export function updateParameterDefinition(
  document: StrategyDocument,
  ref: InstanceRef,
  key: string,
  patch: Partial<ParameterDefinition>,
): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.parameters = (instance.parameters ?? []).map((definition) => (definition.key === key ? { ...definition, ...patch } : definition));
  });
}

export function removeParameterDefinition(document: StrategyDocument, ref: InstanceRef, key: string): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.parameters = (instance.parameters ?? []).filter((definition) => definition.key !== key);
    if (instance.parameter_values !== undefined) {
      removeOwn(instance.parameter_values, key);
    }
  });
}

export function addPropertyDefinition(document: StrategyDocument, ref: InstanceRef, definition: PropertyDefinition): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.properties = [...(instance.properties ?? []), definition];
  });
}

export function updatePropertyDefinition(
  document: StrategyDocument,
  ref: InstanceRef,
  key: string,
  patch: Partial<PropertyDefinition>,
): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.properties = (instance.properties ?? []).map((definition) => (definition.key === key ? { ...definition, ...patch } : definition));
  });
}

export function removePropertyDefinition(document: StrategyDocument, ref: InstanceRef, key: string): StrategyDocument {
  return changeInstance(document, ref, (instance) => {
    instance.properties = (instance.properties ?? []).filter((definition) => definition.key !== key);
  });
}
