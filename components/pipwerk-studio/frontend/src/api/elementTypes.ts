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

/** The kinds of assignment (specification 3.1): fixed value, strategy parameter, data connection, expression, at the application. */
export type BindingKind = 'fixed' | 'parameter' | 'connection' | 'expression' | 'application';

export const bindingKinds: readonly BindingKind[] = [
  'fixed',
  'parameter',
  'connection',
  'expression',
  'application',
];

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

/** The groups of the element library (specification 5.2), in the order shown. */
export const groupIds = ['when', 'actions', 'market', 'indicators', 'trends', 'rules'] as const;
export type GroupId = (typeof groupIds)[number];

export type Scalar = string | number | boolean | null;

export type Choice = { id: string; label: Label };

/** The parameter or property applies only if the parameter or property `name` has the value `value`. */
export type Condition = { name: string; value: string };

export type ParameterDescription = {
  id: string;
  datatype: DataType;
  label: Label;
  explanation: Label;
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
  explanation: Label;
  must: boolean;
  setByUser: boolean;
  default: Scalar;
  choices: Choice[];
  /** The kinds of assignment the user may choose; all of them if the description names none. */
  bindings: BindingKind[];
  appliesWhen: Condition | null;
  objectType: string | null;
};

/** An output of an element of the flow. The management of the element hangs at the output with `holdsManagement`. */
export type OutputDescription = { id: string; label: Label; explanation: Label; holdsManagement: boolean };

export type TypeDescription = {
  id: string;
  kind: ElementKind;
  name: Label;
  description: Label;
  /** The short text shown when the entry is pointed at (specification 3.1). */
  explanation: Label;
  category: ObjectCategory | null;
  /** The group of the element library; `null` for a type that does not stand there. */
  group: GroupId | null;
  parameters: ParameterDescription[];
  properties: PropertyDescription[];
  outputs: OutputDescription[];
  /** An element of the flow has a name under which expressions address its result. */
  named: boolean;
  /** An object of the application: expressions address the strategy parameters through it. */
  strategyParameters: boolean;
  rulesAllowed: boolean;
  onCanvas: boolean;
  builtin: boolean;
  byUser: boolean;
};

/** One argument of a function with its label and explanation in trader language. */
export type FunctionArgument = {
  name: string;
  kind: string;
  optional: boolean;
  label: Label;
  explanation: Label;
};

export type FunctionDescription = {
  name: string;
  label: Label;
  explanation: Label;
  minArguments: number;
  maxArguments: number | null;
  /** The arguments in order; the last one repeats if `variadic` names a kind. */
  arguments: FunctionArgument[];
  variadic: string | null;
  result: string;
};

/**
 * A template document as the backend delivers it. Besides the fields used here it holds the whole content. A
 * delivered template names and explains itself in both languages (`label`, `explanation`), taken from
 * `template_texts` of the answer; `name` is the German name, the one that is stored in an instance of an own template.
 */
export type TemplateDocument = {
  id: string;
  name: string;
  description: string;
  object_type: string;
  label: Label;
  explanation: Label;
  [field: string]: unknown;
};

export type ElementTypesResponse = {
  types: TypeDescription[];
  templates: TemplateDocument[];
  functions: FunctionDescription[];
};

/** A flag that a description may leave out: it then counts as not set. */
function optionalBoolean(value: unknown, what: string): boolean {
  return value === undefined ? false : expectBoolean(value, what);
}

function parseLabel(value: unknown, what: string): Label {
  const record = expectRecord(value, what);
  return { de: expectString(record.de, `${what}.de`), en: expectString(record.en, `${what}.en`) };
}

/** A label that a description may leave out: the empty text then. */
function optionalLabel(value: unknown, what: string): Label {
  return value === undefined || value === null ? { de: '', en: '' } : parseLabel(value, what);
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

function parseBindingKinds(value: unknown, what: string): BindingKind[] {
  return expectArray(value, what).map((kind) => {
    if (typeof kind === 'string' && (bindingKinds as readonly string[]).includes(kind)) {
      return kind as BindingKind;
    }
    throw new ResponseFormatError(what);
  });
}

function parseParameter(value: unknown, what: string): ParameterDescription {
  const record = expectRecord(value, what);
  return {
    id: expectString(record.id, `${what}.id`),
    datatype: parseDataType(record.datatype, `${what}.datatype`),
    label: parseLabel(record.label, `${what}.label`),
    explanation: optionalLabel(record.explanation, `${what}.explanation`),
    required: expectBoolean(record.required, `${what}.required`),
    default: parseScalar(record.default, `${what}.default`),
    choices: parseChoices(record.choices, `${what}.choices`),
    bindings: parseBindingKinds(record.bindings, `${what}.bindings`),
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
    explanation: optionalLabel(record.explanation, `${what}.explanation`),
    must: expectBoolean(record.must, `${what}.must`),
    setByUser: expectBoolean(record.set_by_user, `${what}.set_by_user`),
    default: parseScalar(record.default, `${what}.default`),
    choices: parseChoices(record.choices, `${what}.choices`),
    bindings:
      record.bindings === undefined
        ? [...bindingKinds]
        : parseBindingKinds(record.bindings, `${what}.bindings`),
    appliesWhen: parseCondition(record.applies_when, `${what}.applies_when`),
    objectType: expectNullableString(record.object_type, `${what}.object_type`),
  };
}

function parseGroup(value: unknown, what: string): GroupId | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' && (groupIds as readonly string[]).includes(value)) {
    return value as GroupId;
  }
  throw new ResponseFormatError(what);
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
  const description = parseLabel(record.description, `${what}.description`);
  const explanation = optionalLabel(record.explanation, `${what}.explanation`);
  return {
    id: expectString(record.id, `${what}.id`),
    kind: kind as ElementKind,
    name: parseLabel(record.name, `${what}.name`),
    description,
    explanation: explanation.de === '' && explanation.en === '' ? description : explanation,
    category: (category ?? null) as ObjectCategory | null,
    group: parseGroup(record.group, `${what}.group`),
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
        explanation: optionalLabel(output.explanation, `${what}.outputs[${index}].explanation`),
        holdsManagement: optionalBoolean(output.holds_management, `${what}.outputs[${index}].holds_management`),
      };
    }),
    named: optionalBoolean(record.named, `${what}.named`),
    strategyParameters: optionalBoolean(record.strategy_parameters, `${what}.strategy_parameters`),
    rulesAllowed: expectBoolean(record.rules_allowed, `${what}.rules_allowed`),
    onCanvas: expectBoolean(record.on_canvas, `${what}.on_canvas`),
    builtin: expectBoolean(record.builtin, `${what}.builtin`),
    byUser: expectBoolean(record.by_user, `${what}.by_user`),
  };
}

/** A name that is a text or a text in both languages. */
function parseBilingualName(value: unknown, what: string): Label {
  if (typeof value === 'string') {
    return { de: value, en: value };
  }
  return parseLabel(value, what);
}

/** The texts a delivered template shows, by template identifier (`template_texts` of the answer). */
type TemplateTexts = { name: Label; explanation: Label };

function parseTemplateTexts(value: unknown): Map<string, TemplateTexts> {
  const texts = new Map<string, TemplateTexts>();
  if (value === undefined || value === null) {
    return texts;
  }
  expectArray(value, 'template_texts').forEach((item, index) => {
    const record = expectRecord(item, `template_texts[${index}]`);
    texts.set(expectString(record.id, `template_texts[${index}].id`), {
      name: parseLabel(record.name, `template_texts[${index}].name`),
      explanation: parseLabel(record.explanation, `template_texts[${index}].explanation`),
    });
  });
  return texts;
}

function parseTemplate(value: unknown, what: string, texts: ReadonlyMap<string, TemplateTexts>): TemplateDocument {
  const record = expectRecord(value, what);
  const id = expectString(record.id, `${what}.id`);
  expectString(record.object_type, `${what}.object_type`);
  const delivered = texts.get(id);
  const label = delivered?.name ?? parseBilingualName(record.name ?? record.title, `${what}.name`);
  const description = typeof record.description === 'string' ? record.description : '';
  return {
    ...record,
    name: label.de,
    label,
    description,
    explanation: delivered?.explanation ?? { de: description, en: description },
  } as TemplateDocument;
}

function parseFunction(value: unknown, what: string): FunctionDescription {
  const record = expectRecord(value, what);
  const max = record.max_arguments;
  const name = expectString(record.name, `${what}.name`);
  const label = optionalLabel(record.label, `${what}.label`);
  const args = record.parameters === undefined ? [] : expectArray(record.parameters, `${what}.parameters`);
  return {
    name,
    label: label.de === '' && label.en === '' ? { de: name, en: name } : label,
    explanation: optionalLabel(record.explanation, `${what}.explanation`),
    minArguments: typeof record.min_arguments === 'number' ? record.min_arguments : 0,
    maxArguments: typeof max === 'number' ? max : null,
    arguments: args.map((item, index) => {
      const argument = expectRecord(item, `${what}.parameters[${index}]`);
      const argumentName = expectString(argument.name, `${what}.parameters[${index}].name`);
      const argumentLabel = optionalLabel(argument.label, `${what}.parameters[${index}].label`);
      return {
        name: argumentName,
        kind: typeof argument.kind === 'string' ? argument.kind : 'any',
        optional: argument.optional === true,
        label: argumentLabel.de === '' && argumentLabel.en === '' ? { de: argumentName, en: argumentName } : argumentLabel,
        explanation: optionalLabel(argument.explanation, `${what}.parameters[${index}].explanation`),
      };
    }),
    variadic: typeof record.variadic === 'string' ? record.variadic : null,
    result: typeof record.result === 'string' ? record.result : 'any',
  };
}

/** Checks the answer of `GET /api/v1/element-types` before it is used. */
export function parseElementTypes(value: unknown): ElementTypesResponse {
  const record = expectRecord(value, 'element types');
  const texts = parseTemplateTexts(record.template_texts);
  return {
    types: expectArray(record.types, 'types').map((item, index) => parseType(item, `types[${index}]`)),
    templates: expectArray(record.templates, 'templates').map((item, index) =>
      parseTemplate(item, `templates[${index}]`, texts),
    ),
    functions: expectArray(record.functions, 'functions').map((item, index) =>
      parseFunction(item, `functions[${index}]`),
    ),
  };
}

export async function fetchElementTypes(signal?: AbortSignal): Promise<ElementTypesResponse> {
  return parseElementTypes(await requestJson('/api/v1/element-types', { signal }));
}
