// Geometry of the canvas: automatic arrangement of the flow, the management frames and the sections.
// Every instance of an indicator, a trend or an object of the application lies at the element of its
// first use and is connected with it: next to it in the vertical flow, above it in the horizontal flow
// (req-ui-017). Instances without a first use lie where the user dropped them. The data connections
// between the instances and the elements that use them are drawn on top.
import { TYPES, isFlowEl, isObjectEl, isTrigger, membersOf } from './catalog';
import { layered } from './layout';
import type { LEdge, LNode, Pt } from './layout';
import type { El, Strategy } from './model';
import { collectUsage, memberKey, placements } from './uses';
import type { Placement, UseRec } from './uses';

export type Dir = 'v' | 'h';

export const EL_W = 236;
export const EL_H = 96;
export const SEC_H = 58;
export const CARD_W = 210;
export const ROW_H = 27;
export const CARD_HEAD = 50;
export const FRAME_HEAD = 36;
export const FRAME_PAD = 18;
/**
 * Distance between an instance and the element of its first use. It is smaller than the distance of two
 * consecutive elements of the flow (66 and 76, see buildScene), so that the instance lies close to its element
 * (order 06). A label that is longer than the space is shortened on the picture; the full text stays in the hint.
 */
export const BAND_GAP_V = 60;
export const BAND_GAP_H = 64;
/** Distance of consecutive elements of the flow: across the rank (vertical flow) and along it. */
export const FLOW_GAP = { v: 66, h: 76 };
const CARD_GAP = 16;
/** Height of the hint on an instance that is not connected yet. */
export const FREE_HINT = 44;

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

export interface CardRow {
  /** Property id, or for a method with arguments `id(args)`. */
  key: string;
  prop: string;
  args?: number[];
  used: boolean;
  method: boolean;
}

export interface CardGeo extends Box {
  id: string;
  rows: CardRow[];
  /** Number of rows that are folded away. */
  more: number;
  /** The card can unfold. */
  foldable: boolean;
  rowY: Map<string, number>;
  /** No first use: the card lies where it was dropped. */
  free: boolean;
  host: string | null;
}

export interface WireGeo {
  key: string;
  src: string;
  dst: string;
  /** The uses this line carries, in the order of the rows. */
  uses: { prop: string; args?: number[]; refresh: boolean; key: string }[];
  /** The connection of the first use: always visible. */
  first: boolean;
  refresh: boolean;
  pts: Pt[];
  stubs: Pt[][];
  mid: Pt;
  /** The line leaves the card to the side ('x') or downward ('y'). */
  lead: 'x' | 'y';
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
  bounds: Box;
  rep: Map<string, string>;
  usage: UseRec[];
  places: Map<string, Placement>;
}

// ---- helpers -------------------------------------------------------------------

export function outPort(b: Box, i: number, n: number, dir: Dir): Pt {
  const f = (i + 1) / (n + 1);
  return dir === 'v' ? { x: b.x + b.w * f, y: b.y + b.h } : { x: b.x + b.w, y: b.y + b.h * f };
}
export function inPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x, y: b.y + b.h / 2 };
}
/** Where the data connections end: left of the element in the vertical flow, on top in the horizontal flow. */
export function dataPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y };
}

function outputsOf(e: El) {
  return TYPES[e.type]?.outputs ?? [];
}

interface CardMetrics {
  rows: CardRow[];
  more: number;
  foldable: boolean;
  h: number;
}

function sortArgs(a?: number[]): number {
  return a && a.length ? a[0] : 0;
}

/** The rows of a card: the values that are used; unfolded: everything the object delivers. */
export function cardMetrics(e: El, usage: UseRec[], free: boolean): CardMetrics {
  const members = membersOf(e);
  const mine = usage.filter((u) => u.src === e.id);
  const order = (prop: string) => members.findIndex((m) => m.id === prop);
  const usedRows: CardRow[] = [];
  for (const u of [...mine].sort((a, b) => order(a.prop) - order(b.prop) || sortArgs(a.args) - sortArgs(b.args))) {
    const key = memberKey(u.prop, u.args);
    if (usedRows.some((r) => r.key === key)) continue;
    usedRows.push({ key, prop: u.prop, args: u.args, used: true, method: !!members.find((m) => m.id === u.prop)?.method });
  }
  const all: CardRow[] = [];
  for (const m of members) {
    if (m.method) {
      const used = usedRows.filter((r) => r.prop === m.id);
      if (used.length) all.push(...used);
      else all.push({ key: m.id, prop: m.id, used: false, method: true });
    } else {
      all.push(usedRows.find((r) => r.prop === m.id) ?? { key: m.id, prop: m.id, used: false, method: false });
    }
  }
  const closed: CardRow[] = usedRows.length > 0
    ? usedRows
    : members.filter((m) => !m.method).slice(0, 3).map((m) => ({ key: m.id, prop: m.id, used: false, method: false }));
  const foldable = all.length > closed.length;
  const rows = e.open && foldable ? all : closed;
  const h = CARD_HEAD + rows.length * ROW_H + (foldable ? 30 : 8) + (free ? FREE_HINT : 0);
  return { rows, more: all.length - rows.length, foldable, h };
}

interface Footprint {
  W: number;
  H: number;
  ex: number;
  ey: number;
  /** Cards attached to the element, relative to the top left corner of the footprint. */
  cards: { id: string; x: number; y: number }[];
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

  // ---- instances: first use, rows, footprint of every element with its cards ----
  const usage = collectUsage(s);
  const places = placements(s, usage);
  const objects = s.els.filter((e) => isObjectEl(e.type));
  const metrics = new Map<string, CardMetrics>();
  for (const o of objects) metrics.set(o.id, cardMetrics(o, usage, !places.has(o.id)));
  const attached = new Map<string, { id: string; depth: number; parent: string }[]>();
  for (const o of objects) {
    const pl = places.get(o.id);
    if (!pl) continue;
    if (!attached.has(pl.root)) attached.set(pl.root, []);
    attached.get(pl.root)?.push({ id: o.id, depth: pl.depth, parent: pl.host });
  }
  for (const list of attached.values()) list.sort((a, b) => a.depth - b.depth || objects.findIndex((o) => o.id === a.id) - objects.findIndex((o) => o.id === b.id));
  const cardH = (id: string) => (metrics.get(id) as CardMetrics).h;

  const footprints = new Map<string, Footprint>();
  function footprintOf(e: El): Footprint {
    const cached = footprints.get(e.id);
    if (cached) return cached;
    const att = attached.get(e.id) ?? [];
    let fp: Footprint;
    if (att.length === 0) {
      fp = { W: EL_W, H: EL_H, ex: 0, ey: 0, cards: [] };
    } else {
      const maxDepth = Math.max(...att.map((a) => a.depth));
      const band = (d: number) => att.filter((a) => a.depth === d);
      if (dir === 'v') {
        const colX = (d: number) => (maxDepth - d) * (CARD_W + BAND_GAP_V);
        const bandH = (d: number) => band(d).reduce((sum, a, i) => sum + cardH(a.id) + (i > 0 ? CARD_GAP : 0), 0);
        const H = Math.max(EL_H, ...Array.from({ length: maxDepth }, (_, i) => bandH(i + 1)));
        const cards: Footprint['cards'] = [];
        for (let d = 1; d <= maxDepth; d++) {
          let y = (H - bandH(d)) / 2;
          for (const a of band(d)) {
            cards.push({ id: a.id, x: colX(d), y });
            y += cardH(a.id) + CARD_GAP;
          }
        }
        fp = { W: maxDepth * (CARD_W + BAND_GAP_V) + EL_W, H, ex: maxDepth * (CARD_W + BAND_GAP_V), ey: (H - EL_H) / 2, cards };
      } else {
        const rowW = (d: number) => band(d).length * CARD_W + (band(d).length - 1) * CARD_GAP;
        const rowH = (d: number) => Math.max(0, ...band(d).map((a) => cardH(a.id)));
        const W = Math.max(EL_W, ...Array.from({ length: maxDepth }, (_, i) => rowW(i + 1)));
        // the farthest row on top, the nearest just above the element
        let y = 0;
        const rowY = new Map<number, number>();
        for (let d = maxDepth; d >= 1; d--) {
          rowY.set(d, y);
          y += rowH(d) + BAND_GAP_H;
        }
        const cards: Footprint['cards'] = [];
        for (let d = 1; d <= maxDepth; d++) {
          let x = (W - rowW(d)) / 2;
          for (const a of band(d)) {
            cards.push({ id: a.id, x, y: (rowY.get(d) as number) + rowH(d) - cardH(a.id) });
            x += CARD_W + CARD_GAP;
          }
        }
        fp = { W, H: y + EL_H, ex: (W - EL_W) / 2, ey: y, cards };
      }
    }
    footprints.set(e.id, fp);
    return fp;
  }

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
        const fp = footprintOf(e);
        nodeSize.set(e.id, { w: fp.W, h: fp.H });
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
    // layout: across the rank the element itself is what neighbours align to, not its cards
    const sw = dir === 'v';
    const lnodes: LNode[] = nodeIds.map((id) => {
      const sz = nodeSize.get(id) as { w: number; h: number };
      const fp = byId.has(id) ? footprintOf(byId.get(id) as El) : null;
      if (sw) return fp ? { id, w: sz.w, h: sz.h, ax: fp.ex + EL_W / 2 } : { id, w: sz.w, h: sz.h };
      return fp ? { id, w: sz.h, h: sz.w, ax: fp.ey + EL_H / 2 } : { id, w: sz.h, h: sz.w };
    });
    const res = layered(lnodes, edges, sw ? 48 : 26, sw ? FLOW_GAP.v : FLOW_GAP.h);
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
  const cardPos = new Map<string, Pt>();
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
        const fp = footprintOf(e);
        const dx = e.dx ?? 0;
        const dy = e.dy ?? 0;
        nodes.set(id, { x: ox + p.x + fp.ex + dx, y: oy + p.y + fp.ey + dy, w: EL_W, h: EL_H });
        // the cards follow the element, plus their own shift
        for (const c of fp.cards) {
          const ce = byId.get(c.id) as El;
          cardPos.set(c.id, { x: ox + p.x + c.x + dx + (ce.dx ?? 0), y: oy + p.y + c.y + dy + (ce.dy ?? 0) });
        }
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
  // the first element of the main flow stays at the origin, so the picture does not shift when instances are added
  let ox0 = 0;
  let oy0 = 0;
  const rid = main.ids[0];
  const rp = rid ? main.pos.get(rid) : undefined;
  if (rid && rp) {
    const fp = byId.has(rid) ? footprintOf(byId.get(rid) as El) : null;
    ox0 = -(rp.x + (fp?.ex ?? 0));
    oy0 = -(rp.y + (fp?.ey ?? 0));
  }
  emit(main, ox0, oy0);

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

  // ---- cards ----
  const cards = new Map<string, CardGeo>();
  const mkCard = (o: El, x: number, y: number, free: boolean) => {
    const m = metrics.get(o.id) as CardMetrics;
    const rowY = new Map<string, number>();
    m.rows.forEach((r, i) => rowY.set(r.key, y + CARD_HEAD + i * ROW_H + ROW_H / 2));
    cards.set(o.id, {
      id: o.id, x, y, w: CARD_W, h: m.h, rows: m.rows, more: m.more, foldable: m.foldable, rowY, free, host: places.get(o.id)?.host ?? null,
    });
  };
  for (const o of objects) {
    const p = cardPos.get(o.id);
    if (p) mkCard(o, p.x, p.y, false);
  }

  // ---- section bands (they include the cards of their elements) ----
  const bands: BandGeo[] = [];
  for (const sec of s.sections) {
    if (sec.collapsed) continue;
    const bs: Box[] = [];
    for (const id of sec.els) {
      const nb = nodes.get(id);
      if (nb) bs.push(nb);
      for (const [cid, pl] of places) if (pl.root === id) { const cb = cards.get(cid); if (cb) bs.push(cb); }
    }
    if (bs.length === 0) continue;
    const x0 = Math.min(...bs.map((b) => b.x)) - 12;
    const y0 = Math.min(...bs.map((b) => b.y)) - 14;
    const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 12;
    const y1 = Math.max(...bs.map((b) => b.y + b.h)) + 12;
    bands.push({ id: sec.id, name: sec.name, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }

  // ---- instances without a first use: where the user dropped them, otherwise beside the flow ----
  const flowBoxes: Box[] = [...nodes.values(), ...secNodes.values(), ...frames, ...bands, ...cards.values()];
  const fx0 = flowBoxes.length ? Math.min(...flowBoxes.map((b) => b.x)) : 0;
  const fy0 = flowBoxes.length ? Math.min(...flowBoxes.map((b) => b.y)) : 0;
  let nextFree = 0;
  for (const o of objects) {
    if (places.has(o.id)) continue;
    const m = metrics.get(o.id) as CardMetrics;
    let x: number;
    let y: number;
    if (o.fx !== undefined && o.fy !== undefined) {
      x = o.fx;
      y = o.fy;
    } else if (dir === 'v') {
      x = fx0 - CARD_W - 70;
      y = fy0 + nextFree;
      nextFree += m.h + CARD_GAP;
    } else {
      x = fx0 + nextFree;
      y = fy0 - m.h - 70;
      nextFree += CARD_W + CARD_GAP;
    }
    mkCard(o, x + (o.dx ?? 0), y + (o.dy ?? 0), true);
  }

  // ---- data connections ----
  const wires: WireGeo[] = [];
  const groups = new Map<string, UseRec[]>();
  for (const u of usage) {
    if (!cards.has(u.src) || u.src === u.dst) continue;
    const dstVisible = nodes.has(u.dst) || cards.has(u.dst) || rep.has(u.dst);
    if (!dstVisible) continue;
    const k = `${u.src}>${u.dst}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)?.push(u);
  }
  for (const [k, us] of groups) {
    const src = cards.get(us[0].src) as CardGeo;
    const dstId = us[0].dst;
    const dst: Box | undefined = nodes.get(dstId) ?? cards.get(dstId) ?? secNodes.get(repOf(dstId));
    if (!dst) continue;
    const keys = [...new Set(us.map((u) => memberKey(u.prop, u.args)))];
    const ys = keys.map((kk) => src.rowY.get(kk)).filter((y): y is number => y !== undefined);
    const avgY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : src.y + src.h / 2;
    const end = dataPort(dst, dir);
    let pts: Pt[];
    let stubs: Pt[][] = [];
    let lead: 'x' | 'y';
    if (dir === 'v') {
      stubs = ys.length > 1 ? ys.map((y) => [{ x: src.x + src.w, y }, { x: src.x + src.w + 14, y }]) : [];
      pts = [{ x: src.x + src.w + (ys.length > 1 ? 14 : 0), y: avgY }, end];
      lead = 'x';
    } else {
      pts = [{ x: src.x + src.w / 2, y: src.y + src.h }, end];
      lead = 'y';
    }
    const first = places.get(us[0].src)?.host === dstId;
    // the label names the values in the order of the rows of the card
    const rowIndex = (kk: string) => { const i = src.rows.findIndex((r) => r.key === kk); return i < 0 ? 999 : i; };
    const ordered = keys.sort((a, b) => rowIndex(a) - rowIndex(b)).map((kk) => us.find((u) => memberKey(u.prop, u.args) === kk) as UseRec);
    const w: WireGeo = {
      key: k, src: us[0].src, dst: dstId, first, refresh: ordered.some((u) => u.refresh), pts, stubs, lead, mid: { x: 0, y: 0 },
      uses: ordered.map((u) => ({ prop: u.prop, args: u.args, refresh: u.refresh, key: u.key })),
    };
    w.mid = wireMid(w, dir);
    wires.push(w);
  }
  // the connection to the first use is there even when the element uses no value yet
  for (const [oid, pl] of places) {
    const src = cards.get(oid);
    const dst = nodes.get(pl.host) ?? cards.get(pl.host);
    if (!src || !dst || groups.has(`${oid}>${pl.host}`)) continue;
    const end = dataPort(dst, dir);
    const pts = dir === 'v' ? [{ x: src.x + src.w, y: src.y + CARD_HEAD / 2 }, end] : [{ x: src.x + src.w / 2, y: src.y + src.h }, end];
    const w: WireGeo = { key: `${oid}>${pl.host}`, src: oid, dst: pl.host, first: true, refresh: false, pts, stubs: [], lead: dir === 'v' ? 'x' : 'y', mid: { x: 0, y: 0 }, uses: [] };
    w.mid = wireMid(w, dir);
    wires.push(w);
  }

  // ---- bounds ----
  const all: Box[] = [...nodes.values(), ...secNodes.values(), ...cards.values(), ...frames, ...bands];
  if (all.length === 0) all.push({ x: 0, y: 0, w: EL_W, h: EL_H });
  const x0 = Math.min(...all.map((b) => b.x));
  const y0 = Math.min(...all.map((b) => b.y));
  const x1 = Math.max(...all.map((b) => b.x + b.w));
  const y1 = Math.max(...all.map((b) => b.y + b.h));

  return { nodes, secNodes, cards, frames, bands, edges, wires, bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, rep, usage, places };
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

function wireControls(w: Pick<WireGeo, 'pts' | 'lead'>): [Pt, Pt, Pt, Pt] {
  const a = w.pts[0];
  const b = w.pts[1];
  if (w.lead === 'x') {
    const k = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return [a, { x: a.x + k, y: a.y }, { x: b.x - k, y: b.y }, b];
  }
  const k = Math.max(30, Math.abs(b.y - a.y) * 0.5);
  return [a, { x: a.x, y: a.y + k }, { x: b.x, y: b.y - k }, b];
}

/** The line between an instance and the element that uses it. */
export function wirePath(w: WireGeo, _dir?: Dir): string {
  const [a, c1, c2, b] = wireControls(w);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

function wireMid(w: Pick<WireGeo, 'pts' | 'lead'>, _dir?: Dir): Pt {
  const [a, c1, c2, b] = wireControls(w);
  return { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 };
}

export { isTrigger };
