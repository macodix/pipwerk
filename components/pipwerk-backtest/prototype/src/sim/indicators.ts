// Simulated indicators on the simulated candles. EMA and ATR follow their usual definitions.
// The 1-2-3 trend (market technique) is a simple stand-in: turning points are found with a
// fractal window, the trend from the last two highs and lows. It is not the delivered indicator.
import type { TfSeries } from './market';

export type Series = Float64Array;

function sourceOf(s: TfSeries, kind: string): Series {
  const out = new Float64Array(s.n);
  for (let i = 0; i < s.n; i++) {
    switch (kind) {
      case 'eroeffnungskurs': out[i] = s.o[i]; break;
      case 'hoch': out[i] = s.h[i]; break;
      case 'tief': out[i] = s.l[i]; break;
      case 'medianpreis': out[i] = (s.h[i] + s.l[i]) / 2; break;
      case 'typischer_preis': out[i] = (s.h[i] + s.l[i] + s.c[i]) / 3; break;
      case 'gewichteter_schlusskurs': out[i] = (s.h[i] + s.l[i] + 2 * s.c[i]) / 4; break;
      default: out[i] = s.c[i];
    }
  }
  return out;
}

/** Exponential moving average; no value before as many candles as the period are there. */
export function ema(s: TfSeries, period: number, source: string, shift = 0): Series {
  const src = sourceOf(s, source);
  const out = new Float64Array(s.n).fill(NaN);
  const p = Math.max(1, Math.round(period));
  const k = 2 / (p + 1);
  let acc = 0;
  for (let i = 0; i < s.n; i++) {
    if (i < p - 1) {
      acc += src[i];
    } else if (i === p - 1) {
      acc += src[i];
      acc /= p;
      out[i] = acc;
    } else {
      acc = src[i] * k + acc * (1 - k);
      out[i] = acc;
    }
  }
  if (shift > 0) {
    const sh = new Float64Array(s.n).fill(NaN);
    for (let i = shift; i < s.n; i++) sh[i] = out[i - shift];
    return sh;
  }
  return out;
}

/** Average true range (Wilder); no value before as many candles as the period are there. */
export function atr(s: TfSeries, period: number): Series {
  const out = new Float64Array(s.n).fill(NaN);
  const p = Math.max(1, Math.round(period));
  let acc = 0;
  let prev = NaN;
  for (let i = 0; i < s.n; i++) {
    const tr = i === 0 ? s.h[i] - s.l[i] : Math.max(s.h[i] - s.l[i], Math.abs(s.h[i] - s.c[i - 1]), Math.abs(s.l[i] - s.c[i - 1]));
    if (i < p) {
      acc += tr;
      if (i === p - 1) {
        prev = acc / p;
        out[i] = prev;
      }
    } else {
      prev = (prev * (p - 1) + tr) / p;
      out[i] = prev;
    }
  }
  return out;
}

export interface Pivot {
  idx: number;
  price: number;
  high: boolean;
}

/** Turning points with a fractal window of d candles on each side; known d candles after the pivot. */
export function pivots(s: TfSeries, d: number): { list: Pivot[]; knownAt: number[] } {
  const list: Pivot[] = [];
  const knownAt: number[] = [];
  const n = s.n;
  for (let j = d; j < n - d; j++) {
    let isHigh = true;
    let isLow = true;
    for (let k = 1; k <= d; k++) {
      if (!(s.h[j] > s.h[j - k] && s.h[j] >= s.h[j + k])) isHigh = false;
      if (!(s.l[j] < s.l[j - k] && s.l[j] <= s.l[j + k])) isLow = false;
      if (!isHigh && !isLow) break;
    }
    if (isHigh && isLow) {
      const up = s.c[j] >= s.o[j];
      isHigh = up;
      isLow = !up;
    }
    if (!isHigh && !isLow) continue;
    const high = isHigh;
    const price = high ? s.h[j] : s.l[j];
    const last = list[list.length - 1];
    if (last && last.high === high) {
      // two turning points of the same kind in a row: keep the more extreme one
      if ((high && price > last.price) || (!high && price < last.price)) {
        last.idx = j;
        last.price = price;
        knownAt[list.length - 1] = j + d;
      }
      continue;
    }
    list.push({ idx: j, price, high });
    knownAt.push(j + d);
  }
  return { list, knownAt };
}

export interface Technique {
  dir: Int8Array; // 1 up, -1 down, 0 no trend, NaN-like -2: no values yet
  intact: Int8Array;
  phase: Int8Array; // 0 movement, 1 correction, -1 none
  p2: Series;
  p13: Series;
  final: Int8Array;
}

/** 1-2-3 trend from the turning points that are known at each candle. */
export function technique(s: TfSeries, depth: number): Technique {
  const d = Math.max(2, Math.round(depth / 3));
  const { list, knownAt } = pivots(s, d);
  const n = s.n;
  const out: Technique = {
    dir: new Int8Array(n).fill(-2), intact: new Int8Array(n), phase: new Int8Array(n).fill(-1),
    p2: new Float64Array(n).fill(NaN), p13: new Float64Array(n).fill(NaN), final: new Int8Array(n),
  };
  let known = 0;
  const highs: Pivot[] = [];
  const lows: Pivot[] = [];
  let latest: Pivot | null = null;
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    while (known < list.length && knownAt[known] <= i) {
      known += 1;
    }
    // rebuild the lists of the known pivots (the last one can still have moved, so recompute from scratch cheaply)
    highs.length = 0;
    lows.length = 0;
    seen.clear();
    for (let q = Math.max(0, known - 8); q < known; q++) {
      const pv = list[q];
      if (knownAt[q] > i) continue;
      (pv.high ? highs : lows).push(pv);
      latest = pv;
    }
    if (highs.length < 2 || lows.length < 2) continue;
    const h1 = highs[highs.length - 1];
    const h2 = highs[highs.length - 2];
    const l1 = lows[lows.length - 1];
    const l2 = lows[lows.length - 2];
    const up = h1.price > h2.price && l1.price > l2.price;
    const down = h1.price < h2.price && l1.price < l2.price;
    // a trend counts as "no trend" as soon as the price has broken point 1/3
    if (up && s.c[i] > l1.price) {
      out.dir[i] = 1;
      out.p2[i] = h1.price;
      out.p13[i] = l1.price;
      out.intact[i] = 1;
      out.phase[i] = latest && !latest.high ? 0 : 1;
      out.final[i] = 1;
    } else if (down && s.c[i] < h1.price) {
      out.dir[i] = -1;
      out.p2[i] = l1.price;
      out.p13[i] = h1.price;
      out.intact[i] = 1;
      out.phase[i] = latest && latest.high ? 0 : 1;
      out.final[i] = 1;
    } else {
      out.dir[i] = 0;
    }
  }
  return out;
}
