import type {
  BindingKind,
  Choice,
  DataType,
  ElementKind,
  ElementTypesResponse,
  Label,
  OutputDescription,
  ParameterDescription,
  PropertyDescription,
  TypeDescription,
} from '../api/elementTypes';
import { createTypeIndex } from '../model/typeIndex';

/**
 * Types that the user interface cannot know: they exist only here. Tests build
 * the library, the elements and the property view from them to show that the
 * interface needs nothing but the type descriptions (specification E2).
 */

export function label(de: string, en = de): Label {
  return { de, en };
}

const allBindings: BindingKind[] = ['fixed', 'parameter', 'expression', 'application'];

export function parameter(
  id: string,
  datatype: DataType,
  options: Partial<ParameterDescription> = {},
): ParameterDescription {
  return {
    id,
    datatype,
    label: label(`${id} (de)`, `${id} (en)`),
    required: false,
    default: null,
    choices: [],
    bindings: allBindings,
    appliesWhen: null,
    objectType: null,
    ...options,
  };
}

export function property(
  id: string,
  datatype: DataType,
  options: Partial<PropertyDescription> = {},
): PropertyDescription {
  return {
    id,
    datatype,
    label: label(`${id} (de)`, `${id} (en)`),
    must: false,
    setByUser: true,
    default: null,
    choices: [],
    appliesWhen: null,
    objectType: null,
    ...options,
  };
}

/** An output of an element of the flow; `holdsManagement` marks the one the management hangs at. */
export function output(id: string, de: string, en = de, holdsManagement = false): OutputDescription {
  return { id, label: label(de, en), holdsManagement };
}

/** The time units of the invented descriptions: not those of any real type. */
export const inventedTimeUnits: Choice[] = [
  { id: 'qq1', label: label('QQ1') },
  { id: 'qq7', label: label('QQ7') },
];

export function choices(...ids: string[]): Choice[] {
  return ids.map((id) => ({ id, label: label(`${id} (de)`, `${id} (en)`) }));
}

export function typeOf(
  id: string,
  kind: ElementKind,
  options: Partial<TypeDescription> = {},
): TypeDescription {
  return {
    id,
    kind,
    name: label(`${id} (de)`, `${id} (en)`),
    description: label(`${id} beschreibt`, `${id} describes`),
    category: null,
    parameters: [],
    properties: [],
    outputs: [],
    named: false,
    strategyParameters: false,
    rulesAllowed: false,
    onCanvas: true,
    builtin: false,
    byUser: true,
    ...options,
  };
}

export const inventedList: TypeDescription[] = [
  typeOf('zz.pulse', 'trigger', {
    outputs: [output('go', 'los', 'go')],
    parameters: [parameter('period', 'time_unit', { required: true, choices: inventedTimeUnits })],
  }),
  typeOf('zz.gate', 'flow', {
    named: true,
    outputs: [output('yes', 'ja', 'yes'), output('no', 'nein', 'no'), output('maybe', 'vielleicht', 'maybe')],
    parameters: [
      parameter('formula', 'expression', { required: true, bindings: ['expression'] }),
      parameter('limit', 'percent'),
      parameter('count', 'integer', { default: 3 }),
      parameter('flag', 'boolean'),
      parameter('note', 'text'),
      parameter('mode', 'choice', { choices: choices('fast', 'slow'), default: 'fast' }),
      parameter('since', 'timestamp', { appliesWhen: { name: 'mode', value: 'slow' } }),
      parameter('day', 'date'),
    ],
    properties: [property('verdict', 'boolean')],
  }),
  typeOf('zz.launch', 'flow', {
    outputs: [output('refused', 'abgelehnt', 'refused'), output('sent', 'gesendet', 'sent', true)],
    parameters: [
      parameter('shape', 'choice', {
        required: true,
        bindings: ['fixed'],
        choices: choices('ZzOrderA', 'ZzOrderB'),
      }),
    ],
    rulesAllowed: true,
  }),
  typeOf('zz.sweep', 'flow', { outputs: [output('next', 'weiter', 'next')] }),
  typeOf('ZzOrderA', 'order_type', {
    onCanvas: false,
    properties: [
      property('serial', 'text', { setByUser: false, must: true }),
      property('amount', 'number', { must: true }),
      property('reason', 'text'),
    ],
  }),
  typeOf('ZzOrderB', 'order_type', {
    onCanvas: false,
    properties: [property('amount', 'number', { must: true }), property('trigger_price', 'number')],
  }),
  typeOf('Zork', 'object_type', {
    category: 'indicator',
    parameters: [
      parameter('size', 'integer', { required: true }),
      parameter('unit', 'time_unit', { required: true, choices: inventedTimeUnits }),
    ],
    properties: [property('level', 'number', { setByUser: false })],
  }),
  typeOf('Planet', 'application_object', {
    strategyParameters: true,
    properties: [property('mass', 'number', { setByUser: false })],
  }),
  typeOf('ZzRule', 'object_type', { category: 'rule', onCanvas: false }),
  typeOf('ZzRuleset', 'object_type', { category: 'ruleset', onCanvas: false }),
];

export function inventedResponse(): ElementTypesResponse {
  return {
    types: inventedList,
    templates: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Zz limit',
        description: 'A rule template',
        object_type: 'ZzRule',
        parameter_values: {},
        parameters: [{ name: 'cap', datatype: 'number', required: true, default: 5, choices: [] }],
        properties: [],
        instances: [],
        rules: [],
        expression: 'cap',
        determined_property: null,
        comparison: null,
        result_expression: null,
      },
    ],
    functions: [],
  };
}

export const inventedTypes = createTypeIndex(inventedResponse());

/** The same descriptions as the backend sends them (the field names of the wire), for tests that run the application. */
export function inventedWire(): Record<string, unknown> {
  const condition = (value: { name: string; value: string } | null) => value;
  return {
    types: inventedList.map((type) => ({
      id: type.id,
      kind: type.kind,
      name: type.name,
      description: type.description,
      category: type.category,
      parameters: type.parameters.map((parameter) => ({
        id: parameter.id,
        datatype: parameter.datatype,
        label: parameter.label,
        required: parameter.required,
        default: parameter.default,
        choices: parameter.choices,
        bindings: parameter.bindings,
        applies_when: condition(parameter.appliesWhen),
        object_type: parameter.objectType,
      })),
      properties: type.properties.map((property) => ({
        id: property.id,
        datatype: property.datatype,
        label: property.label,
        must: property.must,
        set_by_user: property.setByUser,
        default: property.default,
        choices: property.choices,
        applies_when: condition(property.appliesWhen),
        object_type: property.objectType,
      })),
      outputs: type.outputs.map((output) => ({
        id: output.id,
        label: output.label,
        holds_management: output.holdsManagement,
      })),
      named: type.named,
      strategy_parameters: type.strategyParameters,
      rules_allowed: type.rulesAllowed,
      on_canvas: type.onCanvas,
      builtin: type.builtin,
      by_user: type.byUser,
    })),
    templates: inventedResponse().templates,
    functions: [],
  };
}
