// Simulated market data: invented but credible price series per instrument, derived from
// a seeded random number generator. Nothing here comes from a broker. The same instrument
// always yields the same series, so the prototype behaves the same on every start.
import type { Lang } from '../model';

export const MIN = 60_000;
export const DAY = 86_400_000;
/** The last complete trading day of the prototype (fixed so that screenshots and tests are stable). */
export const LAST_DAY = Date.UTC(2026, 9, 20);
/** First day for which the simulated series exist. */
export const DATA_FROM = Date.UTC(2024, 9, 1);
export const BASE_MIN = 5;

export interface InstrumentInfo {
  id: string;
  bezeichnung: string;
  tickgroesse: number;
  tickwert: number;
  punkt: number;
  pip: number;
  spread: number;
  mindestvolumen: number;
  volumenschritt: number;
  kontraktgroesse: number;
  swapLong: number;
  swapShort: number;
  margin: number;
  digits: number;
}

export interface Broker {
  id: string;
  name: string;
  spreadFactor: number;
}

export const BROKERS: Broker[] = [
  { id: 'b1', name: 'Demo-Broker (MetaTrader 5)', spreadFactor: 1 },
  { id: 'b2', name: 'Zweiter Demo-Broker (MetaTrader 5)', spreadFactor: 1.4 },
];

interface InstrumentDef extends InstrumentInfo {
  price0: number;
  vol: number;
  seed: number;
  description: { de: string; en: string };
}

const DEFS: InstrumentDef[] = [
  {
    id: 'EURUSD', bezeichnung: 'Euro / US-Dollar', tickgroesse: 0.00001, tickwert: 1, punkt: 0.00001, pip: 0.0001, spread: 0.00012,
    mindestvolumen: 0.01, volumenschritt: 0.01, kontraktgroesse: 100000, swapLong: -6.2, swapShort: 1.8, margin: 3.33, digits: 5,
    price0: 1.085, vol: 0.00031, seed: 1058, description: { de: 'Euro gegen US-Dollar', en: 'Euro against US dollar' },
  },
  {
    id: 'GBPUSD', bezeichnung: 'Britisches Pfund / US-Dollar', tickgroesse: 0.00001, tickwert: 1, punkt: 0.00001, pip: 0.0001, spread: 0.00016,
    mindestvolumen: 0.01, volumenschritt: 0.01, kontraktgroesse: 100000, swapLong: -5.1, swapShort: 0.9, margin: 3.33, digits: 5,
    price0: 1.282, vol: 0.00036, seed: 77711, description: { de: 'Pfund gegen US-Dollar', en: 'Pound against US dollar' },
  },
  {
    id: 'USDJPY', bezeichnung: 'US-Dollar / Japanischer Yen', tickgroesse: 0.001, tickwert: 0.66, punkt: 0.001, pip: 0.01, spread: 0.012,
    mindestvolumen: 0.01, volumenschritt: 0.01, kontraktgroesse: 100000, swapLong: 4.4, swapShort: -9.7, margin: 3.33, digits: 3,
    price0: 148.2, vol: 0.034, seed: 31337, description: { de: 'US-Dollar gegen Yen', en: 'US dollar against yen' },
  },
  {
    id: 'XAUUSD', bezeichnung: 'Gold / US-Dollar', tickgroesse: 0.01, tickwert: 1, punkt: 0.01, pip: 0.1, spread: 0.28,
    mindestvolumen: 0.01, volumenschritt: 0.01, kontraktgroesse: 100, swapLong: -21.5, swapShort: 8.2, margin: 5, digits: 2,
    price0: 2650, vol: 0.9, seed: 90210, description: { de: 'Feingold in US-Dollar', en: 'Gold in US dollar' },
  },
];

export const INSTRUMENTS: InstrumentInfo[] = DEFS.map((d) => ({
  id: d.id, bezeichnung: d.bezeichnung, tickgroesse: d.tickgroesse, tickwert: d.tickwert, punkt: d.punkt, pip: d.pip, spread: d.spread,
  mindestvolumen: d.mindestvolumen, volumenschritt: d.volumenschritt, kontraktgroesse: d.kontraktgroesse, swapLong: d.swapLong,
  swapShort: d.swapShort, margin: d.margin, digits: d.digits,
}));

export function instrumentInfo(id: string, brokerId = 'b1'): InstrumentInfo {
  const d = DEFS.find((x) => x.id === id) ?? DEFS[0];
  const b = BROKERS.find((x) => x.id === brokerId) ?? BROKERS[0];
  const base = INSTRUMENTS.find((x) => x.id === d.id) as InstrumentInfo;
  const r = (v: number) => Math.round(v / d.punkt) * d.punkt;
  return {
    ...base,
    spread: Number(r(base.spread * b.spreadFactor).toFixed(d.digits)),
    kontraktgroesse: brokerId === 'b2' && d.id === 'XAUUSD' ? 100 : base.kontraktgroesse,
    swapLong: Number((base.swapLong * (b.id === 'b2' ? 1.15 : 1)).toFixed(2)),
    swapShort: Number((base.swapShort * (b.id === 'b2' ? 1.15 : 1)).toFixed(2)),
  };
}

// ---- random numbers ------------------------------------------------------------------

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- base series (5 minutes) ----------------------------------------------------------------

export interface Bars {
  n: number;
  t: Float64Array;
  o: Float64Array;
  h: Float64Array;
  l: Float64Array;
  c: Float64Array;
  sp: Float64Array;
}

const cache = new Map<string, Bars>();

const SESSION = (hour: number): number => {
  if (hour < 6) return 0.62;
  if (hour < 8) return 1.0;
  if (hour < 11) return 1.25;
  if (hour < 13) return 1.0;
  if (hour < 17) return 1.55;
  if (hour < 21) return 0.95;
  return 0.55;
};

function isTradingDay(dayStart: number): boolean {
  const wd = new Date(dayStart).getUTCDay();
  return wd !== 0 && wd !== 6;
}

/** The simulated 5-minute candles of an instrument for the whole period of the prototype. */
export function baseBars(instrument: string): Bars {
  const hit = cache.get(instrument);
  if (hit) return hit;
  const d = DEFS.find((x) => x.id === instrument) ?? DEFS[0];
  const r = rng(d.seed);
  const perDay = 1440 / BASE_MIN;
  let days = 0;
  for (let t = DATA_FROM; t <= LAST_DAY; t += DAY) if (isTradingDay(t)) days += 1;
  const n = days * perDay;
  const out: Bars = {
    n, t: new Float64Array(n), o: new Float64Array(n), h: new Float64Array(n), l: new Float64Array(n), c: new Float64Array(n), sp: new Float64Array(n),
  };
  const digits = d.digits;
  const round = (v: number) => Number(v.toFixed(digits));
  let price = d.price0;
  let mu = 0;
  let regimeLeft = 0;
  let k = 0;
  for (let day = DATA_FROM; day <= LAST_DAY; day += DAY) {
    if (!isTradingDay(day)) continue;
    for (let b = 0; b < perDay; b++) {
      const t = day + b * BASE_MIN * MIN;
      const hour = Math.floor((b * BASE_MIN) / 60);
      if (regimeLeft <= 0) {
        const x = r();
        mu = x < 0.38 ? -0.04 : x < 0.62 ? 0 : 0.04;
        regimeLeft = Math.floor(1500 + r() * 4500);
      }
      regimeLeft -= 1;
      const sigma = d.vol * SESSION(hour);
      const ret = (mu + gauss(r)) * sigma;
      const open = price;
      const close = open + ret;
      const wickUp = Math.abs(gauss(r)) * sigma * 0.55;
      const wickDown = Math.abs(gauss(r)) * sigma * 0.55;
      const high = Math.max(open, close) + wickUp;
      const low = Math.min(open, close) - wickDown;
      const spreadMult = hour >= 22 || hour < 1 ? 2.3 : hour < 7 ? 1.35 : 1 + Math.abs(gauss(r)) * 0.12;
      out.t[k] = t;
      out.o[k] = round(open);
      out.h[k] = round(high);
      out.l[k] = round(low);
      out.c[k] = round(close);
      out.sp[k] = Number((Math.round((d.spread * spreadMult) / d.punkt) * d.punkt).toFixed(digits));
      price = out.c[k];
      k += 1;
    }
  }
  cache.set(instrument, out);
  return out;
}

/** Index of the first base candle at or after the time. */
export function lowerBound(arr: Float64Array, v: number, n = arr.length): number {
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// ---- time frames ----------------------------------------------------------------------------

export const TF_MINUTES: Record<string, number> = {
  m1: 1, m2: 2, m3: 3, m4: 4, m5: 5, m6: 6, m10: 10, m12: 12, m15: 15, m20: 20, m30: 30,
  h1: 60, h2: 120, h3: 180, h4: 240, h6: 360, h8: 480, h12: 720, d1: 1440, w1: 10080, mn1: 43200,
};

/** The prototype can simulate candles of lengths that are multiples of five minutes up to one day. */
export function tfSupported(tf: string): boolean {
  const m = TF_MINUTES[tf.toLowerCase()];
  return m !== undefined && m >= 5 && m <= 1440 && m % 5 === 0 && 1440 % m === 0;
}

export interface TfSeries {
  tf: string;
  mins: number;
  n: number;
  t: Float64Array;
  o: Float64Array;
  h: Float64Array;
  l: Float64Array;
  c: Float64Array;
  sp: Float64Array;
}

/** Aggregates base candles in [from, to] (UTC days) to candles of the time frame. */
export function seriesFor(instrument: string, tf: string, from: number, to: number, brokerId = 'b1'): TfSeries {
  const bars = baseBars(instrument);
  const mins = TF_MINUTES[tf.toLowerCase()] ?? 60;
  const factor = mins / BASE_MIN;
  const b0 = lowerBound(bars.t, from, bars.n);
  const b1 = lowerBound(bars.t, to + DAY, bars.n);
  const bf = BROKERS.find((x) => x.id === brokerId)?.spreadFactor ?? 1;
  const n = Math.floor((b1 - b0) / factor);
  const s: TfSeries = {
    tf: tf.toLowerCase(), mins, n, t: new Float64Array(n), o: new Float64Array(n), h: new Float64Array(n), l: new Float64Array(n), c: new Float64Array(n), sp: new Float64Array(n),
  };
  for (let i = 0; i < n; i++) {
    const a = b0 + i * factor;
    let hi = -Infinity;
    let lo = Infinity;
    let sp = 0;
    for (let j = 0; j < factor; j++) {
      if (bars.h[a + j] > hi) hi = bars.h[a + j];
      if (bars.l[a + j] < lo) lo = bars.l[a + j];
      sp += bars.sp[a + j];
    }
    s.t[i] = bars.t[a];
    s.o[i] = bars.o[a];
    s.h[i] = hi;
    s.l[i] = lo;
    s.c[i] = bars.c[a + factor - 1];
    s.sp[i] = (sp / factor) * bf;
  }
  return s;
}

/** Index of the last candle that is closed at the time (its open time plus its length is not after it), or -1. */
export function closedIndex(s: TfSeries, now: number): number {
  const len = s.mins * MIN;
  let lo = 0;
  let hi = s.n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (s.t[mid] + len <= now) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

// ---- ticks ---------------------------------------------------------------------------------------

export interface Tick {
  t: number;
  bid: number;
  ask: number;
}

const TICK_OFFSETS = [0, 55_000, 150_000, 240_000];

/** Four ticks per five-minute candle (open, the two extremes, close) as simulated tick data. */
export function ticksOfBar(bars: Bars, j: number, spreadFactor: number, spreadOverride: number | null, out: Tick[]): void {
  const o = bars.o[j];
  const h = bars.h[j];
  const l = bars.l[j];
  const c = bars.c[j];
  const sp = spreadOverride ?? bars.sp[j] * spreadFactor;
  const up = c >= o;
  const p = [o, up ? l : h, up ? h : l, c];
  for (let i = 0; i < 4; i++) {
    out[i] = { t: bars.t[j] + TICK_OFFSETS[i], bid: p[i], ask: p[i] + sp };
  }
}

// ---- formatting -----------------------------------------------------------------------------------

export function fmtTime(ms: number, lang: Lang, withTime = true): string {
  const d = new Date(ms);
  const p = (x: number) => String(x).padStart(2, '0');
  const date = lang === 'en' ? `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` : `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
  return withTime ? `${date} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : date;
}

export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
export function parseIsoDate(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

export function fmtNum(v: number, digits: number, lang: Lang): string {
  const s = v.toFixed(digits);
  return lang === 'de' ? s.replace('.', ',') : s;
}
