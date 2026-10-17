import type {
  ElementTypesResponse,
  FunctionDescription,
  Label,
  ParameterDescription,
  PropertyDescription,
  TemplateDocument,
  TypeDescription,
} from '../api/elementTypes';
import type { SupportedLanguage } from '../i18n';

/**
 * The type descriptions of the backend with a lookup by identifier. Everything
 * the user interface knows about element types and object types comes from
 * here (specification E2); no identifier of a single type stands in the code.
 */
export type TypeIndex = {
  list: readonly TypeDescription[];
  byId: ReadonlyMap<string, TypeDescription>;
  templates: readonly TemplateDocument[];
  functions: readonly FunctionDescription[];
};

export function createTypeIndex(response: ElementTypesResponse): TypeIndex {
  return {
    list: response.types,
    byId: new Map(response.types.map((type) => [type.id, type])),
    templates: response.templates,
    functions: response.functions,
  };
}

export function labelText(label: Label, language: SupportedLanguage): string {
  return label[language];
}

/** Name of a type in the language; the identifier if the type is not known. */
export function typeName(index: TypeIndex, typeId: string, language: SupportedLanguage): string {
  const type = index.byId.get(typeId);
  return type === undefined ? typeId : labelText(type.name, language);
}

/** What the drawing area shows for an element: it decides the connectors. */
export type NodeKind = 'trigger' | 'flow' | 'object' | 'unknown';

export function nodeKindOf(type: TypeDescription | undefined): NodeKind {
  if (type === undefined) {
    return 'unknown';
  }
  if (type.kind === 'trigger') {
    return 'trigger';
  }
  if (type.kind === 'flow') {
    return 'flow';
  }
  return 'object';
}

/** The parameter that selects an order type, with the order types it offers. */
export type OrderSelector = {
  parameter: ParameterDescription;
  orderTypes: TypeDescription[];
};

/**
 * Finds out from the type description whether a type is one that places an
 * order: it is an element of the flow with a parameter of the datatype choice
 * whose values are all identifiers of types of the kind order type. The
 * description names neither the type nor the output that carries the
 * management; see "Stellen nach Punkt 4" in the technical documentation.
 */
export function orderSelector(index: TypeIndex, type: TypeDescription): OrderSelector | null {
  if (type.kind !== 'flow') {
    return null;
  }
  for (const parameter of type.parameters) {
    if (parameter.datatype !== 'choice' || parameter.choices.length === 0) {
      continue;
    }
    const orderTypes: TypeDescription[] = [];
    for (const choice of parameter.choices) {
      const candidate = index.byId.get(choice.id);
      if (candidate === undefined || candidate.kind !== 'order_type') {
        break;
      }
      orderTypes.push(candidate);
    }
    if (orderTypes.length === parameter.choices.length) {
      return { parameter, orderTypes };
    }
  }
  return null;
}

export function isManagementOwnerType(index: TypeIndex, type: TypeDescription | undefined): boolean {
  return type !== undefined && orderSelector(index, type) !== null;
}

/**
 * The trigger of a new strategy: a trigger with a required parameter of the
 * datatype time unit (it starts at the close of a candle); otherwise the first
 * trigger. The description does not name the type.
 */
export function defaultTrigger(index: TypeIndex): TypeDescription | null {
  const triggers = index.list.filter((type) => type.kind === 'trigger' && type.byUser && type.onCanvas);
  return (
    triggers.find((type) => type.parameters.some((p) => p.datatype === 'time_unit' && p.required)) ??
    triggers[0] ??
    null
  );
}

/**
 * Whether an element of the type has a name under which expressions address
 * its result: an element of the flow whose type has properties.
 */
export function hasNameField(type: TypeDescription | undefined): boolean {
  return type !== undefined && type.kind === 'flow' && type.properties.length > 0;
}

/** Whether an element of the type shows an object and so holds an instance. */
export function holdsInstance(type: TypeDescription | undefined): boolean {
  return type !== undefined && (type.kind === 'object_type' || type.kind === 'application_object');
}

/**
 * The object of the application that stands for "the order" in expressions: the
 * one whose properties all belong to every order type (it is the common part of
 * all order types). In an expression it also offers the properties of the
 * order types (specification 3.4: in a rule, `Order` has the properties of all
 * order types). The description of the object does not list them.
 */
export function commonOrderObject(index: TypeIndex): TypeDescription | undefined {
  const orders = index.list.filter((type) => type.kind === 'order_type');
  if (orders.length === 0) {
    return undefined;
  }
  return index.list.find(
    (type) =>
      type.kind === 'application_object' &&
      type.properties.length > 0 &&
      orders.every((order) =>
        type.properties.every((property) => order.properties.some((candidate) => candidate.id === property.id)),
      ),
  );
}

/** The properties of the order types together, each identifier once (the first description wins). */
export function allOrderProperties(index: TypeIndex): PropertyDescription[] {
  const result: PropertyDescription[] = [];
  const seen = new Set<string>();
  for (const type of index.list) {
    if (type.kind !== 'order_type') {
      continue;
    }
    for (const property of type.properties) {
      if (!seen.has(property.id)) {
        seen.add(property.id);
        result.push(property);
      }
    }
  }
  return result;
}

/** Order types that carry the properties the user sets (all kinds of orders). */
export function orderTypes(index: TypeIndex): TypeDescription[] {
  return index.list.filter((type) => type.kind === 'order_type');
}

export function userProperties(type: TypeDescription): PropertyDescription[] {
  return type.properties.filter((property) => property.setByUser);
}
