// Geometry of the drawing area: automatic arrangement of the flow, the frames of the
// managements, the sections and the area for objects, plus the lines of the data
// connections between them. The arrangement is taken over from the confirmed prototype
// (specification E8, 5.3); React Flow shows what is computed here. The input is
// reduced to what the arrangement needs, so that it knows no single type (E2).
import { layered } from './layout';
import type { LEdge, LNode, Pt } from './layout';

export type { Pt } from './layout';

export type Dir = 'v' | 'h';

export const EL_W = 236;
export const EL_H = 96;
export const SEC_H = 58;
export const CARD_W = 236;
export const ROW_H = 27;
export const CARD_HEAD = 50;
export const FRAME_HEAD = 36;
export const FRAME_PAD = 18;
export const LANE_GAP = 96;
const MORE_ROW_H = 30;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StepKind = 'trigger' | 'flow' | 'unknown';

export interface SceneOutput {
  id: string;
  /** The management of the element hangs at this output. */
  management: boolean;
}

/** An element of the flow (a trigger, a step or an element of an unknown type). */
export interface SceneStep {
  id: string;
  kind: StepKind;
  /** The element "place order" whose management the step belongs to, or `null` for the main flow. */
  mgmt: string | null;
  outputs: SceneOutput[];
  /** The element has a management and so a frame. */
  hasFrame: boolean;
  /** The position the user gave; `null` if the arrangement decides. */
  pos: Pt | null;
}

/** An object on the drawing area, shown as a card with a row per property. */
export interface SceneCard {
  id: string;
  properties: string[];
  open: boolean;
}

export interface SceneConnection {
  id: string;
  from: string;
  out: string;
  to: string;
}

export interface SceneSection {
  id: string;
  flow: string | null;
  elements: string[];
  collapsed: boolean;
}

/** A value of a property of an object that an element uses. `solid`: the user connected it; otherwise only an expression uses it. */
export interface Usage {
  src: string;
  prop: string;
  dst: string;
  solid: boolean;
}

export interface SceneInput {
  steps: SceneStep[];
  cards: SceneCard[];
  connections: SceneConnection[];
  sections: SceneSection[];
  collapsedManagements: string[];
  usage: Usage[];
}

export interface FlowEdgeGeo {
  key: string;
  /** Identifier of the connection in the document; `null` for the line from an element to its frame. */
  connection: string | null;
  from: string;
  out: string;
  to: string;
  pts: Pt[];
  /** The line belongs to a management (green, dotted). */
  mgmt: boolean;
  /** Not drawn: the line only serves the arrangement. */
  hidden: boolean;
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
  owner: string;
  collapsed: boolean;
  empty: boolean;
}

export interface BandGeo extends Box {
  id: string;
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
  /** Elements inside a collapsed section: the identifier of the box that stands for them. */
  rep: Map<string, string>;
  usage: Usage[];
}

// ---- ports ------------------------------------------------------------------------

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

interface FlowPlan {
  key: string | null;
  ids: string[];
  secNodes: { id: string; secId: string }[];
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

function boxContains(b: Box, p: Pt): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

export function frameAt(scene: Scene, p: Pt, exclude?: string): FrameGeo | undefined {
  // the innermost frame: frames are listed outer before inner
  let found: FrameGeo | undefined;
  for (const f of scene.frames) {
    if (!f.collapsed && f.owner !== exclude && boxContains(f, p)) {
      found = f;
    }
  }
  return found;
}

export function buildScene(input: SceneInput, dir: Dir): Scene {
  const stepById = new Map(input.steps.map((s) => [s.id, s]));
  const sectionById = new Map(input.sections.map((s) => [s.id, s]));
  const rep = new Map<string, string>();
  for (const sec of input.sections) {
    if (sec.collapsed) {
      for (const id of sec.elements) {
        if (stepById.has(id)) {
          rep.set(id, `sec:${sec.id}`);
        }
      }
    }
  }
  const repOf = (id: string): string => rep.get(id) ?? id;
  const collapsedMgmt = new Set(input.collapsedManagements);
  const hiddenOwners = new Set<string>();
  for (const s of input.steps) {
    if (rep.has(s.id)) {
      hiddenOwners.add(s.id);
    }
  }
  // The line from the output of a management to the first step of the management (specification 3.3)
  const startConnections = input.connections.filter((c) => {
    const a = stepById.get(c.from);
    const b = stepById.get(c.to);
    return a !== undefined && b !== undefined && a.hasFrame && b.mgmt === a.id && a.outputs.some((o) => o.id === c.out && o.management);
  });
  const hasStart = new Set(startConnections.map((c) => c.from));

  const plans = new Map<string | null, FlowPlan>();

  function plan(key: string | null): FlowPlan {
    const cached = plans.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const members = input.steps.filter((s) => s.mgmt === key);
    const nodeSize = new Map<string, { w: number; h: number }>();
    const nodeIds: string[] = [];
    const secNodes: FlowPlan['secNodes'] = [];
    for (const s of members) {
      const r = repOf(s.id);
      if (r.startsWith('sec:')) {
        if (!nodeSize.has(r)) {
          nodeSize.set(r, { w: EL_W, h: SEC_H });
          nodeIds.push(r);
          secNodes.push({ id: r, secId: r.slice(4) });
        }
      } else {
        nodeSize.set(s.id, { w: EL_W, h: EL_H });
        nodeIds.push(s.id);
      }
    }
    const frames = new Map<string, FlowPlan & { w: number; h: number }>();
    const edges: LEdge[] = [];
    for (const s of members) {
      if (!s.hasFrame || hiddenOwners.has(s.id)) {
        continue;
      }
      const inner = plan(s.id);
      const collapsed = collapsedMgmt.has(s.id);
      const hasInner = inner.ids.length + inner.secNodes.length > 0;
      let w: number;
      let h: number;
      if (collapsed) {
        w = EL_W;
        h = 46;
      } else if (!hasInner) {
        w = EL_W + 2 * FRAME_PAD;
        h = FRAME_HEAD + 64;
      } else {
        w = Math.max(EL_W, inner.size.w) + 2 * FRAME_PAD;
        h = FRAME_HEAD + inner.size.h + 2 * FRAME_PAD;
      }
      frames.set(s.id, { ...inner, w, h });
      const fid = `frame:${s.id}`;
      nodeSize.set(fid, { w, h });
      nodeIds.push(fid);
      edges.push({ key: `mg|${s.id}`, from: repOf(s.id), to: fid, order: 0 });
    }
    for (const c of input.connections) {
      const a = stepById.get(c.from);
      const b = stepById.get(c.to);
      if (a === undefined || b === undefined || a.mgmt !== key || b.mgmt !== key) {
        continue;
      }
      const ra = repOf(c.from);
      const rb = repOf(c.to);
      if (ra === rb) {
        continue;
      }
      const idx = a.outputs.findIndex((o) => o.id === c.out);
      edges.push({ key: `${c.id}`, from: ra, to: rb, order: idx < 0 ? 0 : idx });
    }
    const sw = dir === 'v';
    const lnodes: LNode[] = nodeIds.map((id) => {
      const sz = nodeSize.get(id) ?? { w: EL_W, h: EL_H };
      return sw ? { id, w: sz.w, h: sz.h } : { id, w: sz.h, h: sz.w };
    });
    const res = layered(lnodes, edges, sw ? 48 : 26, sw ? 66 : 76);
    const pos = new Map<string, Pt>();
    const via = new Map<string, Pt[]>();
    for (const [id, p] of res.pos) {
      pos.set(id, sw ? p : transpose(p));
    }
    for (const [k, v] of res.via) {
      via.set(k, sw ? v : v.map(transpose));
    }
    const result: FlowPlan = {
      key,
      ids: nodeIds,
      secNodes,
      frames,
      pos,
      via,
      edges,
      nodeSize,
      size: { x: 0, y: 0, w: sw ? res.w : res.h, h: sw ? res.h : res.w },
    };
    plans.set(key, result);
    return result;
  }

  const main = plan(null);

  // ---- absolute geometry ----
  const nodes = new Map<string, Box>();
  const secNodes = new Map<string, Box>();
  const frames: FrameGeo[] = [];
  const connectionOf = new Map(input.connections.map((c) => [c.id, c]));
  const rawEdges: { key: string; via: Pt[]; mgmt: boolean }[] = [];
  const moved = new Set<string>();

  function emit(pl: FlowPlan, ox: number, oy: number): void {
    for (const id of pl.ids) {
      const p = pl.pos.get(id) ?? { x: 0, y: 0 };
      const sz = pl.nodeSize.get(id) ?? { w: EL_W, h: EL_H };
      if (id.startsWith('frame:')) {
        const owner = id.slice(6);
        const fr = pl.frames.get(owner);
        if (fr === undefined) {
          continue;
        }
        const collapsed = collapsedMgmt.has(owner);
        const empty = fr.ids.length + fr.secNodes.length === 0;
        frames.push({ owner, x: ox + p.x, y: oy + p.y, w: sz.w, h: sz.h, collapsed, empty });
        if (!collapsed && !empty) {
          emit(fr, ox + p.x + FRAME_PAD + (sz.w - 2 * FRAME_PAD - fr.size.w) / 2, oy + p.y + FRAME_HEAD + FRAME_PAD);
        }
      } else if (id.startsWith('sec:')) {
        secNodes.set(id, { x: ox + p.x, y: oy + p.y, w: sz.w, h: sz.h });
      } else {
        const step = stepById.get(id);
        const user = step?.pos ?? null;
        if (user !== null) {
          moved.add(id);
        }
        nodes.set(id, { x: user?.x ?? ox + p.x, y: user?.y ?? oy + p.y, w: sz.w, h: sz.h });
      }
    }
    for (const ed of pl.edges) {
      const via = (pl.via.get(ed.key) ?? []).map((q) => ({ x: ox + q.x, y: oy + q.y }));
      rawEdges.push({ key: ed.key, via, mgmt: ed.key.startsWith('mg|') });
    }
  }
  emit(main, 0, 0);

  const boxOf = (id: string): Box | undefined => {
    const r = repOf(id);
    return r.startsWith('sec:') ? secNodes.get(r) : nodes.get(id);
  };

  const edges: FlowEdgeGeo[] = [];
  for (const re of rawEdges) {
    if (re.mgmt) {
      const owner = re.key.slice(3);
      const a = boxOf(owner);
      const b = frames.find((f) => f.owner === owner);
      const step = stepById.get(owner);
      if (a === undefined || b === undefined || step === undefined) {
        continue;
      }
      const gi = step.outputs.findIndex((o) => o.management);
      const fromPt = outPort(a, Math.max(0, gi), Math.max(1, step.outputs.length), dir);
      edges.push({
        key: re.key,
        connection: null,
        from: owner,
        out: step.outputs[gi]?.id ?? '',
        to: `frame:${owner}`,
        pts: [fromPt, inPort(b, dir)],
        mgmt: true,
        hidden: hasStart.has(owner),
      });
      continue;
    }
    const c = connectionOf.get(re.key);
    if (c === undefined) {
      continue;
    }
    const a = boxOf(c.from);
    const b = boxOf(c.to);
    const fe = stepById.get(c.from);
    if (a === undefined || b === undefined || fe === undefined) {
      continue;
    }
    const isSecFrom = repOf(c.from).startsWith('sec:');
    const oi = Math.max(0, fe.outputs.findIndex((o) => o.id === c.out));
    const fromPt = isSecFrom ? outPort(a, 0, 1, dir) : outPort(a, oi, Math.max(1, fe.outputs.length), dir);
    const toPt = inPort(b, dir);
    // waypoints come from the automatic arrangement and are dropped where the user moved an end
    const via = moved.has(c.from) || moved.has(c.to) ? [] : re.via;
    edges.push({
      key: re.key,
      connection: c.id,
      from: c.from,
      out: c.out,
      to: c.to,
      pts: [fromPt, ...via, toPt],
      mgmt: false,
      hidden: false,
    });
  }
  for (const c of startConnections) {
    const a = boxOf(c.from);
    const b = boxOf(c.to);
    const fe = stepById.get(c.from);
    if (a === undefined || b === undefined || fe === undefined) {
      continue;
    }
    const oi = Math.max(0, fe.outputs.findIndex((o) => o.id === c.out));
    edges.push({
      key: c.id,
      connection: c.id,
      from: c.from,
      out: c.out,
      to: c.to,
      pts: [outPort(a, oi, Math.max(1, fe.outputs.length), dir), inPort(b, dir)],
      mgmt: true,
      hidden: false,
    });
  }

  // ---- section bands ----
  const bands: BandGeo[] = [];
  for (const sec of input.sections) {
    if (sec.collapsed) {
      continue;
    }
    const bs = sec.elements.map((id) => nodes.get(id)).filter((b): b is Box => b !== undefined);
    if (bs.length === 0) {
      continue;
    }
    const x0 = Math.min(...bs.map((b) => b.x)) - 12;
    const y0 = Math.min(...bs.map((b) => b.y)) - 14;
    const x1 = Math.max(...bs.map((b) => b.x + b.w)) + 12;
    const y1 = Math.max(...bs.map((b) => b.y + b.h)) + 12;
    bands.push({ id: sec.id, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }

  // ---- objects without flow connection: in the order of the elements ----
  const usedProps = new Map<string, Set<string>>();
  for (const u of input.usage) {
    const set = usedProps.get(u.src) ?? new Set<string>();
    set.add(u.prop);
    usedProps.set(u.src, set);
  }
  const heights = input.cards.map((card) => {
    const used = card.properties.filter((p) => usedProps.get(card.id)?.has(p) === true);
    const rows = card.open ? card.properties : used.length > 0 ? used : card.properties.slice(0, 3);
    const more = card.properties.length - rows.length;
    return { card, rows, more, h: CARD_HEAD + rows.length * ROW_H + (card.properties.length > 3 || card.open ? MORE_ROW_H : 8) };
  });
  const cards = new Map<string, CardGeo>();
  let lane: Box | null = null;
  if (heights.length > 0) {
    if (dir === 'v') {
      const x = -(CARD_W + LANE_GAP);
      let y = 0;
      for (const hh of heights) {
        const rowY = new Map<string, number>();
        hh.rows.forEach((p, i) => rowY.set(p, y + CARD_HEAD + i * ROW_H + ROW_H / 2));
        cards.set(hh.card.id, { id: hh.card.id, x, y, w: CARD_W, h: hh.h, rows: hh.rows, more: hh.more, rowY });
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
        cards.set(hh.card.id, { id: hh.card.id, x, y, w: CARD_W, h: hh.h, rows: hh.rows, more: hh.more, rowY });
        x += CARD_W + 22;
      }
      lane = { x: -14, y: y - 44, w: x + 14, h: maxH + 58 };
    }
  }

  // ---- data wires ----
  const wires: WireGeo[] = [];
  const groups = new Map<string, Usage[]>();
  for (const u of input.usage) {
    if (!cards.has(u.src)) {
      continue;
    }
    const dstBox = nodes.get(u.dst) ?? cards.get(u.dst);
    const dstVisible = dstBox !== undefined || rep.has(u.dst);
    if (!dstVisible || u.src === u.dst) {
      continue;
    }
    const k = `${u.src}>${u.dst}`;
    const list = groups.get(k) ?? [];
    list.push(u);
    groups.set(k, list);
  }
  for (const [k, us] of groups) {
    const first = us[0];
    if (first === undefined) {
      continue;
    }
    const src = cards.get(first.src);
    const dst: Box | undefined = nodes.get(first.dst) ?? cards.get(first.dst) ?? secNodes.get(repOf(first.dst));
    if (src === undefined || dst === undefined) {
      continue;
    }
    const ys = us.map((u) => src.rowY.get(u.prop)).filter((y): y is number => y !== undefined);
    const avgY = ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length : src.y + src.h / 2;
    const stubs = ys.length > 1 ? ys.map((y) => [{ x: src.x + src.w, y }, { x: src.x + src.w + 14, y }]) : [];
    const start: Pt = { x: src.x + src.w + (ys.length > 1 ? 14 : 0), y: avgY };
    const end = dataPort(dst, dir);
    wires.push({
      key: k,
      src: first.src,
      dst: first.dst,
      props: us.map((u) => u.prop),
      solid: us.some((u) => u.solid),
      pts: [start, end],
      stubs,
    });
  }

  // ---- bounds ----
  const all: Box[] = [...nodes.values(), ...secNodes.values(), ...cards.values(), ...frames, ...bands];
  if (lane !== null) {
    all.push(lane);
  }
  if (all.length === 0) {
    all.push({ x: 0, y: 0, w: EL_W, h: EL_H });
  }
  const x0 = Math.min(...all.map((b) => b.x));
  const y0 = Math.min(...all.map((b) => b.y));
  const x1 = Math.max(...all.map((b) => b.x + b.w));
  const y1 = Math.max(...all.map((b) => b.y + b.h));

  void sectionById;
  return { nodes, secNodes, cards, frames, bands, edges, wires, lane, bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, rep, usage: input.usage };
}

/** Smooth path through points with tangents along the main axis. */
export function pathThrough(pts: Pt[], dir: Dir): string {
  const first = pts[0];
  if (pts.length < 2 || first === undefined) {
    return '';
  }
  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a === undefined || b === undefined) {
      continue;
    }
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
  if (a === undefined || b === undefined) {
    return '';
  }
  if (dir === 'v') {
    const k = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + k} ${a.y}, ${b.x - k} ${b.y}, ${b.x} ${b.y}`;
  }
  const kx = Math.max(30, Math.abs(b.x - a.x) * 0.3);
  const ky = Math.max(40, Math.abs(b.y - a.y) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + kx} ${a.y}, ${b.x} ${b.y - ky}, ${b.x} ${b.y}`;
}
