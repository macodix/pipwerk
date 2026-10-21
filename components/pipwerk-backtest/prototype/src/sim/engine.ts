// The simulated test run. It is a small interpreter for the strategy model of the prototype and
// an internal "broker" that fills orders against the simulated candles. It exists to give the
// prototype coherent, credible behaviour (values, rejected orders, trades). It is not the
// calculation of pipwerk.
import { BUILTIN_RISK_ID } from '../factory';
import type { El, Expr, RuleInst, Strategy, Txt } from '../model';
import { atr as atrCalc, ema as emaCalc, technique } from './indicators';
import type { Technique } from './indicators';
import {
  BASE_MIN, BROKERS, DAY, MIN, baseBars, closedIndex, fmtNum, lowerBound, seriesFor, ticksOfBar,
} from './market';
import type { Bars, InstrumentInfo, Tick, TfSeries } from './market';

export type Val = number | string | boolean | null;

export interface AccountVals {
  capital: number;
  currency: string;
  leverage: number;
  spreadMode: 'candle' | 'fixed';
  /** Fixed spread in pips. */
  spreadFixed: number;
  /** Commission per lot and side, in account currency. */
  commission: number;
}

export interface RunInput {
  strategy: Strategy;
  params: Record<string, string | number | boolean>;
  instr: InstrumentInfo;
  brokerId: string;
  account: AccountVals;
  from: number;
  to: number;
  trace: boolean;
  manualStart: boolean;
}

export interface Progress {
  done: number;
  total: number;
  t: number;
  trades: number;
  equity: number;
}

// ---- records for the replay ------------------------------------------------------------------------

export interface StepRec {
  seq: number;
  /** Counter after the step: records with a counter up to this value are visible at the step. */
  end: number;
  el: string;
  out: string | null;
  /** Result of a condition (true/false) or calculation. */
  value?: Val;
  noValue?: boolean;
  reject?: Txt;
  note?: Txt;
  /** Evaluated settings of an acting element, by field id. */
  vals?: Record<string, Val>;
  effect?: Txt;
}

export interface EvalRec {
  id: number;
  seq0: number;
  t: number;
  kind: 'candle' | 'tick' | 'manual';
  trig: string | null;
  tf: string | null;
  flow: string | null;
  inst: number | null;
  steps: StepRec[];
  acting: boolean;
  bid: number;
  ask: number;
}

export interface InstView {
  id: number;
  tag: string;
  status: 'wartend' | 'ausgefuehrt' | 'geloescht' | 'abgelehnt';
  type: string;
  dir: 'buy' | 'sell';
  vol: number;
  price: number | null;
  sl: number | null;
  tp: number | null;
  entry: number | null;
  posOpen: boolean;
}

export interface WorldRec {
  seq: number;
  t: number;
  balance: number;
  insts: InstView[];
}

export interface ChartEvent {
  seq: number;
  t: number;
  kind: 'placed' | 'rejected' | 'filled' | 'modified' | 'deleted' | 'closed';
  orderId: number | null;
  dir: 'buy' | 'sell' | null;
  price: number | null;
  sl?: number | null;
  tp?: number | null;
  text: Txt;
}

export interface Trade {
  id: number;
  orderTag: string;
  dir: 'buy' | 'sell';
  vol: number;
  openT: number;
  closeT: number;
  entry: number;
  exit: number;
  sl: number | null;
  tp: number | null;
  profit: number;
  cost: number;
  commission: number;
  reason: 'sl' | 'tp' | 'strategy' | 'end';
}

export interface Rejection {
  t: number;
  el: string;
  elName: string;
  dir: 'buy' | 'sell' | null;
  price: number | null;
  reason: Txt;
}

export interface EquityPoint {
  t: number;
  eq: number;
}

export interface RunOutput {
  evals: EvalRec[];
  worlds: WorldRec[];
  events: ChartEvent[];
  trades: Trade[];
  rejections: Rejection[];
  equity: EquityPoint[];
  startCapital: number;
  endBalance: number;
  engine: Engine;
}

// ---- order state ------------------------------------------------------------------------------------------

interface OrderState {
  id: number;
  tag: string;
  elId: string;
  type: string;
  dir: 'buy' | 'sell';
  vol: number;
  price: number | null;
  sl: number | null;
  tp: number | null;
  status: 'wartend' | 'ausgefuehrt' | 'geloescht' | 'abgelehnt';
  placedAt: number;
}
interface PositionState {
  dir: 'buy' | 'sell';
  vol: number;
  entry: number;
  sl: number | null;
  tp: number | null;
  openedAt: number;
  commission: number;
  spreadCost: number;
}
interface Inst {
  id: number;
  order: OrderState;
  position: PositionState | null;
  alive: boolean;
}

const ACTING = new Set(['flow.place_order', 'flow.modify_order', 'flow.delete_order', 'flow.modify_position', 'flow.close_position']);
export const isActing = (type: string): boolean => ACTING.has(type);

const T = (de: string, en: string): Txt => ({ de, en });
const num = (v: number, d: number) => ({ de: fmtNum(v, d, 'de'), en: fmtNum(v, d, 'en') });
const fl = (v: number, step: number) => Math.round(Math.floor(v / step + 1e-9) * step * 1e6) / 1e6;

// ---- expression evaluation ------------------------------------------------------------------------

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

export class Engine {
  readonly input: RunInput;
  readonly byId = new Map<string, El>();
  private seqNo = 0;
  now = 0;
  tfNow = 'h1';
  tick: Tick = { t: 0, bid: 0, ask: 0 };
  results = new Map<string, Val>();
  private cur: Inst | null = null;
  private newOrder: OrderState | null = null;
  private rulePars: Record<string, Val> = {};
  private seriesCache = new Map<string, TfSeries>();
  private indCache = new Map<string, { s: TfSeries; wert?: Float64Array; tech?: Technique }>();
  private insts: Inst[] = [];
  private nextInst = 1;
  private nextTrade = 1;
  balance: number;
  private bars: Bars;
  private spreadFactor: number;
  private mainTriggers: El[] = [];
  private mgmtTriggers = new Map<string, El[]>();
  out: RunOutput;
  private params: Record<string, string | number | boolean>;

  constructor(input: RunInput) {
    this.input = input;
    this.params = { ...input.params };
    for (const e of input.strategy.els) this.byId.set(e.id, e);
    this.bars = baseBars(input.instr.id);
    this.spreadFactor = BROKERS.find((b) => b.id === input.brokerId)?.spreadFactor ?? 1;
    this.balance = input.account.capital;
    for (const e of input.strategy.els) {
      if (e.type !== 'trigger.candle_close' && e.type !== 'trigger.tick') continue;
      if (e.mgmt) {
        if (!this.mgmtTriggers.has(e.mgmt)) this.mgmtTriggers.set(e.mgmt, []);
        this.mgmtTriggers.get(e.mgmt)?.push(e);
      } else this.mainTriggers.push(e);
    }
    this.out = {
      evals: [], worlds: [], events: [], trades: [], rejections: [], equity: [], startCapital: input.account.capital, endBalance: input.account.capital, engine: this,
    };
  }

  seq(): number {
    this.seqNo += 1;
    return this.seqNo;
  }

  // ---- data ----

  paramValue(id: string): Val {
    const v = this.params[id];
    return v === undefined ? null : v;
  }

  bindingValue(el: El, fid: string): Val {
    const b = el.bind[fid];
    if (!b) return null;
    switch (b.k) {
      case 'fixed': return b.v;
      case 'param': return this.paramValue(b.id);
      case 'expr': return this.eval(b.e, 0);
      case 'ref': return this.prop(b.obj, b.prop, 0);
      default: return null;
    }
  }

  tfOfEl(el: El): string | null {
    const b = el.bind.zeiteinheit;
    if (!b) return null;
    const v = b.k === 'fixed' ? b.v : b.k === 'param' ? this.paramValue(b.id) : null;
    return typeof v === 'string' ? v.toLowerCase() : null;
  }

  series(tf: string): TfSeries {
    const key = tf.toLowerCase();
    let s = this.seriesCache.get(key);
    if (!s) {
      s = seriesFor(this.input.instr.id, key, this.input.from, this.input.to, this.input.brokerId);
      this.seriesCache.set(key, s);
    }
    return s;
  }

  private indicator(el: El): { s: TfSeries; wert?: Float64Array; tech?: Technique } | null {
    const hit = this.indCache.get(el.id);
    if (hit) return hit;
    const tf = this.tfOfEl(el) ?? this.tfNow;
    const s = this.series(tf);
    const num = (id: string, def: number): number => {
      const v = this.bindingValue(el, id);
      return typeof v === 'number' ? v : def;
    };
    let rec: { s: TfSeries; wert?: Float64Array; tech?: Technique } | null = null;
    if (el.type === 'EMA') {
      const src = this.bindingValue(el, 'kursquelle');
      rec = { s, wert: emaCalc(s, num('periode', 20), typeof src === 'string' ? src : 'schlusskurs', num('verschiebung', 0)) };
    } else if (el.type === 'ATR') rec = { s, wert: atrCalc(s, num('periode', 14)) };
    else if (el.type === 'Markttechnik') rec = { s, tech: technique(s, num('depth', 12)) };
    else if (el.type === 'ZigZag') rec = { s };
    if (rec) this.indCache.set(el.id, rec);
    return rec;
  }

  /** The value of a property at the current time. `shift` counts candles back (PREVIOUS). */
  prop(obj: string, prop: string, shift: number): Val {
    const el = this.byId.get(obj);
    if (el) {
      if (el.type === 'flow.condition' || el.type === 'flow.calculation') {
        const v = this.results.get(el.id);
        return v === undefined ? null : v;
      }
      const ind = this.indicator(el);
      if (!ind) return null;
      const i = closedIndex(ind.s, this.now) - shift;
      if (i < 0) return null;
      if (ind.wert) {
        if (prop !== 'wert') return null;
        const v = ind.wert[i];
        return Number.isNaN(v) ? null : v;
      }
      if (ind.tech) {
        const t = ind.tech;
        if (t.dir[i] === -2) return null;
        switch (prop) {
          case 'trendrichtung': return t.dir[i] === 1 ? 'aufwaerts' : t.dir[i] === -1 ? 'abwaerts' : 'kein_trend';
          case 'trend_intakt': return t.dir[i] !== 0 && t.intact[i] === 1;
          case 'phase': return t.phase[i] < 0 ? null : t.phase[i] === 0 ? 'bewegung' : 'korrektur';
          case 'punkt_2': return Number.isNaN(t.p2[i]) ? null : t.p2[i];
          case 'punkt_13': return Number.isNaN(t.p13[i]) ? null : t.p13[i];
          case 'punkt_13_endgueltig': return t.dir[i] === 0 ? null : t.final[i] === 1;
          default: return null;
        }
      }
      return null;
    }
    const ins = this.input.instr;
    switch (obj) {
      case 'Kerze': {
        const s = this.series(this.tfNow);
        const i = closedIndex(s, this.now) - shift;
        if (i < 0) return null;
        switch (prop) {
          case 'eroeffnung': return s.o[i];
          case 'hoch': return s.h[i];
          case 'tief': return s.l[i];
          case 'schluss': return s.c[i];
          case 'zeitpunkt': return s.t[i];
          default: return null;
        }
      }
      case 'Tick':
        return prop === 'geld' ? this.tick.bid : prop === 'brief' ? this.tick.ask : prop === 'zeitpunkt' ? this.tick.t : null;
      case 'Konto':
        return prop === 'kapital' ? this.equity() : prop === 'freie_margin' ? this.equity() - this.usedMargin() : prop === 'waehrung' ? this.input.account.currency : null;
      case 'Instrument': {
        switch (prop) {
          case 'bezeichnung': return ins.bezeichnung;
          case 'tickgroesse': return ins.tickgroesse;
          case 'tickwert': return ins.tickwert;
          case 'punkt': return ins.punkt;
          case 'pip': return ins.pip;
          case 'spread': return this.spread();
          case 'mindestvolumen': return ins.mindestvolumen;
          case 'volumenschritt': return ins.volumenschritt;
          default: return null;
        }
      }
      case 'Order': {
        const o = this.newOrder ?? this.cur?.order ?? null;
        if (!o) return null;
        switch (prop) {
          case 'status': return o.status;
          case 'richtung': return o.dir;
          case 'volumen': return o.vol > 0 ? o.vol : null;
          case 'preis': return o.price;
          case 'stop_loss': return o.sl;
          case 'take_profit': return o.tp;
          case 'gueltigkeit': return 'bis_auf_widerruf';
          case 'order_id': return o.tag;
          default: return null;
        }
      }
      case 'Position': {
        const p = this.cur?.position ?? null;
        if (!p) return null;
        switch (prop) {
          case 'richtung': return p.dir;
          case 'volumen': return p.vol;
          case 'einstiegspreis': return p.entry;
          case 'stop_loss': return p.sl;
          case 'take_profit': return p.tp;
          case 'offener_gewinn_oder_verlust': return this.openPl(p);
          default: return null;
        }
      }
      case 'Strategie': {
        const live = this.insts.filter((i) => i.alive);
        switch (prop) {
          case 'bezeichnung': return this.input.strategy.name;
          case 'beschreibung': return this.input.strategy.description;
          case 'wartende_orders': return live.filter((i) => i.order.status === 'wartend').length;
          case 'offene_positionen': return live.filter((i) => i.position !== null).length;
          default: return null;
        }
      }
      default: return null;
    }
  }

  eval(e: Expr, shift: number): Val {
    switch (e.t) {
      case 'num': return e.v;
      case 'str': return e.v;
      case 'bool': return e.v;
      case 'ref': return this.prop(e.obj, e.prop, shift);
      case 'sp': return this.paramValue(e.id);
      case 'par': return this.rulePars[e.id] ?? null;
      case 'neg': { const v = this.eval(e.e, shift); return typeof v === 'number' ? -v : null; }
      case 'bin': return this.binary(e.op, this.eval(e.l, shift), this.eval(e.r, shift));
      case 'cross': {
        const up = this.crossing(e.a, e.b, 'up', shift);
        const down = this.crossing(e.a, e.b, 'down', shift);
        if (e.dir === 'up') return up;
        if (e.dir === 'down') return down;
        if (up === true || down === true) return true;
        return up === null && down === null ? null : false;
      }
      case 'call': return this.call(e.fn, e.args, shift);
      default: return null;
    }
  }

  private crossing(a: Expr, b: Expr, dir: 'up' | 'down', shift: number): Val {
    const pa = this.eval(a, shift + 1);
    const pb = this.eval(b, shift + 1);
    const na = this.eval(a, shift);
    const nb = this.eval(b, shift);
    if (typeof pa !== 'number' || typeof pb !== 'number' || typeof na !== 'number' || typeof nb !== 'number') return null;
    return dir === 'up' ? pa <= pb && na > nb : pa >= pb && na < nb;
  }

  private binary(op: string, l: Val, r: Val): Val {
    if (l === null || r === null) return null;
    switch (op) {
      case '=': return typeof l === 'number' && typeof r === 'number' ? approxEq(l, r) : l === r;
      case '<>': return typeof l === 'number' && typeof r === 'number' ? !approxEq(l, r) : l !== r;
      case '&': return `${String(l)}${String(r)}`;
      default: break;
    }
    if (typeof l !== 'number' || typeof r !== 'number') return null;
    switch (op) {
      case '>': return l > r;
      case '>=': return l >= r || approxEq(l, r);
      case '<': return l < r;
      case '<=': return l <= r || approxEq(l, r);
      case '+': return l + r;
      case '-': return l - r;
      case '*': return l * r;
      case '/': return r === 0 ? null : l / r;
      case '^': return Math.pow(l, r);
      default: return null;
    }
  }

  private call(fn: string, args: Expr[], shift: number): Val {
    const ev = (x: Expr | undefined) => (x ? this.eval(x, shift) : null);
    switch (fn) {
      case 'IF': { const c = ev(args[0]); return c === true ? ev(args[1]) : c === false ? ev(args[2]) : null; }
      case 'AND': {
        let unknown = false;
        for (const a of args) { const v = ev(a); if (v === false) return false; if (v !== true) unknown = true; }
        return unknown ? null : true;
      }
      case 'OR': {
        let unknown = false;
        for (const a of args) { const v = ev(a); if (v === true) return true; if (v !== false) unknown = true; }
        return unknown ? null : false;
      }
      case 'NOT': { const v = ev(args[0]); return typeof v === 'boolean' ? !v : null; }
      case 'MIN': case 'MAX': {
        const vs = args.map((a) => ev(a));
        if (vs.some((v) => typeof v !== 'number')) return null;
        return fn === 'MIN' ? Math.min(...(vs as number[])) : Math.max(...(vs as number[]));
      }
      case 'ABS': { const v = ev(args[0]); return typeof v === 'number' ? Math.abs(v) : null; }
      case 'FLOOR': case 'CEILING': {
        const v = ev(args[0]);
        const st = ev(args[1]);
        if (typeof v !== 'number' || typeof st !== 'number' || st <= 0) return null;
        return fn === 'FLOOR' ? fl(v, st) : Math.round(Math.ceil(v / st - 1e-9) * st * 1e6) / 1e6;
      }
      case 'ISNA': return ev(args[0]) === null;
      case 'ISBLANK': return ev(args[0]) === null;
      case 'IFNA': { const v = ev(args[0]); return v === null ? ev(args[1]) : v; }
      case 'PREVIOUS': return args[0] ? this.eval(args[0], shift + 1) : null;
      case 'TRUE': return true;
      case 'FALSE': return false;
      default: return null;
    }
  }

  // ---- account ----

  spread(): number {
    const a = this.input.account;
    if (a.spreadMode === 'fixed') return a.spreadFixed * this.input.instr.pip;
    return this.tick.ask - this.tick.bid;
  }

  private perLot(dist: number): number {
    return (dist / this.input.instr.tickgroesse) * this.input.instr.tickwert;
  }

  openPl(p: PositionState): number {
    const gross = p.dir === 'buy' ? this.perLot(this.tick.bid - p.entry) : this.perLot(p.entry - this.tick.ask);
    return gross * p.vol;
  }

  equity(): number {
    let eq = this.balance;
    for (const i of this.insts) if (i.alive && i.position) eq += this.openPl(i.position) - i.position.commission * 0;
    return eq;
  }

  usedMargin(): number {
    let m = 0;
    for (const i of this.insts) {
      if (i.alive && i.position) m += (i.position.vol * this.input.instr.kontraktgroesse * i.position.entry) / this.input.account.leverage;
    }
    return m;
  }

  // ---- world records ----

  private view(i: Inst): InstView {
    const o = i.order;
    return {
      id: o.id, tag: o.tag, status: o.status, type: o.type, dir: o.dir, vol: o.vol, price: o.price, sl: i.position ? i.position.sl : o.sl,
      tp: i.position ? i.position.tp : o.tp, entry: i.position ? i.position.entry : null, posOpen: i.position !== null,
    };
  }

  private world(): void {
    if (!this.input.trace) return;
    this.out.worlds.push({ seq: this.seq(), t: this.now, balance: this.balance, insts: this.insts.filter((i) => i.alive || i.order.status !== 'wartend').slice(-40).map((i) => this.view(i)) });
  }

  private event(ev: Omit<ChartEvent, 'seq' | 't'>): void {
    if (!this.input.trace) return;
    this.out.events.push({ seq: this.seq(), t: this.now, ...ev });
  }

  // ---- broker ----

  private reject(el: El, order: { dir: 'buy' | 'sell' | null; price: number | null }, reason: Txt): void {
    this.out.rejections.push({ t: this.now, el: el.id, elName: el.name, dir: order.dir, price: order.price, reason });
    this.event({ kind: 'rejected', orderId: null, dir: order.dir, price: order.price, text: reason });
  }

  private ruleSets(el: El): RuleInst[] {
    return [...this.input.strategy.rules, ...el.rules];
  }

  /** Applies the rules to an order. Returns the volume determined by a rule and, if a rule is violated, the reason. */
  private applyRules(el: El, o: OrderState, checkOnly: boolean): { vol: number | null; fail: Txt | null } {
    const ins = this.input.instr;
    let vol: number | null = null;
    for (const r of this.ruleSets(el)) {
      if (r.builtin === BUILTIN_RISK_ID) {
        const lim = (r.params.risikogrenze as { v?: number } | undefined)?.v ?? 0.01;
        const px = o.price ?? (o.dir === 'buy' ? this.tick.ask : this.tick.bid);
        if (o.sl === null) return { vol, fail: T(`Regel „${r.name}“: Ohne Stop-Loss lässt sich das Risiko nicht begrenzen.`, `Rule "${r.name}": without a stop loss the risk cannot be limited.`) };
        const dist = o.dir === 'buy' ? px - o.sl : o.sl - px;
        if (dist <= 0) {
          return {
            vol,
            fail: T(
              `Regel „${r.name}“: Der Stop-Loss ${fmtNum(o.sl, ins.digits, 'de')} liegt nicht auf der Verlustseite des Preises ${fmtNum(px, ins.digits, 'de')}. Das Volumen lässt sich nicht berechnen.`,
              `Rule "${r.name}": the stop loss ${fmtNum(o.sl, ins.digits, 'en')} is not on the loss side of the price ${fmtNum(px, ins.digits, 'en')}. The volume cannot be calculated.`,
            ),
          };
        }
        const perLot = this.perLot(dist);
        const money = lim * this.equity();
        if (checkOnly) {
          if (o.vol * perLot > money * (1 + 1e-9)) {
            return {
              vol,
              fail: T(
                `Regel „${r.name}“: Mit dem Volumen ${fmtNum(o.vol, 2, 'de')} würde der Verlust bis zum neuen Stop-Loss ${fmtNum(o.vol * perLot, 2, 'de')} betragen, erlaubt sind ${fmtNum(money, 2, 'de')}.`,
                `Rule "${r.name}": with volume ${fmtNum(o.vol, 2, 'en')} the loss up to the new stop loss would be ${fmtNum(o.vol * perLot, 2, 'en')}, allowed is ${fmtNum(money, 2, 'en')}.`,
              ),
            };
          }
        } else {
          vol = fl(money / perLot, ins.volumenschritt);
        }
      }
    }
    if (vol !== null) o.vol = vol;
    // rules with an expression must be true for the order
    const prev = this.newOrder;
    this.newOrder = o;
    try {
      for (const r of this.ruleSets(el)) {
        if (r.builtin === BUILTIN_RISK_ID || r.e.t === 'empty') continue;
        const v = this.eval(r.e, 0);
        if (v !== true) {
          if (r.name === 'Mindestvolumen') {
            return {
              vol,
              fail: T(
                `Regel „${r.name}“: Das Volumen ${fmtNum(o.vol, 2, 'de')} liegt unter dem Mindestvolumen ${fmtNum(ins.mindestvolumen, 2, 'de')} des Instruments. Der Trade ist nicht handelbar.`,
                `Rule "${r.name}": the volume ${fmtNum(o.vol, 2, 'en')} is below the minimum volume ${fmtNum(ins.mindestvolumen, 2, 'en')} of the instrument. The trade cannot be traded.`,
              ),
            };
          }
          return { vol, fail: T(`Regel „${r.name}“ ist nicht erfüllt.`, `Rule "${r.name}" is not satisfied.`) };
        }
      }
    } finally {
      this.newOrder = prev;
    }
    return { vol, fail: null };
  }

  private brokerCheck(o: OrderState, market: boolean): Txt | null {
    const ins = this.input.instr;
    const d = ins.digits;
    const ask = this.tick.ask;
    const bid = this.tick.bid;
    const px = o.price ?? (o.dir === 'buy' ? ask : bid);
    if (!market && o.type === 'StopOrder') {
      if (o.dir === 'buy' && px <= ask) {
        return T(
          `Der Broker lehnt ab: Eine Kauf-Stop-Order muss über dem aktuellen Kurs liegen. Preis ${fmtNum(px, d, 'de')}, aktueller Kurs ${fmtNum(ask, d, 'de')}.`,
          `The broker rejects: a buy stop order must be above the current price. Price ${fmtNum(px, d, 'en')}, current price ${fmtNum(ask, d, 'en')}.`,
        );
      }
      if (o.dir === 'sell' && px >= bid) {
        return T(
          `Der Broker lehnt ab: Eine Verkaufs-Stop-Order muss unter dem aktuellen Kurs liegen. Preis ${fmtNum(px, d, 'de')}, aktueller Kurs ${fmtNum(bid, d, 'de')}.`,
          `The broker rejects: a sell stop order must be below the current price. Price ${fmtNum(px, d, 'en')}, current price ${fmtNum(bid, d, 'en')}.`,
        );
      }
    }
    if (o.sl !== null && ((o.dir === 'buy' && o.sl >= px) || (o.dir === 'sell' && o.sl <= px))) {
      return T(
        `Der Broker lehnt ab: Der Stop-Loss ${fmtNum(o.sl, d, 'de')} liegt nicht auf der Verlustseite des Preises ${fmtNum(px, d, 'de')}.`,
        `The broker rejects: the stop loss ${fmtNum(o.sl, d, 'en')} is not on the loss side of the price ${fmtNum(px, d, 'en')}.`,
      );
    }
    if (o.tp !== null && ((o.dir === 'buy' && o.tp <= px) || (o.dir === 'sell' && o.tp >= px))) {
      return T(
        `Der Broker lehnt ab: Der Take-Profit ${fmtNum(o.tp, d, 'de')} liegt nicht auf der Gewinnseite des Preises ${fmtNum(px, d, 'de')}.`,
        `The broker rejects: the take profit ${fmtNum(o.tp, d, 'en')} is not on the profit side of the price ${fmtNum(px, d, 'en')}.`,
      );
    }
    if (o.vol < ins.mindestvolumen - 1e-9) {
      return T(`Der Broker lehnt ab: Das Volumen ${fmtNum(o.vol, 2, 'de')} liegt unter dem Mindestvolumen.`, `The broker rejects: the volume ${fmtNum(o.vol, 2, 'en')} is below the minimum volume.`);
    }
    if (o.vol > 100) {
      return T('Der Broker lehnt ab: Das Volumen liegt über dem Höchstvolumen von 100.', 'The broker rejects: the volume is above the maximum volume of 100.');
    }
    const need = (o.vol * ins.kontraktgroesse * px) / this.input.account.leverage;
    const free = this.equity() - this.usedMargin();
    if (need > free) {
      return T(
        `Der Broker lehnt ab: Nicht genug freie Margin. Benötigt ${fmtNum(need, 2, 'de')} ${this.input.account.currency}, frei ${fmtNum(Math.max(0, free), 2, 'de')} ${this.input.account.currency}.`,
        `The broker rejects: not enough free margin. Needed ${fmtNum(need, 2, 'en')} ${this.input.account.currency}, free ${fmtNum(Math.max(0, free), 2, 'en')} ${this.input.account.currency}.`,
      );
    }
    return null;
  }

  private openPosition(inst: Inst, price: number): void {
    const o = inst.order;
    const ins = this.input.instr;
    const comm = this.input.account.commission * o.vol;
    this.balance -= comm;
    o.status = 'ausgefuehrt';
    inst.position = {
      dir: o.dir, vol: o.vol, entry: price, sl: o.sl, tp: o.tp, openedAt: this.now, commission: comm,
      spreadCost: this.perLot(this.tick.ask - this.tick.bid) * o.vol,
    };
    this.event({
      kind: 'filled', orderId: o.id, dir: o.dir, price,
      text: T(`Order ${o.tag} ausgeführt zu ${fmtNum(price, ins.digits, 'de')}`, `Order ${o.tag} filled at ${fmtNum(price, ins.digits, 'en')}`),
    });
  }

  private closePosition(inst: Inst, price: number, reason: Trade['reason']): void {
    const p = inst.position;
    if (!p) return;
    const ins = this.input.instr;
    const gross = (p.dir === 'buy' ? this.perLot(price - p.entry) : this.perLot(p.entry - price)) * p.vol;
    const commClose = this.input.account.commission * p.vol;
    this.balance += gross - commClose;
    const comm = p.commission + commClose;
    this.out.trades.push({
      id: this.nextTrade++, orderTag: inst.order.tag, dir: p.dir, vol: p.vol, openT: p.openedAt, closeT: this.now, entry: p.entry, exit: price, sl: p.sl, tp: p.tp,
      profit: gross - comm, cost: comm + p.spreadCost, commission: comm, reason,
    });
    this.event({
      kind: 'closed', orderId: inst.order.id, dir: p.dir, price,
      text: T(
        `Position ${inst.order.tag} geschlossen bei ${fmtNum(price, ins.digits, 'de')} (${reason === 'sl' ? 'Stop-Loss' : reason === 'tp' ? 'Take-Profit' : reason === 'end' ? 'Testende' : 'durch die Strategie'})`,
        `Position ${inst.order.tag} closed at ${fmtNum(price, ins.digits, 'en')} (${reason === 'sl' ? 'stop loss' : reason === 'tp' ? 'take profit' : reason === 'end' ? 'end of test' : 'by the strategy'})`,
      ),
    });
    inst.position = null;
    inst.alive = false;
  }

  // ---- per tick ----

  private processTick(): void {
    const tk = this.tick;
    for (const inst of this.insts) {
      if (!inst.alive) continue;
      const o = inst.order;
      if (o.status === 'wartend' && o.price !== null) {
        if (o.dir === 'buy' && tk.ask >= o.price) {
          this.openPosition(inst, Math.max(o.price, tk.ask));
          this.world();
        } else if (o.dir === 'sell' && tk.bid <= o.price) {
          this.openPosition(inst, Math.min(o.price, tk.bid));
          this.world();
        }
      }
      const p = inst.position;
      if (p) {
        let hit: 'sl' | 'tp' | null = null;
        if (p.dir === 'buy') {
          if (p.sl !== null && tk.bid <= p.sl) hit = 'sl';
          else if (p.tp !== null && tk.bid >= p.tp) hit = 'tp';
        } else if (p.sl !== null && tk.ask >= p.sl) hit = 'sl';
        else if (p.tp !== null && tk.ask <= p.tp) hit = 'tp';
        if (hit) {
          this.closePosition(inst, hit === 'sl' ? (p.sl as number) : (p.tp as number), hit);
          this.world();
        }
      }
    }
  }

  // ---- flows ----

  private fieldVals(el: El, ids: string[]): Record<string, Val> {
    const out: Record<string, Val> = {};
    for (const id of ids) out[id] = this.bindingValue(el, id);
    return out;
  }

  private exec(el: El, inst: Inst | null): StepRec {
    const step: StepRec = { seq: this.seq(), end: 0, el: el.id, out: null };
    const ins = this.input.instr;
    const d = ins.digits;
    switch (el.type) {
      case 'trigger.candle_close':
      case 'trigger.tick':
        step.out = 'weiter';
        break;
      case 'flow.condition': {
        const b = el.bind.ausdruck;
        const v = b && b.k === 'expr' ? this.eval(b.e, 0) : null;
        const ok = v === true;
        step.value = ok;
        step.noValue = v === null;
        step.out = ok ? 'wahr' : 'falsch';
        if (v === null) {
          step.note = T(
            'Mindestens ein verwendeter Wert ist noch nicht vorhanden (zum Beispiel weil ein Indikator noch keine Werte hat). Die Bedingung gilt als nicht erfüllt.',
            'At least one value used is not available yet (for example because an indicator has no values yet). The condition counts as not satisfied.',
          );
        }
        this.results.set(el.id, ok);
        break;
      }
      case 'flow.calculation': {
        const b = el.bind.ausdruck;
        const v = b && b.k === 'expr' ? this.eval(b.e, 0) : null;
        step.value = v;
        step.out = 'weiter';
        if (v === null) step.note = T('Das Ergebnis ist nicht verfügbar, weil ein verwendeter Wert fehlt.', 'The result is not available because a value used is missing.');
        this.results.set(el.id, v);
        break;
      }
      case 'flow.set_parameter': {
        const sp = el.bind.strategieparameter;
        const v = this.bindingValue(el, 'ausdruck');
        if (sp && sp.k === 'param' && v !== null) this.params[sp.id] = v as string | number | boolean;
        step.out = 'weiter';
        break;
      }
      case 'flow.place_order': this.execPlace(el, step); break;
      case 'flow.modify_order': this.execModifyOrder(el, step, inst); break;
      case 'flow.delete_order': {
        step.out = 'weiter';
        if (inst && inst.order.status === 'wartend') {
          inst.order.status = 'geloescht';
          inst.alive = false;
          step.effect = T(`Order ${inst.order.tag} gelöscht.`, `Order ${inst.order.tag} deleted.`);
          this.event({ kind: 'deleted', orderId: inst.order.id, dir: inst.order.dir, price: inst.order.price, text: step.effect });
          this.world();
        } else step.note = T('Keine wartende Order vorhanden.', 'No pending order exists.');
        break;
      }
      case 'flow.modify_position': {
        const vals = this.fieldVals(el, ['stop_loss', 'take_profit']);
        step.vals = vals;
        const p = inst?.position ?? null;
        if (!inst || !p) {
          step.out = 'nicht_geaendert';
          step.reject = T('Es gibt keine offene Position.', 'There is no open position.');
          break;
        }
        const sl = typeof vals.stop_loss === 'number' ? vals.stop_loss : p.sl;
        const tp = typeof vals.take_profit === 'number' ? vals.take_profit : p.tp;
        const bad = (p.dir === 'buy' && sl !== null && sl >= this.tick.bid) || (p.dir === 'sell' && sl !== null && sl <= this.tick.ask);
        if (bad) {
          step.out = 'nicht_geaendert';
          step.reject = T(`Der Broker lehnt ab: Der neue Stop-Loss ${fmtNum(sl as number, d, 'de')} liegt nicht auf der Verlustseite des Kurses.`, `The broker rejects: the new stop loss ${fmtNum(sl as number, d, 'en')} is not on the loss side of the price.`);
          this.out.rejections.push({ t: this.now, el: el.id, elName: el.name, dir: p.dir, price: sl, reason: step.reject });
          this.event({ kind: 'rejected', orderId: inst.order.id, dir: p.dir, price: sl, text: step.reject });
          break;
        }
        p.sl = sl;
        p.tp = tp;
        step.out = 'geaendert';
        step.effect = T(`Position ${inst.order.tag}: Stop-Loss ${sl === null ? '–' : fmtNum(sl, d, 'de')}, Take-Profit ${tp === null ? '–' : fmtNum(tp, d, 'de')}.`, `Position ${inst.order.tag}: stop loss ${sl === null ? '–' : fmtNum(sl, d, 'en')}, take profit ${tp === null ? '–' : fmtNum(tp, d, 'en')}.`);
        this.event({ kind: 'modified', orderId: inst.order.id, dir: p.dir, price: sl, sl, tp, text: step.effect });
        this.world();
        break;
      }
      case 'flow.close_position': {
        step.out = 'weiter';
        const p = inst?.position ?? null;
        if (inst && p) {
          const px = p.dir === 'buy' ? this.tick.bid : this.tick.ask;
          this.closePosition(inst, px, 'strategy');
          step.effect = T(`Position ${inst.order.tag} geschlossen bei ${fmtNum(px, d, 'de')}.`, `Position ${inst.order.tag} closed at ${fmtNum(px, d, 'en')}.`);
          this.world();
        } else step.note = T('Es gibt keine offene Position.', 'There is no open position.');
        break;
      }
      default: break;
    }
    return step;
  }

  private execPlace(el: El, step: StepRec): void {
    const ins = this.input.instr;
    const d = ins.digits;
    const type = String((el.bind.ordertyp as { v?: string } | undefined)?.v ?? 'MarketOrder');
    const vals = this.fieldVals(el, ['richtung', 'volumen', 'preis', 'stop_loss', 'take_profit']);
    const dir = vals.richtung === 'buy' || vals.richtung === 'sell' ? vals.richtung : null;
    step.vals = { ...vals, ordertyp: type };
    const num = (v: Val): number | null => (typeof v === 'number' ? v : null);
    if (dir === null) {
      step.out = 'nicht_gestellt';
      step.reject = T('Die Richtung der Order ist nicht bestimmt (buy oder sell erwartet).', 'The direction of the order is not defined (buy or sell expected).');
      this.reject(el, { dir: null, price: null }, step.reject);
      return;
    }
    const market = type === 'MarketOrder';
    const o: OrderState = {
      id: this.nextInst, tag: `#${this.nextInst}`, elId: el.id, type, dir, vol: num(vals.volumen) ?? 0, price: market ? null : num(vals.preis),
      sl: num(vals.stop_loss), tp: num(vals.take_profit), status: 'wartend', placedAt: this.now,
    };
    if (!market && o.price === null) {
      step.out = 'nicht_gestellt';
      step.reject = T('Der Preis der Order ist nicht bestimmt.', 'The price of the order is not defined.');
      this.reject(el, { dir, price: null }, step.reject);
      return;
    }
    const rules = this.applyRules(el, o, false);
    step.vals = { ...step.vals, volumen: o.vol > 0 ? o.vol : null };
    if (rules.fail) {
      step.out = 'nicht_gestellt';
      step.reject = rules.fail;
      this.reject(el, { dir, price: o.price ?? (dir === 'buy' ? this.tick.ask : this.tick.bid) }, rules.fail);
      return;
    }
    if (o.vol <= 0) {
      step.out = 'nicht_gestellt';
      step.reject = T('Das Volumen ist nicht bestimmt: Keine Regel und keine Angabe liefert ein Volumen größer null.', 'The volume is not defined: no rule and no entry yields a volume above zero.');
      this.reject(el, { dir, price: o.price }, step.reject);
      return;
    }
    const broker = this.brokerCheck(o, market);
    if (broker) {
      step.out = 'nicht_gestellt';
      step.reject = broker;
      this.reject(el, { dir, price: o.price ?? (dir === 'buy' ? this.tick.ask : this.tick.bid) }, broker);
      return;
    }
    const inst: Inst = { id: this.nextInst++, order: o, position: null, alive: true };
    this.insts.push(inst);
    step.out = 'gestellt';
    const typeDe = market ? 'Marktorder' : type === 'StopOrder' ? 'Stop-Order' : type;
    const typeEn = market ? 'market order' : type === 'StopOrder' ? 'stop order' : type;
    const priceTxt = o.price === null ? T('zum aktuellen Kurs', 'at the current price') : T(`Preis ${fmtNum(o.price, d, 'de')}`, `price ${fmtNum(o.price, d, 'en')}`);
    step.effect = T(
      `Order ${o.tag} gestellt: ${dir === 'buy' ? 'Kauf' : 'Verkauf'} ${typeDe}, Volumen ${fmtNum(o.vol, 2, 'de')}, ${priceTxt.de}.`,
      `Order ${o.tag} placed: ${dir === 'buy' ? 'buy' : 'sell'} ${typeEn}, volume ${fmtNum(o.vol, 2, 'en')}, ${priceTxt.en}.`,
    );
    this.event({ kind: 'placed', orderId: o.id, dir, price: o.price ?? (dir === 'buy' ? this.tick.ask : this.tick.bid), sl: o.sl, tp: o.tp, text: step.effect });
    if (market) this.openPosition(inst, dir === 'buy' ? this.tick.ask : this.tick.bid);
    this.world();
  }

  private execModifyOrder(el: El, step: StepRec, inst: Inst | null): void {
    const d = this.input.instr.digits;
    const vals = this.fieldVals(el, ['preis', 'stop_loss', 'take_profit']);
    step.vals = vals;
    if (!inst || inst.order.status !== 'wartend') {
      step.out = 'nicht_geaendert';
      step.reject = T('Die Order wartet nicht mehr und lässt sich nicht ändern.', 'The order is no longer pending and cannot be modified.');
      return;
    }
    const o = inst.order;
    const trial: OrderState = {
      ...o,
      price: typeof vals.preis === 'number' ? vals.preis : o.price,
      sl: typeof vals.stop_loss === 'number' ? vals.stop_loss : o.sl,
      tp: typeof vals.take_profit === 'number' ? vals.take_profit : o.tp,
    };
    const rules = this.applyRules(el, trial, true);
    const fail = rules.fail ?? this.brokerCheck(trial, false);
    if (fail) {
      step.out = 'nicht_geaendert';
      step.reject = fail;
      this.out.rejections.push({ t: this.now, el: el.id, elName: el.name, dir: o.dir, price: trial.sl, reason: fail });
      this.event({ kind: 'rejected', orderId: o.id, dir: o.dir, price: trial.sl, text: fail });
      return;
    }
    o.price = trial.price;
    o.sl = trial.sl;
    o.tp = trial.tp;
    step.out = 'geaendert';
    step.effect = T(
      `Order ${o.tag} geändert: Stop-Loss ${o.sl === null ? '–' : fmtNum(o.sl, d, 'de')}, Take-Profit ${o.tp === null ? '–' : fmtNum(o.tp, d, 'de')}.`,
      `Order ${o.tag} modified: stop loss ${o.sl === null ? '–' : fmtNum(o.sl, d, 'en')}, take profit ${o.tp === null ? '–' : fmtNum(o.tp, d, 'en')}.`,
    );
    this.event({ kind: 'modified', orderId: o.id, dir: o.dir, price: o.price, sl: o.sl, tp: o.tp, text: step.effect });
    this.world();
  }

  private runFlow(trig: El, inst: Inst | null, kind: 'candle' | 'tick', tf: string | null): void {
    const trace = this.input.trace;
    const prevCur = this.cur;
    this.cur = inst;
    const rec: EvalRec | null = trace
      ? {
        id: this.out.evals.length, seq0: this.seqNo + 1, t: this.now, kind, trig: trig.id, tf, flow: trig.mgmt ?? null, inst: inst ? inst.order.id : null, steps: [], acting: false,
        bid: this.tick.bid, ask: this.tick.ask,
      }
      : null;
    let el: El | undefined = trig;
    let guard = 0;
    while (el && guard++ < 80) {
      const step = this.exec(el, inst);
      step.end = this.seqNo;
      if (rec) {
        rec.steps.push(step);
        if (isActing(el.type)) rec.acting = true;
      }
      if (!step.out) break;
      const c = this.input.strategy.conns.find((x) => x.from === (el as El).id && x.out === step.out);
      el = c ? this.byId.get(c.to) : undefined;
    }
    if (rec) this.out.evals.push(rec);
    this.cur = prevCur;
  }

  /** Runs the test. Yields progress; the result is the return value. */
  *run(chunk = 3000): Generator<Progress, RunOutput> {
    const { from, to, account } = this.input;
    const bars = this.bars;
    const b0 = lowerBound(bars.t, from, bars.n);
    const b1 = lowerBound(bars.t, to + DAY, bars.n);
    const total = b1 - b0;
    const ticks: Tick[] = [{ t: 0, bid: 0, ask: 0 }, { t: 0, bid: 0, ask: 0 }, { t: 0, bid: 0, ask: 0 }, { t: 0, bid: 0, ask: 0 }];
    const mainTf = this.mainTriggers.find((t) => t.type === 'trigger.candle_close');
    const defaultTf = (mainTf ? this.tfOfEl(mainTf) : null) ?? 'h1';
    this.tfNow = defaultTf;
    // time frames that close: all candle triggers of the main flow and of the management frames
    const tfOf = (t: El): string => this.tfOfEl(t) ?? defaultTf;
    const fixedSpread = account.spreadMode === 'fixed' ? account.spreadFixed * this.input.instr.pip : null;
    let lastEq = account.capital;
    if (this.input.trace && this.input.manualStart) {
      this.now = bars.t[b0] ?? from;
      this.tick = { t: this.now, bid: bars.o[b0], ask: bars.o[b0] + (fixedSpread ?? bars.sp[b0] * this.spreadFactor) };
      this.out.evals.push({
        id: 0, seq0: this.seq(), t: this.now, kind: 'manual', trig: null, tf: null, flow: null, inst: null, steps: [], acting: false, bid: this.tick.bid, ask: this.tick.ask,
      });
    }
    this.world();
    for (let j = b0; j < b1; j++) {
      ticksOfBar(bars, j, this.spreadFactor, fixedSpread, ticks);
      for (let k = 0; k < 4; k++) {
        this.tick = ticks[k];
        this.now = ticks[k].t;
        this.processTick();
        // tick triggers: management of live orders first, then the main flow
        for (const inst of this.insts) {
          if (!inst.alive) continue;
          const trs = this.mgmtTriggers.get(inst.order.elId);
          if (!trs) continue;
          for (const tr of trs) if (tr.type === 'trigger.tick' && inst.alive) { this.tfNow = defaultTf; this.runFlow(tr, inst, 'tick', null); }
        }
        for (const tr of this.mainTriggers) if (tr.type === 'trigger.tick') { this.tfNow = defaultTf; this.runFlow(tr, null, 'tick', null); }
      }
      // candle close at the end of the base candle
      const end = bars.t[j] + BASE_MIN * MIN;
      this.now = end;
      this.tick = ticks[3];
      for (const inst of [...this.insts]) {
        if (!inst.alive) continue;
        const trs = this.mgmtTriggers.get(inst.order.elId);
        if (!trs) continue;
        for (const tr of trs) {
          if (tr.type !== 'trigger.candle_close' || !inst.alive) continue;
          const tf = tfOf(tr);
          const mins = (this.series(tf).mins) * MIN;
          if (end % mins !== 0) continue;
          this.tfNow = tf;
          this.runFlow(tr, inst, 'candle', tf);
        }
      }
      for (const tr of this.mainTriggers) {
        if (tr.type !== 'trigger.candle_close') continue;
        const tf = tfOf(tr);
        const mins = (this.series(tf).mins) * MIN;
        if (end % mins !== 0) continue;
        this.tfNow = tf;
        this.runFlow(tr, null, 'candle', tf);
      }
      // hourly equity sample
      if (end % (60 * MIN) === 0 || j === b1 - 1) {
        lastEq = this.equity();
        this.out.equity.push({ t: end, eq: lastEq });
      }
      if ((j - b0) % chunk === chunk - 1) yield { done: j - b0 + 1, total, t: end, trades: this.out.trades.length, equity: lastEq };
    }
    // the end of the test period: open positions are closed at the last price
    this.now = bars.t[b1 - 1] + BASE_MIN * MIN;
    for (const inst of this.insts) {
      if (inst.alive && inst.position) {
        this.closePosition(inst, inst.position.dir === 'buy' ? this.tick.bid : this.tick.ask, 'end');
      }
    }
    this.out.endBalance = this.balance;
    if (this.out.equity.length) this.out.equity[this.out.equity.length - 1].eq = this.balance;
    return this.out;
  }

  /** Values of an object at a given time (for the replay), independent of the run position. */
  valueAt(obj: string, prop: string, now: number, tf: string, shift = 0): Val {
    const keepNow = this.now;
    const keepTf = this.tfNow;
    const keepCur = this.cur;
    this.now = now;
    this.tfNow = tf;
    this.cur = null;
    try {
      return this.prop(obj, prop, shift);
    } finally {
      this.now = keepNow;
      this.tfNow = keepTf;
      this.cur = keepCur;
    }
  }
}

export function runSync(input: RunInput): RunOutput {
  const eng = new Engine(input);
  const it = eng.run(1e9);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

// ---- summary of a backtest ------------------------------------------------------------------------

export interface Summary {
  net: number;
  trades: number;
  wins: number;
  hitRate: number | null;
  profitFactor: number | null;
  maxDd: number;
  maxDdPct: number;
  avgWin: number | null;
  avgLoss: number | null;
  rejected: number;
  endBalance: number;
}

export function summarize(out: { trades: Trade[]; rejections: Rejection[]; equity: EquityPoint[]; startCapital: number; endBalance: number }): Summary {
  const wins = out.trades.filter((t) => t.profit > 0);
  const losses = out.trades.filter((t) => t.profit <= 0);
  const gw = wins.reduce((a, t) => a + t.profit, 0);
  const gl = -losses.reduce((a, t) => a + t.profit, 0);
  let peak = out.startCapital;
  let maxDd = 0;
  let maxDdPct = 0;
  for (const p of out.equity) {
    if (p.eq > peak) peak = p.eq;
    const dd = peak - p.eq;
    if (dd > maxDd) maxDd = dd;
    if (peak > 0 && dd / peak > maxDdPct) maxDdPct = dd / peak;
  }
  return {
    net: out.endBalance - out.startCapital,
    trades: out.trades.length,
    wins: wins.length,
    hitRate: out.trades.length ? wins.length / out.trades.length : null,
    profitFactor: gl > 0 ? gw / gl : gw > 0 ? Infinity : null,
    maxDd, maxDdPct,
    avgWin: wins.length ? gw / wins.length : null,
    avgLoss: losses.length ? -gl / losses.length : null,
    rejected: out.rejections.length,
    endBalance: out.endBalance,
  };
}

/** Drawdown from the running peak for each equity point. */
export function drawdownSeries(eq: EquityPoint[], start: number): { t: number; dd: number }[] {
  let peak = start;
  return eq.map((p) => {
    if (p.eq > peak) peak = p.eq;
    return { t: p.t, dd: peak - p.eq };
  });
}
