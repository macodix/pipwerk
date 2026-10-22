// Uses of objects: which element uses which value of which instance, where an instance lies
// (the element of its first use, req-fach-055) and whether every path to a use passes that place.
import { isFlowEl, isObjectEl, isTrigger } from './catalog';
import { refsOf } from './expr';
import type { Binding, El, Expr, Strategy, Use } from './model';

/** Key of a use: the object, the property or method, the arguments of a method. */
export const memberKey = (prop: string, args?: number[]): string => `${prop}${args && args.length ? `(${args.join(',')})` : ''}`;
export const useKey = (u: Use): string => `${u.obj}|${memberKey(u.prop, u.args)}`;

export interface UseRec {
  src: string;
  prop: string;
  args?: number[];
  dst: string;
  /** The user connected it (line, list, input); otherwise the name only stands in an expression. */
  explicit: boolean;
  /** The element asks the instance to update its values first. */
  refresh: boolean;
  key: string;
  /** Only the main value of a new connection, nothing chosen yet. */
  auto: boolean;
}

function exprsOf(b: Binding | undefined): Expr[] {
  return b && b.k === 'expr' ? [b.e] : [];
}

/** Expressions of an element, with everything that can use a value. */
export function exprsOfEl(e: El): Expr[] {
  const out: Expr[] = [];
  for (const b of Object.values(e.bind)) out.push(...exprsOf(b));
  for (const r of e.rules) out.push(r.e);
  if (e.own) {
    for (const p of e.own.props) out.push(p.e);
    if (e.own.direction) out.push(e.own.direction);
  }
  return out;
}

export function collectUsage(s: Pick<Strategy, 'els'>): UseRec[] {
  const objs = new Set(s.els.filter((e) => isObjectEl(e.type)).map((e) => e.id));
  const out: UseRec[] = [];
  const add = (u: Use, dst: string, explicit: boolean) => {
    if (!objs.has(u.obj) || u.obj === dst) return;
    const key = useKey(u);
    const auto = !!u.auto;
    const ex = out.find((x) => x.key === key && x.dst === dst);
    if (ex) { ex.explicit = ex.explicit || explicit; ex.auto = ex.auto && auto; return; }
    const d = s.els.find((e) => e.id === dst);
    out.push({ src: u.obj, prop: u.prop, args: u.args, dst, explicit, refresh: !!d?.refresh?.includes(key), key, auto });
  };
  for (const e of s.els) {
    for (const i of e.inputs) add(i, e.id, true);
    for (const b of Object.values(e.bind)) if (b.k === 'ref') add({ obj: b.obj, prop: b.prop }, e.id, true);
    for (const x of exprsOfEl(e)) for (const r of refsOf(x)) add(r, e.id, false);
  }
  // the main value of a new connection gives way as soon as the element uses a value of the instance
  return out.filter((r) => !(r.auto && out.some((o) => o !== r && o.src === r.src && o.dst === r.dst && !o.auto)));
}

// ---- order of the flow ------------------------------------------------------------------

/** Position of every element in the flow: distance from the triggers, management after the main flow. */
export function flowRank(s: Pick<Strategy, 'els' | 'conns'>): Map<string, number> {
  const rank = new Map<string, number>();
  const byId = new Map(s.els.map((e) => [e.id, e]));
  const depthOf = (key: string | null): number => {
    let d = 0;
    let k = key;
    while (k && d < 10) {
      d += 1;
      k = byId.get(k)?.mgmt ?? null;
    }
    return d;
  };
  const keys = new Set<string | null>(s.els.filter((e) => isFlowEl(e.type)).map((e) => e.mgmt ?? null));
  for (const key of keys) {
    const base = 1000 * depthOf(key);
    let frontier = s.els.filter((e) => isTrigger(e.type) && (e.mgmt ?? null) === key).map((e) => e.id);
    let dist = 0;
    while (frontier.length) {
      const next: string[] = [];
      for (const id of frontier) {
        if (rank.has(id)) continue;
        rank.set(id, base + dist);
        for (const c of s.conns) if (c.from === id && !rank.has(c.to)) next.push(c.to);
      }
      frontier = next;
      dist += 1;
    }
  }
  s.els.forEach((e, i) => { if (!rank.has(e.id)) rank.set(e.id, 100000 + i); });
  return rank;
}

// ---- first use --------------------------------------------------------------------------

export interface Placement {
  /** The element or object this instance hangs at. */
  host: string;
  /** The flow element at the end of the chain. */
  root: string;
  /** 1: hangs at a flow element, 2: at an object that hangs at a flow element, and so on. */
  depth: number;
}

/**
 * The element of the first use of every instance. It is the element the user connected the instance
 * with, otherwise the first element in the flow that uses it in an expression. Instances without a
 * first use are missing from the result.
 */
export function placements(s: Pick<Strategy, 'els' | 'conns'>, usage?: UseRec[]): Map<string, Placement> {
  const use = usage ?? collectUsage(s);
  const rank = flowRank(s);
  const byId = new Map(s.els.map((e) => [e.id, e]));
  const result = new Map<string, Placement | null>();
  const resolving = new Set<string>();
  const resolve = (id: string): Placement | null => {
    if (result.has(id)) return result.get(id) ?? null;
    if (resolving.has(id)) return null;
    const o = byId.get(id);
    if (!o || !isObjectEl(o.type)) return null;
    resolving.add(id);
    const cands: string[] = [];
    if (o.host && o.host !== id && byId.has(o.host)) cands.push(o.host);
    const users = [...new Set(use.filter((u) => u.src === id).map((u) => u.dst))].sort((a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9));
    for (const u of users) if (!cands.includes(u)) cands.push(u);
    let found: Placement | null = null;
    for (const c of cands) {
      const ce = byId.get(c);
      if (!ce) continue;
      if (!isObjectEl(ce.type)) {
        found = { host: c, root: c, depth: 1 };
        break;
      }
      const up = resolve(c);
      if (up) {
        found = { host: c, root: up.root, depth: up.depth + 1 };
        break;
      }
    }
    resolving.delete(id);
    result.set(id, found);
    return found;
  };
  for (const e of s.els) if (isObjectEl(e.type)) resolve(e.id);
  const out = new Map<string, Placement>();
  for (const [k, v] of result) if (v) out.set(k, v);
  return out;
}

/** The flow element that stands for an element: itself, or the root of the chain of an object. */
export function flowElementOf(id: string, pl: Map<string, Placement>, byId: Map<string, El>): string | null {
  const e = byId.get(id);
  if (!e) return null;
  if (!isObjectEl(e.type)) return id;
  return pl.get(id)?.root ?? null;
}

// ---- every path passes the first use ------------------------------------------------------

/**
 * True when every way from a trigger to `user` passes `host`. For an element in the management of an
 * order, the way continues from the order: the instance keeps the state it had when the order was
 * placed (req-fach-055, open point, proposal of the project lead).
 */
export function onEveryPath(s: Pick<Strategy, 'els' | 'conns'>, host: string, user: string): boolean {
  const byId = new Map(s.els.map((e) => [e.id, e]));
  const flowOf = (id: string): string | null => byId.get(id)?.mgmt ?? null;
  const dominated = (h: string, u: string, depth: number): boolean => {
    if (h === u) return true;
    if (depth > 8) return true;
    const fh = flowOf(h);
    const fu = flowOf(u);
    if (fh === fu) {
      const seen = new Set<string>();
      let stack = s.els.filter((e) => isTrigger(e.type) && (e.mgmt ?? null) === fu && e.id !== h).map((e) => e.id);
      while (stack.length) {
        const id = stack.pop() as string;
        if (seen.has(id)) continue;
        seen.add(id);
        for (const c of s.conns) if (c.from === id && c.to !== h && (flowOf(c.to) === fu)) stack.push(c.to);
      }
      return !seen.has(u);
    }
    if (fu !== null) {
      const order = byId.get(fu);
      if (!order) return true;
      return dominated(h, order.id, depth + 1);
    }
    return false;
  };
  return dominated(host, user, 0);
}
