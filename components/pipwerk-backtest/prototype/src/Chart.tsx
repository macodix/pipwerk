// Own SVG charts: candles with markers and lines, and line and area charts for the account curve.
// No chart library is used.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { fmtN } from './fmt';
import type { Lang } from './model';
import { MIN, fmtTime, lowerBound } from './sim/market';
import type { TfSeries } from './sim/market';
import { Icon, useL } from './ui';

export function useSize(ref: React.RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 300, h: 160 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => setSize({ w: Math.max(40, el.clientWidth), h: Math.max(40, el.clientHeight) });
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export interface ChartMarker {
  id: string;
  t: number;
  kind: 'acting' | 'reject' | 'manual';
  price?: number;
  title: string;
}
export interface ChartTrade {
  id: number;
  dir: 'buy' | 'sell';
  openT: number;
  closeT: number;
  entry: number;
  exit: number;
  profit: number;
  selected?: boolean;
}
export interface ChartLine {
  id: string;
  price: number;
  fromT: number;
  toT: number;
  kind: 'order' | 'sl' | 'tp' | 'entry';
  label: string;
}
export interface ChartPoint {
  id: string;
  t: number;
  price: number;
  kind: 'placed' | 'filled' | 'closed' | 'modified' | 'deleted';
  dir: 'buy' | 'sell' | null;
  title: string;
}

interface CandleChartProps {
  series: TfSeries;
  digits: number;
  lang: Lang;
  title: string;
  now: number | null;
  markers?: ChartMarker[];
  trades?: ChartTrade[];
  lines?: ChartLine[];
  points?: ChartPoint[];
  /** Changes when the view should center on `focusT`. */
  focusKey?: number;
  focusT?: number | null;
  testid: string;
  onSelectTrade?: (id: number) => void;
}

const GREEN = '#1f9d55';
const RED = '#d64545';

export function CandleChart(p: CandleChartProps) {
  const L = useL();
  const { series: s } = p;
  const box = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(box);
  const mR = 66;
  const mB = 22;
  const mT = 8;
  const plotW = Math.max(30, w - mR);
  const plotH = Math.max(30, h - mB - mT);
  const [count, setCount] = useState(0);
  const [first, setFirst] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const drag = useRef<{ x: number; first: number; moved: boolean } | null>(null);
  const n = s.n;
  const baseCount = Math.min(n, Math.max(24, Math.floor(plotW / 8)));
  const vis = Math.max(12, Math.min(n, count || baseCount));
  const maxFirst = Math.max(0, n - vis);
  const f0 = Math.max(0, Math.min(maxFirst, first));
  const cw = plotW / vis;

  const idxAt = (t: number): number => {
    const i = lowerBound(s.t, t + 1, n) - 1;
    return Math.max(0, Math.min(n - 1, i));
  };
  const nowIdx = p.now === null ? n - 1 : idxAt(p.now - 1);

  // follow the current time: show it at about three quarters of the width
  useEffect(() => {
    if (p.now === null) return;
    const i = nowIdx;
    if (i < f0 + 2 || i >= f0 + vis - 1) setFirst(Math.max(0, Math.min(maxFirst, i - Math.floor(vis * 0.72))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.now, vis]);
  useEffect(() => {
    if (p.focusT == null) return;
    const i = idxAt(p.focusT);
    setFirst(Math.max(0, Math.min(maxFirst, i - Math.floor(vis / 2))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.focusKey]);

  const last = Math.min(n, f0 + vis);
  const { lo, hi } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    for (let i = f0; i < last; i++) {
      if (s.l[i] < mn) mn = s.l[i];
      if (s.h[i] > mx) mx = s.h[i];
    }
    if (!Number.isFinite(mn)) { mn = 0; mx = 1; }
    const pad = (mx - mn) * 0.08 || 1;
    return { lo: mn - pad, hi: mx + pad };
  }, [s, f0, last]);
  const y = (v: number) => mT + ((hi - v) / (hi - lo)) * plotH;
  const x = (i: number) => (i - f0) * cw + cw / 2;
  const xt = (t: number) => {
    const i = idxAt(t);
    const frac = Math.max(0, Math.min(1, (t - s.t[i]) / (s.mins * MIN)));
    return (i - f0) * cw + frac * cw;
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, first: f0, moved: false };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const r = e.currentTarget.getBoundingClientRect();
    if (d) {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 3) d.moved = true;
      if (d.moved) setFirst(Math.max(0, Math.min(maxFirst, Math.round(d.first - dx / cw))));
    }
    const px = e.clientX - r.left;
    const i = f0 + Math.floor(px / cw);
    setHoverIdx(px >= 0 && px < plotW && i >= 0 && i < n ? i : null);
  };
  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* released */ }
  };
  const zoom = (f: number) => setCount(Math.max(12, Math.min(n, Math.round(vis * f))));
  const pan = (k: number) => setFirst(Math.max(0, Math.min(maxFirst, f0 + Math.round(vis * k))));

  // axes
  const ticks: number[] = [];
  const step = niceStep((hi - lo) / Math.max(2, Math.floor(plotH / 38)));
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  const tl: { i: number; text: string }[] = [];
  const every = Math.max(1, Math.floor(vis / Math.max(2, Math.floor(plotW / 96))));
  for (let i = f0; i < last; i += every) tl.push({ i, text: axisTime(s.t[i], s.mins, p.lang) });

  const hover = hoverIdx !== null ? hoverIdx : null;
  const visMarkers = (p.markers ?? []).filter((m) => m.t >= s.t[f0] && m.t < s.t[last - 1] + s.mins * MIN);
  const body = Math.max(1, Math.min(cw * 0.72, 16));

  return (
    <div className="chart" data-testid={p.testid} data-tf={s.tf} data-first={f0} data-visible={vis}>
      <div className="chart-head">
        <strong>{p.title}</strong>
        <span className="chart-tf">{s.tf.toUpperCase()}</span>
        <span className="spacer" />
        <div className="seg chart-tools" data-nodrag>
          <button type="button" onClick={() => pan(-0.5)} aria-label={L('Nach links', 'Left')} data-tip={L('Zeitachse nach links verschieben', 'Move the time axis left')}><Icon name="left" size={14} /></button>
          <button type="button" onClick={() => pan(0.5)} aria-label={L('Nach rechts', 'Right')} data-tip={L('Zeitachse nach rechts verschieben', 'Move the time axis right')}><Icon name="right" size={14} /></button>
          <button type="button" onClick={() => zoom(0.7)} aria-label={L('Mehr Details', 'Zoom in')} data-tip={L('Weniger Kerzen, mehr Details', 'Fewer candles, more detail')}><Icon name="zoomin" size={14} /></button>
          <button type="button" onClick={() => zoom(1.4)} aria-label={L('Mehr Überblick', 'Zoom out')} data-tip={L('Mehr Kerzen, mehr Überblick', 'More candles, more overview')}><Icon name="zoomout" size={14} /></button>
          <button type="button" onClick={() => setFirst(Math.max(0, Math.min(maxFirst, nowIdx - Math.floor(vis * 0.72))))} aria-label={L('Zur aktuellen Stelle', 'To the current position')} data-testid="chart-now" data-tip={L('Zur aktuellen Stelle springen', 'Jump to the current position')}><Icon name="fit" size={14} /></button>
        </div>
      </div>
      <div className="chart-body" ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setHoverIdx(null)}>
        <svg width={w} height={h} role="img" aria-label={p.title}>
          <rect x="0" y="0" width={plotW} height={plotH + mT} className="chart-bg" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1="0" x2={plotW} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={plotW + 6} y={y(t) + 4} className="chart-axis">{fmtN(t, p.digits, p.lang)}</text>
            </g>
          ))}
          {tl.map((q) => (
            <text key={q.i} x={x(q.i)} y={plotH + mT + 15} className="chart-axis" textAnchor="middle">{q.text}</text>
          ))}
          {(p.lines ?? []).map((ln) => {
            const x1 = Math.max(0, xt(ln.fromT));
            const x2 = Math.min(plotW, xt(ln.toT));
            if (x2 < 0 || x1 > plotW || ln.price < lo || ln.price > hi) return null;
            return (
              <g key={ln.id} className={`chart-line ${ln.kind}`} data-testid={`chart-line-${ln.kind}`}>
                <line x1={x1} x2={x2} y1={y(ln.price)} y2={y(ln.price)} />
                <text x={Math.max(4, x2 - 4)} y={y(ln.price) - 3} textAnchor="end" className="chart-line-label">{ln.label}</text>
              </g>
            );
          })}
          {Array.from({ length: Math.max(0, last - f0) }, (_, k) => {
            const i = f0 + k;
            const up = s.c[i] >= s.o[i];
            const cx = x(i);
            const top = y(Math.max(s.o[i], s.c[i]));
            const bot = y(Math.min(s.o[i], s.c[i]));
            const dim = p.now !== null && i > nowIdx;
            return (
              <g key={i} className={`candle${dim ? ' future' : ''}`} opacity={dim ? 0.3 : 1}>
                <line x1={cx} x2={cx} y1={y(s.h[i])} y2={y(s.l[i])} stroke="#000" strokeWidth="1" />
                <rect x={cx - body / 2} y={top} width={body} height={Math.max(1, bot - top)} fill={up ? GREEN : RED} stroke="#000" strokeWidth={body >= 3 ? 1 : 0.6} />
              </g>
            );
          })}
          {p.now !== null && nowIdx >= f0 && nowIdx < last && (
            <g data-testid="chart-now-line">
              <line x1={x(nowIdx) + cw / 2} x2={x(nowIdx) + cw / 2} y1={mT} y2={plotH + mT} className="chart-now" />
            </g>
          )}
          {(p.trades ?? []).map((tr) => {
            const x1 = xt(tr.openT);
            const x2 = xt(tr.closeT);
            if (x2 < -20 || x1 > plotW + 20) return null;
            const win = tr.profit > 0;
            return (
              <g
                key={tr.id} className={`chart-trade${tr.selected ? ' selected' : ''}${win ? ' win' : ' loss'}`} data-testid="marker-trade" data-trade={tr.id}
                onClick={() => p.onSelectTrade?.(tr.id)} data-nodrag
              >
                <line x1={x1} y1={y(tr.entry)} x2={x2} y2={y(tr.exit)} className="trade-link" />
                <path d={tr.dir === 'buy' ? `M ${x1} ${y(tr.entry) - 7} l 6 11 h -12 z` : `M ${x1} ${y(tr.entry) + 7} l 6 -11 h -12 z`} className="trade-open" />
                <circle cx={x2} cy={y(tr.exit)} r="4.5" className="trade-close" />
                <line x1={x1} y1={y(tr.entry)} x2={x1} y2={y(tr.entry)} stroke="transparent" strokeWidth="18" />
                <title>{`${tr.dir === 'buy' ? 'Long' : 'Short'} #${tr.id}: ${fmtN(tr.profit, 2, p.lang)}`}</title>
              </g>
            );
          })}
          {(p.points ?? []).map((pt) => {
            if (pt.t < s.t[f0] || pt.t > s.t[last - 1] + s.mins * MIN || pt.price < lo || pt.price > hi) return null;
            const px = xt(pt.t);
            const py = y(pt.price);
            return (
              <g key={pt.id} className={`chart-point ${pt.kind}`} data-testid={`marker-${pt.kind}`}>
                {pt.kind === 'placed' && <path d={`M ${px - 6} ${py} h 12 M ${px} ${py - 6} v 12`} />}
                {pt.kind === 'filled' && <path d={pt.dir === 'buy' ? `M ${px} ${py - 7} l 6 11 h -12 z` : `M ${px} ${py + 7} l 6 -11 h -12 z`} />}
                {pt.kind === 'closed' && <rect x={px - 4.5} y={py - 4.5} width="9" height="9" />}
                {pt.kind === 'modified' && <circle cx={px} cy={py} r="3.2" />}
                {pt.kind === 'deleted' && <path d={`M ${px - 5} ${py - 5} l 10 10 M ${px + 5} ${py - 5} l -10 10`} />}
                <title>{pt.title}</title>
              </g>
            );
          })}
          {visMarkers.map((m) => {
            const i = idxAt(m.t);
            const px = x(i);
            const py = m.kind === 'reject' && m.price !== undefined ? y(m.price) : y(s.h[i]) - 12;
            return (
              <g key={m.id} className={`chart-marker ${m.kind}`} data-testid={`marker-${m.kind}`} data-t={m.t}>
                {m.kind === 'acting' && <path d={`M ${px} ${py - 6} l 6 6 l -6 6 l -6 -6 z`} />}
                {m.kind === 'manual' && <path d={`M ${px - 6} ${py - 6} h 12 v 12 h -12 z`} />}
                {m.kind === 'reject' && <path d={`M ${px - 5} ${py - 5} l 10 10 M ${px + 5} ${py - 5} l -10 10`} />}
                <title>{m.title}</title>
              </g>
            );
          })}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={mT} y2={plotH + mT} className="chart-cross" />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="chart-tip" data-testid="chart-tip">
            <b>{fmtTime(s.t[hover], p.lang)}</b>
            <span>{L('Er', 'O')} {fmtN(s.o[hover], p.digits, p.lang)}</span>
            <span>{L('Ho', 'H')} {fmtN(s.h[hover], p.digits, p.lang)}</span>
            <span>{L('Ti', 'L')} {fmtN(s.l[hover], p.digits, p.lang)}</span>
            <span>{L('Sc', 'C')} {fmtN(s.c[hover], p.digits, p.lang)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const f = raw / pow;
  const m = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return m * pow;
}

function axisTime(t: number, mins: number, lang: Lang): string {
  const d = new Date(t);
  const p = (v: number) => String(v).padStart(2, '0');
  const date = lang === 'en' ? `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` : `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.`;
  if (mins >= 1440) return `${date}${lang === 'en' ? '' : String(d.getUTCFullYear() % 100).padStart(2, '0')}`;
  return `${date} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// ---- line and area charts --------------------------------------------------------------------------------

export interface LineSeries {
  id: string;
  name: string;
  color: string;
  pts: { x: number; y: number }[];
}

interface LineChartProps {
  series: LineSeries[];
  testid: string;
  title: string;
  lang: Lang;
  xFmt: (v: number) => string;
  yFmt: (v: number) => string;
  area?: boolean;
  baseline?: number;
  /** Vertical marker at an x value (the selected trade). */
  markX?: number | null;
  invertY?: boolean;
  zeroTop?: boolean;
}

export function LineChart(p: LineChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(box);
  const mL = 62;
  const mB = 20;
  const mT = 8;
  const plotW = Math.max(30, w - mL - 8);
  const plotH = Math.max(30, h - mB - mT);
  const [hover, setHover] = useState<number | null>(null);
  const all = p.series.flatMap((q) => q.pts);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const q of all) {
    if (q.x < x0) x0 = q.x;
    if (q.x > x1) x1 = q.x;
    if (q.y < y0) y0 = q.y;
    if (q.y > y1) y1 = q.y;
  }
  if (p.baseline !== undefined) { y0 = Math.min(y0, p.baseline); y1 = Math.max(y1, p.baseline); }
  if (p.zeroTop) { y1 = Math.max(y1, 0); y0 = Math.min(y0, 0); }
  if (!Number.isFinite(x0)) { x0 = 0; x1 = 1; y0 = 0; y1 = 1; }
  if (y1 === y0) { y1 += 1; y0 -= 1; }
  const pad = (y1 - y0) * 0.06;
  y0 -= p.zeroTop ? 0 : pad;
  y1 += pad;
  const X = (v: number) => mL + ((v - x0) / (x1 - x0 || 1)) * plotW;
  const Y = (v: number) => mT + ((y1 - v) / (y1 - y0)) * plotH;
  const step = niceStep((y1 - y0) / Math.max(2, Math.floor(plotH / 30)));
  const ticks: number[] = [];
  for (let v = Math.ceil(y0 / step) * step; v <= y1; v += step) ticks.push(v);
  const xt: number[] = [];
  const nx = Math.max(2, Math.floor(plotW / 110));
  for (let i = 0; i <= nx; i++) xt.push(x0 + ((x1 - x0) * i) / nx);
  const first = p.series[0];
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - mL;
    if (px < 0 || px > plotW || !first || first.pts.length === 0) { setHover(null); return; }
    setHover(x0 + (px / plotW) * (x1 - x0));
  };
  const valueAt = (q: LineSeries, xv: number): number | null => {
    if (q.pts.length === 0) return null;
    let lo = 0;
    let hi = q.pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (q.pts[mid].x < xv) lo = mid + 1;
      else hi = mid;
    }
    return q.pts[lo].y;
  };
  return (
    <div className="chart linechart" data-testid={p.testid}>
      <div className="chart-head"><strong>{p.title}</strong></div>
      <div className="chart-body" ref={box} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg width={w} height={h} role="img" aria-label={p.title}>
          <rect x={mL} y={mT} width={plotW} height={plotH} className="chart-bg" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={mL} x2={mL + plotW} y1={Y(t)} y2={Y(t)} className="chart-grid" />
              <text x={mL - 6} y={Y(t) + 4} className="chart-axis" textAnchor="end">{p.yFmt(t)}</text>
            </g>
          ))}
          {xt.map((t, i) => (
            <text key={i} x={X(t)} y={mT + plotH + 14} className="chart-axis" textAnchor={i === 0 ? 'start' : i === xt.length - 1 ? 'end' : 'middle'}>{p.xFmt(t)}</text>
          ))}
          {p.baseline !== undefined && <line x1={mL} x2={mL + plotW} y1={Y(p.baseline)} y2={Y(p.baseline)} className="chart-base" />}
          {p.series.map((q) => {
            if (q.pts.length === 0) return null;
            const d = q.pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${X(pt.x).toFixed(1)} ${Y(pt.y).toFixed(1)}`).join(' ');
            const base = p.baseline !== undefined ? Y(p.baseline) : p.zeroTop ? Y(0) : mT + plotH;
            return (
              <g key={q.id} data-testid="line-series" data-series={q.id}>
                {p.area && <path d={`${d} L ${X(q.pts[q.pts.length - 1].x).toFixed(1)} ${base} L ${X(q.pts[0].x).toFixed(1)} ${base} z`} fill={q.color} opacity="0.18" />}
                <path d={d} fill="none" stroke={q.color} strokeWidth="1.8" strokeLinejoin="round" />
              </g>
            );
          })}
          {p.markX != null && p.markX >= x0 && p.markX <= x1 && <line x1={X(p.markX)} x2={X(p.markX)} y1={mT} y2={mT + plotH} className="chart-now" data-testid="line-mark" />}
          {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={mT} y2={mT + plotH} className="chart-cross" />}
        </svg>
        {hover !== null && (
          <div className="chart-tip" data-testid="line-tip">
            <b>{p.xFmt(hover)}</b>
            {p.series.map((q) => {
              const v = valueAt(q, hover);
              return v === null ? null : <span key={q.id} style={{ color: q.color }}>{p.series.length > 1 ? `${q.name}: ` : ''}{p.yFmt(v)}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
