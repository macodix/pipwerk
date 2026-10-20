import { parseElementTypes } from '../api/elementTypes';
import { createTypeIndex, type TypeIndex } from '../model/typeIndex';
import { newUuid } from '../document/ids';
import { newStrategy } from '../document/build';
import type { ElementDocument, StrategyDocument } from '../document/types';

/**
 * Type descriptions that no mitgeliefert type of the product uses: the tests of the interface build the whole drawing
 * area, the library and the properties view from them and so show that the interface knows no single type (specification
 * E2). The groups are the identifiers of the specification, everything else is invented.
 */

const label = (de: string, en: string) => ({ de, en });

function parameter(id: string, datatype: string, de: string, en: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    datatype,
    label: label(de, en),
    explanation: label(`Erklärung ${de}`, `Explanation ${en}`),
    required: false,
    default: null,
    choices: [],
    bindings: ['fixed', 'parameter', 'connection', 'expression', 'application'],
    applies_when: null,
    object_type: null,
    ...extra,
  };
}

function property(id: string, datatype: string, de: string, en: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    datatype,
    label: label(de, en),
    explanation: label(`Erklärung ${de}`, `Explanation ${en}`),
    must: false,
    set_by_user: true,
    default: null,
    choices: [],
    bindings: ['fixed', 'parameter', 'connection', 'expression', 'application'],
    applies_when: null,
    object_type: null,
    ...extra,
  };
}

function type(id: string, kind: string, de: string, en: string, extra: Record<string, unknown>) {
  return {
    id,
    kind,
    name: label(de, en),
    description: label(`Beschreibung ${de}`, `Description ${en}`),
    explanation: label(`Erklärung ${de}`, `Explanation ${en}`),
    category: null,
    group: null,
    parameters: [],
    properties: [],
    outputs: [],
    rules_allowed: false,
    on_canvas: true,
    builtin: true,
    by_user: true,
    named: false,
    strategy_parameters: false,
    ...extra,
  };
}

const next = [{ id: 'next', label: label('weiter', 'next'), explanation: label('', ''), holds_management: false }];

export const inventedTypesJson = {
  types: [
    type('zz.start', 'trigger', 'Beginn', 'Start', {
      group: 'when',
      parameters: [parameter('takt', 'time_unit', 'Takt', 'Beat', { required: true, choices: [{ id: 'fast', label: label('schnell', 'fast') }, { id: 'slow', label: label('langsam', 'slow') }], bindings: ['fixed', 'parameter', 'connection'] })],
      outputs: next,
    }),
    type('zz.when', 'flow', 'Weiche', 'Switch', {
      group: 'actions',
      named: true,
      parameters: [parameter('formel', 'expression', 'Formel', 'Formula', { required: true, bindings: ['expression'] })],
      properties: [property('ausgang', 'boolean', 'Ausgang', 'Result', { must: true })],
      outputs: [
        { id: 'yes', label: label('ja', 'yes'), explanation: label('', ''), holds_management: false },
        { id: 'no', label: label('nein', 'no'), explanation: label('', ''), holds_management: false },
      ],
    }),
    type('zz.do', 'flow', 'Tun', 'Do', {
      group: 'actions',
      parameters: [parameter('menge', 'number', 'Menge', 'Amount', { default: 1 })],
      outputs: next,
    }),
    type('zz.place', 'flow', 'Ausführen', 'Execute', {
      group: 'actions',
      rules_allowed: true,
      parameters: [
        parameter('sorte', 'choice', 'Sorte', 'Kind', {
          required: true,
          choices: [
            { id: 'zz.kind_a', label: label('Sorte A', 'Kind A') },
            { id: 'zz.kind_b', label: label('Sorte B', 'Kind B') },
          ],
          bindings: ['fixed'],
        }),
      ],
      outputs: [
        { id: 'done', label: label('erledigt', 'done'), explanation: label('', ''), holds_management: true },
        { id: 'failed', label: label('misslungen', 'failed'), explanation: label('', ''), holds_management: false },
      ],
    }),
    type('zz.kind_a', 'order_type', 'Sorte A', 'Kind A', {
      on_canvas: false,
      properties: [
        property('wunsch', 'text', 'Wunsch', 'Wish', { must: true }),
        property('stufe', 'choice', 'Stufe', 'Level', { default: 'low', choices: [{ id: 'low', label: label('niedrig', 'low') }, { id: 'high', label: label('hoch', 'high') }] }),
      ],
    }),
    type('zz.kind_b', 'order_type', 'Sorte B', 'Kind B', {
      on_canvas: false,
      properties: [property('wunsch', 'text', 'Wunsch', 'Wish', { must: true }), property('extra', 'number', 'Extra', 'Extra', { default: 5 })],
    }),
    type('zz.world', 'application_object', 'Welt', 'World', {
      group: 'market',
      properties: [property('wetter', 'text', 'Wetter', 'Weather'), property('temperatur', 'number', 'Temperatur', 'Temperature')],
    }),
    type('zz.meter', 'object_type', 'Messer', 'Meter', {
      group: 'indicators',
      category: 'indicator',
      parameters: [
        parameter('takt', 'time_unit', 'Takt', 'Beat', { required: true, choices: [{ id: 'fast', label: label('schnell', 'fast') }, { id: 'slow', label: label('langsam', 'slow') }] }),
        parameter('laenge', 'integer', 'Länge', 'Length', { required: true }),
        parameter('ziel', 'object', 'Ziel', 'Target', { object_type: 'zz.target', default: 'zz.own_target', choices: [{ id: 'zz.own_target', label: label('das eigene Ziel', 'the own target') }] }),
      ],
      properties: [property('stand', 'number', 'Stand', 'Reading', { must: true }), property('trend', 'text', 'Tendenz', 'Tendency'), property('hoch', 'number', 'Höchststand', 'Peak'), property('tief', 'number', 'Tiefststand', 'Low')],
    }),
    type('zz.chain', 'object_type', 'Kette', 'Chain', {
      group: 'trends',
      category: 'trend',
      parameters: [parameter('takt', 'time_unit', 'Takt', 'Beat', { required: true })],
      properties: [property('richtung', 'text', 'Richtung', 'Direction', { must: true })],
    }),
    type('zz.rule', 'object_type', 'Regel', 'Rule', { group: 'rules', category: 'rule', on_canvas: false }),
    type('zz.ruleset', 'object_type', 'Regelsatz', 'Rule set', { group: 'rules', category: 'ruleset', on_canvas: false }),
  ],
  templates: [
    {
      id: 'tpl-1',
      name: { de: 'Vorgabe Regel', en: 'Rule template' },
      description: 'Eine mitgelieferte Regel.',
      object_type: 'zz.rule',
      format: 'pipwerk.rule',
      format_version: '2.0',
      parameter_values: {},
      parameters: [],
      properties: [],
      instances: [],
      rules: [],
      expression: 'x',
      determined_property: null,
      comparison: null,
      result_expression: null,
    },
  ],
  functions: [],
};

export function inventedTypes(): TypeIndex {
  return createTypeIndex(parseElementTypes(inventedTypesJson));
}

/** An element of the flow for the tests: all fields a document needs. */
export function stepElement(type: string, name: string, extra: Partial<ElementDocument> = {}): ElementDocument {
  return {
    id: newUuid(),
    type,
    name,
    key: null,
    position: null,
    parameters: {},
    properties: {},
    inputs: [],
    rules: [],
    management_of: null,
    ...extra,
  };
}

/** An element that shows an object of the invented meter. */
export function meterElement(name: string, key: string, extra: Partial<ElementDocument> = {}): ElementDocument {
  return stepElement('zz.meter', '', {
    name: null,
    instance: {
      name,
      key,
      object_type: 'zz.meter',
      origin: { object_type: 'zz.meter', template_id: null },
      parameter_values: { takt: { kind: 'fixed', value: 'fast' }, laenge: { kind: 'fixed', value: 10 } },
      parameters: [],
      properties: [],
      instances: [],
      rules: [],
    },
    ...extra,
  });
}

/** A small strategy of the invented types: a start, a switch and an action in the main flow, an execution with a management. */
export function inventedStrategy(): StrategyDocument {
  const document = newStrategy('Erfundene Strategie');
  const start = stepElement('zz.start', 'Beginn', { parameters: { takt: { kind: 'fixed', value: 'fast' } } });
  const when = stepElement('zz.when', 'Weiche', { key: 'weiche', parameters: { formel: { kind: 'expression', value: 'messer.stand > 1' } } });
  const doIt = stepElement('zz.do', 'Tun');
  const place = stepElement('zz.place', 'Ausführen', { parameters: { sorte: { kind: 'fixed', value: 'zz.kind_a' } } });
  const inside = stepElement('zz.start', 'Beginn innen', { management_of: place.id, parameters: { takt: { kind: 'fixed', value: 'slow' } } });
  const insideDo = stepElement('zz.do', 'Tun innen', { management_of: place.id });
  const meter = meterElement('Messer', 'messer');
  document.elements = [meter, start, when, doIt, place, inside, insideDo];
  document.connections = [
    { id: newUuid(), source: start.id, output: 'next', target: when.id },
    { id: newUuid(), source: when.id, output: 'yes', target: doIt.id },
    { id: newUuid(), source: doIt.id, output: 'next', target: place.id },
    { id: newUuid(), source: inside.id, output: 'next', target: insideDo.id },
  ];
  return document;
}
