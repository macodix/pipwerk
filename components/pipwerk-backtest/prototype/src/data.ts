// Strategies, test accounts and the simulated data stock of historical price data, with the check
// that runs before a test run (req-test-003). The data stock is filled by the import of files only
// (req-system-026); the files come from `pipwerk-fetch-mt5` or from an export.
import { isTrigger } from './catalog';
import { sampleStrategies } from './samples';
import { newEl } from './factory';
import type { Strategy, Txt } from './model';
import { clone } from './model';
import { BROKERS, DAY, INSTRUMENTS, LAST_DAY, isoDate, parseIsoDate } from './sim/market';
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

/** Candles of a time unit, ticks, or the contract data of an instrument (no period). */
export type Kind = 'candles' | 'ticks' | 'contract';

export interface DataRow {
  id: string;
  broker: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  /** First and last day (ISO); empty for contract data. */
  from: string;
  to: string;
  origin: 'bestand' | 'import';
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
    // M15 of EURUSD starts later: a backtest of str-01 over two years finds that part missing
    rows.push(row('b1', 'EURUSD', 'candles', tf, tf === 'm15' ? '2025-03-03' : D0, D1));
    rows.push(row('b1', 'GBPUSD', 'candles', tf, D0, D1));
    // USDJPY D1 has one gap
    if (tf === 'd1') {
      rows.push(row('b1', 'USDJPY', 'candles', tf, D0, '2026-03-13'));
      rows.push(row('b1', 'USDJPY', 'candles', tf, '2026-03-23', D1));
    } else rows.push(row('b1', 'USDJPY', 'candles', tf, D0, D1));
  }
  rows.push(row('b1', 'EURUSD', 'ticks', null, '2025-06-02', D1));
  rows.push(row('b1', 'GBPUSD', 'ticks', null, '2026-07-01', D1));
  for (const tf of ['m15', 'h1', 'd1']) {
    // XAUUSD H1 has two gaps; the second sample file closes the first one
    if (tf === 'h1') {
      rows.push(row('b1', 'XAUUSD', 'candles', tf, D0, '2025-04-11'));
      rows.push(row('b1', 'XAUUSD', 'candles', tf, '2025-04-21', '2026-01-02'));
      rows.push(row('b1', 'XAUUSD', 'candles', tf, '2026-01-12', D1));
    } else rows.push(row('b1', 'XAUUSD', 'candles', tf, tf === 'm15' ? '2025-06-02' : D0, D1));
  }
  for (const tf of ['m15', 'h1', 'd1']) rows.push(row('b2', 'EURUSD', 'candles', tf, '2025-01-02', D1));
  // contract data: complete at the first broker; the second broker has none for EURUSD (the missing case)
  // and has contract data for GBPUSD only (the case without price data)
  for (const i of INSTRUMENTS) rows.push(row('b1', i.id, 'contract', null, '', ''));
  rows.push(row('b2', 'GBPUSD', 'contract', null, '', ''));
  return rows;
}

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

export interface Need {
  key: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  from: number;
  to: number;
  why: Txt;
}

/** The state of one data set: available, or missing (with the missing periods; contract data has none). */
export interface NeedResult {
  need: Need;
  status: 'present' | 'missing';
  missing: Range[];
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
  for (const ins of instruments) {
    needs.push({
      key: `k|${ins}`, instrument: ins, kind: 'contract', tf: null, from: run.from, to: run.to,
      why: T('Kontraktgröße, Tickwert, Swap und weitere Angaben des Instruments bei diesem Broker.', 'Contract size, tick value, swap and further details of the instrument at this broker.'),
    });
  }
  return needs;
}

export function checkNeeds(run: RunSettings, rows: DataRow[]): NeedResult[] {
  return needsFor(run).map((need) => classifyNeed(need, rows, run.broker));
}

export function classifyNeed(need: Need, rows: DataRow[], broker: string): NeedResult {
  if (need.kind === 'contract') {
    return hasContract(rows, broker, need.instrument)
      ? { need, status: 'present', missing: [] }
      : { need, status: 'missing', missing: [] };
  }
  const have = rows.filter((r) => r.broker === broker && r.instrument === need.instrument && r.kind === need.kind && (need.kind === 'ticks' || r.tf === need.tf)).map(rowRange);
  // days without trading at the edges are no gaps
  const real = subtract({ from: need.from, to: need.to }, have).filter((m) => tradingDays(m) > 0);
  return real.length === 0 ? { need, status: 'present', missing: [] } : { need, status: 'missing', missing: real };
}

export function hasContract(rows: DataRow[], broker: string, instrument: string): boolean {
  return rows.some((r) => r.kind === 'contract' && r.broker === broker && r.instrument === instrument);
}

/** One line of the table: a series of one broker, one instrument and one kind of data. */
export interface StockLine {
  key: string;
  broker: string;
  instrument: string;
  kind: Kind;
  tf: string | null;
  /** First and last day of the series, null for contract data. */
  span: Range | null;
  /** Periods with trading days between two covered periods. */
  gaps: Range[];
}

/** The label of the data of a line, for example "Kerzen H1", "Ticks", "Kontraktdaten". */
export function dataLabel(kind: Kind, tf: string | null, lang: 'de' | 'en'): string {
  if (kind === 'ticks') return 'Ticks';
  if (kind === 'contract') return lang === 'en' ? 'Contract data' : 'Kontraktdaten';
  return `${lang === 'en' ? 'Candles' : 'Kerzen'} ${(tf ?? '').toUpperCase()}`;
}

/** The stock as it is shown: one line per series; contract data gets a line only when there is no price data. */
export function stockLines(rows: DataRow[]): StockLine[] {
  const groups = new Map<string, DataRow[]>();
  for (const r of rows) {
    const k = `${r.broker}|${r.instrument}|${r.kind}|${r.tf ?? ''}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)?.push(r);
  }
  const priced = new Set(rows.filter((r) => r.kind !== 'contract').map((r) => `${r.broker}|${r.instrument}`));
  const order = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
  const tfOrder = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm10', 'm12', 'm15', 'm20', 'm30', 'h1', 'h2', 'h3', 'h4', 'h6', 'h8', 'h12', 'd1', 'w1', 'mn1'];
  const rank = (k: Kind) => (k === 'candles' ? 0 : k === 'ticks' ? 1 : 2);
  const lines: StockLine[] = [];
  for (const [key, rs] of groups) {
    const first = rs[0];
    if (first.kind === 'contract') {
      if (!priced.has(`${first.broker}|${first.instrument}`)) lines.push({ key, broker: first.broker, instrument: first.instrument, kind: 'contract', tf: null, span: null, gaps: [] });
      continue;
    }
    const ranges = mergeRanges(rs.map(rowRange));
    const gaps: Range[] = [];
    for (let i = 1; i < ranges.length; i++) {
      const g = { from: ranges[i - 1].to + DAY, to: ranges[i].from - DAY };
      if (tradingDays(g) > 0) gaps.push(g);
    }
    lines.push({ key, broker: first.broker, instrument: first.instrument, kind: first.kind, tf: first.tf, span: { from: ranges[0].from, to: ranges[ranges.length - 1].to }, gaps });
  }
  const idx = (i: string) => (order.indexOf(i) < 0 ? 99 : order.indexOf(i));
  lines.sort((a, b) => brokerName(a.broker).localeCompare(brokerName(b.broker)) || idx(a.instrument) - idx(b.instrument) || a.instrument.localeCompare(b.instrument) || rank(a.kind) - rank(b.kind) || tfOrder.indexOf(a.tf ?? '') - tfOrder.indexOf(b.tf ?? ''));
  return lines;
}

export const brokerName = (id: string): string => BROKERS.find((b) => b.id === id)?.name ?? id;

/** The brokers that occur in the data stock, in order of their names. */
export function stockBrokers(rows: DataRow[]): string[] {
  return [...new Set(rows.map((r) => r.broker))].sort((a, b) => brokerName(a).localeCompare(brokerName(b)));
}

/** The id of a broker by the name the user typed: a known name keeps its id, a new name is its own id. */
export function brokerIdOf(name: string, rows: DataRow[]): string {
  const n = name.trim();
  const known = [...new Set([...BROKERS.map((b) => b.id), ...rows.map((r) => r.broker)])].find((id) => brokerName(id) === n);
  return known ?? n;
}

export function fmtRange(r: Range, lang: 'de' | 'en'): string {
  const f = (t: number) => (lang === 'en' ? isoDate(t) : `${isoDate(t).slice(8, 10)}.${isoDate(t).slice(5, 7)}.${isoDate(t).slice(0, 4)}`);
  return `${f(r.from)} – ${f(r.to)}`;
}
