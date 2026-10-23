// Type descriptions of the prototype (simulated element register) with labels
// in German and English and short explanations in trader language.
import type { BindingKind, Choice, DType, El, GroupId, Lang, MethodDef, ParamDef, PropDef, TypeDef, Txt } from './model';

import { memberText } from './descriptions';

const t = (de: string, en: string): Txt => ({ de, en });
const ch = (id: string, de: string, en = de): Choice => ({ id, de, en });

export const TIME_UNITS: Choice[] = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M10', 'M12', 'M15', 'M20', 'M30',
  'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN1',
].map((u) => ch(u.toLowerCase(), u));

export const PRICE_SOURCES: Choice[] = [
  ch('schlusskurs', 'Schlusskurs', 'Close price'),
  ch('eroeffnungskurs', 'Eröffnungskurs', 'Open price'),
  ch('hoch', 'Hoch', 'High'),
  ch('tief', 'Tief', 'Low'),
  ch('medianpreis', 'Medianpreis', 'Median price'),
  ch('typischer_preis', 'Typischer Preis', 'Typical price'),
  ch('gewichteter_schlusskurs', 'Gewichteter Schlusskurs', 'Weighted close price'),
];

export const DIRECTION: Choice[] = [ch('buy', 'buy (Kauf)', 'buy'), ch('sell', 'sell (Verkauf)', 'sell')];
const VALIDITY: Choice[] = [
  ch('bis_auf_widerruf', 'bis auf Widerruf', 'good till cancelled'),
  ch('bis_tagesende', 'bis Tagesende', 'until end of day'),
  ch('bis_zeitpunkt', 'bis Zeitpunkt', 'until time'),
  ch('bis_ende_eines_tages', 'bis Ende eines Tages', 'until end of a given day'),
];
const ORDER_STATUS: Choice[] = [
  ch('wartend', 'wartend', 'pending'),
  ch('teilausgefuehrt', 'teilausgeführt', 'partially filled'),
  ch('ausgefuehrt', 'ausgeführt', 'filled'),
  ch('geloescht', 'gelöscht', 'deleted'),
  ch('abgelaufen', 'abgelaufen', 'expired'),
  ch('abgelehnt', 'abgelehnt', 'rejected'),
];
const TREND_DIR: Choice[] = [
  ch('aufwaerts', 'aufwärts', 'upwards'),
  ch('abwaerts', 'abwärts', 'downwards'),
  ch('kein_trend', 'kein Trend', 'no trend'),
];
const PHASE: Choice[] = [ch('bewegung', 'Bewegung', 'Movement'), ch('korrektur', 'Korrektur', 'Correction')];
const ZZ_KIND: Choice[] = [ch('hoch', 'Hoch', 'High'), ch('tief', 'Tief', 'Low')];

const ALL: BindingKind[] = ['fixed', 'param', 'ref', 'expr', 'app'];
const FIXPARAM: BindingKind[] = ['fixed', 'param'];

const prm = (
  id: string, de: string, en: string, dtype: DType,
  o: Partial<ParamDef> = {},
): ParamDef => ({ id, de, en, dtype, bindings: ALL, ...o });
const prp = (
  id: string, de: string, en: string, dtype: DType,
  o: Partial<PropDef> = {},
): PropDef => ({ id, de, en, dtype, ...o });

/** Assumed for the prototype: EMA and ATR return their value some candles ago (req-fach-055, open point). */
const VALUE_BEFORE: MethodDef = {
  id: 'wert_vor', de: 'Wert vor', en: 'Value before', dtype: 'number', defaults: [1],
  args: [{ id: 'anzahl', de: 'Anzahl Kerzen', en: 'Number of candles' }],
};

const P_TIME = prm('zeiteinheit', 'Zeiteinheit', 'Time unit', 'time_unit', { required: true, choices: TIME_UNITS });
const P_INSTR = prm('instrument', 'Instrument', 'Instrument', 'instrument', { def: 'app', bindings: ['app', 'param', 'fixed'] });
const O_NEXT = { id: 'weiter', de: 'weiter', en: 'next' };

// ---- order properties --------------------------------------------------------

const ORDER_PROPS: Record<string, PropDef> = {
  richtung: prp('richtung', 'Richtung', 'Direction', 'choice', { choices: DIRECTION, userSet: true, must: true }),
  volumen: prp('volumen', 'Volumen', 'Volume', 'number', { userSet: true, must: true }),
  preis: prp('preis', 'Preis', 'Price', 'number', { userSet: true, must: true }),
  limitpreis: prp('limitpreis', 'Limitpreis', 'Limit price', 'number', { userSet: true, must: true }),
  stop_loss: prp('stop_loss', 'Stop-Loss', 'Stop loss', 'number', { userSet: true }),
  take_profit: prp('take_profit', 'Take-Profit', 'Take profit', 'number', { userSet: true }),
  gueltigkeit: prp('gueltigkeit', 'Gültigkeit', 'Validity', 'choice', { choices: VALIDITY, userSet: true, must: true }),
  ablaufzeit: prp('ablaufzeit', 'Ablaufzeit', 'Expiry time', 'timestamp', {
    userSet: true, must: true, appliesWhen: { id: 'gueltigkeit', value: 'bis_zeitpunkt' },
  }),
  datum: prp('datum', 'Datum', 'Date', 'date', {
    userSet: true, must: true, appliesWhen: { id: 'gueltigkeit', value: 'bis_ende_eines_tages' },
  }),
  bemerkung: prp('bemerkung', 'Bemerkung', 'Remark', 'text', { userSet: true }),
};

export const ORDER_TYPES: Choice[] = [
  ch('MarketOrder', 'Marktorder', 'Market order'),
  ch('StopOrder', 'Stop-Order', 'Stop order'),
  ch('LimitOrder', 'Limit-Order', 'Limit order'),
  ch('StopLimitOrder', 'Stop-Limit-Order', 'Stop limit order'),
];

export function orderPropIds(orderType: string): string[] {
  switch (orderType) {
    case 'StopOrder':
    case 'LimitOrder':
      return ['richtung', 'volumen', 'preis', 'stop_loss', 'take_profit', 'gueltigkeit', 'ablaufzeit', 'datum', 'bemerkung'];
    case 'StopLimitOrder':
      return ['richtung', 'volumen', 'preis', 'limitpreis', 'stop_loss', 'take_profit', 'gueltigkeit', 'ablaufzeit', 'datum', 'bemerkung'];
    default:
      return ['richtung', 'volumen', 'stop_loss', 'take_profit', 'bemerkung'];
  }
}

// ---- types -------------------------------------------------------------------

function mkProps(): PropDef[] {
  return [
    prp('order_id', 'Order-ID', 'Order ID', 'text'),
    prp('status', 'Status', 'Status', 'choice', { choices: ORDER_STATUS }),
    prp('konto', 'Konto', 'Account', 'object'),
    prp('strategie_id', 'Strategie-ID', 'Strategy ID', 'text'),
    prp('bemerkung', 'Bemerkung', 'Remark', 'text'),
    prp('instrument', 'Instrument', 'Instrument', 'object'),
    prp('richtung', 'Richtung', 'Direction', 'choice', { choices: DIRECTION }),
    prp('volumen', 'Volumen', 'Volume', 'number'),
    prp('preis', 'Preis', 'Price', 'number'),
    prp('limitpreis', 'Limitpreis', 'Limit price', 'number'),
    prp('stop_loss', 'Stop-Loss', 'Stop loss', 'number'),
    prp('take_profit', 'Take-Profit', 'Take profit', 'number'),
    prp('gueltigkeit', 'Gültigkeit', 'Validity', 'choice', { choices: VALIDITY }),
  ];
}

function zigzagProps(): PropDef[] {
  const out: PropDef[] = [];
  const names: [string, string, string][] = [
    ['1', 'letzter Wendepunkt', 'latest turning point'],
    ['2', 'vorletzter Wendepunkt', 'second latest turning point'],
    ['3', 'drittletzter Wendepunkt', 'third latest turning point'],
  ];
  for (const [n, de, en] of names) {
    out.push(prp(`wp${n}_kurs`, `Kurs, ${de}`, `Price, ${en}`, 'number'));
    out.push(prp(`wp${n}_art`, `Hoch oder Tief, ${de}`, `High or low, ${en}`, 'choice', { choices: ZZ_KIND }));
    out.push(prp(`wp${n}_endgueltig`, `endgültig, ${de}`, `final, ${en}`, 'boolean'));
  }
  return out;
}

const defs: TypeDef[] = [
  {
    id: 'trigger.candle_close', kind: 'trigger', group: 'flow', icon: 'clock', de: 'Kerzenschluss', en: 'Candle close',
    params: [P_INSTR, P_TIME], props: [], outputs: [O_NEXT],
  },
  {
    id: 'trigger.tick', kind: 'trigger', group: 'flow', icon: 'bolt', de: 'Tick', en: 'Tick',
    params: [P_INSTR], props: [], outputs: [O_NEXT],
  },
  {
    id: 'flow.condition', kind: 'flow', group: 'flow', icon: 'diamond', de: 'Bedingung', en: 'Condition',
    params: [prm('ausdruck', 'Bedingung', 'Condition', 'expression', { required: true, bindings: ['expr'] })],
    props: [prp('ergebnis', 'Ergebnis', 'Result', 'boolean')],
    outputs: [{ id: 'wahr', de: 'wahr', en: 'true' }, { id: 'falsch', de: 'falsch', en: 'false' }], named: true,
  },
  {
    id: 'flow.connection', kind: 'tool', group: 'flow', icon: 'link', de: 'Verbindung', en: 'Connection',
    params: [], props: [], outputs: [],
  },
  {
    id: 'flow.calculation', kind: 'flow', group: 'calc', icon: 'calc', de: 'Berechnung', en: 'Calculation',
    params: [prm('ausdruck', 'Berechnung', 'Calculation', 'expression', { required: true, bindings: ['expr'] })],
    props: [prp('ergebnis', 'Ergebnis', 'Result', 'number')], outputs: [O_NEXT], named: true,
  },
  {
    id: 'flow.set_parameter', kind: 'flow', group: 'calc', icon: 'sliders', de: 'Strategieparameter ändern', en: 'Change strategy parameter',
    params: [
      prm('strategieparameter', 'Strategieparameter', 'Strategy parameter', 'text', { required: true, bindings: ['param'] }),
      prm('ausdruck', 'Neuer Wert', 'New value', 'expression', { required: true, bindings: ['expr'] }),
    ],
    props: [], outputs: [O_NEXT],
  },
  {
    id: 'flow.place_order', kind: 'flow', group: 'actions', icon: 'order', de: 'Order aufgeben', en: 'Place order',
    params: [prm('ordertyp', 'Ordertyp', 'Order type', 'choice', { required: true, choices: ORDER_TYPES, bindings: ['fixed'], def: 'MarketOrder' })],
    props: [],
    outputs: [
      { id: 'gestellt', de: 'gestellt', en: 'placed', management: true },
      { id: 'nicht_gestellt', de: 'nicht gestellt', en: 'not placed' },
    ],
    rulesAllowed: true,
  },
  {
    id: 'flow.modify_order', kind: 'flow', group: 'actions', icon: 'edit', de: 'Order ändern', en: 'Modify order',
    params: [
      prm('preis', 'Preis', 'Price', 'number'),
      prm('limitpreis', 'Limitpreis', 'Limit price', 'number'),
      prm('stop_loss', 'Stop-Loss', 'Stop loss', 'number'),
      prm('take_profit', 'Take-Profit', 'Take profit', 'number'),
      prm('gueltigkeit', 'Gültigkeit', 'Validity', 'choice', { choices: VALIDITY }),
      prm('ablaufzeit', 'Ablaufzeit', 'Expiry time', 'timestamp', { appliesWhen: { id: 'gueltigkeit', value: 'bis_zeitpunkt' } }),
      prm('datum', 'Datum', 'Date', 'date', { appliesWhen: { id: 'gueltigkeit', value: 'bis_ende_eines_tages' } }),
    ],
    props: [],
    outputs: [{ id: 'geaendert', de: 'geändert', en: 'changed' }, { id: 'nicht_geaendert', de: 'nicht geändert', en: 'not changed' }],
    rulesAllowed: true,
  },
  {
    id: 'flow.delete_order', kind: 'flow', group: 'actions', icon: 'trash', de: 'Order löschen', en: 'Delete order',
    params: [], props: [], outputs: [O_NEXT],
  },
  {
    id: 'flow.modify_position', kind: 'flow', group: 'actions', icon: 'edit', de: 'Position ändern', en: 'Modify position',
    params: [prm('stop_loss', 'Stop-Loss', 'Stop loss', 'number'), prm('take_profit', 'Take-Profit', 'Take profit', 'number')],
    props: [],
    outputs: [{ id: 'geaendert', de: 'geändert', en: 'changed' }, { id: 'nicht_geaendert', de: 'nicht geändert', en: 'not changed' }],
    rulesAllowed: true,
  },
  {
    id: 'flow.close_position', kind: 'flow', group: 'actions', icon: 'close', de: 'Position schließen', en: 'Close position',
    params: [prm('volumen', 'Volumen (leer: ganz schließen)', 'Volume (empty: close completely)', 'number')],
    props: [], outputs: [O_NEXT], rulesAllowed: true,
  },
  // objects of the application
  {
    id: 'Konto', kind: 'app', group: 'account', icon: 'wallet', de: 'Konto', en: 'Account', placeable: true, refresh: true, main: 'kapital',
    params: [],
    props: [
      prp('kapital', 'Kapital', 'Equity', 'number'),
      prp('freie_margin', 'freie Margin', 'Free margin', 'number'),
      prp('waehrung', 'Währung', 'Currency', 'text'),
    ],
    outputs: [],
  },
  {
    id: 'Instrument', kind: 'app', group: 'marketdata', icon: 'chart', de: 'Instrument', en: 'Instrument', placeable: true, refresh: true, main: 'spread',
    params: [P_INSTR],
    props: [
      prp('bezeichnung', 'Bezeichnung', 'Designation', 'text'),
      prp('tickgroesse', 'Tickgröße', 'Tick size', 'number'),
      prp('tickwert', 'Tickwert', 'Tick value', 'number'),
      prp('punkt', 'Punkt', 'Point', 'number'),
      prp('pip', 'Pip', 'Pip', 'number'),
      prp('spread', 'Spread', 'Spread', 'number'),
      prp('mindestvolumen', 'Mindestvolumen', 'Minimum volume', 'number'),
      prp('volumenschritt', 'Volumenschritt', 'Volume step', 'number'),
    ],
    outputs: [],
  },
  {
    id: 'Kerze', kind: 'app', group: 'marketdata', icon: 'candle', de: 'Kerze', en: 'Candle', placeable: true, refresh: true, main: 'schluss',
    params: [P_INSTR, P_TIME],
    props: [
      prp('eroeffnung', 'Eröffnung', 'Open', 'number'),
      prp('hoch', 'Hoch', 'High', 'number'),
      prp('tief', 'Tief', 'Low', 'number'),
      prp('schluss', 'Schluss', 'Close', 'number'),
      prp('volumen', 'Volumen', 'Volume', 'number'),
      prp('zeitpunkt', 'Zeitpunkt', 'Time', 'timestamp'),
    ],
    outputs: [],
  },
  {
    id: 'Tick', kind: 'app', group: 'marketdata', icon: 'dots', de: 'Tick', en: 'Tick', placeable: true, refresh: true, main: 'geld',
    params: [P_INSTR],
    props: [
      prp('geld', 'Geld', 'Bid', 'number'),
      prp('brief', 'Brief', 'Ask', 'number'),
      prp('zeitpunkt', 'Zeitpunkt', 'Time', 'timestamp'),
    ],
    outputs: [],
  },
  { id: 'Order', kind: 'app', group: 'marketdata', icon: 'order', de: 'Order', en: 'Order', params: [], props: mkProps(), outputs: [], refresh: true },
  {
    id: 'Position', kind: 'app', group: 'marketdata', refresh: true, icon: 'order', de: 'Position', en: 'Position', params: [],
    props: [
      prp('instrument', 'Instrument', 'Instrument', 'object'),
      prp('richtung', 'Richtung', 'Direction', 'choice', { choices: DIRECTION }),
      prp('volumen', 'Volumen', 'Volume', 'number'),
      prp('einstiegspreis', 'Einstiegspreis', 'Entry price', 'number'),
      prp('stop_loss', 'Stop-Loss', 'Stop loss', 'number'),
      prp('take_profit', 'Take-Profit', 'Take profit', 'number'),
      prp('offener_gewinn_oder_verlust', 'offener Gewinn oder Verlust', 'Open profit or loss', 'number'),
    ],
    outputs: [],
  },
  {
    id: 'Strategie', kind: 'app', group: 'marketdata', refresh: true, icon: 'sliders', de: 'Strategie', en: 'Strategy', params: [],
    props: [
      prp('bezeichnung', 'Name', 'Name', 'text'),
      prp('beschreibung', 'Beschreibung', 'Description', 'text'),
      prp('wartende_orders', 'wartende Orders', 'Pending orders', 'integer'),
      prp('offene_positionen', 'offene Positionen', 'Open positions', 'integer'),
    ],
    outputs: [],
  },
  // indicators
  {
    id: 'EMA', kind: 'indicator', group: 'indicators', icon: 'wave', de: 'EMA', en: 'EMA', refresh: true, main: 'wert', methods: [VALUE_BEFORE],
    params: [
      P_INSTR, P_TIME,
      prm('periode', 'Periode', 'Period', 'integer', { required: true }),
      prm('verschiebung', 'Verschiebung', 'Shift', 'integer', { def: 0 }),
      prm('kursquelle', 'Anwenden auf', 'Apply to', 'choice', { def: 'schlusskurs', choices: PRICE_SOURCES }),
    ],
    props: [prp('wert', 'Wert', 'Value', 'number')], outputs: [],
  },
  {
    id: 'ATR', kind: 'indicator', group: 'indicators', icon: 'wave', de: 'ATR', en: 'ATR', refresh: true, main: 'wert', methods: [VALUE_BEFORE],
    params: [P_INSTR, P_TIME, prm('periode', 'Periode', 'Period', 'integer', { required: true })],
    props: [prp('wert', 'Wert', 'Value', 'number')], outputs: [],
  },
  {
    id: 'ZigZag', kind: 'indicator', group: 'indicators', icon: 'zigzag', de: 'ZigZag', en: 'ZigZag', refresh: true, main: 'wp1_kurs',
    params: [
      P_INSTR, P_TIME,
      prm('depth', 'Depth', 'Depth', 'integer', { def: 12 }),
      prm('deviation', 'Deviation', 'Deviation', 'integer', { def: 5 }),
      prm('backstep', 'Backstep', 'Backstep', 'integer', { def: 3 }),
    ],
    props: zigzagProps(), outputs: [],
  },
  {
    id: 'Indikator', kind: 'indicator', group: 'indicators', icon: 'wave', de: 'Indikator', en: 'Indicator', own: true, refresh: true,
    params: [], props: [], outputs: [],
  },
  // trends
  {
    id: 'Markttechnik', kind: 'indicator', group: 'trends', icon: 'trend', de: '1-2-3-Trend (Markttechnik)', en: '1-2-3 trend (market technique)', refresh: true, main: 'trendrichtung',
    params: [
      P_INSTR, P_TIME,
      prm('depth', 'Depth', 'Depth', 'integer', { def: 12 }),
      prm('deviation', 'Deviation', 'Deviation', 'integer', { def: 5 }),
      prm('backstep', 'Backstep', 'Backstep', 'integer', { def: 3 }),
    ],
    props: [
      prp('trendrichtung', 'Trendrichtung', 'Trend direction', 'choice', { choices: TREND_DIR }),
      prp('trend_intakt', 'Trend intakt', 'Trend intact', 'boolean'),
      prp('phase', 'Phase', 'Phase', 'choice', { choices: PHASE }),
      prp('punkt_2', 'Punkt 2', 'Point 2', 'number'),
      prp('punkt_13', 'Punkt 1/3', 'Point 1/3', 'number'),
      prp('punkt_13_endgueltig', 'Punkt 1/3 endgültig', 'Point 1/3 final', 'boolean'),
    ],
    outputs: [],
  },
  {
    id: 'Trend', kind: 'trend', group: 'trends', icon: 'trend', de: 'Trend', en: 'Trend', own: true, refresh: true, main: 'richtung',
    params: [
      P_INSTR, P_TIME,
      prm('methode', 'Berechnungsverfahren', 'Calculation procedure', 'choice', {
        required: true, def: 'ausdruck', bindings: ['fixed'],
        choices: [ch('ausdruck', 'Ausdruck', 'Expression')],
      }),
    ],
    props: [prp('richtung', 'Richtung', 'Direction', 'text', { userSet: true, must: true })], outputs: [],
  },
  // rules
  { id: 'Regel', kind: 'rule', group: 'rules', icon: 'shield', de: 'Regel', en: 'Rule', own: true, params: [], props: [prp('ergebnis', 'Ergebnis', 'Result', 'boolean')], outputs: [] },
  { id: 'Regelwerk', kind: 'ruleset', group: 'rules', icon: 'layers', de: 'Regelwerk', en: 'Rule set', own: true, params: [], props: [prp('ergebnis', 'Gesamtergebnis', 'Total result', 'boolean')], outputs: [] },
];

export const TYPES: Record<string, TypeDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const TYPE_LIST = defs;

export function getType(id: string): TypeDef | undefined {
  return TYPES[id];
}

export const LIB_LABEL: Record<string, Txt> = {
  Indikator: t('eigener Indikator', 'own indicator'),
  Trend: t('eigener Trend', 'own trend'),
  Regel: t('eigene Regel', 'own rule'),
  Regelwerk: t('eigenes Regelwerk', 'own rule set'),
};

/** Groups of the element library (req-ui-018): by task, like the structure of a programming language. */
export const GROUPS: { id: GroupId; de: string; en: string }[] = [
  { id: 'flow', de: 'Ablaufsteuerung', en: 'Flow control' },
  { id: 'calc', de: 'Berechnung', en: 'Calculation' },
  { id: 'indicators', de: 'Indikatoren', en: 'Indicators' },
  { id: 'trends', de: 'Trends', en: 'Trends' },
  { id: 'marketdata', de: 'Marktdaten', en: 'Market data' },
  { id: 'account', de: 'Konto', en: 'Account' },
  { id: 'actions', de: 'Aktionen', en: 'Actions' },
  { id: 'rules', de: 'Regeln und Regelwerke', en: 'Rules and rule sets' },
];

/** Application objects that Order/Position-like expressions can address. */
export const APP_OBJECTS = ['Konto', 'Instrument', 'Kerze', 'Tick', 'Order', 'Position', 'Strategie'];
export const PLACEABLE_APP = ['Konto', 'Instrument', 'Kerze', 'Tick'];

export function tx(o: { de: string; en: string }, lang: Lang): string {
  return lang === 'en' ? o.en : o.de;
}

export function typeLabel(id: string, lang: Lang): string {
  const d = TYPES[id];
  return d ? tx(d, lang) : id;
}

export function isFlowEl(type: string): boolean {
  const d = TYPES[type];
  return !!d && (d.kind === 'trigger' || d.kind === 'flow');
}
export function isTrigger(type: string): boolean {
  return TYPES[type]?.kind === 'trigger';
}
export function isObjectEl(type: string): boolean {
  const d = TYPES[type];
  return !!d && (d.kind === 'indicator' || d.kind === 'trend' || d.kind === 'app');
}
export function isRuleType(type: string): boolean {
  const d = TYPES[type];
  return !!d && (d.kind === 'rule' || d.kind === 'ruleset');
}

// ---- unified fields -----------------------------------------------------------

export interface Field {
  id: string;
  de: string;
  en: string;
  dtype: DType;
  required: boolean;
  choices?: Choice[];
  bindings: BindingKind[];
  def?: string | number | boolean;
  appliesWhen?: { id: string; value: string };
  section: 'param' | 'order';
}

/** Parameters and user-set properties of an element or instance. */
export function fieldsOf(el: Pick<El, 'type' | 'bind' | 'own'>): Field[] {
  const d = TYPES[el.type];
  if (!d) return [];
  const out: Field[] = d.params.map((p) => ({
    id: p.id, de: p.de, en: p.en, dtype: p.dtype, required: !!p.required, choices: p.choices,
    bindings: p.bindings, def: p.def, appliesWhen: p.appliesWhen, section: 'param',
  }));
  if (el.type === 'flow.place_order') {
    const ot = String((el.bind.ordertyp as { v?: string } | undefined)?.v ?? 'MarketOrder');
    for (const id of orderPropIds(ot)) {
      const p = ORDER_PROPS[id];
      out.push({
        id: p.id, de: p.de, en: p.en, dtype: p.dtype, required: !!p.must, choices: p.choices, bindings: ALL,
        def: id === 'gueltigkeit' ? 'bis_auf_widerruf' : undefined, appliesWhen: p.appliesWhen, section: 'order',
      });
    }
  }
  if (el.own) {
    for (const op of el.own.params) {
      out.push({ id: `own:${op.id}`, de: op.name, en: op.name, dtype: op.dtype, required: false, bindings: ALL, def: op.def, section: 'param' });
    }
  }
  return out;
}

/** Properties an instance delivers (for output ports and the properties view). */
export function propsOf(el: Pick<El, 'type' | 'own' | 'name'>): (PropDef & { custom?: boolean })[] {
  const d = TYPES[el.type];
  if (!d) return [];
  const base = d.props.filter((p) => !(d.kind === 'trend' && p.id === 'richtung'));
  const out: (PropDef & { custom?: boolean })[] = [...base];
  if (d.kind === 'trend') out.push(...d.props.filter((p) => p.id === 'richtung'));
  if (el.own) {
    for (const op of el.own.props) {
      out.push({ id: `own:${op.id}`, de: op.name, en: op.name, dtype: op.dtype, custom: true });
    }
    for (const inc of el.own.includes) {
      const sub = TYPES[inc.tpl];
      if (sub) {
        for (const p of sub.props.slice(0, 3)) {
          out.push({ ...p, id: `inc:${inc.id}:${p.id}`, de: `${inc.name}: ${p.de}`, en: `${inc.name}: ${p.en}`, custom: true });
        }
      }
    }
  }
  return out;
}

export function propDef(objType: string, propId: string, el?: Pick<El, 'type' | 'own' | 'name'>): PropDef | undefined {
  const d = TYPES[objType];
  if (el) {
    const found = propsOf(el).find((p) => p.id === propId);
    if (found) return found;
  }
  return d?.props.find((p) => p.id === propId);
}

// ---- members: properties and methods ------------------------------------------------

/** What an object passes on: a property, or a method with arguments (req-ui-014, req-fach-055). */
export interface Member {
  id: string;
  de: string;
  en: string;
  dtype: DType;
  method?: MethodDef;
  choices?: Choice[];
}

export function methodsOf(el: Pick<El, 'type'>): MethodDef[] {
  return TYPES[el.type]?.methods ?? [];
}

export function methodOf(type: string, prop: string): MethodDef | undefined {
  return TYPES[type]?.methods?.find((m) => m.id === prop);
}

/** Properties first, then methods. */
export function membersOf(el: Pick<El, 'type' | 'own' | 'name'>): Member[] {
  const out: Member[] = propsOf(el).map((p) => ({ id: p.id, de: p.de, en: p.en, dtype: p.dtype, choices: p.choices }));
  for (const m of methodsOf(el)) out.push({ id: m.id, de: m.de, en: m.en, dtype: m.dtype, method: m });
  return out;
}

/** "Value before 3 candles" with the arguments, "Value before … candles" without. */
export function methodText(m: MethodDef, args: number[] | undefined, lang: Lang): string {
  const n = args && args.length ? args[0] : undefined;
  if (m.id === 'wert_vor') {
    if (lang === 'en') return n === undefined ? 'Value … candles ago' : `Value ${n} ${n === 1 ? 'candle' : 'candles'} ago`;
    return n === undefined ? 'Wert vor … Kerzen' : `Wert vor ${n} ${n === 1 ? 'Kerze' : 'Kerzen'}`;
  }
  const a = args && args.length ? `(${args.join('; ')})` : '(…)';
  return `${tx(m, lang)}${a}`;
}

/** Label of what a use passes on, as written at a data connection. */
export function memberLabel(el: Pick<El, 'type' | 'own' | 'name'> | undefined, prop: string, args: number[] | undefined, lang: Lang): string {
  if (!el) return prop;
  const m = methodOf(el.type, prop);
  if (m) return methodText(m, args, lang);
  const p = propsOf(el).find((q) => q.id === prop);
  return p ? tx(p, lang) : prop;
}

/**
 * What a property or method of an object says and what one uses it for (req-ui-016), in trader language.
 * Own indicators and trends: the sentence of the contained object type or a general sentence.
 */
export function memberDesc(el: Pick<El, 'type' | 'own'>, id: string, lang: Lang): string {
  const inc = /^inc:([^:]+):(.+)$/.exec(id);
  if (inc) {
    const sub = el.own?.includes.find((i) => i.id === inc[1]);
    const txt = sub ? memberText(sub.tpl, inc[2], lang) : undefined;
    if (txt) return txt;
  }
  return memberText(el.type, id, lang)
    ?? (lang === 'en' ? 'A value of this object that other elements can use.' : 'Ein Wert dieses Objekts, den andere Elemente verwenden können.');
}

/** The same for an object type without an instance (formula editor, template view). */
export function typeMemberDesc(type: string, id: string, lang: Lang): string | undefined {
  return memberText(type, id, lang);
}

export function supportsRefresh(el: Pick<El, 'type'>): boolean {
  return !!TYPES[el.type]?.refresh;
}

export function choiceLabel(c: Choice[] | undefined, id: string, lang: Lang): string {
  const f = c?.find((x) => x.id === id);
  return f ? tx(f, lang) : id;
}

export const DTYPE_LABEL: Record<DType, Txt> = {
  number: t('Zahl', 'Number'),
  integer: t('Ganzzahl', 'Integer'),
  percent: t('Prozent', 'Percent'),
  boolean: t('ja/nein', 'yes/no'),
  text: t('Text', 'Text'),
  choice: t('Auswahl', 'Choice'),
  time_unit: t('Zeiteinheit', 'Time unit'),
  timestamp: t('Datum und Uhrzeit', 'Date and time'),
  date: t('Datum', 'Date'),
  expression: t('Ausdruck', 'Expression'),
  instrument: t('Instrument', 'Instrument'),
  object: t('Objekt', 'Object'),
};

// ---- explanations (shown on hover, req-ui-016) ---------------------------------

export const TIPS: Record<string, Txt> = {
  // library entries
  'type:trigger.candle_close': t('Die Strategie rechnet jedes Mal, wenn eine Kerze der gewählten Länge abgeschlossen ist, zum Beispiel jede Stunde bei H1.', 'The strategy calculates whenever a candle of the chosen length closes, for example every hour with H1.'),
  'type:trigger.tick': t('Die Strategie rechnet bei jedem neuen Kurs (Tick). Das ist sehr oft, daher eher für die Überwachung einer Order geeignet.', 'The strategy calculates at every new quote (tick). That is very often, so it suits monitoring an order.'),
  'type:flow.condition': t('Prüft etwas, zum Beispiel „EMA 20 kreuzt EMA 50“. Bei „wahr“ geht es auf dem einen Weg weiter, bei „falsch“ auf dem anderen.', 'Checks something, for example "EMA 20 crosses EMA 50". If true the flow continues one way, if false the other.'),
  'type:flow.connection': t('Verbindet zwei Schritte: Wählen Sie zuerst den Schritt, von dem es weitergeht, klicken Sie hier und dann den Schritt, der folgt. Sie können auch vom Anschluss unten am Schritt ziehen.', 'Connects two steps: first select the step the flow continues from, click here and then click the step that follows. You can also drag from the port at the bottom of the step.'),
  'f:aktualisieren': t('Aktualisieren: Das Objekt ermittelt seine Werte neu, bevor es sie an dieses Element übergibt. Ohne den Schalter übergibt es den Stand, den es an der Stelle seiner ersten Verwendung hatte.', 'Update: the object determines its values anew before it passes them to this element. Without the switch it passes the state it had at the place of its first use.'),
  'f:erste_verwendung': t('Die Instanz liegt beim Element, das sie zuerst verwendet. Dort werden ihre Werte ermittelt, wenn der Ablauf diese Stelle erreicht.', 'The instance lies at the element that uses it first. Its values are determined there when the flow reaches this place.'),
  'p:wert_vor': t('Methode: der Wert des Indikators vor der gewählten Anzahl Kerzen, zum Beispiel vor 1 Kerze.', 'Method: the value of the indicator the chosen number of candles ago, for example 1 candle ago.'),
  'type:flow.calculation': t('Rechnet einen Wert aus, zum Beispiel den Stop-Loss. Das Ergebnis können spätere Schritte verwenden.', 'Calculates a value, for example the stop loss. Later steps can use the result.'),
  'type:flow.set_parameter': t('Ändert den Wert eines Strategieparameters, zum Beispiel um mit einer anderen Zeiteinheit erneut zu prüfen.', 'Changes the value of a strategy parameter, for example to check again with another time unit.'),
  'type:flow.place_order': t('Gibt eine Order an den Markt. Am Ausgang „gestellt“ steht danach die Verwaltung dieser Order.', 'Sends an order to the market. After "placed" follows the management of this order.'),
  'type:flow.modify_order': t('Ändert eine wartende Order, zum Beispiel Stop-Loss oder Take-Profit. Was leer bleibt, bleibt unverändert.', 'Modifies a pending order, for example stop loss or take profit. Whatever stays empty stays unchanged.'),
  'type:flow.delete_order': t('Löscht die wartende Order dieser Verwaltung.', 'Deletes the pending order of this management.'),
  'type:flow.modify_position': t('Ändert Stop-Loss oder Take-Profit der offenen Position, zum Beispiel um den Stop-Loss nachzuziehen.', 'Modifies stop loss or take profit of the open position, for example to trail the stop loss.'),
  'type:flow.close_position': t('Schließt die offene Position ganz oder, mit Angabe eines Volumens, teilweise.', 'Closes the open position completely or, with a volume, partially.'),
  'type:Konto': t('Zeigt Kapital, freie Margin und Währung des Handelskontos. Legen Sie es auf die Fläche, wenn Sie Werte davon verbinden wollen.', 'Shows equity, free margin and currency of the trading account. Place it on the canvas to wire values from it.'),
  'type:Instrument': t('Zeigt Eigenschaften des gehandelten Instruments, zum Beispiel Spread, Pip und Mindestvolumen.', 'Shows properties of the traded instrument, for example spread, pip and minimum volume.'),
  'type:Kerze': t('Die jeweils letzte abgeschlossene Kerze einer Zeiteinheit mit Eröffnung, Hoch, Tief und Schluss.', 'The most recent completed candle of a time unit with open, high, low and close.'),
  'type:Tick': t('Der jeweils letzte Kurs mit Geld- und Briefkurs.', 'The most recent quote with bid and ask.'),
  'type:EMA': t('Exponentieller gleitender Durchschnitt: eine geglättete Kurslinie, die sich neuen Kursen schnell anpasst.', 'Exponential moving average: a smoothed price line that adapts quickly to new prices.'),
  'type:ATR': t('Average True Range: die durchschnittliche Schwankungsbreite einer Kerze, geeignet für Abstände wie den Stop-Loss.', 'Average True Range: the average range of a candle, suited for distances such as the stop loss.'),
  'type:ZigZag': t('Verbindet die wichtigen Hochs und Tiefs des Kurses und liefert die letzten Wendepunkte.', 'Connects the important highs and lows of the price and delivers the latest turning points.'),
  'type:Indikator': t('Ein Indikator, den Sie selbst aus Regeln oder anderen Indikatoren zusammenstellen.', 'An indicator you put together yourself from rules or other indicators.'),
  'type:Markttechnik': t('Erkennt Trend, Phase und die Punkte 1, 2 und 3 nach der Markttechnik aus den Wendepunkten des ZigZag.', 'Detects trend, phase and points 1, 2 and 3 by the market technique from the turning points of the ZigZag.'),
  'type:Trend': t('Ein Trend, den Sie selbst festlegen: Ein Ausdruck bestimmt die Richtung.', 'A trend you define yourself: an expression determines the direction.'),
  'type:Regel': t('Eine Regel, die einen Wert der Order bestimmt oder die Order prüft.', 'A rule that determines a value of the order or checks the order.'),
  'type:Regelwerk': t('Mehrere Regeln in fester Reihenfolge.', 'Several rules in a fixed order.'),
  'tpl:risiko': t('Begrenzt den Verlust bis zum Stop-Loss auf einen Anteil des Kapitals und bestimmt daraus das Volumen.', 'Limits the loss up to the stop loss to a share of the equity and derives the volume from it.'),
  'tpl:own': t('Von Ihnen gespeicherte Vorlage. Ein Klick fügt sie ein, „Öffnen“ zeigt die Vorlage.', 'Template saved by you. A click inserts it, "Open" shows the template.'),
  // parameters and properties
  'f:zeiteinheit': t('Die Kerzenlänge, auf der gerechnet wird, zum Beispiel M15 für 15-Minuten-Kerzen oder H1 für Stundenkerzen.', 'The candle length used for the calculation, for example M15 for 15-minute candles or H1 for hourly candles.'),
  'f:instrument': t('Das gehandelte Instrument. Vorbelegt mit dem Instrument, auf dem die Strategie angewendet wird.', 'The traded instrument. Preset with the instrument the strategy is applied to.'),
  'f:periode': t('Anzahl der Kerzen, über die gerechnet wird. Kleinere Werte reagieren schneller, größere ruhiger.', 'Number of candles used. Smaller values react faster, larger ones calmer.'),
  'f:verschiebung': t('Verschiebt die Linie um so viele Kerzen. Normalerweise 0.', 'Shifts the line by that many candles. Normally 0.'),
  'f:kursquelle': t('Aus welchem Kurs der Kerze gerechnet wird, zum Beispiel dem Schlusskurs.', 'Which price of the candle is used, for example the close price.'),
  'f:depth': t('Mindestzahl an Kerzen zwischen zwei Wendepunkten (Einstellung des ZigZag in MetaTrader 5).', 'Minimum number of candles between two turning points (setting of the ZigZag in MetaTrader 5).'),
  'f:deviation': t('Mindestbewegung in Punkten, damit ein neuer Wendepunkt entsteht.', 'Minimum move in points for a new turning point.'),
  'f:backstep': t('Mindestabstand in Kerzen zwischen einem Hoch und einem Tief.', 'Minimum distance in candles between a high and a low.'),
  'f:ausdruck': t('Hier legen Sie fest, was geprüft oder berechnet wird. Wählen Sie die Bausteine aus den Listen.', 'Here you define what is checked or calculated. Choose the blocks from the lists.'),
  'f:strategieparameter': t('Der Strategieparameter, dessen Wert geändert wird. Wählen Sie einen angelegten oder legen Sie einen neuen an.', 'The strategy parameter whose value is changed. Choose an existing one or create a new one.'),
  'f:ordertyp': t('Marktorder: sofort zum aktuellen Kurs. Stop-Order: wird ausgelöst, wenn der Kurs den Preis erreicht. Limit-Order: wartet auf einen besseren Preis.', 'Market: immediately at the current price. Stop: triggers when the price reaches the order price. Limit: waits for a better price.'),
  'f:richtung': t('buy kauft, sell verkauft.', 'buy buys, sell sells.'),
  'f:volumen': t('Die Menge, die gehandelt wird. Meist bestimmt eine Regel wie „Risiko je Trade“ das Volumen.', 'The quantity traded. Usually a rule such as "Risk per trade" determines the volume.'),
  'f:preis': t('Bei wartenden Orders der Preis, bei dem die Order ausgelöst wird.', 'For pending orders the price at which the order triggers.'),
  'f:limitpreis': t('Der Preis, zu dem die Order nach dem Auslösen gestellt wird.', 'The price at which the order is placed after it triggers.'),
  'f:stop_loss': t('Der Kurs, bei dem die Position mit Verlust geschlossen wird, um den Verlust zu begrenzen.', 'The price at which the position is closed at a loss to limit the loss.'),
  'f:take_profit': t('Der Kurs, bei dem die Position mit Gewinn geschlossen wird. Leer: kein Take-Profit.', 'The price at which the position is closed at a profit. Empty: no take profit.'),
  'f:gueltigkeit': t('Wie lange eine wartende Order gilt, wenn sie nicht ausgeführt wird.', 'How long a pending order stays valid if it is not executed.'),
  'f:ablaufzeit': t('Zeitpunkt, zu dem die Order endet.', 'Time at which the order ends.'),
  'f:datum': t('Tag, an dessen Ende die Order endet.', 'Day at the end of which the order ends.'),
  'f:bemerkung': t('Freier Text, nur zur Information.', 'Free text, for information only.'),
  'f:methode': t('Wie der Trend berechnet wird. Mitgeliefert ist „Ausdruck“: Sie legen die Richtung mit Bausteinen fest.', 'How the trend is calculated. Delivered is "Expression": you define the direction with blocks.'),
  'f:risikogrenze': t('Höchster Verlust je Trade als Anteil des Kapitals, zum Beispiel 1 %.', 'Maximum loss per trade as a share of the equity, for example 1 %.'),
  'p:wert': t('Der aktuelle Wert des Indikators.', 'The current value of the indicator.'),
  'p:trendrichtung': t('aufwärts, abwärts oder kein Trend.', 'upwards, downwards or no trend.'),
  'p:trend_intakt': t('Ja, solange der Kurs nicht unter den letzten Punkt 1/3 gefallen ist (beim Abwärtstrend darüber).', 'Yes as long as the price has not fallen below the last point 1/3 (above it for a downtrend).'),
  'p:phase': t('Bewegung: der Kurs läuft in Trendrichtung. Korrektur: der Kurs läuft zurück.', 'Movement: the price runs in trend direction. Correction: the price retraces.'),
  'p:punkt_2': t('Das jüngste Hoch des Trends (beim Abwärtstrend das jüngste Tief).', 'The most recent high of the trend (the most recent low for a downtrend).'),
  'p:punkt_13': t('Das jüngste Korrekturtief des Trends (beim Abwärtstrend das jüngste Korrekturhoch).', 'The most recent correction low of the trend (correction high for a downtrend).'),
  'p:punkt_13_endgueltig': t('Ja, wenn dieser Wendepunkt sich nicht mehr verschiebt.', 'Yes if this turning point does not move any more.'),
  'p:ergebnis': t('Das Ergebnis dieses Schritts. Spätere Schritte können es verwenden.', 'The result of this step. Later steps can use it.'),
  'p:kapital': t('Kontostand einschließlich der Gewinne und Verluste offener Positionen.', 'Account balance including profits and losses of open positions.'),
  'p:freie_margin': t('Das Geld, das für neue Positionen noch zur Verfügung steht.', 'The money still available for new positions.'),
  'p:waehrung': t('Die Währung des Kontos.', 'The currency of the account.'),
  'p:bezeichnung': t('Name des Instruments.', 'Name of the instrument.'),
  'p:tickgroesse': t('Kleinste Kursänderung des Instruments.', 'Smallest price change of the instrument.'),
  'p:tickwert': t('Wert einer Kursänderung um einen Tick in der Kontowährung.', 'Value of a price change by one tick in account currency.'),
  'p:punkt': t('Ein Punkt in Kursdifferenz.', 'One point as price difference.'),
  'p:pip': t('Ein Pip in Kursdifferenz.', 'One pip as price difference.'),
  'p:spread': t('Abstand zwischen Brief- und Geldkurs.', 'Distance between ask and bid.'),
  'p:mindestvolumen': t('Kleinstes handelbares Volumen.', 'Smallest tradable volume.'),
  'p:volumenschritt': t('Kleinste Stufe, in der sich das Volumen ändern lässt.', 'Smallest step in which the volume can change.'),
  'p:eroeffnung': t('Eröffnungskurs der letzten abgeschlossenen Kerze.', 'Open of the last completed candle.'),
  'p:hoch': t('Höchstkurs der letzten abgeschlossenen Kerze.', 'High of the last completed candle.'),
  'p:tief': t('Tiefstkurs der letzten abgeschlossenen Kerze.', 'Low of the last completed candle.'),
  'p:schluss': t('Schlusskurs der letzten abgeschlossenen Kerze.', 'Close of the last completed candle.'),
  'p:geld': t('Der Kurs, zu dem Sie verkaufen.', 'The price at which you sell.'),
  'p:brief': t('Der Kurs, zu dem Sie kaufen.', 'The price at which you buy.'),
  'p:zeitpunkt': t('Zeitpunkt der Kerze beziehungsweise des Ticks.', 'Time of the candle or tick.'),
  'p:status': t('Wartend, ausgeführt, gelöscht …', 'Pending, filled, deleted …'),
  'p:einstiegspreis': t('Der Preis, zu dem die Position eröffnet wurde.', 'The price at which the position was opened.'),
  'p:offener_gewinn_oder_verlust': t('Gewinn oder Verlust der Position beim aktuellen Kurs.', 'Profit or loss of the position at the current price.'),
  'p:wartende_orders': t('Anzahl der wartenden Orders dieser Strategie.', 'Number of pending orders of this strategy.'),
  'p:offene_positionen': t('Anzahl der offenen Positionen dieser Strategie.', 'Number of open positions of this strategy.'),
  'p:richtung': t('Die Richtung, die der Ausdruck bestimmt, zum Beispiel aufwärts oder abwärts.', 'The direction determined by the expression, for example up or down.'),
};

export function fieldTip(id: string, lang: Lang, kind: 'f' | 'p' = 'f'): string | undefined {
  if (id.startsWith('wp')) {
    return lang === 'en'
      ? 'Value of a turning point of the ZigZag. Provisional: three turning points can be addressed.'
      : 'Wert eines Wendepunkts des ZigZag. Vorläufig: drei Wendepunkte sind ansprechbar.';
  }
  const direct = TIPS[`${kind}:${id}`] ?? TIPS[`${kind === 'f' ? 'p' : 'f'}:${id}`];
  return direct ? tx(direct, lang) : undefined;
}
