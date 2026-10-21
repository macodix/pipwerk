// Strategies, test accounts and the simulated data stock of historical price data, with the check
// that runs before a test run (req-test-003) and the simulated procurement and import.
import { isTrigger } from './catalog';
import { sampleStrategies } from './samples';
import { newEl } from './factory';
import type { Strategy, Txt } from './model';
import { clone } from './model';
import { BROKERS, DAY, LAST_DAY, TF_MINUTES, isoDate, parseIsoDate, tfSupported } from './sim/market';
import type { AccountVals } from './sim/engine';

const T = (de: string, en: string): Txt => ({ de, en });

// ---- strategies -----------------------------------------------------------------------------------

export interface StrategyEntry {
  id: string;
  strategy: Strategy;
  badge: Txt;
}

export function strategyEntries(): StrategyEntry[] {
  const list = sampleStrategies();
  const by = (s: string) => list.find((x) => x.sample === s) as Strategy;
  const example = clone(by('str03'));
  example.id = 'sample-beispiel';
  example.sample = 'beispiel';
  example.name = 'EMA-Trendfolge mit Vergleichsinstrument';
  example.description = 'Beispiel für einen Strategieparameter vom Typ Instrument: wie der Testfall str-03, dazu ein Vergleichsinstrument, dessen Kursdaten der Testlauf ebenfalls braucht.';
  example.params.push({ id: 'p-vergl', name: 'Vergleichsinstrument', dtype: 'instrument', value: 'GBPUSD', atApplication: false });
  // a trigger "Manual" in the main flow, so that the setting "Trigger Manual" can be tried out
  const manual = newEl('trigger.manual', 'Manuell', { id: 'trg-man' });
  example.els.push(manual);
  example.conns.push({ from: 'trg-man', out: 'weiter', to: 'richtung' });
  example.sections.find((x) => x.id === 'sec-1')?.els.push('trg-man');
  return [
    { id: by('auftraggeber').id, strategy: by('auftraggeber'), badge: T('Ihre Strategie', 'Your strategy') },
    { id: by('str03').id, strategy: by('str03'), badge: T('Testfall str-03', 'Test case str-03') },
    { id: by('str01').id, strategy: by('str01'), badge: T('Testfall str-01', 'Test case str-01') },
    { id: example.id, strategy: example, badge: T('Beispiel', 'Example') },
  ];
}

// ---- test accounts -----------------------------------------------------------------------------------

export interface Account extends AccountVals {
  id: string;
  name: string;
  builtin?: boolean;
}

export const STANDARD_ACCOUNT: Account = {
  id: 'standard', name: 'Standard-Testkonto', capital: 10000, currency: 'USD', leverage: 30, spreadMode: 'candle', spreadFixed: 1.2, commission: 3.5, builtin: true,
};

export function accountName(a: Account, lang: 'de' | 'en'): string {
  return a.builtin && a.name === 'Standard-Testkonto' && lang === 'en' ? 'Default test account' : a.name;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];

// ---- data stock -----------------------------------------------------------------------------------------

export type Kind = 'candles' | 'ticks';

export interface DataRow {
  id: string;
  broker: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  from: string;
  to: string;
  origin: 'bestand' | 'beschaffung' | 'import';
}

const D0 = '2024-10-01';
const D1 = isoDate(LAST_DAY);
let rowNo = 0;
const row = (broker: string, instrument: string, kind: Kind, tf: string | null, from: string, to: string): DataRow => {
  rowNo += 1;
  return { id: `r${rowNo}`, broker, instrument, kind, tf, from, to, origin: 'bestand' };
};

export function initialRows(): DataRow[] {
  rowNo = 0;
  const rows: DataRow[] = [];
  for (const tf of ['m5', 'm15', 'm30', 'h1', 'h4', 'd1']) {
    // M15 of EURUSD starts later: the fetch of the missing part is shown for a backtest of str-01
    rows.push(row('b1', 'EURUSD', 'candles', tf, tf === 'm15' ? '2025-03-03' : D0, D1));
    rows.push(row('b1', 'GBPUSD', 'candles', tf, D0, D1));
    rows.push(row('b1', 'USDJPY', 'candles', tf, D0, D1));
  }
  rows.push(row('b1', 'EURUSD', 'ticks', null, '2025-06-02', D1));
  rows.push(row('b1', 'GBPUSD', 'ticks', null, '2026-07-01', D1));
  for (const tf of ['m15', 'h1', 'd1']) rows.push(row('b1', 'XAUUSD', 'candles', tf, tf === 'm15' ? '2025-06-02' : D0, D1));
  for (const tf of ['m15', 'h1', 'd1']) rows.push(row('b2', 'EURUSD', 'candles', tf, '2025-01-02', D1));
  return rows;
}

// What the source (MetaTrader 5) can deliver. Invented limits for the prototype.
interface SourceLimit {
  candlesFrom: string;
  /** null: no ticks at all, 'days90': only the last 90 days, otherwise the first day. */
  ticksFrom: string | null | 'days90';
}
const SOURCE: Record<string, SourceLimit> = {
  EURUSD: { candlesFrom: '2023-01-02', ticksFrom: '2024-01-02' },
  GBPUSD: { candlesFrom: '2023-01-02', ticksFrom: 'days90' },
  USDJPY: { candlesFrom: '2023-01-02', ticksFrom: null },
  XAUUSD: { candlesFrom: '2024-01-02', ticksFrom: 'days90' },
};

export interface Range {
  from: number;
  to: number;
}

const rowRange = (r: DataRow): Range => ({ from: parseIsoDate(r.from), to: parseIsoDate(r.to) });

export function mergeRanges(rs: Range[]): Range[] {
  const sorted = [...rs].sort((a, b) => a.from - b.from);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.from <= last.to + DAY) last.to = Math.max(last.to, r.to);
    else out.push({ ...r });
  }
  return out;
}

export function subtract(need: Range, have: Range[]): Range[] {
  let rest: Range[] = [need];
  for (const h of mergeRanges(have)) {
    const next: Range[] = [];
    for (const r of rest) {
      if (h.to < r.from || h.from > r.to) { next.push(r); continue; }
      if (h.from > r.from) next.push({ from: r.from, to: h.from - DAY });
      if (h.to < r.to) next.push({ from: h.to + DAY, to: r.to });
    }
    rest = next;
  }
  return rest;
}

export function tradingDays(r: Range): number {
  let n = 0;
  for (let t = r.from; t <= r.to; t += DAY) {
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) n += 1;
  }
  return n;
}

export function countOf(kind: Kind, tf: string | null, r: Range): number {
  const days = tradingDays(r);
  if (kind === 'ticks') return days * 41000;
  const mins = TF_MINUTES[(tf ?? 'h1').toLowerCase()] ?? 60;
  return Math.round((days * 1440) / mins);
}

export interface Need {
  key: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  from: number;
  to: number;
  why: Txt;
}

export interface NeedResult {
  need: Need;
  status: 'present' | 'fetchable' | 'blocked';
  missing: Range[];
  fetchable: Range[];
  blocked: Range[];
  reason: Txt | null;
}

export interface RunSettings {
  strategy: Strategy;
  params: Record<string, string | number | boolean>;
  instrument: string;
  broker: string;
  from: number;
  to: number;
}

/** The time frames a strategy uses with the values of the strategy parameters of the run. */
export function usedTimeframes(strategy: Strategy, params: Record<string, string | number | boolean>): string[] {
  const out: string[] = [];
  for (const e of strategy.els) {
    const b = e.bind.zeiteinheit;
    if (!b) continue;
    const v = b.k === 'fixed' ? b.v : b.k === 'param' ? params[b.id] : undefined;
    if (typeof v === 'string' && !out.includes(v.toLowerCase())) out.push(v.toLowerCase());
  }
  return out;
}

/** Whether the strategy has the trigger "Manual" in its main flow. */
export function hasManualTrigger(strategy: Strategy): boolean {
  return strategy.els.some((e) => e.type === 'trigger.manual' && !e.mgmt);
}

export function usesTicks(strategy: Strategy): boolean {
  return strategy.els.some((e) => isTrigger(e.type) && e.type === 'trigger.tick');
}

/** The instruments of the run: the instrument of the application and every instrument parameter. */
export function runInstruments(strategy: Strategy, params: Record<string, string | number | boolean>, main: string): string[] {
  const out = [main];
  for (const p of strategy.params) {
    if (p.dtype !== 'instrument') continue;
    const v = params[p.id];
    if (typeof v === 'string' && !out.includes(v)) out.push(v);
  }
  return out;
}

export function needsFor(run: RunSettings): Need[] {
  const tfs = usedTimeframes(run.strategy, run.params);
  const instruments = runInstruments(run.strategy, run.params, run.instrument);
  const ticks = usesTicks(run.strategy);
  const needs: Need[] = [];
  for (const ins of instruments) {
    for (const tf of tfs) {
      needs.push({
        key: `c|${ins}|${tf}`, instrument: ins, kind: 'candles', tf, from: run.from, to: run.to,
        why: ins === run.instrument ? T(`Die Strategie rechnet auf ${tf.toUpperCase()}-Kerzen.`, `The strategy calculates on ${tf.toUpperCase()} candles.`) : T('Vergleichsinstrument der Strategie.', 'Comparison instrument of the strategy.'),
      });
    }
  }
  if (ticks) {
    needs.push({
      key: `t|${run.instrument}`, instrument: run.instrument, kind: 'ticks', tf: null, from: run.from, to: run.to,
      why: T('Die Verwaltung der Order hat den Auslöser „Tick“. Ticks werden nicht aus Kerzen nachgebildet.', 'The management of the order has the trigger "Tick". Ticks are not rebuilt from candles.'),
    });
  }
  return needs;
}

export function checkNeeds(run: RunSettings, rows: DataRow[]): NeedResult[] {
  return needsFor(run).map((need) => classifyNeed(need, rows, run.broker));
}

export function classifyNeed(need: Need, rows: DataRow[], broker: string): NeedResult {
  {
    const have = rows.filter((r) => r.broker === broker && r.instrument === need.instrument && r.kind === need.kind && (need.kind === 'ticks' || r.tf === need.tf)).map(rowRange);
    const missing = subtract({ from: need.from, to: need.to }, have);
    // days without trading at the edges are no gaps
    const real = missing.filter((m) => tradingDays(m) > 0);
    if (real.length === 0) return { need, status: 'present' as const, missing: [], fetchable: [], blocked: [], reason: null };
    const src = SOURCE[need.instrument];
    let limit: number | null = null;
    let reason: Txt | null = null;
    if (!src) {
      reason = T(`Die Quelle MetaTrader 5 kennt das Instrument ${need.instrument} nicht.`, `The source MetaTrader 5 does not know the instrument ${need.instrument}.`);
    } else if (need.kind === 'candles') {
      if (need.tf && !tfSupported(need.tf)) reason = T(`Die Quelle liefert keine Kerzen der Zeiteinheit ${need.tf.toUpperCase()}.`, `The source does not deliver candles of the time unit ${need.tf.toUpperCase()}.`);
      else {
        limit = parseIsoDate(src.candlesFrom);
        reason = T(`MetaTrader 5 hat Kerzen von ${need.instrument} erst ab ${src.candlesFrom}.`, `MetaTrader 5 has candles of ${need.instrument} only from ${src.candlesFrom}.`);
      }
    } else if (src.ticksFrom === null) {
      reason = T(`Der Broker stellt für ${need.instrument} keine historischen Ticks bereit.`, `The broker provides no historical ticks for ${need.instrument}.`);
    } else if (src.ticksFrom === 'days90') {
      limit = LAST_DAY - 89 * DAY;
      reason = T(`MetaTrader 5 liefert Ticks von ${need.instrument} nur für die letzten 90 Tage, also ab ${isoDate(limit)}.`, `MetaTrader 5 delivers ticks of ${need.instrument} only for the last 90 days, that is from ${isoDate(limit)}.`);
    } else {
      limit = parseIsoDate(src.ticksFrom);
      reason = T(`MetaTrader 5 hat Ticks von ${need.instrument} erst ab ${src.ticksFrom}.`, `MetaTrader 5 has ticks of ${need.instrument} only from ${src.ticksFrom}.`);
    }
    const fetchable: Range[] = [];
    const blocked: Range[] = [];
    for (const m of real) {
      if (limit === null) { blocked.push(m); continue; }
      if (m.to < limit) blocked.push(m);
      else if (m.from < limit) { blocked.push({ from: m.from, to: limit - DAY }); fetchable.push({ from: limit, to: m.to }); } else fetchable.push(m);
    }
    const blockedReal = blocked.filter((b) => tradingDays(b) > 0);
    return {
      need, status: blockedReal.length ? 'blocked' as const : 'fetchable' as const, missing: real, fetchable, blocked: blockedReal, reason: blockedReal.length ? reason : null,
    };
  }
}

export function addRows(rows: DataRow[], broker: string, results: NeedResult[]): DataRow[] {
  const out = [...rows];
  for (const r of results) {
    for (const f of r.fetchable) {
      out.push({
        id: `f${out.length + 1}-${Math.floor(f.from / DAY)}`, broker, instrument: r.need.instrument, kind: r.need.kind, tf: r.need.tf,
        from: isoDate(f.from), to: isoDate(f.to), origin: 'beschaffung',
      });
    }
  }
  return out;
}

/** The stock as it is shown: merged ranges per instrument and kind. */
export interface StockLine {
  broker: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  ranges: Range[];
  count: number;
}

export function stockLines(rows: DataRow[]): StockLine[] {
  const groups = new Map<string, DataRow[]>();
  for (const r of rows) {
    const k = `${r.broker}|${r.instrument}|${r.kind}|${r.tf ?? ''}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)?.push(r);
  }
  const order = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
  const tfOrder = ['m5', 'm15', 'm30', 'h1', 'h4', 'd1'];
  const lines: StockLine[] = [];
  for (const rs of groups.values()) {
    const ranges = mergeRanges(rs.map(rowRange));
    lines.push({
      broker: rs[0].broker, instrument: rs[0].instrument, kind: rs[0].kind, tf: rs[0].tf, ranges,
      count: ranges.reduce((a, r) => a + countOf(rs[0].kind, rs[0].tf, r), 0),
    });
  }
  lines.sort((a, b) => a.broker.localeCompare(b.broker) || order.indexOf(a.instrument) - order.indexOf(b.instrument) || (a.kind === b.kind ? 0 : a.kind === 'candles' ? -1 : 1) || tfOrder.indexOf(a.tf ?? '') - tfOrder.indexOf(b.tf ?? ''));
  return lines;
}

export const brokerName = (id: string): string => BROKERS.find((b) => b.id === id)?.name ?? id;

export function fmtRange(r: Range, lang: 'de' | 'en'): string {
  const f = (t: number) => (lang === 'en' ? isoDate(t) : `${isoDate(t).slice(8, 10)}.${isoDate(t).slice(5, 7)}.${isoDate(t).slice(0, 4)}`);
  return `${f(r.from)} – ${f(r.to)}`;
}
