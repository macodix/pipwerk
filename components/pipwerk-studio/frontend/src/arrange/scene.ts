// Geometry of the drawing area: automatic arrangement of the flow, the frames of the
// managements and the sections, the places of the objects beside the elements that use
// them, plus the lines of the data connections between them. Code of the prototype, taken
// over and adapted (specification E8: the prototype is an aid, not a template; 5.3 is
// authoritative); it is checked like any other code (docs/technical/pipwerk-studio.md,
// section 2.3). The flow library shows what is computed here. The input is reduced to what
// the arrangement needs, so that it knows no single type (E2).
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
/** The room between a card and the element it sits beside (the label of the line stands there). */
export const CARD_GAP = 72;
/** The room between two cards that sit beside the same element. */
export const CARD_STACK_GAP = 16;
/** The room between the flow and a card that no element uses. */
export const FREE_GAP = 72;
const MORE_ROW_H = 30;
/** The rows of an object that no element uses yet. */
export const UNUSED_ROWS = 3;

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

/**
 * An object on the drawing area, shown as a card with a row per property and method. `home` is the element (or the
 * card of another instance) it sits beside, `null` if no element uses it; `pos` is the place the user gave it.
 */
export interface SceneCard {
  id: string;
  /** Every property and method of the object, in the order of the card. */
  rows: string[];
  /** The rows whose values an element uses. */
  usedRows: string[];
  open: boolean;
  home: string | null;
  pos: Pt | null;
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

/** The line of values from a card to an element (or to the card of another instance). `first`: it leads to the element of the first use. */
export interface SceneLink {
  key: string;
  src: string;
  dst: string;
  first: boolean;
  rows: string[];
}

export interface SceneInput {
  steps: SceneStep[];
  cards: SceneCard[];
  connections: SceneConnection[];
  sections: SceneSection[];
  collapsedManagements: string[];
  links: SceneLink[];
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
  /** The rows that are shown. */
  rows: string[];
  /** The number of rows that are hidden until "Alle anzeigen". */
  more: number;
  /** Whether the card has the button that shows all rows or fewer. */
  toggle: boolean;
  rowY: Map<string, number>;
}

export interface LinkGeo {
  key: string;
  src: string;
  dst: string;
  first: boolean;
  rows: string[];
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
  links: LinkGeo[];
  bounds: Box;
  /** Elements inside a collapsed section: the identifier of the box that stands for them. */
  rep: Map<string, string>;
}

// ---- ports ------------------------------------------------------------------------

export function outPort(b: Box, i: number, n: number, dir: Dir): Pt {
  const f = (i + 1) / (n + 1);
  return dir === 'v' ? { x: b.x + b.w * f, y: b.y + b.h } : { x: b.x + b.w, y: b.y + b.h * f };
}
export function inPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x + b.w / 2, y: b.y } : { x: b.x, y: b.y + b.h / 2 };
}
/** The one point at which the lines of values end: at the side where the objects lie (left, or above). */
export function dataPort(b: Box, dir: Dir): Pt {
  return dir === 'v' ? { x: b.x, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y };
}

// ---- cards ------------------------------------------------------------------------

interface CardShape {
  card: SceneCard;
  rows: string[];
  more: number;
  toggle: boolean;
  h: number;
}

/** The rows of a card that are shown: the used ones, for an unused object the first three, with "Alle anzeigen" all. */
function shapeOf(card: SceneCard): CardShape {
  const total = card.rows.length;
  const used = card.rows.filter((row) => card.usedRows.includes(row));
  const rows = card.open ? card.rows : used.length > 0 ? used : card.rows.slice(0, UNUSED_ROWS);
  const toggle = total > UNUSED_ROWS && (rows.length < total || card.open);
  return { card, rows, more: total - rows.length, toggle, h: CARD_HEAD + rows.length * ROW_H + (toggle ? MORE_ROW_H : 8) };
}

/** The places of cards relative to the box they sit beside, and the room they need on the side of the objects. */
interface Attachment {
  rel: Map<string, Pt>;
  /** Vertical flow: the room to the left of the element; horizontal flow: the room above it. */
  before: number;
  /** The extent of the cards across that direction. */
  across: number;
}

/**
 * Lays the cards that sit beside one box relative to its top left corner: in columns to its left (vertical flow) or in
 * rows above it (horizontal flow), a card of an instance that only another instance uses one column or row further out.
 */
function attach(levels: CardShape[][], parentOf: Map<string, string>, dir: Dir): Attachment {
  const rel = new Map<string, Pt>();
  let across = 0;
  let before = 0;
  if (dir === 'v') {
    levels.forEach((level, index) => {
      let cursor = 0;
      for (const shape of level) {
        const parent = rel.get(parentOf.get(shape.card.id) ?? '');
        const y = Math.max(cursor, index === 0 || parent === undefined ? 0 : parent.y);
        rel.set(shape.card.id, { x: -(index + 1) * (CARD_W + CARD_GAP), y });
        cursor = y + shape.h + CARD_STACK_GAP;
      }
      across = Math.max(across, cursor - CARD_STACK_GAP);
    });
    before = levels.length * (CARD_W + CARD_GAP);
  } else {
    let bottom = -CARD_GAP;
    levels.forEach((level, index) => {
      let cursor = 0;
      const tallest = Math.max(0, ...level.map((shape) => shape.h));
      for (const shape of level) {
        const parent = rel.get(parentOf.get(shape.card.id) ?? '');
        const x = Math.max(cursor, index === 0 || parent === undefined ? 0 : parent.x);
        rel.set(shape.card.id, { x, y: bottom - shape.h });
        cursor = x + CARD_W + CARD_STACK_GAP;
      }
      across = Math.max(across, cursor - CARD_STACK_GAP);
      bottom -= tallest + CARD_GAP;
    });
    before = levels.length === 0 ? 0 : -(bottom + CARD_GAP);
  }
  return { rel, before, across };
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
  /** The size of a node of the layout: the element together with the cards that sit beside it. */
  nodeSize: Map<string, { w: number; h: number }>;
  /** Where the element lies inside its node of the layout. */
  offset: Map<string, Pt>;
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

  // ---- cards: the box each one sits beside, in columns (levels) around it ----
  const shapes = new Map(input.cards.map((card) => [card.id, shapeOf(card)]));
  const cardById = new Map(input.cards.map((card) => [card.id, card]));
  /** The step, section box or card the user placed that a card is arranged around, the card it hangs at, and its column. */
  const rootOf = new Map<string, string>();
  const parentOf = new Map<string, string>();
  const depthOf = new Map<string, number>();
  /** Follows `home` from a card to the element, or to a card the user placed; `null` if it ends nowhere. */
  const chainOf = (card: SceneCard): { cards: SceneCard[]; root: string } | null => {
    const cards = [card];
    let current = card;
    for (;;) {
      const home = current.home;
      if (home === null) {
        return null;
      }
      const next = cardById.get(home);
      if (next === undefined) {
        return stepById.has(home) ? { cards, root: repOf(home) } : null;
      }
      if (next === card || cards.includes(next)) {
        return null;
      }
      if (next.pos !== null) {
        return { cards, root: next.id };
      }
      cards.push(next);
      current = next;
    }
  };
  for (const card of input.cards) {
    const chain = card.pos === null ? chainOf(card) : null;
    if (chain !== null) {
      rootOf.set(card.id, chain.root);
      depthOf.set(card.id, chain.cards.length - 1);
      const parent = chain.cards[1];
      if (parent !== undefined) {
        parentOf.set(card.id, parent.id);
      }
    }
  }
  const attachments = new Map<string, Attachment>();
  {
    const byRoot = new Map<string, CardShape[][]>();
    for (const card of input.cards) {
      const root = rootOf.get(card.id);
      const shape = shapes.get(card.id);
      if (card.pos !== null || root === undefined || shape === undefined) {
        continue;
      }
      const levels = byRoot.get(root) ?? [];
      const depth = depthOf.get(card.id) ?? 0;
      while (levels.length <= depth) {
        levels.push([]);
      }
      levels[depth]?.push(shape);
      byRoot.set(root, levels);
    }
    for (const [root, levels] of byRoot) {
      attachments.set(root, attach(levels, parentOf, dir));
    }
  }

  const plans = new Map<string | null, FlowPlan>();

  /** The size of a node of the layout for an element or a section box and the place of the element inside it. */
  function sized(id: string, w: number, h: number, nodeSize: Map<string, { w: number; h: number }>, offset: Map<string, Pt>): void {
    const around = attachments.get(id);
    if (around === undefined) {
      nodeSize.set(id, { w, h });
      offset.set(id, { x: 0, y: 0 });
    } else if (dir === 'v') {
      nodeSize.set(id, { w: w + around.before, h: Math.max(h, around.across) });
      offset.set(id, { x: around.before, y: 0 });
    } else {
      nodeSize.set(id, { w: Math.max(w, around.across), h: h + around.before });
      offset.set(id, { x: 0, y: around.before });
    }
  }

  function plan(key: string | null): FlowPlan {
    const cached = plans.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const members = input.steps.filter((s) => s.mgmt === key);
    const nodeSize = new Map<string, { w: number; h: number }>();
    const offset = new Map<string, Pt>();
    const nodeIds: string[] = [];
    const secNodes: FlowPlan['secNodes'] = [];
    for (const s of members) {
      const r = repOf(s.id);
      if (r.startsWith('sec:')) {
        if (!nodeSize.has(r)) {
          sized(r, EL_W, SEC_H, nodeSize, offset);
          nodeIds.push(r);
          secNodes.push({ id: r, secId: r.slice(4) });
        }
      } else {
        sized(s.id, EL_W, EL_H, nodeSize, offset);
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
      offset,
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
      const inside = pl.offset.get(id) ?? { x: 0, y: 0 };
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
        secNodes.set(id, { x: ox + p.x + inside.x, y: oy + p.y + inside.y, w: EL_W, h: SEC_H });
      } else {
        const step = stepById.get(id);
        const user = step?.pos ?? null;
        if (user !== null) {
          moved.add(id);
        }
        nodes.set(id, { x: user?.x ?? ox + p.x + inside.x, y: user?.y ?? oy + p.y + inside.y, w: EL_W, h: EL_H });
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

  // ---- cards: where the user put them, beside their element, or beside the flow ----
  const cards = new Map<string, CardGeo>();
  const putCard = (shape: CardShape, x: number, y: number): void => {
    const rowY = new Map<string, number>();
    shape.rows.forEach((row, index) => rowY.set(row, y + CARD_HEAD + index * ROW_H + ROW_H / 2));
    cards.set(shape.card.id, { id: shape.card.id, x, y, w: CARD_W, h: shape.h, rows: shape.rows, more: shape.more, toggle: shape.toggle, rowY });
  };
  for (const shape of shapes.values()) {
    if (shape.card.pos !== null) {
      putCard(shape, shape.card.pos.x, shape.card.pos.y);
    }
  }
  const rootBox = (root: string): Box | undefined => (root.startsWith('sec:') ? secNodes.get(root) : (nodes.get(root) ?? cards.get(root)));
  for (const [root, around] of attachments) {
    const box = rootBox(root);
    if (box === undefined) {
      continue;
    }
    for (const [id, at] of around.rel) {
      const shape = shapes.get(id);
      if (shape !== undefined) {
        putCard(shape, box.x + at.x, box.y + at.y);
      }
    }
  }
  // objects that no element uses and the user did not place: beside the flow, covering nothing
  const free = input.cards.filter((card) => card.pos === null && !rootOf.has(card.id));
  if (free.length > 0) {
    const others: Box[] = [...nodes.values(), ...secNodes.values(), ...frames, ...bands, ...cards.values()];
    const right = others.length === 0 ? 0 : Math.max(...others.map((b) => b.x + b.w));
    const bottom = others.length === 0 ? 0 : Math.max(...others.map((b) => b.y + b.h));
    const left = others.length === 0 ? 0 : Math.min(...others.map((b) => b.x));
    const top = others.length === 0 ? 0 : Math.min(...others.map((b) => b.y));
    let cursor = 0;
    for (const card of free) {
      const shape = shapes.get(card.id);
      if (shape === undefined) {
        continue;
      }
      if (dir === 'v') {
        putCard(shape, right + FREE_GAP, top + cursor);
        cursor += shape.h + CARD_STACK_GAP;
      } else {
        putCard(shape, left + cursor, bottom + FREE_GAP);
        cursor += CARD_W + CARD_STACK_GAP;
      }
    }
  }

  // ---- lines of values ----
  const links: LinkGeo[] = [];
  for (const link of input.links) {
    const src = cards.get(link.src);
    const dst: Box | undefined = cards.get(link.dst) ?? nodes.get(link.dst) ?? secNodes.get(repOf(link.dst));
    if (src === undefined || dst === undefined || link.src === link.dst) {
      continue;
    }
    const ys = link.rows.map((row) => src.rowY.get(row)).filter((y): y is number => y !== undefined);
    const avgY = ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length : src.y + CARD_HEAD / 2;
    const stubs = ys.length > 1 ? ys.map((y) => [{ x: src.x + src.w, y }, { x: src.x + src.w + 14, y }]) : [];
    const start: Pt = { x: src.x + src.w + (ys.length > 1 ? 14 : 0), y: avgY };
    links.push({ key: link.key, src: link.src, dst: link.dst, first: link.first, rows: link.rows, pts: [start, dataPort(dst, dir)], stubs });
  }

  // ---- bounds ----
  const all: Box[] = [...nodes.values(), ...secNodes.values(), ...cards.values(), ...frames, ...bands];
  if (all.length === 0) {
    all.push({ x: 0, y: 0, w: EL_W, h: EL_H });
  }
  const x0 = Math.min(...all.map((b) => b.x));
  const y0 = Math.min(...all.map((b) => b.y));
  const x1 = Math.max(...all.map((b) => b.x + b.w));
  const y1 = Math.max(...all.map((b) => b.y + b.h));

  return { nodes, secNodes, cards, frames, bands, edges, links, bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, rep };
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

/** Path of a line of values: leaves the card to the right and ends at the connection point of the element. */
export function linkPath(w: LinkGeo, dir: Dir): string {
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
