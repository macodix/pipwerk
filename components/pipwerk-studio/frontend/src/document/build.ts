import type { ParameterDescription, PropertyDescription, TypeDescription } from '../api/elementTypes';
import type { SupportedLanguage } from '../i18n';
import { labelText, orderSelector, type TypeIndex } from '../model/typeIndex';
import { newUuid } from './ids';
import { getOwn, hasOwn, setOwn } from './own';
import {
  FORMAT_VERSION,
  STRATEGY_FORMAT,
  type Binding,
  type Bindings,
  type ElementDocument,
  type InstanceDocument,
  type StrategyDocument,
} from './types';

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** A new, empty strategy: no elements, no strategy parameters (specification 5.5). */
export function newStrategy(name: string): StrategyDocument {
  return {
    format: STRATEGY_FORMAT,
    format_version: FORMAT_VERSION,
    id: newUuid(),
    name,
    description: '',
    parameters: [],
    rules: [],
    elements: [],
    connections: [],
    sections: [],
    orientation: 'vertical',
    collapsed_managements: [],
  };
}

/**
 * `base`, then `base 2`, `base 3`, … : the first name that is not in `taken` (compared without regard to
 * case). Specification 3.3: "Kerze 2".
 */
export function uniqueDisplayName(base: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (name) => name.toLowerCase()));
  if (!used.has(base.toLowerCase())) {
    return base;
  }
  for (let counter = 2; ; counter += 1) {
    const candidate = `${base} ${counter}`;
    if (!used.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

function instanceNames(instance: InstanceDocument, into: string[]): void {
  into.push(instance.name);
  for (const child of instance.instances ?? []) {
    instanceNames(child, into);
  }
  for (const rule of instance.rules ?? []) {
    instanceNames(rule, into);
  }
}

/**
 * The names a new instance, rule, condition or calculation must not take (specification 3.3): the names of the
 * existing ones and the names of the application objects in both languages.
 */
export function takenNames(document: StrategyDocument, types: TypeIndex): string[] {
  const names: string[] = [];
  for (const rule of document.rules) {
    instanceNames(rule, names);
  }
  for (const element of document.elements) {
    if (element.instance !== undefined && element.instance !== null) {
      instanceNames(element.instance, names);
    } else if (types.byId.get(element.type)?.named === true && element.name !== null && element.name !== undefined) {
      names.push(element.name);
    }
    for (const rule of element.rules) {
      instanceNames(rule, names);
    }
  }
  for (const type of types.list) {
    if (type.kind === 'application_object') {
      names.push(type.name.de, type.name.en);
    }
  }
  return names;
}

/** The standard binding of a parameter or property: its standard value, or for a fixed-only required entry the first value. */
export function defaultBinding(entry: ParameterDescription | PropertyDescription): Binding | null {
  if (entry.default !== null) {
    return { kind: 'fixed', value: entry.default };
  }
  const required = 'required' in entry ? entry.required : entry.must;
  if (required && entry.bindings.length === 1 && entry.bindings[0] === 'fixed' && entry.choices[0] !== undefined) {
    return { kind: 'fixed', value: entry.choices[0].id };
  }
  return null;
}

export function defaultBindings(entries: readonly (ParameterDescription | PropertyDescription)[]): Bindings {
  const bindings: Bindings = {};
  for (const entry of entries) {
    const binding = defaultBinding(entry);
    if (binding !== null) {
      setOwn(bindings, entry.id, binding);
    }
  }
  return bindings;
}

/**
 * The properties of an element that selects an order type (the order the element places) with the
 * standard values of the properties the user sets. Properties the element already has stay as they are:
 * a new order type only brings the standard values of the properties it newly needs (specification 5.4).
 */
export function withOrderDefaults(element: ElementDocument, types: TypeIndex): ElementDocument {
  const type = types.byId.get(element.type);
  const selector = type === undefined ? null : orderSelector(types, type);
  if (selector === null) {
    return element;
  }
  const chosen = getOwn(element.parameters, selector.parameter.id);
  const orderType = selector.orderTypes.find((candidate) => candidate.id === chosen?.value);
  if (orderType === undefined) {
    return element;
  }
  const properties: Bindings = { ...element.properties };
  for (const property of orderType.properties) {
    if (property.setByUser && !hasOwn(properties, property.id)) {
      const binding = defaultBinding(property);
      if (binding !== null) {
        setOwn(properties, property.id, binding);
      }
    }
  }
  return { ...element, properties };
}

export type NewElementOptions = {
  /** The name of the element, already unique. */
  name: string;
  /** The identifier in expressions, for an element with a result (condition, calculation). */
  key?: string | null;
  /** The element "place order" whose management the element belongs to, or `null` for the main flow. */
  managementOf: string | null;
};

function baseElement(type: TypeDescription, options: NewElementOptions): ElementDocument {
  return {
    id: newUuid(),
    type: type.id,
    name: null,
    key: null,
    position: null,
    parameters: {},
    properties: {},
    inputs: [],
    rules: [],
    management_of: options.managementOf,
  };
}

/**
 * The instance the backend made (`/api/v1/insert`: name, key, origin and content, expressions written on the new keys)
 * with the standard values of its parameters, which the backend does not set: those of the parameters the instance
 * defines itself, and, for an instance of an object type without a template, those of the type. Names, keys and
 * expressions of the instance stay as they are; only a rule from an object type gets the empty expression a rule is
 * started with.
 */
export function withStandardValues(instance: InstanceDocument, type: TypeDescription | undefined): InstanceDocument {
  const parameterValues: Bindings = { ...instance.parameter_values };
  const fromType = type !== undefined && (instance.origin?.template_id ?? null) === null;
  const standards: Bindings = fromType ? defaultBindings(type.parameters) : {};
  for (const definition of instance.parameters ?? []) {
    if (definition.default !== undefined && definition.default !== null) {
      setOwn(standards, definition.key, { kind: 'fixed', value: definition.default });
    }
  }
  for (const [key, binding] of Object.entries(standards)) {
    if (!hasOwn(parameterValues, key)) {
      setOwn(parameterValues, key, binding);
    }
  }
  return {
    ...instance,
    parameter_values: parameterValues,
    ...(fromType && type.category === 'rule' && (instance.expression ?? null) === null ? { expression: '' } : {}),
  };
}

/**
 * A new element for a type of the flow (a trigger or a step), the parameters set to their standard values. An element
 * that shows an object is made by `elementForInstance`.
 */
export function newElement(type: TypeDescription, options: NewElementOptions): ElementDocument {
  const element = baseElement(type, options);
  element.name = options.name;
  if (type.named) {
    element.key = options.key ?? null;
  }
  element.parameters = defaultBindings(type.parameters);
  return element;
}

/** A new element on the drawing area that shows an instance (from `/api/v1/insert`). */
export function elementForInstance(instance: InstanceDocument): ElementDocument {
  return {
    id: newUuid(),
    type: instance.object_type,
    name: null,
    key: null,
    position: null,
    parameters: {},
    properties: {},
    inputs: [],
    rules: [],
    management_of: null,
    instance,
  };
}

/** The name a new element gets: the name of its type in the language of the interface. */
export function typeDisplayName(type: TypeDescription, language: SupportedLanguage): string {
  return labelText(type.name, language);
}
