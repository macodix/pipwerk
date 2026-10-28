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

/**
 * The groups of the element library that the interface has names for (specification 5.2), in the order shown. A group
 * value that is not in this list does not stop anything: the library shows such a group behind the known ones.
 */
export const groupIds = ['flow', 'calculation', 'indicators', 'trends', 'market', 'account', 'actions', 'rules'] as const;

/** The identifier of a group as the type descriptions deliver it: a text, also one that is not in `groupIds`. */
export type GroupId = string;

export type Scalar = string | number | boolean | null;

export type Choice = { id: string; label: Label };

/** The parameter or property applies only if the parameter or property `name` has the value `value`. */
export type Condition = { name: string; value: string };

export type ParameterDescription = {
  id: string;
  datatype: DataType;
  /** The word for the data type in trader language (specification 3.1); for an object the name of its object type. */
  datatypeLabel: Label;
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
  datatypeLabel: Label;
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

/** An argument of a method (specification 3.1). Optional arguments carry their standard value in `default`. */
export type ArgumentDescription = {
  id: string;
  datatype: DataType;
  datatypeLabel: Label;
  label: Label;
  explanation: Label;
  required: boolean;
  default: Scalar;
  choices: Choice[];
  objectType: string | null;
};

/**
 * A method of a type (specification 3.1): an expression addresses it as `Object.Method(Arguments)`. The data type is
 * the one of the result; the arguments stand in their order, the mandatory ones first.
 */
export type MethodDescription = {
  id: string;
  datatype: DataType;
  datatypeLabel: Label;
  label: Label;
  explanation: Label;
  choices: Choice[];
  objectType: string | null;
  arguments: ArgumentDescription[];
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
  /** The methods of the type; none for the delivered types. */
  methods: MethodDescription[];
  /** Whether a use of an instance of the type can choose "Aktualisieren" (specification 3.1). */
  canRefresh: boolean;
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
 * `group` is the group of the element library the answer names for the template; `null` if it names none.
 */
export type TemplateDocument = {
  id: string;
  name: string;
  description: string;
  object_type: string;
  label: Label;
  explanation: Label;
  group: GroupId | null;
  [field: string]: unknown;
};

/** A data type with its word in trader language in both languages (`data_types` of the answer). */
export type DataTypeWord = { id: string; label: Label };

export type ElementTypesResponse = {
  /** The words for the data types; for `object` the general word. */
  dataTypes: DataTypeWord[];
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
    datatypeLabel: optionalLabel(record.datatype_label, `${what}.datatype_label`),
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
    datatypeLabel: optionalLabel(record.datatype_label, `${what}.datatype_label`),
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

/** A group is a text; one the interface has no name for is kept (the library shows it behind the known ones). */
function parseGroup(value: unknown, what: string): GroupId | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  throw new ResponseFormatError(what);
}

function parseArgument(value: unknown, what: string): ArgumentDescription {
  const record = expectRecord(value, what);
  return {
    id: expectString(record.id, `${what}.id`),
    datatype: parseDataType(record.datatype, `${what}.datatype`),
    datatypeLabel: optionalLabel(record.datatype_label, `${what}.datatype_label`),
    label: parseLabel(record.label, `${what}.label`),
    explanation: optionalLabel(record.explanation, `${what}.explanation`),
    required: expectBoolean(record.required, `${what}.required`),
    default: parseScalar(record.default, `${what}.default`),
    choices: record.choices === undefined ? [] : parseChoices(record.choices, `${what}.choices`),
    objectType: record.object_type === undefined ? null : expectNullableString(record.object_type, `${what}.object_type`),
  };
}

function parseMethod(value: unknown, what: string): MethodDescription {
  const record = expectRecord(value, what);
  return {
    id: expectString(record.id, `${what}.id`),
    datatype: parseDataType(record.datatype, `${what}.datatype`),
    datatypeLabel: optionalLabel(record.datatype_label, `${what}.datatype_label`),
    label: parseLabel(record.label, `${what}.label`),
    explanation: optionalLabel(record.explanation, `${what}.explanation`),
    choices: record.choices === undefined ? [] : parseChoices(record.choices, `${what}.choices`),
    objectType: record.object_type === undefined ? null : expectNullableString(record.object_type, `${what}.object_type`),
    arguments:
      record.arguments === undefined
        ? []
        : expectArray(record.arguments, `${what}.arguments`).map((item, index) =>
            parseArgument(item, `${what}.arguments[${index}]`),
          ),
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
    methods:
      record.methods === undefined
        ? []
        : expectArray(record.methods, `${what}.methods`).map((item, index) => parseMethod(item, `${what}.methods[${index}]`)),
    canRefresh: optionalBoolean(record.can_refresh, `${what}.can_refresh`),
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
type TemplateTexts = { name: Label; explanation: Label; group: GroupId | null };

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
      group: parseGroup(record.group, `template_texts[${index}].group`),
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
    group: delivered?.group ?? null,
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
    dataTypes:
      record.data_types === undefined
        ? []
        : expectArray(record.data_types, 'data_types').map((item, index) => {
            const word = expectRecord(item, `data_types[${index}]`);
            return {
              id: expectString(word.id, `data_types[${index}].id`),
              label: parseLabel(word.label, `data_types[${index}].label`),
            };
          }),
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
