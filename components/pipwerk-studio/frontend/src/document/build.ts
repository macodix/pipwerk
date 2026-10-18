import type { ParameterDescription, TemplateDocument, TypeDescription } from '../api/elementTypes';
import type { SupportedLanguage } from '../i18n';
import { holdsInstance, labelText } from '../model/typeIndex';
import { identifierFromName, newUuid, uniqueName } from './ids';
import { hasOwn, setOwn } from './own';
import {
  FORMAT_VERSION,
  STRATEGY_FORMAT,
  type Bindings,
  type ElementDocument,
  type InstanceDocument,
  type StrategyDocument,
} from './types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * The binding a new parameter gets from its description: the standard value,
 * or, for a required parameter that only allows a fixed value, the first value
 * of its choice.
 */
export function defaultBindings(parameters: readonly ParameterDescription[]): Bindings {
  const bindings: Bindings = {};
  for (const parameter of parameters) {
    if (parameter.default !== null) {
      setOwn(bindings, parameter.id, { kind: 'fixed', value: parameter.default });
    } else if (
      parameter.required &&
      parameter.bindings.length === 1 &&
      parameter.bindings[0] === 'fixed' &&
      parameter.choices[0] !== undefined
    ) {
      setOwn(bindings, parameter.id, { kind: 'fixed', value: parameter.choices[0].id });
    }
  }
  return bindings;
}

/** All names an element, an instance or a rule of the strategy already uses. */
export function usedNames(document: StrategyDocument): string[] {
  const names: string[] = [];
  function addInstance(instance: InstanceDocument): void {
    names.push(instance.name);
    for (const child of instance.instances ?? []) {
      addInstance(child);
    }
    for (const rule of instance.rules ?? []) {
      addInstance(rule);
    }
  }
  for (const rule of document.rules) {
    addInstance(rule);
  }
  for (const element of document.elements) {
    if (element.name !== null && element.name !== '') {
      names.push(element.name);
    }
    if (element.instance !== undefined && element.instance !== null) {
      addInstance(element.instance);
    }
    for (const rule of element.rules) {
      addInstance(rule);
    }
  }
  return names;
}

/** An empty instance of an object type. The caller fills in what the type needs. */
function emptyInstance(name: string, objectType: string, origin: InstanceDocument['origin']): InstanceDocument {
  return {
    name,
    object_type: objectType,
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
}

/** A new instance of an object type (without a template), the parameters set to their standard values. */
export function instanceFromType(type: TypeDescription, name: string): InstanceDocument {
  const instance = emptyInstance(name, type.id, {
    object_type: type.id,
    template_id: null,
    template_title: null,
  });
  instance.parameter_values = defaultBindings(type.parameters);
  if (type.category === 'rule') {
    instance.expression = '';
  }
  return instance;
}

/**
 * A new instance from a template: a complete copy of its content (specification
 * E4) with the origin. Own parameters with a standard value that the template
 * does not set get it as fixed value.
 */
export function instanceFromTemplate(template: TemplateDocument, name: string): InstanceDocument {
  const instance = emptyInstance(name, template.object_type, {
    object_type: template.object_type,
    template_id: template.id,
    template_title: template.title,
  });
  const copy = clone(template);
  const parameterValues = (copy.parameter_values ?? {}) as Bindings;
  const definitions = (copy.parameters ?? []) as NonNullable<InstanceDocument['parameters']>;
  for (const definition of definitions) {
    const standard = definition.default;
    if (standard !== undefined && standard !== null && !hasOwn(parameterValues, definition.name)) {
      setOwn(parameterValues, definition.name, { kind: 'fixed', value: standard });
    }
  }
  instance.parameter_values = parameterValues;
  instance.parameters = definitions;
  instance.properties = (copy.properties ?? []) as NonNullable<InstanceDocument['properties']>;
  instance.instances = (copy.instances ?? []) as InstanceDocument[];
  instance.rules = (copy.rules ?? []) as InstanceDocument[];
  instance.expression = (copy.expression ?? null) as string | null;
  instance.determined_property = (copy.determined_property ?? null) as string | null;
  instance.comparison = (copy.comparison ?? null) as InstanceDocument['comparison'];
  instance.result_expression = (copy.result_expression ?? null) as string | null;
  return instance;
}

/** A name for a new instance, free in the strategy. */
export function freshName(document: StrategyDocument, base: string): string {
  return uniqueName(identifierFromName(base), usedNames(document));
}

export type NewElementOptions = {
  x: number;
  y: number;
  managementOf?: string | null;
  language: SupportedLanguage;
};

/** The first part of every new element: identifier, type, title (the name of the type), position. */
function baseElement(type: TypeDescription, options: NewElementOptions): ElementDocument {
  return {
    id: newUuid(),
    type: type.id,
    title: labelText(type.name, options.language),
    name: null,
    x: options.x,
    y: options.y,
    parameters: {},
    properties: {},
    rules: [],
    management_of: options.managementOf ?? null,
  };
}

/** A new element from a trigger or an element of the flow. */
export function newFlowElement(type: TypeDescription, options: NewElementOptions): ElementDocument {
  const element = baseElement(type, options);
  element.parameters = defaultBindings(type.parameters);
  return element;
}

/** A new element that shows an object: it holds an instance of the type. */
export function newObjectElement(
  document: StrategyDocument,
  type: TypeDescription,
  options: NewElementOptions,
): ElementDocument {
  const element = baseElement(type, options);
  element.instance = instanceFromType(type, freshName(document, type.id));
  return element;
}

/** A new element that shows an object from a template. */
export function newTemplateElement(
  document: StrategyDocument,
  template: TemplateDocument,
  options: NewElementOptions,
): ElementDocument {
  const element: ElementDocument = {
    id: newUuid(),
    type: template.object_type,
    title: template.title,
    name: null,
    x: options.x,
    y: options.y,
    parameters: {},
    properties: {},
    rules: [],
    management_of: options.managementOf ?? null,
  };
  element.instance = instanceFromTemplate(template, freshName(document, template.title));
  return element;
}

/** A new element for any type of the drawing area (the library decides which of the builders applies). */
export function newElementForType(
  document: StrategyDocument,
  type: TypeDescription,
  options: NewElementOptions,
): ElementDocument {
  return holdsInstance(type) ? newObjectElement(document, type, options) : newFlowElement(type, options);
}

/**
 * A new strategy: an empty drawing area without elements (specification 5.2).
 * The user places triggers from the element library; the user interface neither
 * creates one nor chooses a type.
 */
export function newStrategy(): StrategyDocument {
  return {
    format: STRATEGY_FORMAT,
    format_version: FORMAT_VERSION,
    id: newUuid(),
    title: '',
    description: '',
    parameters: [],
    rules: [],
    elements: [],
    connections: [],
  };
}
