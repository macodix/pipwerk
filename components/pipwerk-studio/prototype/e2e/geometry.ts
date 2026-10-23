// Measures the canvas in the page: boxes of elements and instances, the lines to the first use, crossings.
import type { Page } from '@playwright/test';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Measure {
  nodes: Record<string, Rect>;
  cards: Record<string, Rect & { free: boolean }>;
  /** Lines to the first use: instance, element, gap between the boxes, crossings with other lines and with boxes. */
  first: { src: string; dst: string; gap: number; crossLines: string[]; crossBoxes: string[] }[];
  /** Smallest gap between two consecutive elements of the flow, measured along the flow. */
  flowGap: number;
  /** Frames and bands that contain only instances (must not exist). */
  onlyInstanceBoxes: number;
}

/** All numbers in world coordinates of the canvas (not scaled by the zoom). */
export async function measure(page: Page): Promise<Measure> {
  return page.evaluate(() => {
    const world = document.querySelector('[data-testid="world"]') as HTMLElement;
    const rectOf = (el: HTMLElement): Rect => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width), h: parseFloat(el.style.height) });
    const nodes: Record<string, Rect> = {};
    const cards: Record<string, Rect & { free: boolean }> = {};
    world.querySelectorAll<HTMLElement>('[data-testid="node"]').forEach((e) => { nodes[e.dataset.nodeName as string] = rectOf(e); });
    world.querySelectorAll<HTMLElement>('[data-testid="card"]').forEach((e) => {
      cards[e.dataset.nodeName as string] = { ...rectOf(e), free: !!e.querySelector('[data-testid="card-free"]') };
    });
    const gapBetween = (a: Rect, b: Rect) => {
      const dx = Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
      const dy = Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
      return Math.hypot(dx, dy);
    };
    const sample = (p: SVGPathElement): { x: number; y: number }[] => {
      const len = p.getTotalLength();
      const n = Math.max(24, Math.ceil(len / 6));
      const out: { x: number; y: number }[] = [];
      for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((len * i) / n); out.push({ x: q.x, y: q.y }); }
      return out;
    };
    const seg = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) => {
      const o = (p: typeof a, q: typeof a, r: typeof a) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
      return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
    };
    const cross = (p: { x: number; y: number }[], q: { x: number; y: number }[]) => {
      for (let i = 0; i + 1 < p.length; i++) for (let j = 0; j + 1 < q.length; j++) if (seg(p[i], p[i + 1], q[j], q[j + 1])) return true;
      return false;
    };
    const inBox = (pts: { x: number; y: number }[], r: Rect, pad: number) => pts.some((p) => p.x > r.x + pad && p.x < r.x + r.w - pad && p.y > r.y + pad && p.y < r.y + r.h - pad);
    const wires = [...world.querySelectorAll<SVGGElement>('[data-testid="wire"]')].map((g) => ({
      src: g.dataset.src as string, dst: g.dataset.dst as string, first: g.dataset.first === '1',
      pts: sample(g.querySelector('.wire-line') as SVGPathElement),
    }));
    const flows = [...world.querySelectorAll<SVGGElement>('[data-testid="flow-edge"]')].map((g) => ({ key: g.dataset.edge as string, pts: sample(g.querySelector('.edge-line') as SVGPathElement) }));
    const all: Record<string, Rect> = { ...nodes, ...cards };
    const first = wires.filter((w) => w.first).map((w) => {
      const crossLines: string[] = [];
      for (const o of wires) if (o !== w && cross(w.pts, o.pts)) crossLines.push(`${o.src}>${o.dst}`);
      for (const f of flows) if (cross(w.pts, f.pts)) crossLines.push(`flow ${f.key}`);
      const crossBoxes: string[] = [];
      for (const [name, r] of Object.entries(all)) if (name !== w.src && name !== w.dst && inBox(w.pts, r, 2)) crossBoxes.push(name);
      return { src: w.src, dst: w.dst, gap: gapBetween(all[w.src], all[w.dst]), crossLines, crossBoxes };
    });
    // gap between consecutive elements of the flow
    let flowGap = Infinity;
    const byId = new Map<string, Rect>();
    world.querySelectorAll<HTMLElement>('[data-testid="node"]').forEach((e) => byId.set(e.dataset.nodeId as string, rectOf(e)));
    for (const f of flows) {
      const parts = f.key.split('|');
      const a = byId.get(parts[0].startsWith('mg') ? parts[1] : parts[0]);
      const b = byId.get(parts[2] ?? '');
      if (a && b) flowGap = Math.min(flowGap, gapBetween(a, b));
    }
    const frames = [...world.querySelectorAll<HTMLElement>('[data-testid="frame"]')].map(rectOf);
    const bands = [...world.querySelectorAll<HTMLElement>('[data-testid="band"]')].map(rectOf);
    const holdsFlowElement = (r: Rect) => Object.values(nodes).some((n) => n.x >= r.x - 1 && n.y >= r.y - 1 && n.x + n.w <= r.x + r.w + 1 && n.y + n.h <= r.y + r.h + 1);
    const onlyInstanceBoxes = [...frames, ...bands].filter((r) => !holdsFlowElement(r) && Object.values(cards).some((c) => c.x >= r.x - 1 && c.y >= r.y - 1 && c.x + c.w <= r.x + r.w + 1 && c.y + c.h <= r.y + r.h + 1)).length;
    return { nodes, cards, first, flowGap: Number.isFinite(flowGap) ? flowGap : 0, onlyInstanceBoxes };
  });
}
