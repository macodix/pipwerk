import type {
  Choice,
  ElementTypesResponse,
  OutputDescription,
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
 * Finds out from the type description which parameter of an element of the flow
 * selects an order type: a parameter of the datatype choice whose values are
 * all identifiers of types of the kind order type. The description has no field
 * for this (specification 3.1, hint H7); it follows from the form of the
 * descriptions without knowing a single type.
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

/** The output at which the management of an element of the type hangs (specification 3.1), or `null`. */
export function managementOutput(type: TypeDescription | undefined): OutputDescription | null {
  return type?.outputs.find((output) => output.holdsManagement) ?? null;
}

/** Whether an element of the type has a management (a frame): the description has an output that holds it. */
export function isManagementOwnerType(type: TypeDescription | undefined): boolean {
  return managementOutput(type) !== null;
}

/** Whether an element of the type has a name under which expressions address its result (field `named`). */
export function hasNameField(type: TypeDescription | undefined): boolean {
  return type !== undefined && type.named;
}

/**
 * The values of the datatype time unit. The descriptions list them as the
 * choices of every parameter or property of this datatype; the first one that
 * does is taken. `definitionChoices` offers them wherever a value of this
 * datatype is entered and the definition names no `choices` of its own.
 */
export function timeUnitChoices(index: TypeIndex): Choice[] {
  for (const type of index.list) {
    for (const entry of [...type.parameters, ...type.properties]) {
      if (entry.datatype === 'time_unit' && entry.choices.length > 0) {
        return entry.choices;
      }
    }
  }
  return [];
}

/**
 * The single rule for the values offered when a value of a parameter definition
 * is entered (value of a strategy parameter, default value and value row of an
 * own parameter of a rule or an instance): if the definition names `choices`,
 * exactly these; otherwise, for the datatype time unit, the time units of the
 * type descriptions (`timeUnits`, see `timeUnitChoices`); otherwise none.
 */
export function definitionChoices(
  datatype: string,
  ownChoices: readonly string[] | undefined,
  timeUnits: readonly Choice[],
): Choice[] {
  const own = ownChoices ?? [];
  if (own.length > 0) {
    return own.map((id) => ({ id, label: { de: id, en: id } }));
  }
  return datatype === 'time_unit' ? [...timeUnits] : [];
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
