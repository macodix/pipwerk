// Layered layout for the flow: ranks along the main axis, order inside a rank by
// barycenter sweeps (few crossings), long edges get invisible waypoints so they
// run beside the boxes instead of through them.

export interface LNode {
  id: string;
  w: number;
  h: number;
}
export interface LEdge {
  key: string;
  from: string;
  to: string;
  /** order of the output at its node (true before false) */
  order: number;
}
export interface Pt {
  x: number;
  y: number;
}
export interface LayoutResult {
  pos: Map<string, Pt>;
  via: Map<string, Pt[]>;
  w: number;
  h: number;
}

const DUMMY_W = 14;

interface Item {
  id: string;
  w: number;
  h: number;
  dummy: boolean;
  rank: number;
  x: number;
  y: number;
}

export function layered(nodes: LNode[], edges: LEdge[], gapX: number, gapY: number, compGap = 56): LayoutResult {
  const pos = new Map<string, Pt>();
  const via = new Map<string, Pt[]>();
  if (nodes.length === 0) return { pos, via, w: 0, h: 0 };
  const ids = new Set(nodes.map((n) => n.id));
  const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);

  // components
  const parent = new Map<string, string>();
  const find = (a: string): string => {
    let r = a;
    while (parent.get(r) !== r) r = parent.get(r) as string;
    parent.set(a, r);
    return r;
  };
  nodes.forEach((n) => parent.set(n.id, n.id));
  es.forEach((e) => parent.set(find(e.from), find(e.to)));
  const comps = new Map<string, LNode[]>();
  nodes.forEach((n) => {
    const r = find(n.id);
    if (!comps.has(r)) comps.set(r, []);
    (comps.get(r) as LNode[]).push(n);
  });

  let cx = 0;
  let totalH = 0;
  for (const comp of comps.values()) {
    const r = layoutComponent(comp, es.filter((e) => comp.some((n) => n.id === e.from)), gapX, gapY);
    for (const [id, p] of r.pos) pos.set(id, { x: p.x + cx, y: p.y });
    for (const [k, v] of r.via) via.set(k, v.map((p) => ({ x: p.x + cx, y: p.y })));
    cx += r.w + compGap;
    totalH = Math.max(totalH, r.h);
  }
  return { pos, via, w: Math.max(0, cx - compGap), h: totalH };
}

function layoutComponent(nodes: LNode[], edges: LEdge[], gapX: number, gapY: number): LayoutResult {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Map<string, LEdge[]>();
  const inn = new Map<string, LEdge[]>();
  nodes.forEach((n) => { out.set(n.id, []); inn.set(n.id, []); });
  edges.forEach((e) => { out.get(e.from)?.push(e); inn.get(e.to)?.push(e); });
  out.forEach((l) => l.sort((a, b) => a.order - b.order));

  // ranks (back edges of cycles are ignored)
  const state = new Map<string, number>();
  const back = new Set<string>();
  const topo: string[] = [];
  const dfs = (id: string) => {
    state.set(id, 1);
    for (const e of out.get(id) ?? []) {
      const s = state.get(e.to);
      if (s === 1) back.add(e.key);
      else if (!s) dfs(e.to);
    }
    state.set(id, 2);
    topo.push(id);
  };
  const roots = nodes.filter((n) => (inn.get(n.id) ?? []).length === 0);
  (roots.length ? roots : [nodes[0]]).forEach((n) => { if (!state.get(n.id)) dfs(n.id); });
  nodes.forEach((n) => { if (!state.get(n.id)) dfs(n.id); });
  topo.reverse();
  const rank = new Map<string, number>();
  topo.forEach((id) => {
    let r = 0;
    for (const e of inn.get(id) ?? []) {
      if (back.has(e.key)) continue;
      r = Math.max(r, (rank.get(e.from) ?? 0) + 1);
    }
    rank.set(id, r);
  });

  // items with dummies
  const items = new Map<string, Item>();
  nodes.forEach((n) => items.set(n.id, { id: n.id, w: n.w, h: n.h, dummy: false, rank: rank.get(n.id) ?? 0, x: 0, y: 0 }));
  interface Seg { key: string; chain: string[] }
  const segs: Seg[] = [];
  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!succ.has(a)) succ.set(a, []);
    if (!pred.has(b)) pred.set(b, []);
    (succ.get(a) as string[]).push(b);
    (pred.get(b) as string[]).push(a);
  };
  for (const e of edges) {
    if (back.has(e.key)) continue;
    const ra = rank.get(e.from) ?? 0;
    const rb = rank.get(e.to) ?? 0;
    const chain = [e.from];
    for (let r = ra + 1; r < rb; r++) {
      const did = `~${e.key}~${r}`;
      items.set(did, { id: did, w: DUMMY_W, h: 0, dummy: true, rank: r, x: 0, y: 0 });
      chain.push(did);
    }
    chain.push(e.to);
    for (let i = 0; i + 1 < chain.length; i++) link(chain[i], chain[i + 1]);
    segs.push({ key: e.key, chain });
  }

  const maxRank = Math.max(...[...items.values()].map((i) => i.rank));
  const layers: string[][] = Array.from({ length: maxRank + 1 }, () => []);
  // initial order: depth-first along edges in output order
  const seen = new Set<string>();
  const place = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    layers[(items.get(id) as Item).rank].push(id);
    const ss = [...(succ.get(id) ?? [])];
    ss.forEach(place);
  };
  const order0 = [...nodes].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  order0.forEach((n) => { if ((pred.get(n.id) ?? []).length === 0) place(n.id); });
  order0.forEach((n) => place(n.id));
  // dummies not reached (cannot happen) are appended
  items.forEach((_, id) => place(id));

  const indexIn = (layer: string[]) => new Map(layer.map((id, i) => [id, i]));
  const sweep = (down: boolean) => {
    const range = down ? layers.slice(1).map((_, i) => i + 1) : layers.slice(0, -1).map((_, i) => layers.length - 2 - i);
    for (const r of range) {
      const ref = indexIn(layers[down ? r - 1 : r + 1]);
      const bary = new Map<string, number>();
      layers[r].forEach((id, i) => {
        const ns = (down ? pred.get(id) : succ.get(id)) ?? [];
        const vals = ns.map((n) => ref.get(n)).filter((v): v is number => v !== undefined);
        bary.set(id, vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : i);
      });
      layers[r] = [...layers[r]].sort((a, b) => (bary.get(a) as number) - (bary.get(b) as number));
    }
  };
  for (let i = 0; i < 4; i++) { sweep(true); sweep(false); }

  // coordinates across the rank
  const widthOf = (id: string) => (items.get(id) as Item).w;
  const gapFor = (a: string, b: string) => (items.get(a)?.dummy || items.get(b)?.dummy ? gapX / 2 : gapX);
  layers.forEach((layer) => {
    let x = 0;
    layer.forEach((id, i) => {
      if (i > 0) x += gapFor(layer[i - 1], id);
      (items.get(id) as Item).x = x;
      x += widthOf(id);
    });
  });
  const center = (id: string) => (items.get(id) as Item).x + widthOf(id) / 2;
  const settle = (layer: string[], getNb: (id: string) => string[] | undefined) => {
    const want = layer.map((id) => {
      const ns = getNb(id) ?? [];
      return ns.length ? ns.reduce((s, n) => s + center(n), 0) / ns.length - widthOf(id) / 2 : (items.get(id) as Item).x;
    });
    let minX = -Infinity;
    layer.forEach((id, i) => {
      const it = items.get(id) as Item;
      it.x = Math.max(want[i], minX);
      minX = it.x + it.w + gapFor(id, layer[i + 1] ?? id);
    });
  };
  for (let it = 0; it < 4; it++) {
    for (let r = 1; r < layers.length; r++) settle(layers[r], (id) => pred.get(id));
    for (let r = layers.length - 2; r >= 0; r--) settle(layers[r], (id) => succ.get(id));
  }
  for (let r = 1; r < layers.length; r++) settle(layers[r], (id) => pred.get(id));
  let minX = Infinity;
  items.forEach((i) => { minX = Math.min(minX, i.x); });
  items.forEach((i) => { i.x -= minX; });

  // coordinates along the rank
  let y = 0;
  const layerY: number[] = [];
  layers.forEach((layer) => {
    const h = Math.max(0, ...layer.map((id) => (items.get(id) as Item).h));
    layerY.push(y);
    layer.forEach((id) => { (items.get(id) as Item).y = y; });
    y += h + gapY;
  });

  const pos = new Map<string, Pt>();
  const via = new Map<string, Pt[]>();
  let w = 0;
  let h = 0;
  nodes.forEach((n) => {
    const it = items.get(n.id) as Item;
    pos.set(n.id, { x: it.x, y: it.y });
    w = Math.max(w, it.x + it.w);
    h = Math.max(h, it.y + it.h);
  });
  segs.forEach((s) => {
    const pts: Pt[] = [];
    s.chain.slice(1, -1).forEach((id) => {
      const it = items.get(id) as Item;
      const layerH = Math.max(0, ...layers[it.rank].map((i) => (items.get(i) as Item).h));
      pts.push({ x: it.x + it.w / 2, y: it.y + layerH / 2 });
    });
    if (pts.length) via.set(s.key, pts);
  });
  void byId;
  return { pos, via, w, h };
}
