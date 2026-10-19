// The strategies the prototype starts with: the strategy of the client ("EMA-Trendfolge",
// from his saved file, with his values) and the two test cases str-01 and str-03,
// translated into the model of the prototype.
import { BUILTIN_RISK_ID, newEl, newRuleFromTemplate, builtinTemplates } from './factory';
import type { Binding, Conn, El, Expr, RuleInst, Section, SParam, Strategy, Template } from './model';
import { emptyOwn } from './model';

const ref = (obj: string, prop: string): Expr => ({ t: 'ref', obj, prop });
const sp = (id: string): Expr => ({ t: 'sp', id });
const num = (v: number): Expr => ({ t: 'num', v });
const str = (v: string): Expr => ({ t: 'str', v });
const bin = (op: string, l: Expr, r: Expr): Expr => ({ t: 'bin', op, l, r });
const call = (fn: string, ...args: Expr[]): Expr => ({ t: 'call', fn, args });
const prev = (e: Expr): Expr => call('PREVIOUS', e);
const fixed = (v: string | number | boolean): Binding => ({ k: 'fixed', v });
const param = (id: string): Binding => ({ k: 'param', id });
const ex = (e: Expr): Binding => ({ k: 'expr', e });

const SAVED = '2026-10-19T09:30:00.000Z';

function crossAny(a: Expr, b: Expr): Expr {
  return { t: 'cross', a, b, dir: 'any' };
}

function mindestvolumen(): RuleInst {
  return {
    id: 'r-min', name: 'Mindestvolumen', kind: 'rule',
    origin: { tplId: null, tplName: null, type: 'Regel' },
    params: {}, own: emptyOwn(), e: bin('>=', ref('Order', 'volumen'), ref('Instrument', 'mindestvolumen')), determines: null, cmp: 'min',
  };
}

function risk(name: string): RuleInst {
  const t = builtinTemplates().find((x) => x.id === BUILTIN_RISK_ID) as Template;
  const r = newRuleFromTemplate(t, name);
  r.id = 'r-risiko';
  return r;
}

interface EmaNames {
  title: string;
  description: string;
  zeit: string;
  stop: string;
  zeitValue: string;
  stopValue: number;
  e20: string;
  e50: string;
  a14: string;
  names: Record<string, string>;
  sample: string;
}

function ema(v: EmaNames): Strategy {
  const params: SParam[] = [
    { id: 'p-zeit', name: v.zeit, dtype: 'time_unit', value: v.zeitValue, atApplication: false },
    { id: 'p-stop', name: v.stop, dtype: 'number', value: v.stopValue, atApplication: false },
  ];
  const n = v.names;
  const mk = (type: string, id: string, name: string, bind: Record<string, Binding>, over: Partial<El> = {}): El => {
    const el = newEl(type, name, { id, ...over });
    Object.assign(el.bind, bind);
    return el;
  };
  const ema20 = mk('EMA', 'ema20', v.e20, { zeiteinheit: param('p-zeit'), periode: fixed(20), kursquelle: fixed('schlusskurs'), verschiebung: fixed(0) });
  const ema50 = mk('EMA', 'ema50', v.e50, { zeiteinheit: param('p-zeit'), periode: fixed(50), kursquelle: fixed('schlusskurs'), verschiebung: fixed(0) });
  const atr14 = mk('ATR', 'atr14', v.a14, { zeiteinheit: param('p-zeit'), periode: fixed(14) });
  const w20 = ref('ema20', 'wert');
  const w50 = ref('ema50', 'wert');
  const trg = mk('trigger.candle_close', 'trg', 'Kerzenschluss', { zeiteinheit: param('p-zeit') });
  const kreuzen = mk('flow.condition', 'kreuzen', n.kreuzen, { ausdruck: ex(crossAny(w20, w50)) });
  const richtung = mk('flow.calculation', 'richtung', n.richtung, {
    ausdruck: ex(call('IF', bin('>', w20, w50), str('buy'), str('sell'))),
  });
  const stopLoss = (dir: Expr, buyIf: string) =>
    call('IF', bin('=', dir, str(buyIf)),
      bin('-', ref('Kerze', 'schluss'), bin('*', sp('p-stop'), ref('atr14', 'wert'))),
      bin('+', ref('Kerze', 'schluss'), bin('*', sp('p-stop'), ref('atr14', 'wert'))));
  const stop = mk('flow.calculation', 'stop', n.stop, { ausdruck: ex(stopLoss(ref('richtung', 'ergebnis'), 'buy')) });
  const order = mk('flow.place_order', 'order', 'Order aufgeben', {
    ordertyp: fixed('MarketOrder'),
    richtung: ex(ref('richtung', 'ergebnis')),
    stop_loss: ex(ref('stop', 'ergebnis')),
  }, { rules: [mindestvolumen()] });
  const mTrg = mk('trigger.candle_close', 'm-trg', 'Kerzenschluss', { zeiteinheit: param('p-zeit') }, { mgmt: 'order' });
  const mAusg = mk('flow.condition', 'm-ausg', n.ausgefuehrt, { ausdruck: ex(bin('=', ref('Order', 'status'), str('ausgefuehrt'))) }, { mgmt: 'order' });
  const buy = bin('=', ref('Position', 'richtung'), str('buy'));
  const sell = bin('=', ref('Position', 'richtung'), str('sell'));
  const mKreuz = mk('flow.condition', 'm-kreuz', n.gegen, {
    ausdruck: ex(call('OR',
      call('AND', buy, { t: 'cross', a: w20, b: w50, dir: 'down' }),
      call('AND', sell, { t: 'cross', a: w20, b: w50, dir: 'up' }))),
  }, { mgmt: 'order' });
  const mClose = mk('flow.close_position', 'm-close', 'Position schließen', {}, { mgmt: 'order' });
  const mNeu = mk('flow.calculation', 'm-neu', n.neu, { ausdruck: ex(stopLoss(ref('Position', 'richtung'), 'buy')) }, { mgmt: 'order' });
  const mVerb = mk('flow.condition', 'm-verb', n.verbessert, {
    ausdruck: ex(call('IF', bin('=', ref('Position', 'richtung'), str('buy')),
      bin('>', ref('m-neu', 'ergebnis'), ref('Position', 'stop_loss')),
      bin('<', ref('m-neu', 'ergebnis'), ref('Position', 'stop_loss')))),
  }, { mgmt: 'order' });
  const mPos = mk('flow.modify_position', 'm-pos', 'Position ändern', { stop_loss: ex(ref('m-neu', 'ergebnis')) }, { mgmt: 'order' });
  const conns: Conn[] = [
    { from: 'trg', out: 'weiter', to: 'kreuzen' },
    { from: 'kreuzen', out: 'wahr', to: 'richtung' },
    { from: 'richtung', out: 'weiter', to: 'stop' },
    { from: 'stop', out: 'weiter', to: 'order' },
    { from: 'm-trg', out: 'weiter', to: 'm-ausg' },
    { from: 'm-ausg', out: 'wahr', to: 'm-kreuz' },
    { from: 'm-kreuz', out: 'wahr', to: 'm-close' },
    { from: 'm-kreuz', out: 'falsch', to: 'm-neu' },
    { from: 'm-neu', out: 'weiter', to: 'm-verb' },
    { from: 'm-verb', out: 'wahr', to: 'm-pos' },
  ];
  const sections: Section[] = [
    { id: 'sec-1', name: n.sec1, flow: null, collapsed: false, els: ['trg', 'kreuzen'] },
    { id: 'sec-2', name: n.sec2, flow: null, collapsed: false, els: ['richtung', 'stop', 'order'] },
    { id: 'sec-3', name: n.sec3, flow: 'order', collapsed: false, els: ['m-trg', 'm-ausg'] },
  ];
  return {
    id: `sample-${v.sample}`, name: v.title, description: v.description, params, rules: [risk(n.risk)],
    els: [ema20, ema50, atr14, trg, kreuzen, richtung, stop, order, mTrg, mAusg, mKreuz, mClose, mNeu, mVerb, mPos],
    conns, sections, collapsedMgmt: [], savedAt: SAVED, sample: v.sample,
  };
}

function str01(): Strategy {
  const params: SParam[] = [
    { id: 'p-sig', name: 'Signalzeiteinheit', dtype: 'time_unit', value: 'h1', atApplication: false },
    { id: 'p-han', name: 'Handelszeiteinheit', dtype: 'time_unit', value: 'm15', atApplication: false },
    { id: 'p-entry', name: 'Entry-Puffer', dtype: 'number', value: 3, atApplication: false },
    { id: 'p-stopp', name: 'Stop-Puffer', dtype: 'number', value: 3, atApplication: false },
  ];
  const mk = (type: string, id: string, name: string, bind: Record<string, Binding>, over: Partial<El> = {}): El => {
    const el = newEl(type, name, { id, ...over });
    Object.assign(el.bind, bind);
    return el;
  };
  const mtParams = (z: string) => ({ zeiteinheit: param(z), depth: fixed(12), deviation: fixed(5), backstep: fixed(3) });
  const mtS = mk('Markttechnik', 'mt-s', 'Markttechnik Signal', mtParams('p-sig'));
  const mtH = mk('Markttechnik', 'mt-h', 'Markttechnik Handel', mtParams('p-han'));
  const trg = mk('trigger.candle_close', 'trg', 'Kerzenschluss', { zeiteinheit: param('p-han') });
  const c1 = mk('flow.condition', 'c1', 'Intakter Trend in der Bewegung', {
    ausdruck: ex(call('AND', ref('mt-s', 'trend_intakt'), bin('=', ref('mt-s', 'phase'), str('bewegung')))),
  });
  const c2 = mk('flow.condition', 'c2', 'Handelszeiteinheit in Trendrichtung', {
    ausdruck: ex(bin('=', ref('mt-h', 'trendrichtung'), ref('mt-s', 'trendrichtung'))),
  });
  const c3 = mk('flow.condition', 'c3', 'Keine Order und keine Position', {
    ausdruck: ex(bin('=', bin('+', ref('Strategie', 'wartende_orders'), ref('Strategie', 'offene_positionen')), num(0))),
  });
  const up = bin('=', ref('mt-s', 'trendrichtung'), str('aufwaerts'));
  const pip = ref('Instrument', 'pip');
  const spread = ref('Instrument', 'spread');
  const einstieg = mk('flow.calculation', 'einstieg', 'Einstieg', {
    ausdruck: ex(call('IF', up,
      bin('+', bin('+', ref('mt-h', 'punkt_2'), spread), bin('*', sp('p-entry'), pip)),
      bin('-', ref('mt-h', 'punkt_2'), bin('*', sp('p-entry'), pip)))),
  });
  const stop = mk('flow.calculation', 'stop', 'Stop-Loss', {
    ausdruck: ex(call('IF', up,
      bin('-', ref('mt-h', 'punkt_13'), bin('*', sp('p-stopp'), pip)),
      bin('+', bin('+', ref('mt-h', 'punkt_13'), bin('*', sp('p-stopp'), pip)), spread))),
  });
  const E = ref('einstieg', 'ergebnis');
  const S = ref('stop', 'ergebnis');
  const ziel = mk('flow.calculation', 'ziel', 'Take-Profit', {
    ausdruck: ex(call('IF', up,
      bin('+', bin('+', E, bin('-', E, S)), spread),
      bin('-', bin('-', E, bin('-', S, E)), spread))),
  });
  const order = mk('flow.place_order', 'order', 'Order aufgeben', {
    ordertyp: fixed('StopOrder'),
    richtung: ex(call('IF', up, str('buy'), str('sell'))),
    preis: ex(E),
    stop_loss: ex(S),
    take_profit: ex(ref('ziel', 'ergebnis')),
    gueltigkeit: fixed('bis_auf_widerruf'),
  }, { rules: [mindestvolumen()] });
  const mTick = mk('trigger.tick', 'm-tick', 'Tick', {}, { mgmt: 'order' });
  const mC1 = mk('flow.condition', 'm-c1', 'Kurs durchbricht Punkt 1/3', {
    ausdruck: ex(call('AND', bin('=', ref('Order', 'status'), str('wartend')),
      call('IF', bin('=', ref('Order', 'richtung'), str('buy')),
        bin('<', ref('Tick', 'geld'), ref('mt-h', 'punkt_13')),
        bin('>', ref('Tick', 'brief'), ref('mt-h', 'punkt_13'))))),
  }, { mgmt: 'order' });
  const mDel1 = mk('flow.delete_order', 'm-del1', 'Order löschen', {}, { mgmt: 'order' });
  const mTrg = mk('trigger.candle_close', 'm-trg', 'Kerzenschluss', { zeiteinheit: param('p-han') }, { mgmt: 'order' });
  const mC2 = mk('flow.condition', 'm-c2', 'Order wartet', { ausdruck: ex(bin('=', ref('Order', 'status'), str('wartend'))) }, { mgmt: 'order' });
  const mNeu = mk('flow.calculation', 'm-neu', 'Neuer Stop-Loss', {
    ausdruck: ex(call('IF', bin('=', ref('Order', 'richtung'), str('buy')),
      bin('-', ref('mt-h', 'punkt_13'), bin('*', sp('p-stopp'), pip)),
      bin('+', bin('+', ref('mt-h', 'punkt_13'), bin('*', sp('p-stopp'), pip)), spread))),
  }, { mgmt: 'order' });
  const mC3 = mk('flow.condition', 'm-c3', 'Stop-Loss weicht ab', {
    ausdruck: ex(bin('<>', ref('m-neu', 'ergebnis'), ref('Order', 'stop_loss'))),
  }, { mgmt: 'order' });
  const mZiel = mk('flow.calculation', 'm-ziel', 'Neuer Take-Profit', {
    ausdruck: ex(call('IF', bin('=', ref('Order', 'richtung'), str('buy')),
      bin('+', bin('+', ref('Order', 'preis'), bin('-', ref('Order', 'preis'), ref('m-neu', 'ergebnis'))), spread),
      bin('-', bin('-', ref('Order', 'preis'), bin('-', ref('m-neu', 'ergebnis'), ref('Order', 'preis'))), spread))),
  }, { mgmt: 'order' });
  const mMod = mk('flow.modify_order', 'm-mod', 'Order ändern', {
    stop_loss: ex(ref('m-neu', 'ergebnis')),
    take_profit: ex(ref('m-ziel', 'ergebnis')),
  }, { mgmt: 'order' });
  const mDel2 = mk('flow.delete_order', 'm-del2', 'Order löschen', {}, { mgmt: 'order' });
  const conns: Conn[] = [
    { from: 'trg', out: 'weiter', to: 'c1' },
    { from: 'c1', out: 'wahr', to: 'c2' },
    { from: 'c2', out: 'wahr', to: 'c3' },
    { from: 'c3', out: 'wahr', to: 'einstieg' },
    { from: 'einstieg', out: 'weiter', to: 'stop' },
    { from: 'stop', out: 'weiter', to: 'ziel' },
    { from: 'ziel', out: 'weiter', to: 'order' },
    { from: 'm-tick', out: 'weiter', to: 'm-c1' },
    { from: 'm-c1', out: 'wahr', to: 'm-del1' },
    { from: 'm-trg', out: 'weiter', to: 'm-c2' },
    { from: 'm-c2', out: 'wahr', to: 'm-neu' },
    { from: 'm-neu', out: 'weiter', to: 'm-c3' },
    { from: 'm-c3', out: 'wahr', to: 'm-ziel' },
    { from: 'm-ziel', out: 'weiter', to: 'm-mod' },
    { from: 'm-mod', out: 'nicht_geaendert', to: 'm-del2' },
  ];
  const sections: Section[] = [
    { id: 'sec-1', name: 'Einstieg', flow: null, collapsed: false, els: ['trg', 'c1', 'c2', 'c3'] },
    { id: 'sec-2', name: 'Trade planen', flow: null, collapsed: false, els: ['einstieg', 'stop', 'ziel'] },
    { id: 'sec-3', name: 'Order', flow: null, collapsed: false, els: ['order'] },
  ];
  return {
    id: 'sample-str01', name: 'Scalping Punkt 2 Ausbruch – einfache Strategie',
    description: 'Testfall str-01: Handel in Richtung eines intakten Trends, Einstieg am Punkt 2 der Handelszeiteinheit mit einer Stop-Order.',
    params, rules: [risk('Risiko')],
    els: [mtS, mtH, trg, c1, c2, c3, einstieg, stop, ziel, order, mTick, mC1, mDel1, mTrg, mC2, mNeu, mC3, mZiel, mMod, mDel2],
    conns, sections, collapsedMgmt: [], savedAt: SAVED, sample: 'str01',
  };
}

export function sampleStrategies(): Strategy[] {
  const customer = ema({
    title: 'EMA-Trendfolge', description: 'emma ist die 2 EMA Strategie', zeit: 'Zeiteinheit', stop: 'Stop-Abstand',
    zeitValue: 'm15', stopValue: 0, e20: 'EMA20', e50: 'EMA50', a14: 'ATR14', sample: 'auftraggeber',
    names: {
      kreuzen: 'Kreuzen', richtung: 'Richtung', stop: 'StopLoss', ausgefuehrt: 'Order ausgeführt', gegen: 'Kreuzen gegen die Position',
      neu: 'Neuer Stop-Loss', verbessert: 'StopLossVerbessert', risk: 'Risiko je Trade',
      sec1: 'Einstieg', sec2: 'Order', sec3: 'Prüfen',
    },
  });
  const t03 = ema({
    title: 'EMA-Trendfolge', description: 'Testfall str-03: Trendfolge mit zwei EMA, Marktorder, nachgezogener Stop-Loss.', zeit: 'Zeiteinheit', stop: 'Stop-Abstand',
    zeitValue: 'h1', stopValue: 2, e20: 'EMA 20', e50: 'EMA 50', a14: 'ATR 14', sample: 'str03',
    names: {
      kreuzen: 'Kreuzen', richtung: 'Richtung', stop: 'Stop-Loss', ausgefuehrt: 'Order ausgeführt', gegen: 'Kreuzen gegen die Position',
      neu: 'Neuer Stop-Loss', verbessert: 'Stop-Loss verbessert', risk: 'Risiko',
      sec1: 'Einstieg', sec2: 'Order', sec3: 'Prüfen',
    },
  });
  return [customer, t03, str01()];
}

export function sampleTemplates(): Template[] {
  return [
    {
      id: 'tpl-eigen-ema9', kind: 'indicator', type: 'EMA', name: 'Schneller EMA 9',
      description: 'Beispielvorlage: EMA mit Periode 9 auf dem Schlusskurs.',
      defaults: { periode: fixed(9), kursquelle: fixed('schlusskurs'), verschiebung: fixed(0) },
      own: null, e: { t: 'empty' }, determines: null, cmp: 'max', savedAt: SAVED,
    },
  ];
}
