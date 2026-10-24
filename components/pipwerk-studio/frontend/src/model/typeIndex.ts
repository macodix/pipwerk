import type {
  Choice,
  DataType,
  ElementTypesResponse,
  FunctionDescription,
  GroupId,
  Label,
  OutputDescription,
  ParameterDescription,
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

/** Whether an element of the type shows an object and so holds an instance. */
export function holdsInstance(type: TypeDescription | undefined): boolean {
  return type !== undefined && (type.kind === 'object_type' || type.kind === 'application_object');
}

/**
 * The values of the datatype time unit. The descriptions list them as the
 * choices of every parameter or property of this datatype; the first one that
 * does is taken.
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
 * The values the type descriptions name for the datatype object of an object type (for example the value that stands
 * for "the one of the application"). The first parameter or property of that object type that lists values is taken.
 */
export function objectTypeChoices(index: TypeIndex, objectType: string | null): Choice[] {
  for (const type of index.list) {
    for (const entry of [...type.parameters, ...type.properties]) {
      if (entry.datatype === 'object' && entry.objectType === objectType && entry.choices.length > 0) {
        return entry.choices;
      }
    }
  }
  return [];
}

/** The object types a strategy parameter can have: the object types the type descriptions name for the datatype object. */
export function objectTypesInUse(index: TypeIndex): string[] {
  const found = new Set<string>();
  for (const type of index.list) {
    for (const entry of [...type.parameters, ...type.properties]) {
      if (entry.datatype === 'object' && entry.objectType !== null) {
        found.add(entry.objectType);
      }
    }
  }
  return [...found];
}

/**
 * The values offered for a value of a definition: the definition's own
 * `choices`, otherwise, for the datatype time unit, the time units of the type
 * descriptions; otherwise none.
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

/** The class of the colour of an element on the drawing area, derived from the description only. */
export type KindClass = 'trg' | 'cond' | 'calc' | 'order' | 'act' | 'app' | 'ind' | 'trend' | 'rule' | 'conn' | 'unknown';

export function kindClassOf(type: TypeDescription | undefined): KindClass {
  if (type === undefined) {
    return 'unknown';
  }
  if (type.kind === 'trigger') {
    return 'trg';
  }
  if (type.kind === 'flow') {
    if (isManagementOwnerType(type)) {
      return 'order';
    }
    if (type.named) {
      return type.outputs.length > 1 ? 'cond' : 'calc';
    }
    return 'act';
  }
  if (type.kind === 'application_object') {
    return 'app';
  }
  if (type.category === 'trend') {
    return 'trend';
  }
  if (type.category === 'rule' || type.category === 'ruleset') {
    return 'rule';
  }
  return 'ind';
}

/** The symbol of an element, derived from the description only. */
export function iconOf(type: TypeDescription | undefined): string {
  return iconOfClass(kindClassOf(type));
}

/** The symbol that belongs to a class of elements. */
export function iconOfClass(kindClass: KindClass): string {
  switch (kindClass) {
    case 'trg':
      return 'clock';
    case 'cond':
      return 'diamond';
    case 'calc':
      return 'calc';
    case 'order':
      return 'order';
    case 'act':
      return 'bolt';
    case 'app':
      return 'wallet';
    case 'trend':
      return 'trend';
    case 'rule':
      return 'shield';
    case 'conn':
      return 'link';
    case 'ind':
      return 'wave';
    case 'unknown':
      return 'warn';
  }
}

/** The group of the element library a stored template of an object type belongs to. */
export function groupOfCategory(category: TypeDescription['category']): GroupId | null {
  switch (category) {
    case 'indicator':
      return 'indicators';
    case 'trend':
      return 'trends';
    case 'rule':
    case 'ruleset':
      return 'rules';
    default:
      return null;
  }
}

/** The data types whose values can replace each other in a data connection. */
export function compatibleDataTypes(a: DataType, b: DataType): boolean {
  const numeric: readonly DataType[] = ['number', 'integer', 'percent'];
  if (numeric.includes(a) && numeric.includes(b)) {
    return true;
  }
  return a === b;
}
