import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseElementTypes, type ElementTypesResponse } from '../api/elementTypes';
import { createTypeIndex, type TypeIndex } from '../model/typeIndex';

/**
 * Type descriptions as `GET /api/v1/element-types` delivers them (a copy of the answer of the backend, kept in
 * `element-types.json` for the tests). Test data may name single types; the interface itself does not (specification E2).
 *
 * The copy is completed where an older copy lacks something the interface needs: the group of the element library, the
 * explanation, the kind of assignment "value of an object", the trigger "Start von Hand" and the indicator "ZigZag".
 * A copy that has these things stays as it is.
 */

type Json = Record<string, unknown>;

const GROUP_OF: Record<string, string> = {
  'trigger.candle_close': 'when',
  'trigger.tick': 'when',
  'trigger.manual_start': 'when',
  'flow.condition': 'actions',
  'flow.calculation': 'actions',
  'flow.set_parameter': 'actions',
  'flow.place_order': 'actions',
  'flow.modify_order': 'actions',
  'flow.delete_order': 'actions',
  'flow.modify_position': 'actions',
  'flow.close_position': 'actions',
  Konto: 'market',
  Instrument: 'market',
  Kerze: 'market',
  Tick: 'market',
  Indikator: 'indicators',
  EMA: 'indicators',
  ATR: 'indicators',
  ZigZag: 'indicators',
  Markttechnik: 'trends',
  Trend: 'trends',
  Regel: 'rules',
  Regelwerk: 'rules',
};

/** Names in the language of a trader (specification 3.1) where the older copy still has names of the programming. */
const NAMES: Record<string, { de: string; en: string }> = {
  'flow.set_parameter': { de: 'Strategieparameter ändern', en: 'Change strategy parameter' },
  Markttechnik: { de: '1-2-3-Trend (Markttechnik)', en: '1-2-3 trend (market technique)' },
  Indikator: { de: 'eigener Indikator', en: 'own indicator' },
  Trend: { de: 'eigener Trend', en: 'own trend' },
  Regel: { de: 'eigene Regel', en: 'own rule' },
  Regelwerk: { de: 'eigenes Regelwerk', en: 'own rule set' },
};

function readCopy(): Json {
  const here = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(here, 'element-types.json'), 'utf-8')) as Json;
}

function withConnection(entry: Json): Json {
  const bindings = entry.bindings;
  if (Array.isArray(bindings) && bindings.includes('parameter') && !bindings.includes('connection')) {
    const copy = [...(bindings as string[])];
    copy.splice(copy.indexOf('parameter') + 1, 0, 'connection');
    return { ...entry, bindings: copy };
  }
  return entry;
}

function completeType(type: Json): Json {
  const id = String(type.id);
  const description = type.description as { de: string; en: string };
  const group = 'group' in type ? type.group : (GROUP_OF[id] ?? null);
  const name = id in NAMES && !('group' in type) ? NAMES[id] : type.name;
  return {
    ...type,
    name,
    group,
    explanation: type.explanation ?? description,
    parameters: (type.parameters as Json[]).map((entry) => ({ explanation: description, ...withConnection(entry) })),
    properties: (type.properties as Json[]).map((entry) => ({ explanation: { de: '', en: '' }, ...entry })),
    outputs: (type.outputs as Json[]).map((output) => ({ explanation: output.label, ...output })),
  };
}

const MANUAL_START: Json = {
  id: 'trigger.manual_start',
  kind: 'trigger',
  name: { de: 'Start von Hand', en: 'Manual start' },
  description: { de: 'Startet die Auswertung auf Anforderung des Anwenders.', en: 'Starts the evaluation on request of the user.' },
  category: null,
  parameters: [],
  properties: [],
  outputs: [{ id: 'weiter', label: { de: 'weiter', en: 'next' }, holds_management: false }],
  rules_allowed: false,
  on_canvas: true,
  builtin: true,
  by_user: true,
  named: false,
  strategy_parameters: false,
};

/** The raw answer of the endpoint, completed (see above). */
export function typeDescriptionsJson(): Json {
  const copy = readCopy();
  const types = (copy.types as Json[]).map(completeType);
  if (!types.some((type) => type.id === 'trigger.manual_start')) {
    const at = types.findIndex((type) => type.id === 'trigger.tick');
    types.splice(at + 1, 0, completeType(MANUAL_START));
  }
  return { ...copy, types };
}

export function typeDescriptions(): ElementTypesResponse {
  return parseElementTypes(typeDescriptionsJson());
}

/** The type descriptions with their lookup, as the interface uses them. */
export function testTypes(): TypeIndex {
  return createTypeIndex(typeDescriptions());
}
