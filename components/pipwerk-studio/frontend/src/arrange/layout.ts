// Layered layout for the flow: ranks along the main axis, order inside a rank by
// barycenter sweeps (few crossings), long edges get invisible waypoints so they
// run beside the boxes instead of through them. The layout is taken over from the
// confirmed prototype (specification E8) as a building block of the user interface.

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
  if (nodes.length === 0) {
    return { pos, via, w: 0, h: 0 };
  }
  const ids = new Set(nodes.map((n) => n.id));
  const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);

  // components
  const parent = new Map<string, string>();
  const find = (a: string): string => {
    let r = a;
    for (let next = parent.get(r); next !== undefined && next !== r; next = parent.get(r)) {
      r = next;
    }
    parent.set(a, r);
    return r;
  };
  nodes.forEach((n) => parent.set(n.id, n.id));
  es.forEach((e) => parent.set(find(e.from), find(e.to)));
  const comps = new Map<string, LNode[]>();
  nodes.forEach((n) => {
    const r = find(n.id);
    const list = comps.get(r) ?? [];
    list.push(n);
    comps.set(r, list);
  });

  let cx = 0;
  let totalH = 0;
  for (const comp of comps.values()) {
    const members = new Set(comp.map((n) => n.id));
    const r = layoutComponent(
      comp,
      es.filter((e) => members.has(e.from)),
      gapX,
      gapY,
    );
    for (const [id, p] of r.pos) {
      pos.set(id, { x: p.x + cx, y: p.y });
    }
    for (const [k, v] of r.via) {
      via.set(
        k,
        v.map((p) => ({ x: p.x + cx, y: p.y })),
      );
    }
    cx += r.w + compGap;
    totalH = Math.max(totalH, r.h);
  }
  return { pos, via, w: Math.max(0, cx - compGap), h: totalH };
}

function layoutComponent(nodes: LNode[], edges: LEdge[], gapX: number, gapY: number): LayoutResult {
  const out = new Map<string, LEdge[]>();
  const inn = new Map<string, LEdge[]>();
  nodes.forEach((n) => {
    out.set(n.id, []);
    inn.set(n.id, []);
  });
  edges.forEach((e) => {
    out.get(e.from)?.push(e);
    inn.get(e.to)?.push(e);
  });
  out.forEach((l) => l.sort((a, b) => a.order - b.order));

  // ranks (back edges of cycles are ignored)
  const state = new Map<string, number>();
  const back = new Set<string>();
  const topo: string[] = [];
  const dfs = (id: string): void => {
    state.set(id, 1);
    for (const e of out.get(id) ?? []) {
      const s = state.get(e.to);
      if (s === 1) {
        back.add(e.key);
      } else if (!s) {
        dfs(e.to);
      }
    }
    state.set(id, 2);
    topo.push(id);
  };
  const roots = nodes.filter((n) => (inn.get(n.id) ?? []).length === 0);
  const first = nodes[0];
  const starts = roots.length > 0 ? roots : first === undefined ? [] : [first];
  starts.forEach((n) => {
    if (!state.get(n.id)) {
      dfs(n.id);
    }
  });
  nodes.forEach((n) => {
    if (!state.get(n.id)) {
      dfs(n.id);
    }
  });
  topo.reverse();
  const rank = new Map<string, number>();
  topo.forEach((id) => {
    let r = 0;
    for (const e of inn.get(id) ?? []) {
      if (back.has(e.key)) {
        continue;
      }
      r = Math.max(r, (rank.get(e.from) ?? 0) + 1);
    }
    rank.set(id, r);
  });

  // items with dummies
  const items = new Map<string, Item>();
  nodes.forEach((n) =>
    items.set(n.id, { id: n.id, w: n.w, h: n.h, dummy: false, rank: rank.get(n.id) ?? 0, x: 0, y: 0 }),
  );
  interface Seg {
    key: string;
    chain: string[];
  }
  const segs: Seg[] = [];
  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  const link = (a: string, b: string): void => {
    succ.set(a, [...(succ.get(a) ?? []), b]);
    pred.set(b, [...(pred.get(b) ?? []), a]);
  };
  for (const e of edges) {
    if (back.has(e.key)) {
      continue;
    }
    const ra = rank.get(e.from) ?? 0;
    const rb = rank.get(e.to) ?? 0;
    const chain = [e.from];
    for (let r = ra + 1; r < rb; r++) {
      const did = `~${e.key}~${r}`;
      items.set(did, { id: did, w: DUMMY_W, h: 0, dummy: true, rank: r, x: 0, y: 0 });
      chain.push(did);
    }
    chain.push(e.to);
    for (let i = 0; i + 1 < chain.length; i++) {
      link(chain[i] as string, chain[i + 1] as string);
    }
    segs.push({ key: e.key, chain });
  }

  const itemOf = (id: string): Item => {
    const item = items.get(id);
    if (item === undefined) {
      throw new Error(`layout: unknown item ${id}`);
    }
    return item;
  };

  const maxRank = Math.max(0, ...[...items.values()].map((i) => i.rank));
  const layers: string[][] = Array.from({ length: maxRank + 1 }, () => []);
  // initial order: depth-first along edges in output order
  const seen = new Set<string>();
  const place = (id: string): void => {
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    layers[itemOf(id).rank]?.push(id);
    [...(succ.get(id) ?? [])].forEach(place);
  };
  const order0 = [...nodes].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  order0.forEach((n) => {
    if ((pred.get(n.id) ?? []).length === 0) {
      place(n.id);
    }
  });
  order0.forEach((n) => place(n.id));
  items.forEach((_, id) => place(id));

  const indexIn = (layer: string[]): Map<string, number> => new Map(layer.map((id, i) => [id, i]));
  const sweep = (down: boolean): void => {
    const range = down
      ? layers.slice(1).map((_, i) => i + 1)
      : layers.slice(0, -1).map((_, i) => layers.length - 2 - i);
    for (const r of range) {
      const neighbour = layers[down ? r - 1 : r + 1];
      const current = layers[r];
      if (neighbour === undefined || current === undefined) {
        continue;
      }
      const ref = indexIn(neighbour);
      const bary = new Map<string, number>();
      current.forEach((id, i) => {
        const ns = (down ? pred.get(id) : succ.get(id)) ?? [];
        const vals = ns.map((n) => ref.get(n)).filter((v): v is number => v !== undefined);
        bary.set(id, vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : i);
      });
      layers[r] = [...current].sort((a, b) => (bary.get(a) ?? 0) - (bary.get(b) ?? 0));
    }
  };
  for (let i = 0; i < 4; i++) {
    sweep(true);
    sweep(false);
  }

  // coordinates across the rank
  const widthOf = (id: string): number => itemOf(id).w;
  const gapFor = (a: string, b: string): number =>
    items.get(a)?.dummy === true || items.get(b)?.dummy === true ? gapX / 2 : gapX;
  layers.forEach((layer) => {
    let x = 0;
    layer.forEach((id, i) => {
      if (i > 0) {
        x += gapFor(layer[i - 1] as string, id);
      }
      itemOf(id).x = x;
      x += widthOf(id);
    });
  });
  const center = (id: string): number => itemOf(id).x + widthOf(id) / 2;
  const settle = (layer: string[], getNb: (id: string) => string[] | undefined): void => {
    const want = layer.map((id) => {
      const ns = getNb(id) ?? [];
      return ns.length > 0 ? ns.reduce((s, n) => s + center(n), 0) / ns.length - widthOf(id) / 2 : itemOf(id).x;
    });
    let minX = -Infinity;
    layer.forEach((id, i) => {
      const it = itemOf(id);
      it.x = Math.max(want[i] ?? 0, minX);
      minX = it.x + it.w + gapFor(id, layer[i + 1] ?? id);
    });
  };
  for (let it = 0; it < 4; it++) {
    for (let r = 1; r < layers.length; r++) {
      settle(layers[r] ?? [], (id) => pred.get(id));
    }
    for (let r = layers.length - 2; r >= 0; r--) {
      settle(layers[r] ?? [], (id) => succ.get(id));
    }
  }
  for (let r = 1; r < layers.length; r++) {
    settle(layers[r] ?? [], (id) => pred.get(id));
  }
  let minX = Infinity;
  items.forEach((i) => {
    minX = Math.min(minX, i.x);
  });
  items.forEach((i) => {
    i.x -= minX;
  });

  // coordinates along the rank
  let y = 0;
  layers.forEach((layer) => {
    const h = Math.max(0, ...layer.map((id) => itemOf(id).h));
    layer.forEach((id) => {
      itemOf(id).y = y;
    });
    y += h + gapY;
  });

  const pos = new Map<string, Pt>();
  const via = new Map<string, Pt[]>();
  let w = 0;
  let h = 0;
  nodes.forEach((n) => {
    const it = itemOf(n.id);
    pos.set(n.id, { x: it.x, y: it.y });
    w = Math.max(w, it.x + it.w);
    h = Math.max(h, it.y + it.h);
  });
  segs.forEach((s) => {
    const pts: Pt[] = [];
    s.chain.slice(1, -1).forEach((id) => {
      const it = itemOf(id);
      const layerH = Math.max(0, ...(layers[it.rank] ?? []).map((i) => itemOf(i).h));
      pts.push({ x: it.x + it.w / 2, y: it.y + layerH / 2 });
    });
    if (pts.length > 0) {
      via.set(s.key, pts);
    }
  });
  return { pos, via, w, h };
}
