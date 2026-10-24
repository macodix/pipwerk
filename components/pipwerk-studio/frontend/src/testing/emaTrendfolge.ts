/**
 * The strategy "EMA-Trendfolge" of the client as the backend delivers it after reading the saved file of the first
 * version and converting it to format 2.0 (specification 3.7): names from the old titles, identifiers in expressions
 * from the old names, no places. The identifiers of elements are those of the saved file.
 */

type Json = Record<string, unknown>;

const RISK_TEMPLATE = '7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645';

const EL = {
  ema20: '776256fe-8759-4525-a057-7428378f1f91',
  ema50: '39560eb8-d6dd-4303-8ef7-5bfcad0ba3aa',
  atr14: '5ff9693c-b31f-4bb3-9a26-88ba56562866',
  trigger: '4ce7e841-b694-4c02-bb63-e9b2fe4412b7',
  cross: 'c96cde02-2ecb-4e96-b585-7793c63f774b',
  direction: '4ff9b125-29de-4306-b885-5a476fcd801b',
  stop: '0c5250e9-60b0-4411-b048-fbb09d576142',
  order: '6e1b69c0-4145-4418-9e82-c391fba71b45',
  mgmtTrigger: '930ec007-6856-4012-8a9b-5940cef22bda',
  executed: '0ac5b522-92bb-4c75-8e79-5e761c28669e',
  crossAgainst: '4310688f-0fd1-42f6-866b-b3e3c3da3beb',
  closePosition: '31b718fb-a505-45ce-80f5-e5e815140494',
  newStop: '352a7cbb-a41c-41c8-ab04-468e143364eb',
  improved: '905bce8e-4e14-4d01-9f5c-96eec7196bc3',
  modifyPosition: '24dd5647-172a-49fd-88b1-f8a675925fba',
} as const;

export const EMA_STRATEGY_ID = '7209de70-2fdc-49fc-a242-33251216ed22';
export const EMA_ELEMENT_IDS = EL;

function indicator(id: string, name: string, key: string, type: string, values: Json): Json {
  return {
    id,
    type,
    name: null,
    key: null,
    position: null,
    parameters: {},
    properties: {},
    inputs: [],
    rules: [],
    management_of: null,
    instance: {
      name,
      key,
      object_type: type,
      origin: { object_type: type, template_id: null },
      first_use: null,
      parameter_values: values,
      parameters: [],
      properties: [],
      instances: [],
      rules: [],
      expression: null,
      determined_property: null,
      comparison: null,
      result_expression: null,
    },
  };
}

function step(id: string, type: string, name: string, key: string | null, parameters: Json, managementOf: string | null, extra: Json = {}): Json {
  return {
    id,
    type,
    name,
    key,
    position: null,
    parameters,
    properties: {},
    inputs: [],
    rules: [],
    management_of: managementOf,
    instance: null,
    ...extra,
  };
}

const expression = (text: string): Json => ({ ausdruck: { kind: 'expression', value: text } });
const timeUnit = { zeiteinheit: { kind: 'parameter', value: 'zeiteinheit' } };

let counter = 0;
function connection(source: string, output: string, target: string): Json {
  counter += 1;
  return { id: `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`, source, output, target };
}

/** The document of "EMA-Trendfolge" in format 2.0. */
export function emaTrendfolge(): Json {
  counter = 0;
  return {
    format: 'pipwerk.strategy',
    format_version: '2.0',
    id: EMA_STRATEGY_ID,
    name: 'EMA-Trendfolge',
    description: 'emma ist die 2 EMA Strategie',
    parameters: [
      { key: 'zeiteinheit', name: 'Zeiteinheit', datatype: 'time_unit', value: 'm15', at_application: false, choices: [] },
      { key: 'stop_abstand', name: 'Stop abstand', datatype: 'number', value: 0, at_application: false, choices: [] },
    ],
    rules: [
      {
        name: 'Risiko je trade',
        key: 'risiko_je_trade',
        object_type: 'Regel',
        origin: { object_type: 'Regel', template_id: RISK_TEMPLATE },
        parameter_values: { risikogrenze: { kind: 'fixed', value: 0.01 } },
        parameters: [{ key: 'risikogrenze', name: 'Risikogrenze', datatype: 'percent', required: true, default: 0.01, choices: [] }],
        properties: [],
        instances: [],
        rules: [],
        expression: 'Order.volumen',
        determined_property: 'volumen',
        comparison: 'hoechstens',
        result_expression: null,
      },
    ],
    elements: [
      indicator(EL.ema20, 'EMA20', 'ema20', 'EMA', {
        anwenden_auf: { kind: 'fixed', value: 'schlusskurs' },
        zeiteinheit: { kind: 'parameter', value: 'zeiteinheit' },
        periode: { kind: 'fixed', value: 20 },
      }),
      indicator(EL.ema50, 'EMA50', 'ema50', 'EMA', {
        verschiebung: { kind: 'fixed', value: 0 },
        anwenden_auf: { kind: 'fixed', value: 'schlusskurs' },
        zeiteinheit: { kind: 'parameter', value: 'zeiteinheit' },
        periode: { kind: 'fixed', value: 50 },
      }),
      indicator(EL.atr14, 'ATR14', 'atr14', 'ATR', {
        zeiteinheit: { kind: 'parameter', value: 'zeiteinheit' },
        periode: { kind: 'fixed', value: 14 },
      }),
      step(EL.trigger, 'trigger.candle_close', 'Kerzenschluss', null, timeUnit, null),
      step(
        EL.cross,
        'flow.condition',
        'Kreuzen',
        'kreuzen',
        expression(
          'OR(AND(PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert); AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))',
        ),
        null,
      ),
      step(EL.direction, 'flow.calculation', 'Richtung', 'richtung', expression('IF(ema20.wert > ema50.wert; "buy"; "sell")'), null),
      step(
        EL.stop,
        'flow.calculation',
        'StopLoss',
        'stop',
        expression(
          'IF(richtung.ergebnis = "buy"; Kerze.schluss - Strategie.stop_abstand * atr14.wert; Kerze.schluss + Strategie.stop_abstand * atr14.wert)',
        ),
        null,
      ),
      step(EL.order, 'flow.place_order', 'Order aufgeben', null, { ordertyp: { kind: 'fixed', value: 'MarketOrder' } }, null, {
        properties: {
          richtung: { kind: 'expression', value: 'richtung.ergebnis' },
          stop_loss: { kind: 'expression', value: 'stop.ergebnis' },
        },
        rules: [
          {
            name: 'Mindestvolumen',
            key: 'mindestvolumen',
            object_type: 'Regel',
            origin: { object_type: 'Regel', template_id: null },
            parameter_values: {},
            parameters: [],
            properties: [],
            instances: [],
            rules: [],
            expression: 'Order.volumen >= Instrument.mindestvolumen',
            determined_property: null,
            comparison: null,
            result_expression: null,
          },
        ],
      }),
      step(EL.mgmtTrigger, 'trigger.candle_close', 'Kerzenschluss', null, timeUnit, EL.order),
      step(EL.executed, 'flow.condition', 'Order ausgefuehrt', 'order_ausgefuehrt', expression('Order.status = "ausgefuehrt"'), EL.order),
      step(
        EL.crossAgainst,
        'flow.condition',
        'Kreuzen gegen die position',
        'kreuzen_gegen_die_position',
        expression(
          'OR(AND(Position.richtung = "buy"; PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert); AND(Position.richtung = "sell"; PREVIOUS(ema20.wert) <= PREVIOUS(ema50.wert); ema20.wert > ema50.wert))',
        ),
        EL.order,
      ),
      step(EL.closePosition, 'flow.close_position', 'Position schließen', null, {}, EL.order),
      step(
        EL.newStop,
        'flow.calculation',
        'Neuer Stop-Loss',
        'stop_neu',
        expression(
          'IF(Position.richtung = "buy"; Kerze.schluss - Strategie.stop_abstand * atr14.wert; Kerze.schluss + Strategie.stop_abstand * atr14.wert)',
        ),
        EL.order,
      ),
      step(
        EL.improved,
        'flow.condition',
        'StopLossVerbessert',
        'stop_loss_verbessert',
        expression('IF(Position.richtung = "buy"; stop_neu.ergebnis > Position.stop_loss; stop_neu.ergebnis < Position.stop_loss)'),
        EL.order,
      ),
      step(EL.modifyPosition, 'flow.modify_position', 'Position ändern', null, { stop_loss: { kind: 'expression', value: 'stop_neu.ergebnis' } }, EL.order),
    ],
    connections: [
      connection(EL.trigger, 'weiter', EL.cross),
      connection(EL.cross, 'wahr', EL.direction),
      connection(EL.direction, 'weiter', EL.stop),
      connection(EL.stop, 'weiter', EL.order),
      connection(EL.mgmtTrigger, 'weiter', EL.executed),
      connection(EL.executed, 'wahr', EL.crossAgainst),
      connection(EL.crossAgainst, 'wahr', EL.closePosition),
      connection(EL.crossAgainst, 'falsch', EL.newStop),
      connection(EL.newStop, 'weiter', EL.improved),
      connection(EL.improved, 'wahr', EL.modifyPosition),
    ],
    sections: [],
    orientation: 'vertical',
    collapsed_managements: [],
  };
}
