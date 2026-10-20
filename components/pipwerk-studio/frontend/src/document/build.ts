import type { ParameterDescription, PropertyDescription, TypeDescription } from '../api/elementTypes';
import type { SupportedLanguage } from '../i18n';
import { holdsInstance, labelText, orderSelector, type TypeIndex } from '../model/typeIndex';
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
  /** The name of the element or instance, already unique. */
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

/** A new instance of an object type (without a template), the parameters set to their standard values. */
export function instanceFromType(type: TypeDescription, name: string, key: string): InstanceDocument {
  return {
    name,
    key,
    object_type: type.id,
    origin: { object_type: type.id, template_id: null },
    parameter_values: defaultBindings(type.parameters),
    parameters: [],
    properties: [],
    instances: [],
    rules: [],
    expression: type.category === 'rule' ? '' : null,
    determined_property: null,
    comparison: null,
    result_expression: null,
  };
}

/**
 * A new instance from a template: a complete copy of its content (specification E4) with the origin. A mentioned
 * template stores only its identifier in the origin, an own template also its name (3.7).
 */
export function instanceFromTemplate(
  template: { id: string; name: string; object_type: string } & Record<string, unknown>,
  name: string,
  key: string,
  own: boolean,
): InstanceDocument {
  const copy = clone(template) as Record<string, unknown>;
  const definitions = (copy.parameters ?? []) as NonNullable<InstanceDocument['parameters']>;
  const parameterValues = (copy.parameter_values ?? {}) as Bindings;
  for (const definition of definitions) {
    const standard = definition.default;
    if (standard !== undefined && standard !== null && !hasOwn(parameterValues, definition.key)) {
      setOwn(parameterValues, definition.key, { kind: 'fixed', value: standard });
    }
  }
  return {
    name,
    key,
    object_type: template.object_type,
    origin: {
      object_type: template.object_type,
      template_id: template.id,
      ...(own ? { template_name: template.name } : {}),
    },
    parameter_values: parameterValues,
    parameters: definitions,
    properties: (copy.properties ?? []) as NonNullable<InstanceDocument['properties']>,
    instances: (copy.instances ?? []) as InstanceDocument[],
    rules: (copy.rules ?? []) as InstanceDocument[],
    expression: (copy.expression ?? null) as string | null,
    determined_property: (copy.determined_property ?? null) as string | null,
    comparison: (copy.comparison ?? null) as InstanceDocument['comparison'],
    result_expression: (copy.result_expression ?? null) as string | null,
  };
}

/** A new element for a type of the drawing area: an instance for an object, otherwise a trigger or a step of the flow. */
export function newElement(type: TypeDescription, options: NewElementOptions): ElementDocument {
  const element = baseElement(type, options);
  if (holdsInstance(type)) {
    element.instance = instanceFromType(type, options.name, options.key ?? '');
    return element;
  }
  element.name = options.name;
  if (type.named) {
    element.key = options.key ?? null;
  }
  element.parameters = defaultBindings(type.parameters);
  return element;
}

/** A new element that shows an object from a template. */
export function newTemplateElement(
  template: { id: string; name: string; object_type: string } & Record<string, unknown>,
  options: NewElementOptions,
  own: boolean,
): ElementDocument {
  return {
    id: newUuid(),
    type: template.object_type,
    name: null,
    key: null,
    position: null,
    parameters: {},
    properties: {},
    inputs: [],
    rules: [],
    management_of: options.managementOf,
    instance: instanceFromTemplate(template, options.name, options.key ?? '', own),
  };
}

/** The name a new element gets: the name of its type in the language of the interface. */
export function typeDisplayName(type: TypeDescription, language: SupportedLanguage): string {
  return labelText(type.name, language);
}
