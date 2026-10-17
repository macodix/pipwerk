import {
  expectArray,
  expectBoolean,
  expectNullableString,
  expectRecord,
  expectString,
  isScalar,
  requestJson,
  ResponseFormatError,
} from './http';

/** A text in both languages of the user interface (type descriptions of the backend). */
export type Label = { de: string; en: string };

export type DataType =
  | 'number'
  | 'integer'
  | 'percent'
  | 'boolean'
  | 'text'
  | 'choice'
  | 'time_unit'
  | 'timestamp'
  | 'date'
  | 'expression'
  | 'object';

export const dataTypes: readonly DataType[] = [
  'number',
  'integer',
  'percent',
  'boolean',
  'text',
  'choice',
  'time_unit',
  'timestamp',
  'date',
  'expression',
  'object',
];

export type BindingKind = 'fixed' | 'parameter' | 'expression' | 'application';

export const bindingKinds: readonly BindingKind[] = ['fixed', 'parameter', 'expression', 'application'];

export type ElementKind =
  | 'trigger'
  | 'flow'
  | 'object_type'
  | 'application_object'
  | 'order_type'
  | 'trend_method';

const elementKinds: readonly ElementKind[] = [
  'trigger',
  'flow',
  'object_type',
  'application_object',
  'order_type',
  'trend_method',
];

export type ObjectCategory = 'indicator' | 'trend' | 'rule' | 'ruleset';

const objectCategories: readonly ObjectCategory[] = ['indicator', 'trend', 'rule', 'ruleset'];

export type Scalar = string | number | boolean | null;

export type Choice = { id: string; label: Label };

/** The parameter or property applies only if the parameter or property `name` has the value `value`. */
export type Condition = { name: string; value: string };

export type ParameterDescription = {
  id: string;
  datatype: DataType;
  label: Label;
  required: boolean;
  default: Scalar;
  choices: Choice[];
  bindings: BindingKind[];
  appliesWhen: Condition | null;
  objectType: string | null;
};

export type PropertyDescription = {
  id: string;
  datatype: DataType;
  label: Label;
  must: boolean;
  setByUser: boolean;
  default: Scalar;
  choices: Choice[];
  appliesWhen: Condition | null;
  objectType: string | null;
};

export type OutputDescription = { id: string; label: Label };

export type TypeDescription = {
  id: string;
  kind: ElementKind;
  name: Label;
  description: Label;
  category: ObjectCategory | null;
  parameters: ParameterDescription[];
  properties: PropertyDescription[];
  outputs: OutputDescription[];
  rulesAllowed: boolean;
  onCanvas: boolean;
  builtin: boolean;
  byUser: boolean;
};

export type FunctionDescription = {
  name: string;
  description: Label;
  minArguments: number;
  maxArguments: number | null;
};

/** A template document as the backend delivers it. Besides the fields used here it holds the whole content. */
export type TemplateDocument = {
  id: string;
  title: string;
  description: string;
  object_type: string;
  [field: string]: unknown;
};

export type ElementTypesResponse = {
  types: TypeDescription[];
  templates: TemplateDocument[];
  functions: FunctionDescription[];
};

function parseLabel(value: unknown, what: string): Label {
  const record = expectRecord(value, what);
  return { de: expectString(record.de, `${what}.de`), en: expectString(record.en, `${what}.en`) };
}

function parseDataType(value: unknown, what: string): DataType {
  if (typeof value === 'string' && (dataTypes as readonly string[]).includes(value)) {
    return value as DataType;
  }
  throw new ResponseFormatError(what);
}

function parseScalar(value: unknown, what: string): Scalar {
  if (value === undefined) {
    return null;
  }
  if (!isScalar(value)) {
    throw new ResponseFormatError(what);
  }
  return value;
}

function parseChoices(value: unknown, what: string): Choice[] {
  return expectArray(value, what).map((item, index) => {
    const record = expectRecord(item, `${what}[${index}]`);
    return {
      id: expectString(record.id, `${what}[${index}].id`),
      label: parseLabel(record.label, `${what}[${index}].label`),
    };
  });
}

function parseCondition(value: unknown, what: string): Condition | null {
  if (value === null || value === undefined) {
    return null;
  }
  const record = expectRecord(value, what);
  return { name: expectString(record.name, `${what}.name`), value: expectString(record.value, `${what}.value`) };
}

function parseParameter(value: unknown, what: string): ParameterDescription {
  const record = expectRecord(value, what);
  const bindings = expectArray(record.bindings, `${what}.bindings`).map((kind) => {
    if (typeof kind === 'string' && (bindingKinds as readonly string[]).includes(kind)) {
      return kind as BindingKind;
    }
    throw new ResponseFormatError(`${what}.bindings`);
  });
  return {
    id: expectString(record.id, `${what}.id`),
    datatype: parseDataType(record.datatype, `${what}.datatype`),
    label: parseLabel(record.label, `${what}.label`),
    required: expectBoolean(record.required, `${what}.required`),
    default: parseScalar(record.default, `${what}.default`),
    choices: parseChoices(record.choices, `${what}.choices`),
    bindings,
    appliesWhen: parseCondition(record.applies_when, `${what}.applies_when`),
    objectType: expectNullableString(record.object_type, `${what}.object_type`),
  };
}

function parseProperty(value: unknown, what: string): PropertyDescription {
  const record = expectRecord(value, what);
  return {
    id: expectString(record.id, `${what}.id`),
    datatype: parseDataType(record.datatype, `${what}.datatype`),
    label: parseLabel(record.label, `${what}.label`),
    must: expectBoolean(record.must, `${what}.must`),
    setByUser: expectBoolean(record.set_by_user, `${what}.set_by_user`),
    default: parseScalar(record.default, `${what}.default`),
    choices: parseChoices(record.choices, `${what}.choices`),
    appliesWhen: parseCondition(record.applies_when, `${what}.applies_when`),
    objectType: expectNullableString(record.object_type, `${what}.object_type`),
  };
}

function parseType(value: unknown, what: string): TypeDescription {
  const record = expectRecord(value, what);
  const kind = record.kind;
  if (typeof kind !== 'string' || !(elementKinds as readonly string[]).includes(kind)) {
    throw new ResponseFormatError(`${what}.kind`);
  }
  const category = record.category;
  if (category !== null && category !== undefined) {
    if (typeof category !== 'string' || !(objectCategories as readonly string[]).includes(category)) {
      throw new ResponseFormatError(`${what}.category`);
    }
  }
  return {
    id: expectString(record.id, `${what}.id`),
    kind: kind as ElementKind,
    name: parseLabel(record.name, `${what}.name`),
    description: parseLabel(record.description, `${what}.description`),
    category: (category ?? null) as ObjectCategory | null,
    parameters: expectArray(record.parameters, `${what}.parameters`).map((item, index) =>
      parseParameter(item, `${what}.parameters[${index}]`),
    ),
    properties: expectArray(record.properties, `${what}.properties`).map((item, index) =>
      parseProperty(item, `${what}.properties[${index}]`),
    ),
    outputs: expectArray(record.outputs, `${what}.outputs`).map((item, index) => {
      const output = expectRecord(item, `${what}.outputs[${index}]`);
      return {
        id: expectString(output.id, `${what}.outputs[${index}].id`),
        label: parseLabel(output.label, `${what}.outputs[${index}].label`),
      };
    }),
    rulesAllowed: expectBoolean(record.rules_allowed, `${what}.rules_allowed`),
    onCanvas: expectBoolean(record.on_canvas, `${what}.on_canvas`),
    builtin: expectBoolean(record.builtin, `${what}.builtin`),
    byUser: expectBoolean(record.by_user, `${what}.by_user`),
  };
}

function parseTemplate(value: unknown, what: string): TemplateDocument {
  const record = expectRecord(value, what);
  expectString(record.id, `${what}.id`);
  expectString(record.title, `${what}.title`);
  expectString(record.object_type, `${what}.object_type`);
  return {
    ...record,
    description: typeof record.description === 'string' ? record.description : '',
  } as TemplateDocument;
}

function parseFunction(value: unknown, what: string): FunctionDescription {
  const record = expectRecord(value, what);
  const max = record.max_arguments;
  return {
    name: expectString(record.name, `${what}.name`),
    description: parseLabel(record.description, `${what}.description`),
    minArguments: typeof record.min_arguments === 'number' ? record.min_arguments : 0,
    maxArguments: typeof max === 'number' ? max : null,
  };
}

/** Checks the answer of `GET /api/v1/element-types` before it is used. */
export function parseElementTypes(value: unknown): ElementTypesResponse {
  const record = expectRecord(value, 'element types');
  return {
    types: expectArray(record.types, 'types').map((item, index) => parseType(item, `types[${index}]`)),
    templates: expectArray(record.templates, 'templates').map((item, index) =>
      parseTemplate(item, `templates[${index}]`),
    ),
    functions: expectArray(record.functions, 'functions').map((item, index) =>
      parseFunction(item, `functions[${index}]`),
    ),
  };
}

export async function fetchElementTypes(signal?: AbortSignal): Promise<ElementTypesResponse> {
  return parseElementTypes(await requestJson('/api/v1/element-types', { signal }));
}
