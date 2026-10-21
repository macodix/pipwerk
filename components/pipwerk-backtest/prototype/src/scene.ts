// Geometry of the canvas: automatic arrangement of flow, management frames, sections and the
// area for objects without flow connection, plus the data wires between them.
import { TYPES, isFlowEl, isObjectEl, isTrigger, propsOf } from './catalog';
import { layered } from './layout';
import type { LEdge, LNode, Pt } from './layout';
import { refsOf } from './expr';
import type { Binding, El, Expr, Strategy } from './model';

export type Dir = 'v' | 'h';

export const EL_W = 236;
export const EL_H = 96;
export const SEC_H = 58;
export const CARD_W = 236;
export const ROW_H = 27;
export const CARD_HEAD = 50;
export const FRAME_HEAD = 36;
export const FRAME_PAD = 18;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FlowEdgeGeo {
  key: string;
  from: string;
  out: string;
  to: string;
  pts: Pt[];
  mgmt?: boolean;
}

export interface Usage {
  src: string;
  prop: string;
  dst: string;
  solid: boolean;
}

export interface CardGeo extends Box {
  id: string;
  rows: string[];
  more: number;
  rowY: Map<string, number>;
}

export interface WireGeo {
  key: string;
  src: string;
  dst: string;
  props: string[];
  solid: boolean;
  pts: Pt[];
  stubs: Pt[][];
}

export interface FrameGeo extends Box {
  order: string;
  collapsed: boolean;
  empty: boolean;
}

export interface BandGeo extends Box {
  id: string;
  name: string;
}

export interface Scene {
  nodes: Map<string, Box>;
  secNodes: Map<string, Box>;
  cards: Map<string, CardGeo>;
  frames: FrameGeo[];
  bands: BandGeo[];
  edges: FlowEdgeGeo[];
  wires: WireGeo[];
  lane: Box | null;
  bounds: Box;
  rep: Map<string, string>;
  usage: Usage[];
}

// ---- data usage ----------------------------------------------------------------

function exprsOf(b: Binding | undefined): Expr[] {
  return b && b.k === 'expr' ? [b.e] : [];
}

export function collectUsage(s: Strategy): Usage[] {
  const out: Usage[] = [];
  const add = (src: string, prop: string, dst: string, solid: boolean) => {
    const ex = out.find((u) => u.src === src && u.prop === prop && u.dst === dst);
    if (ex) { ex.solid = ex.solid || solid; return; }
    out.push({ src, prop, dst, solid });
  };
  for (const e of s.els) {
    for (const i of e.inputs) add(i.obj, i.prop, e.id, true);
    for (const b of Object.values(e.bind)) {
      for (const x of exprsOf(b)) for (const r of refsOf(x)) add(r.obj, r.prop, e.id, false);
      if (b.k === 'ref') add(b.obj, b.prop, e.id, true);
    }
    for (const r of e.rules) for (const x of [r.e]) for (const rr of refsOf(x)) add(rr.obj, rr.prop, e.id, false);
    if (e.own) {
      for (const p of e.own.props) for (const r of refsOf(p.e)) add(r.obj, r.prop, e.id, false);
      if (e.own.direction) for (const r of refsOf(e.own.direction)) add(r.obj, r.prop, e.id, false);
    }
  }
  return out;
}

// ---- helpers -------------------------------------------------------------------

export function outPort(b: Box, i: number, n: number, dir: Dir): Pt {
  const f = (i + 1) / (n + 1);
  return dir === 'v' ? { x: b.x + b.w * f, y: b.y + b.h } : { x: b.x + b.w, y: b.y + b.h * f };
}
export function inPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x, y: b.y + b.h / 2 };
}
export function dataPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y };
}

function outputsOf(e: El) {
  return TYPES[e.type]?.outputs ?? [];
}

interface FlowPlan {
  key: string | null;
  ids: string[];
  secNodes: { id: string; secId: string; ids: string[] }[];
  frames: Map<string, FlowPlan & { w: number; h: number }>;
  pos: Map<string, Pt>;
  via: Map<string, Pt[]>;
  size: Box;
  edges: LEdge[];
  nodeSize: Map<string, { w: number; h: number }>;
}

function transpose(p: Pt): Pt {
  return { x: p.y, y: p.x };
}

export function buildScene(s: Strategy, dir: Dir): Scene {
  const byId = new Map(s.els.map((e) => [e.id, e]));
  const collapsedSecs = s.sections.filter((x) => x.collapsed);
  const rep = new Map<string, string>();
  for (const sec of collapsedSecs) for (const id of sec.els) if (byId.has(id)) rep.set(id, `sec:${sec.id}`);
  const repOf = (id: string) => rep.get(id) ?? id;
  const flowEls = s.els.filter((e) => isFlowEl(e.type));

  const collapsedMgmt = new Set(s.collapsedMgmt);
  const hiddenOrders = new Set<string>();
  for (const e of flowEls) if (rep.has(e.id)) hiddenOrders.add(e.id);

  const plans = new Map<string | null, FlowPlan>();

  function plan(key: string | null): FlowPlan {
    const cached = plans.get(key);
    if (cached) return cached;
    const members = flowEls.filter((e) => (e.mgmt ?? null) === key);
    const nodeSize = new Map<string, { w: number; h: number }>();
    const nodeIds: string[] = [];
    const secNodes: FlowPlan['secNodes'] = [];
    for (const e of members) {
      const r = repOf(e.id);
      if (r.startsWith('sec:')) {
        if (!nodeSize.has(r)) {
          nodeSize.set(r, { w: EL_W, h: SEC_H });
          nodeIds.push(r);
          const sid = r.slice(4);
          secNodes.push({ id: r, secId: sid, ids: s.sections.find((x) => x.id === sid)?.els ?? [] });
        }
      } else {
        nodeSize.set(e.id, { w: EL_W, h: EL_H });
        nodeIds.push(e.id);
      }
    }
    const frames = new Map<string, FlowPlan & { w: number; h: number }>();
    const edges: LEdge[] = [];
    for (const e of members) {
      if (e.type !== 'flow.place_order' || hiddenOrders.has(e.id)) continue;
      const inner = plan(e.id);
      const collapsed = collapsedMgmt.has(e.id);
      const hasInner = inner.ids.length + inner.secNodes.length > 0;
      let w: number;
      let h: number;
      if (collapsed) { w = EL_W; h = 46; }
      else if (!hasInner) { w = EL_W + 2 * FRAME_PAD; h = FRAME_HEAD + 64; }
      else {
        // the inner layout is in the orientation of the whole canvas
        w = Math.max(EL_W, inner.size.w) + 2 * FRAME_PAD;
        h = FRAME_HEAD + inner.size.h + 2 * FRAME_PAD;
      }
      frames.set(e.id, { ...inner, w, h });
      const fid = `frame:${e.id}`;
      nodeSize.set(fid, { w, h });
      nodeIds.push(fid);
      edges.push({ key: `mg|${e.id}`, from: repOf(e.id), to: fid, order: 0 });
    }
    for (const c of s.conns) {
      const a = byId.get(c.from);
      const b = byId.get(c.to);
      if (!a || !b || (a.mgmt ?? null) !== key || (b.mgmt ?? null) !== key) continue;
      const ra = repOf(c.from);
      const rb = repOf(c.to);
      if (ra === rb) continue;
      const idx = outputsOf(a).findIndex((o) => o.id === c.out);
      edges.push({ key: `${c.from}|${c.out}|${c.to}`, from: ra, to: rb, order: idx < 0 ? 0 : idx });
    }
    // layout
    const sw = dir === 'v';
    const lnodes: LNode[] = nodeIds.map((id) => {
      const sz = nodeSize.get(id) as { w: number; h: number };
      return sw ? { id, w: sz.w, h: sz.h } : { id, w: sz.h, h: sz.w };
    });
    const res = layered(lnodes, edges, sw ? 48 : 26, sw ? 66 : 76);
    const pos = new Map<string, Pt>();
    const via = new Map<string, Pt[]>();
    for (const [id, p] of res.pos) pos.set(id, sw ? p : transpose(p));
    for (const [k, v] of res.via) via.set(k, sw ? v : v.map(transpose));
    const p: FlowPlan = {
      key, ids: nodeIds, secNodes, frames, pos, via, edges, nodeSize,
      size: { x: 0, y: 0, w: sw ? res.w : res.h, h: sw ? res.h : res.w },
    };
    plans.set(key, p);
    return p;
  }

  const main = plan(null);

  // ---- emit absolute geometry ----
  const nodes = new Map<string, Box>();
  const secNodes = new Map<string, Box>();
  const frames: FrameGeo[] = [];
  const rawEdges: { key: string; from: string; out: string; to: string; via: Pt[]; mgmt: boolean; ox: number; oy: number }[] = [];

  function emit(pl: FlowPlan, ox: number, oy: number) {
    for (const id of pl.ids) {
      const p = pl.pos.get(id) as Pt;
      const sz = pl.nodeSize.get(id) as { w: number; h: number };
      if (id.startsWith('frame:')) {
        const oid = id.slice(6);
        const fr = pl.frames.get(oid) as FlowPlan & { w: number; h: number };
        const collapsed = collapsedMgmt.has(oid);
        const empty = fr.ids.length + fr.secNodes.length === 0;
        frames.push({ order: oid, x: ox + p.x, y: oy + p.y, w: sz.w, h: sz.h, collapsed, empty });
        if (!collapsed && !empty) emit(fr, ox + p.x + FRAME_PAD + (sz.w - 2 * FRAME_PAD - fr.size.w) / 2, oy + p.y + FRAME_HEAD + FRAME_PAD);
      } else if (id.startsWith('sec:')) {
        secNodes.set(id, { x: ox + p.x, y: oy + p.y, w: sz.w, h: sz.h });
      } else {
        const e = byId.get(id) as El;
        nodes.set(id, { x: ox + p.x + (e.dx ?? 0), y: oy + p.y + (e.dy ?? 0), w: sz.w, h: sz.h });
      }
    }
    for (const ed of pl.edges) {
      const via = (pl.via.get(ed.key) ?? []).map((q) => ({ x: ox + q.x, y: oy + q.y }));
      const isMg = ed.key.startsWith('mg|');
      let out = 'gestellt';
      let to = ed.to;
      let from = ed.from;
      if (!isMg) {
        const [f, o, t] = ed.key.split('|');
        out = o;
        from = f;
        to = t;
      }
      rawEdges.push({ key: ed.key, from, out, to, via, mgmt: isMg, ox, oy });
    }
  }
  emit(main, 0, 0);

  const boxOf = (id: string): Box | undefined => {
    const r = repOf(id);
    if (r.startsWith('sec:')) return secNodes.get(r);
    return nodes.get(id);
  };

  const edges: FlowEdgeGeo[] = [];
  for (const re of rawEdges) {
    let a: Box | undefined;
    let b: Box | undefined;
    let fromPt: Pt;
    let toPt: Pt;
    if (re.mgmt) {
      const oid = re.key.slice(3);
      a = boxOf(oid);
      b = frames.find((f) => f.order === oid);
      if (!a || !b) continue;
      const oe = byId.get(oid) as El;
      const outs = outputsOf(oe);
      const gi = outs.findIndex((o) => o.id === 'gestellt');
      fromPt = outPort(a, gi, outs.length, dir);
      toPt = inPort(b, dir);
      edges.push({ key: re.key, from: oid, out: 'gestellt', to: `frame:${oid}`, pts: [fromPt, toPt], mgmt: true });
      continue;
    }
    a = boxOf(re.from);
    b = boxOf(re.to);
    if (!a || !b) continue;
    const fe = byId.get(re.from) as El;
    const outs = outputsOf(fe);
    const isSecFrom = repOf(re.from).startsWith('sec:');
    const oi = Math.max(0, outs.findIndex((o) => o.id === re.out));
    fromPt = isSecFrom ? outPort(a, 0, 1, dir) : outPort(a, oi, outs.length, dir);
    toPt = inPort(b, dir);
    // waypoints come from the automatic layout and follow manual shifts of neither end
    edges.push({ key: re.key, from: re.from, out: re.out, to: re.to, pts: [fromPt, ...re.via, toPt] });
  }

  // ---- section bands ----
  const bands: BandGeo[] = [];
  for (const sec of s.sections) {
    if (sec.collapsed) continue;
    const bs = sec.els.map((id) => nodes.get(id)).filter((b): b is Box => !!b);
    if (bs.length === 0) continue;
    const x0 = Math.min(...bs.map((b) => b.x)) - 12;
    const y0 = Math.min(...bs.map((b) => b.y)) - 14;
    const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 12;
    const y1 = Math.max(...bs.map((b) => b.y + b.h)) + 12;
    bands.push({ id: sec.id, name: sec.name, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }

  // ---- objects without flow connection ----
  const usage = collectUsage(s);
  const objects = s.els.filter((e) => isObjectEl(e.type));
  const usedProps = new Map<string, Set<string>>();
  for (const u of usage) {
    if (!usedProps.has(u.src)) usedProps.set(u.src, new Set());
    usedProps.get(u.src)?.add(u.prop);
  }
  const consumerY = (id: string): number => {
    const ys = usage.filter((u) => u.src === id).map((u) => {
      const b = nodes.get(u.dst);
      return b ? (dir === 'v' ? b.y : b.x) : Infinity;
    });
    return ys.length ? Math.min(...ys) : Infinity;
  };
  const ordered = [...objects].sort((a, b) => {
    const ya = consumerY(a.id);
    const yb = consumerY(b.id);
    if (ya === yb) return objects.indexOf(a) - objects.indexOf(b);
    return ya - yb;
  });
  const cards = new Map<string, CardGeo>();
  const heights = ordered.map((e) => {
    const all = propsOf(e).map((p) => p.id);
    const used = all.filter((p) => usedProps.get(e.id)?.has(p));
    const rows = e.open ? all : used.length > 0 ? used : all.slice(0, 3);
    const more = all.length - rows.length;
    return { e, rows, more, h: CARD_HEAD + rows.length * ROW_H + (all.length > 3 || e.open ? 30 : 8) };
  });
  let lane: Box | null = null;
  if (heights.length) {
    if (dir === 'v') {
      const x = -(CARD_W + 96);
      let y = 0;
      for (const hh of heights) {
        const rowY = new Map<string, number>();
        hh.rows.forEach((p, i) => rowY.set(p, y + CARD_HEAD + i * ROW_H + ROW_H / 2));
        cards.set(hh.e.id, { id: hh.e.id, x: x + (hh.e.dx ?? 0), y: y + (hh.e.dy ?? 0), w: CARD_W, h: hh.h, rows: hh.rows, more: hh.more, rowY });
        y += hh.h + 22;
      }
      lane = { x: x - 14, y: -44, w: CARD_W + 28, h: y + 44 };
    } else {
      const maxH = Math.max(...heights.map((x) => x.h));
      const y = -(maxH + 120);
      let x = 0;
      for (const hh of heights) {
        const rowY = new Map<string, number>();
        hh.rows.forEach((p, i) => rowY.set(p, y + CARD_HEAD + i * ROW_H + ROW_H / 2));
        cards.set(hh.e.id, { id: hh.e.id, x: x + (hh.e.dx ?? 0), y: y + (hh.e.dy ?? 0), w: CARD_W, h: hh.h, rows: hh.rows, more: hh.more, rowY });
        x += CARD_W + 22;
      }
      lane = { x: -14, y: y - 44, w: x + 14, h: maxH + 58 };
    }
  }

  // ---- data wires ----
  const wires: WireGeo[] = [];
  const groups = new Map<string, Usage[]>();
  for (const u of usage) {
    if (!cards.has(u.src)) continue;
    const dstBox = nodes.get(u.dst) ?? cards.get(u.dst);
    const dstVisible = !!dstBox || rep.has(u.dst);
    if (!dstVisible || u.src === u.dst) continue;
    const k = `${u.src}>${u.dst}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)?.push(u);
  }
  for (const [k, us] of groups) {
    const src = cards.get(us[0].src) as CardGeo;
    const dstId = us[0].dst;
    const dst: Box | undefined = nodes.get(dstId) ?? cards.get(dstId) ?? secNodes.get(repOf(dstId));
    if (!dst) continue;
    const ys = us.map((u) => src.rowY.get(u.prop)).filter((y): y is number => y !== undefined);
    const avgY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : src.y + src.h / 2;
    const stubs = ys.length > 1 ? ys.map((y) => [{ x: src.x + src.w, y }, { x: src.x + src.w + 14, y }]) : [];
    const start: Pt = { x: src.x + src.w + (ys.length > 1 ? 14 : 0), y: avgY };
    const end = dataPort(dst, dir);
    wires.push({
      key: k, src: us[0].src, dst: dstId, props: us.map((u) => u.prop), solid: us.some((u) => u.solid), pts: [start, end], stubs,
    });
  }

  // ---- bounds ----
  const all: Box[] = [...nodes.values(), ...secNodes.values(), ...cards.values(), ...frames, ...bands];
  if (lane) all.push(lane);
  if (all.length === 0) all.push({ x: 0, y: 0, w: EL_W, h: EL_H });
  const x0 = Math.min(...all.map((b) => b.x));
  const y0 = Math.min(...all.map((b) => b.y));
  const x1 = Math.max(...all.map((b) => b.x + b.w));
  const y1 = Math.max(...all.map((b) => b.y + b.h));

  return { nodes, secNodes, cards, frames, bands, edges, wires, lane, bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, rep, usage };
}

/** Smooth path through points with tangents along the main axis. */
export function pathThrough(pts: Pt[], dir: Dir): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (dir === 'v') {
      const k = Math.max(24, Math.abs(b.y - a.y) * 0.5);
      d += ` C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
    } else {
      const k = Math.max(24, Math.abs(b.x - a.x) * 0.5);
      d += ` C ${a.x + k} ${a.y}, ${b.x - k} ${b.y}, ${b.x} ${b.y}`;
    }
  }
  return d;
}

/** Wire path: leaves the card to the right (vertical) or downward (horizontal). */
export function wirePath(w: WireGeo, dir: Dir): string {
  const a = w.pts[0];
  const b = w.pts[1];
  if (dir === 'v') {
    const k = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + k} ${a.y}, ${b.x - k} ${b.y}, ${b.x} ${b.y}`;
  }
  const kx = Math.max(30, Math.abs(b.x - a.x) * 0.3);
  const ky = Math.max(40, Math.abs(b.y - a.y) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + kx} ${a.y}, ${b.x} ${b.y - ky}, ${b.x} ${b.y}`;
}

export { isTrigger };
