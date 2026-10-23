// The canvas: vertical or horizontal flow, management frames, collapsible sections. Instances lie at the
// element of their first use and are connected with it; further uses are data connections with labels.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react';
import { TYPES, fieldTip, isFlowEl, isObjectEl, isTrigger, memberLabel, methodOf, tx, typeLabel, DTYPE_LABEL, membersOf } from './catalog';
import { scopeFor } from './findings';
import type { Finding } from './findings';
import { levelOf } from './findings';
import type { El, Strategy } from './model';
import { kindClass } from './Properties';
import { CARD_W, EL_H, EL_W, ROW_H, SEC_H, buildScene, dataPort, inPort, outPort, pathThrough, wirePath } from './scene';
import type { Box, Scene } from './scene';
import { addEntry, connect, connectObject, disconnect, getState, isObjectEntry, select, setOrient, setState, toast, update, useApp } from './store';
import type { LibEntry } from './store';
import { cardSubtitle, summaryOf } from './summary';
import { Btn, Icon, useL } from './ui';

/** Height at the top of the canvas that the toolbar covers, with room for the label of a section above its frame. */
function toolbarRoom(canvas: HTMLElement): number {
  const tools = canvas.querySelector('.canvas-tools') as HTMLElement | null;
  return Math.max(58, (tools ? tools.offsetHeight : 36) + 34);
}

const WIRE_COLORS =['#2f6fb0', '#c2410c', '#15803d', '#a21caf', '#0e7490', '#b45309', '#be123c', '#4d7c0f'];

type Interact =
  | { k: 'pan'; sx: number; sy: number; vx: number; vy: number; moved: boolean; frame?: string }
  | { k: 'node'; id: string; sx: number; sy: number; odx: number; ody: number; moved: boolean }
  | { k: 'connect'; from: string; out: string; sx: number; sy: number; moved: boolean; px: number; py: number }
  | { k: 'wire'; obj: string; prop: string; sx: number; sy: number; moved: boolean };

export function Canvas({ findings }: { findings: Finding[] }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const s = app.strategy;
  const dir = app.orient;
  const scene = useMemo(() => (s ? buildScene(s, dir) : null), [s, dir]);
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 40, y: 40, z: 1 });
  const fittedHidden = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const interact = useRef<Interact | null>(null);
  const [preview, setPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [selEdge, setSelEdge] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState(false);
  const sc = useMemo(() => (s ? scopeFor(s, lang) : null), [s, lang]);

  const fit = useCallback(() => {
    const el = wrap.current;
    const st = getState().strategy;
    if (!el || !st) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    // a canvas that is not shown (small windows) has no size: fit again when it is shown for the first time
    fittedHidden.current = vw === 0;
    const sceneNow = buildScene(st, getState().orient);
    const b = sceneNow.bounds;
    if (st.els.length === 0) {
      // room for the first steps; instances lie next to the element that uses them
      if (getState().orient === 'h') setView({ x: 40, y: Math.min(300, vh / 2), z: 1 });
      else setView({ x: vw >= 640 ? (vw - EL_W) / 2 + 150 : vw / 2 - EL_W / 2, y: Math.min(110, vh / 4), z: 1 });
      return;
    }
    const pad = 22;
    const top = toolbarRoom(el); // room for the toolbar, which wraps into two rows in a narrow canvas
    const horizontal = getState().orient === 'h';
    const raw = horizontal ? (vh - top - pad) / b.h : (vw - 2 * pad) / b.w;
    const z = Math.max(0.8, Math.min(1, raw));
    // the steps themselves, without the instances beside them: where the view starts when everything does not fit
    const flow = [...sceneNow.nodes.values(), ...sceneNow.secNodes.values(), ...sceneNow.frames];
    const fx = flow.length ? Math.min(...flow.map((q) => q.x)) : b.x;
    const fy = flow.length ? Math.min(...flow.map((q) => q.y)) : b.y;
    const fitsW = b.w * z + 2 * pad <= vw;
    const fitsH = b.h * z + top + pad <= vh;
    // not everything fits: the first step with the instances beside it if both fit, otherwise the first step
    // (the instances are one pan away)
    const all = { x: pad - b.x * z, y: top - b.y * z };
    const x = fitsW
      ? (vw - b.w * z) / 2 - b.x * z
      : horizontal || (fx + EL_W + 24 - b.x) * z + 2 * pad <= vw ? all.x : pad - fx * z;
    const y = fitsH
      ? top + (vh - top - b.h * z) / 2 - b.y * z
      : !horizontal || (fy + EL_H + 24 - b.y) * z + top + pad <= vh ? all.y : top - (fy - 40) * z;
    setView({ x, y, z });
  }, []);

  /** Shows everything at once, as large as it fits. */
  const showAll = useCallback(() => {
    const el = wrap.current;
    const st = getState().strategy;
    if (!el || !st) return;
    const b = buildScene(st, getState().orient).bounds;
    const pad = 24;
    const top = toolbarRoom(el);
    const z = Math.max(0.2, Math.min(1, (el.clientWidth - 2 * pad) / b.w, (el.clientHeight - top - pad) / b.h));
    setView({ z, x: (el.clientWidth - b.w * z) / 2 - b.x * z, y: top + (el.clientHeight - top - b.h * z) / 2 - b.y * z });
  }, []);

  // fit when a strategy is opened or the orientation changes; never on editing (the view does not jump)
  useLayoutEffect(() => {
    fit();
  }, [app.openCount, app.orient, fit]);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) { first = false; fit(); } else if (fittedHidden.current && el.clientWidth > 0) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // reveal a new or targeted element only when it is completely outside of the view
  useEffect(() => {
    const id = app.lastAdded;
    if (!id || !scene || !wrap.current) return;
    const b = scene.nodes.get(id) ?? scene.cards.get(id);
    setState({ lastAdded: null });
    if (!b) return;
    const v = viewRef.current;
    const vw = wrap.current.clientWidth;
    const vh = wrap.current.clientHeight;
    const l = b.x * v.z + v.x;
    const t = b.y * v.z + v.y;
    const r = l + b.w * v.z;
    const bt = t + b.h * v.z;
    let dx = 0;
    let dy = 0;
    const m = 16;
    if (r < m || l > vw - m) dx = vw / 2 - (l + r) / 2;
    else if (l < 0) dx = -l + m;
    else if (r > vw) dx = vw - r - m;
    if (bt < m || t > vh - m) dy = vh / 2 - (t + bt) / 2;
    else if (t < 0) dy = -t + m;
    else if (bt > vh) dy = vh - bt - m;
    if (dx || dy) setView({ ...v, x: v.x + dx, y: v.y + dy });
  }, [app.lastAdded, scene]);

  // wheel: move, with Ctrl zoom
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const z = Math.min(2, Math.max(0.3, v.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        const cx = e.clientX - r.left;
        const cy = e.clientY - r.top;
        setView({ z, x: cx - ((cx - v.x) / v.z) * z, y: cy - ((cy - v.y) / v.z) * z });
      } else {
        setView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (f: number) => {
    const el = wrap.current;
    if (!el) return;
    const v = viewRef.current;
    const z = Math.min(2, Math.max(0.3, v.z * f));
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    setView({ z, x: cx - ((cx - v.x) / v.z) * z, y: cy - ((cy - v.y) / v.z) * z });
  };

  const toWorld = (cx: number, cy: number) => {
    const r = (wrap.current as HTMLDivElement).getBoundingClientRect();
    const v = viewRef.current;
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  };

  // ---- pointer interaction ----
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!s || !scene) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('[data-nodrag]')) return;
    const portOut = t.closest('[data-port-out]') as HTMLElement | null;
    const portProp = t.closest('[data-port-prop]') as HTMLElement | null;
    const node = t.closest('[data-node-id]') as HTMLElement | null;
    const frame = t.closest('[data-frame-id]') as HTMLElement | null;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (portOut && node) {
      interact.current = { k: 'connect', from: node.dataset.nodeId as string, out: portOut.dataset.portOut as string, sx: e.clientX, sy: e.clientY, moved: false, px: 0, py: 0 };
    } else if (portProp && node) {
      interact.current = { k: 'wire', obj: node.dataset.nodeId as string, prop: portProp.dataset.portProp as string, sx: e.clientX, sy: e.clientY, moved: false };
    } else if (node) {
      const el = s.els.find((x) => x.id === node.dataset.nodeId);
      interact.current = { k: 'node', id: node.dataset.nodeId as string, sx: e.clientX, sy: e.clientY, odx: el?.dx ?? 0, ody: el?.dy ?? 0, moved: false };
    } else {
      interact.current = { k: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false, frame: frame?.dataset.frameId };
    }
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const it = interact.current;
    if (!it) return;
    const dx = e.clientX - it.sx;
    const dy = e.clientY - it.sy;
    if (!it.moved && Math.hypot(dx, dy) < 5) return;
    it.moved = true;
    const v = viewRef.current;
    if (it.k === 'pan') {
      setView({ ...v, x: it.vx + dx, y: it.vy + dy });
    } else if (it.k === 'node') {
      const id = it.id;
      update((st) => {
        const el = st.els.find((x) => x.id === id);
        if (el) { el.dx = it.odx + dx / v.z; el.dy = it.ody + dy / v.z; }
      });
    } else if (it.k === 'connect') {
      const w = toWorld(e.clientX, e.clientY);
      const from = scene?.nodes.get(it.from);
      if (from && s) {
        const el = s.els.find((x) => x.id === it.from) as El;
        const outs = TYPES[el.type]?.outputs ?? [];
        const oi = Math.max(0, outs.findIndex((o) => o.id === it.out));
        const p = outPort(from, oi, outs.length, dir);
        setPreview({ x1: p.x, y1: p.y, x2: w.x, y2: w.y });
      }
    } else if (it.k === 'wire') {
      const w = toWorld(e.clientX, e.clientY);
      const c = scene?.cards.get(it.obj);
      if (c) {
        const ry = c.rowY.get(it.prop) ?? c.y + c.h / 2;
        setPreview({ x1: c.x + c.w, y1: ry, x2: w.x, y2: w.y });
      }
    }
  };

  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const it = interact.current;
    interact.current = null;
    setPreview(null);
    if (!it || !s) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const targetNode = under?.closest('[data-node-id]') as HTMLElement | null;
    const targetId = targetNode?.dataset.nodeId;
    const armed = getState().armed;
    if (it.k === 'pan') {
      if (!it.moved) {
        if (it.frame) select({ k: 'frame', id: it.frame });
        else {
          setSelEdge(null);
          select({ k: 'strategy' });
        }
      }
    } else if (it.k === 'node') {
      if (it.moved) {
        const dragged = s.els.find((x) => x.id === it.id);
        if (dragged && isObjectEl(dragged.type)) {
          // an instance without a first use is connected by dropping its card onto the element that uses it
          const w = toWorld(e.clientX, e.clientY);
          const hit = hitElement(w.x, w.y, it.id);
          if (hit && !scene?.places.has(it.id)) {
            connectObject(it.id, hit);
            update((st) => { const q = st.els.find((x) => x.id === it.id); if (q) { delete q.dx; delete q.dy; delete q.fx; delete q.fy; } });
          }
        } else finishDrag(it.id);
      }
      else if (armed && armed.from !== it.id) connect(armed.from, armed.out, it.id);
      else {
        select({ k: 'el', id: it.id });
        setSelEdge(null);
      }
    } else if (it.k === 'connect') {
      if (it.moved && targetId && targetId !== it.from) connect(it.from, it.out, targetId);
      else if (!it.moved) {
        if (armed && armed.from === it.from && armed.out === it.out) setState({ armed: null });
        else setState({ armed: { from: it.from, out: it.out }, sel: { k: 'el', id: it.from } });
      }
    } else if (it.k === 'wire') {
      if (it.moved && targetId && targetId !== it.obj) {
        const target = s.els.find((x) => x.id === targetId);
        if (target && (isFlowEl(target.type) || isObjectEl(target.type))) {
          const row = scene?.cards.get(it.obj)?.rows.find((r) => r.key === it.prop);
          const oe = s.els.find((x) => x.id === it.obj);
          const m = oe ? methodOf(oe.type, row?.prop ?? it.prop) : undefined;
          connectObject(it.obj, targetId, {
            obj: it.obj, prop: row?.prop ?? it.prop, ...(row?.args ? { args: row.args } : m ? { args: [...m.defaults] } : {}),
          });
        }
      } else if (!it.moved) {
        select({ k: 'el', id: it.obj });
      }
    }
  };

  /** The flow element or card (not the one dragged) at a point of the canvas. */
  const hitElement = (wx: number, wy: number, except: string): string | null => {
    if (!scene) return null;
    for (const [id, b] of scene.nodes) {
      if (id !== except && wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) return id;
    }
    for (const [id, b] of scene.cards) {
      if (id !== except && wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) return id;
    }
    return null;
  };

  /** After moving: the element belongs to the frame it lies in, never to one it only touches. */
  const finishDrag = (id: string) => {
    const st = getState().strategy;
    if (!st) return;
    const sceneNow = buildScene(st, getState().orient);
    const el = st.els.find((x) => x.id === id);
    const b = sceneNow.nodes.get(id);
    if (!el || !b || !isFlowEl(el.type)) return;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const frame = sceneNow.frames.find((f) => !f.collapsed && cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h && f.order !== id);
    const target = frame ? frame.order : null;
    if ((el.mgmt ?? null) === target) return;
    update((x) => {
      const e2 = x.els.find((q) => q.id === id) as El;
      e2.mgmt = target;
      e2.dx = 0;
      e2.dy = 0;
      const same = (q: string) => (x.els.find((z) => z.id === q)?.mgmt ?? null) === target;
      x.conns = x.conns.filter((c) => (c.from !== id && c.to !== id) || (same(c.from) && same(c.to)));
      x.sections.forEach((sec) => { sec.els = sec.els.filter((q) => q !== id); });
      x.sections = x.sections.filter((sec) => sec.els.length > 0);
      if (e2.type === 'flow.place_order') x.els.filter((z) => z.mgmt === id).forEach((z) => { z.mgmt = null; });
    });
    toast(target ? 'Das Element gehört jetzt zur Verwaltung dieser Order.' : 'Das Element gehört jetzt zum Hauptablauf.', target ? 'The element now belongs to the management of this order.' : 'The element now belongs to the main flow.');
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHint(false);
    if (!s || !scene) return;
    const raw = e.dataTransfer.getData('application/x-pipwerk');
    if (!raw) return;
    let entry: LibEntry;
    try { entry = JSON.parse(raw) as LibEntry; } catch { return; }
    const w = toWorld(e.clientX, e.clientY);
    const hit = [...scene.nodes.entries()].find(([, b]) => w.x >= b.x && w.x <= b.x + b.w && w.y >= b.y && w.y <= b.y + b.h);
    const frame = scene.frames.find((f) => !f.collapsed && w.x >= f.x && w.x <= f.x + f.w && w.y >= f.y && w.y <= f.y + f.h);
    const hitEl = hit ? s.els.find((x) => x.id === hit[0]) : undefined;
    if (isObjectEntry(entry)) {
      // onto an element: connected at once; onto free space: it lies there until it is connected
      if (hitEl && isFlowEl(hitEl.type)) addEntry(entry, { host: hitEl.id });
      else addEntry(entry, { free: { x: w.x - CARD_W / 2, y: w.y - 24 } });
    } else if (hitEl && isFlowEl(hitEl.type)) addEntry(entry, { after: hitEl.id, flow: hitEl.mgmt ?? null });
    else addEntry(entry, { flow: frame ? frame.order : null, after: '' });
  };

  if (!s || !scene || !sc) {
    // no hint here: "No strategy open" stands in the properties view only (req-ui-016)
    return <div className="canvas" ref={wrap} data-region="canvas" data-testid="canvas" />;
  }

  const sel = app.sel;
  const selId = sel.k === 'el' ? sel.id : null;
  const wiresMode = app.wires;
  const cardIndex = new Map([...scene.cards.keys()].map((k, i) => [k, i]));
  const relatedWire = (w: { src: string; dst: string }) => selId !== null && (w.src === selId || w.dst === selId);
  const world: CSSProperties = { transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` };
  const horizontal = dir === 'h';

  return (
    <div className="canvas" ref={wrap} data-region="canvas" data-testid="canvas" data-view={`${view.x.toFixed(1)},${view.y.toFixed(1)},${view.z.toFixed(3)}`} data-orient={dir}>
      <div className="canvas-tools" data-nodrag>
        <div className="seg" role="group" aria-label={L('Ausrichtung', 'Orientation')}>
          <button type="button" className={dir === 'v' ? 'on' : ''} onClick={() => setOrient('v')} data-testid="orient-v" data-tip={L('Ablauf senkrecht: Eingang oben, Ausgänge unten', 'Flow vertical: entry on top, exits below')}>
            <Icon name="arrowdown" size={15} /><span>{L('Senkrecht', 'Vertical')}</span>
          </button>
          <button type="button" className={dir === 'h' ? 'on' : ''} onClick={() => setOrient('h')} data-testid="orient-h" data-tip={L('Ablauf waagerecht von links nach rechts, für breite Bildschirme', 'Flow horizontal from left to right, for wide screens')}>
            <Icon name="right" size={15} /><span>{L('Waagerecht', 'Horizontal')}</span>
          </button>
        </div>
        <div className="seg" role="group" aria-label={L('Weitere Verwendungen', 'Further uses')} data-testid="uses-switch">
          <span className="seg-cap" aria-hidden="true">{L('Weitere Verwendungen', 'Further uses')}</span>
          {(['all', 'sel', 'off'] as const).map((m) => (
            <button key={m} type="button" className={wiresMode === m ? 'on' : ''} onClick={() => setState({ wires: m })} data-testid={`wires-${m}`}
              data-tip={m === 'all' ? L('Alle weiteren Verwendungen als Linien zeigen. Die Verbindung zum Element der ersten Verwendung ist immer da.', 'Show all further uses as lines. The connection to the element of the first use is always there.') : m === 'sel' ? L('Nur die weiteren Verwendungen des gewählten Elements zeigen', 'Show only the further uses of the selected element') : L('Weitere Verwendungen ausblenden', 'Hide further uses')}>
              {m === 'all' ? <Icon name="link" size={15} /> : m === 'sel' ? <Icon name="eye" size={15} /> : <Icon name="x" size={15} />}
              <span>{m === 'all' ? L('Alle', 'All') : m === 'sel' ? L('Auswahl', 'Selection') : L('Aus', 'Off')}</span>
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomBy(1 / 1.2)} aria-label={L('Verkleinern', 'Zoom out')} data-testid="zoom-out" data-tip={L('Verkleinern', 'Zoom out')}><Icon name="zoomout" size={16} /></button>
          <button type="button" onClick={() => zoomBy(1.2)} aria-label={L('Vergrößern', 'Zoom in')} data-testid="zoom-in" data-tip={L('Vergrößern', 'Zoom in')}><Icon name="zoomin" size={16} /></button>
          <button type="button" onClick={showAll} aria-label={L('Alles zeigen', 'Show everything')} data-testid="zoom-fit" data-tip={L('Die ganze Strategie auf einmal zeigen (verkleinert)', 'Show the whole strategy at once (zoomed out)')}><Icon name="fit" size={16} /></button>
          <button type="button" onClick={fit} aria-label={L('Zum Anfang', 'To the beginning')} data-testid="zoom-start" data-tip={L('Ansicht an den Anfang der Strategie setzen, in lesbarer Größe', 'Move the view to the beginning of the strategy, at a readable size')}><Icon name="up" size={16} /></button>
          <button type="button" onClick={() => { update((st) => { st.els.forEach((x) => { delete x.dx; delete x.dy; }); }); }} aria-label={L('Neu anordnen', 'Arrange again')} data-testid="arrange" data-tip={L('Alle Elemente wieder automatisch anordnen', 'Arrange all elements automatically again')}><Icon name="grid" size={16} /></button>
        </div>
      </div>

      {app.armed && (
        <div className="armed-banner" data-testid="armed-banner" data-nodrag>
          <Icon name="link" size={16} />
          <span>{L('Klicken Sie jetzt das Element an, das als Nächstes folgt.', 'Now click the element that follows next.')}</span>
          <Btn small kind="quiet" onClick={() => setState({ armed: null })}>{L('Abbrechen', 'Cancel')}</Btn>
        </div>
      )}

      <div
        className={`viewport${dropHint ? ' drop' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { interact.current = null; setPreview(null); }}
        onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-pipwerk')) { e.preventDefault(); setDropHint(true); } }}
        onDragLeave={() => setDropHint(false)}
        onDrop={onDrop}
        data-testid="viewport"
      >
        <div className="world" style={world} data-testid="world">
          <svg className="edges" width="1" height="1" overflow="visible" aria-hidden="true">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9 z" className="arrow-head" />
              </marker>
              <marker id="arrow-sel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9 z" className="arrow-head sel" />
              </marker>
            </defs>
            {scene.edges.map((ed) => {
              const mid = ed.pts[Math.floor(ed.pts.length / 2) - (ed.pts.length % 2 === 0 ? 1 : 0)];
              const next = ed.pts[Math.floor(ed.pts.length / 2)];
              const m = { x: (mid.x + next.x) / 2, y: (mid.y + next.y) / 2 };
              const on = selEdge === ed.key || (selId !== null && (ed.from === selId || ed.to === selId));
              return (
                <g key={ed.key} className={`flow-edge${ed.mgmt ? ' mgmt' : ''}${on ? ' on' : ''}`} data-testid="flow-edge" data-edge={ed.key}>
                  <path d={pathThrough(ed.pts, dir)} className="edge-line" markerEnd={on ? 'url(#arrow-sel)' : 'url(#arrow)'} />
                  {!ed.mgmt && <path d={pathThrough(ed.pts, dir)} className="edge-hit" onClick={(e) => { e.stopPropagation(); setSelEdge(ed.key); }} />}
                  {selEdge === ed.key && !ed.mgmt && (
                    <g className="edge-del" transform={`translate(${m.x} ${m.y})`} onClick={(e) => { e.stopPropagation(); disconnect(ed.from, ed.out, ed.to); setSelEdge(null); }} data-testid="edge-delete" data-nodrag>
                      <circle r="11" /><path d="M-4 -4 L4 4 M4 -4 L-4 4" />
                    </g>
                  )}
                </g>
              );
            })}
            {scene.wires.map((w) => {
              const rel = relatedWire(w);
              // the connection to the element of the first use is always shown, further uses as chosen
              if (!w.first && (wiresMode === 'off' || (wiresMode === 'sel' && !rel))) return null;
              const color = WIRE_COLORS[(cardIndex.get(w.src) ?? 0) % WIRE_COLORS.length];
              const srcEl = s.els.find((x) => x.id === w.src);
              const dstEl = s.els.find((x) => x.id === w.dst);
              const parts = w.uses.map((u) => `${u.refresh ? '↻ ' : ''}${memberLabel(srcEl, u.prop, u.args, lang)}`);
              const text = parts.join(', ');
              const tip = `${srcEl?.name ?? ''} → ${dstEl?.name ?? ''}: ${parts.join(', ')}${w.first ? ` (${L('erste Verwendung', 'first use')})` : ''}${w.refresh ? ` – ${L('Aktualisieren: Das Objekt ermittelt seine Werte neu, bevor es sie übergibt', 'Update: the object determines its values anew before it passes them')}` : ''}`;
              const lw = Math.max(28, text.length * 6.4 + 18);
              return (
                <g key={w.key} className={`wire${w.first ? ' first' : ' further'}${w.refresh ? ' refresh' : ''}${rel ? ' on' : ''}${selId !== null && !rel && !w.first ? ' dim' : ''}`} style={{ color }}
                  data-testid="wire" data-src={srcEl?.name} data-dst={dstEl?.name} data-first={w.first ? '1' : '0'} data-refresh={w.refresh ? '1' : '0'} data-label={text}>
                  {w.stubs.map((st, i) => <path key={i} d={`M ${st[0].x} ${st[0].y} L ${st[1].x} ${st[1].y}`} className="wire-stub" />)}
                  {w.stubs.length > 1 && <path d={`M ${w.stubs[0][1].x} ${w.stubs[0][1].y} L ${w.stubs[w.stubs.length - 1][1].x} ${w.stubs[w.stubs.length - 1][1].y}`} className="wire-stub" />}
                  <path d={wirePath(w, dir)} className="wire-line" />
                  <path d={wirePath(w, dir)} className="wire-hit" data-tip={tip} />
                  <circle cx={w.pts[1].x} cy={w.pts[1].y} r="4" className="wire-end" />
                  {text && (
                    <g transform={`translate(${w.mid.x} ${w.mid.y})`} className="wire-label" data-testid="wire-label" data-tip={tip}>
                      <rect x={-lw / 2} y="-9" width={lw} height="18" rx="9" />
                      <text textAnchor="middle" dy="4">{text}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {preview && <path d={`M ${preview.x1} ${preview.y1} L ${preview.x2} ${preview.y2}`} className="preview-line" />}
          </svg>

          {scene.bands.map((b) => {
            const sec = s.sections.find((x) => x.id === b.id) as NonNullable<Strategy['sections'][number]>;
            return (
              <div key={b.id} className="band" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} data-testid="band" data-section={sec.name}>
                <div className="band-label" data-nodrag>
                  <button type="button" className="band-toggle" aria-label={L('Abschnitt einklappen', 'Collapse section')} data-testid="section-collapse" onClick={() => update((st) => { const q = st.sections.find((x) => x.id === b.id); if (q) q.collapsed = true; })}>
                    <Icon name="down" size={14} />
                  </button>
                  <input className="band-name" style={{ width: `${Math.max(6, sec.name.length + 1)}ch` }} value={sec.name} aria-label={L('Name des Abschnitts', 'Name of the section')} onChange={(e) => update((st) => { const q = st.sections.find((x) => x.id === b.id); if (q) q.name = e.target.value; })} />
                </div>
              </div>
            );
          })}

          {scene.frames.map((f) => {
            const order = s.els.find((x) => x.id === f.order) as El;
            const count = s.els.filter((x) => x.mgmt === f.order).length;
            const isSel = sel.k === 'frame' && sel.id === f.order;
            return (
              <div key={f.order} className={`frame${isSel ? ' selected' : ''}${f.collapsed ? ' collapsed' : ''}`} style={{ left: f.x, top: f.y, width: f.w, height: f.h }} data-frame-id={f.order} data-testid="frame">
                <div className="frame-head">
                  <button type="button" className="band-toggle" data-nodrag aria-label={f.collapsed ? L('Verwaltung ausklappen', 'Expand management') : L('Verwaltung einklappen', 'Collapse management')} data-testid="frame-toggle"
                    onClick={() => update((st) => { st.collapsedMgmt = f.collapsed ? st.collapsedMgmt.filter((x) => x !== f.order) : [...st.collapsedMgmt, f.order]; })}>
                    <Icon name={f.collapsed ? 'right' : 'down'} size={14} />
                  </button>
                  <Icon name="layers" size={15} />
                  <span className="frame-title">{L('Verwaltung', 'Management')} · {order.name}</span>
                  {f.collapsed && <span className="chip">{L(`${count} Schritte`, `${count} steps`)}</span>}
                </div>
                {f.empty && !f.collapsed && (
                  <p className="frame-empty" data-testid="frame-empty">{L('Noch leer. Wählen Sie diesen Rahmen und fügen Sie einen Auslöser aus der Bibliothek ein.', 'Still empty. Select this frame and add a trigger from the library.')}</p>
                )}
              </div>
            );
          })}

          {[...scene.secNodes.entries()].map(([id, b]) => {
            const sec = s.sections.find((x) => `sec:${x.id}` === id);
            if (!sec) return null;
            const lv = sec.els.map((e) => levelOf(findings, e)).filter(Boolean);
            const sev = lv.includes('error') ? 'err' : lv.includes('hint') ? 'hint' : '';
            return (
              <div key={id} className={`node sec-node ${sev}`} style={{ left: b.x, top: b.y, width: b.w, height: b.h }} data-testid="section-node" data-section={sec.name}>
                <span className="port in" style={portStyle(inPort({ x: 0, y: 0, w: b.w, h: b.h }, dir))} />
                <button type="button" className="band-toggle" data-nodrag aria-label={L('Abschnitt ausklappen', 'Expand section')} data-testid="section-expand" onClick={() => update((st) => { const q = st.sections.find((x) => x.id === sec.id); if (q) q.collapsed = false; })}>
                  <Icon name="right" size={14} />
                </button>
                <div className="sec-text">
                  <strong>{sec.name}</strong>
                  <span>{L(`${sec.els.length} Schritte`, `${sec.els.length} steps`)}</span>
                </div>
                <span className="port out" style={portStyle(outPort({ x: 0, y: 0, w: b.w, h: b.h }, 0, 1, dir))} />
              </div>
            );
          })}

          {s.els.filter((e) => scene.nodes.has(e.id)).map((el) => (
            <NodeView key={el.id} el={el} box={scene.nodes.get(el.id) as Box} s={s} selected={selId === el.id} level={app.checked ? levelOf(findings, el.id) : null}
              scState={sc} dir={dir} connected={s.conns} armed={app.armed} wireCount={scene.wires.filter((w) => w.dst === el.id).length} />
          ))}

          {[...scene.cards.values()].map((c) => {
            const el = s.els.find((x) => x.id === c.id) as El;
            return <CardView key={c.id} el={el} geo={c} s={s} selected={selId === el.id} level={app.checked ? levelOf(findings, el.id) : null} color={WIRE_COLORS[(cardIndex.get(el.id) ?? 0) % WIRE_COLORS.length]} used={scene.usage.filter((u) => u.src === el.id)} wireCount={scene.wires.filter((w) => w.dst === el.id).length} dir={dir} />;
          })}
        </div>
      </div>

      <details className="legend" data-nodrag>
        <summary>{L('Legende', 'Legend')}</summary>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H36" className="edge-line" /><path d="M34 2 L42 6 L34 10z" className="arrow-head" /></svg><span>{L('Ablauf: legt die Reihenfolge fest', 'Flow: defines the order')}</span></div>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H44" className="legend-wire first" /></svg><span>{L('Erste Verwendung: Die Instanz liegt bei dem Element (immer sichtbar)', 'First use: the instance lies at the element (always visible)')}</span></div>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H44" className="legend-wire" /></svg><span>{L('Weitere Verwendung: Weg eines Werts, die Beschriftung nennt Eigenschaft oder Methode', 'Further use: path of a value, the label names the property or method')}</span></div>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H44" className="legend-wire refresh" /></svg><span>{L('↻ Aktualisieren: Das Objekt ermittelt seine Werte vorher neu', '↻ Update: the object determines its values anew first')}</span></div>
      </details>

      <div className="sel-bar" data-nodrag>
        <span>{selId ? (s.els.find((x) => x.id === selId)?.name ?? '') : L('Strategie', 'Strategy')}</span>
        <Btn small kind="primary" testid="open-props" onClick={() => setState({ panel: 'props' })}>{L('Eigenschaften', 'Properties')}</Btn>
      </div>
      <span hidden>{horizontal}</span>
    </div>
  );
}

const portStyle = (p: { x: number; y: number }): CSSProperties => ({ left: p.x, top: p.y });

function NodeView({
  el, box, s, selected, level, scState, dir, connected, armed, wireCount,
}: {
  el: El;
  box: Box;
  s: Strategy;
  selected: boolean;
  level: 'error' | 'hint' | null;
  scState: ReturnType<typeof scopeFor>;
  dir: 'v' | 'h';
  connected: Strategy['conns'];
  armed: { from: string; out: string } | null;
  wireCount: number;
}) {
  const lang = scState.lang;
  const d = TYPES[el.type];
  const k = kindClass(el.type);
  const outs = d?.outputs ?? [];
  const sum = d ? summaryOf(el, s, { ...scState, self: el.id, els: s.els }) : el.type;
  const trigger = isTrigger(el.type);
  const label = outs.length > 1;
  return (
    <div
      className={`node k-${k}${selected ? ' selected' : ''}${level === 'error' ? ' err' : level === 'hint' ? ' hint' : ''}${armed && armed.from === el.id ? ' armed' : ''}${armed && armed.from !== el.id ? ' armable' : ''}`}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      data-node-id={el.id}
      data-node-name={el.name}
      data-type={el.type}
      data-testid="node"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select({ k: 'el', id: el.id }); } }}
      aria-label={`${d ? typeLabel(el.type, lang) : el.type}: ${el.name}`}
    >
      {!trigger && <span className="port in" style={portStyle(inPort({ x: 0, y: 0, w: box.w, h: box.h }, dir))} data-testid="port-in" />}
      {wireCount > 0 && <span className="port data" style={portStyle(dataPort({ x: 0, y: 0, w: box.w, h: box.h }, dir))} data-tip={lang === 'en' ? `${wireCount} value line(s) arrive here` : `${wireCount} Werte-Linie(n) enden hier`} />}
      <div className="node-head">
        <span className={`badge sm b-${k}`}><Icon name={d?.icon ?? 'warn'} size={16} /></span>
        <span className="node-name" title={el.name}>{el.name}</span>
        {level && <Icon name={level === 'error' ? 'warn' : 'info'} size={16} className={`node-flag ${level}`} />}
      </div>
      <div className="node-type">{d ? typeLabel(el.type, lang) : el.type}</div>
      <div className="node-sum">{sum}</div>
      {outs.map((o, i) => {
        const p = outPort({ x: 0, y: 0, w: box.w, h: box.h }, i, outs.length, dir);
        const used = connected.some((c) => c.from === el.id && c.out === o.id) || !!o.management;
        const isArmed = !!armed && armed.from === el.id && armed.out === o.id;
        return (
          <Fragment key={o.id}>
            <button
              type="button"
              className={`port out${used ? ' used' : ''}${isArmed ? ' armed' : ''}${o.management ? ' mgmt' : ''}`}
              style={portStyle(p)}
              data-port-out={o.id}
              data-testid={`port-out-${o.id}`}
              data-tip={o.management ? (lang === 'en' ? 'Management of this order starts here (frame below)' : 'Hier beginnt die Verwaltung dieser Order (Rahmen darunter)') : used ? (lang === 'en' ? 'Drag to another step to connect differently' : 'Zum Umverbinden auf ein anderes Element ziehen') : (lang === 'en' ? 'Drag to the next step, or click and then click the next step' : 'Zum nächsten Schritt ziehen, oder anklicken und dann den nächsten Schritt anklicken')}
              aria-label={`${tx(o, lang)}`}
              disabled={!!o.management}
            />
            {label && (
              <span className={`port-label ${dir}`} style={dir === 'v' ? { left: p.x, top: p.y + 5 } : { left: p.x + 8, top: p.y - 9 }}>{tx(o, lang)}</span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function CardView({
  el, geo, s, selected, level, color, used, wireCount, dir,
}: {
  el: El;
  geo: Scene['cards'] extends Map<string, infer V> ? V : never;
  s: Strategy;
  selected: boolean;
  level: 'error' | 'hint' | null;
  color: string;
  used: Scene['usage'];
  wireCount: number;
  dir: 'v' | 'h';
}) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const d = TYPES[el.type];
  const props = membersOf(el);
  const sc = scopeFor(s, lang, el);
  const k = kindClass(el.type);
  const sub = cardSubtitle(el, s, sc);
  return (
    <div
      className={`card k-${k}${selected ? ' selected' : ''}${level === 'error' ? ' err' : level === 'hint' ? ' hint' : ''}`}
      style={{ left: geo.x, top: geo.y, width: geo.w, height: geo.h, ['--wire' as string]: color }}
      data-node-id={el.id}
      data-node-name={el.name}
      data-type={el.type}
      data-testid="card"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select({ k: 'el', id: el.id }); } }}
      aria-label={`${typeLabel(el.type, lang)}: ${el.name}`}
    >
      {wireCount > 0 && <span className="port data" style={portStyle(dataPort({ x: 0, y: 0, w: geo.w, h: geo.h }, dir))} />}
      <div className="card-head">
        <span className={`badge sm b-${k}`}><Icon name={d?.icon ?? 'warn'} size={16} /></span>
        <div className="card-title">
          <span className="node-name" title={el.name}>{el.name}</span>
          <span className="card-sub">{typeLabel(el.type, lang)}{sub ? ` · ${sub}` : ''}</span>
        </div>
        {level && <Icon name={level === 'error' ? 'warn' : 'info'} size={16} className={`node-flag ${level}`} />}
      </div>
      <ul className="card-rows">
        {geo.rows.map((row) => {
          const p = props.find((q) => q.id === row.prop);
          if (!p) return null;
          return (
            <li key={row.key} className={`card-row${row.used ? ' used' : ''}${row.method ? ' method' : ''}`} data-tip={fieldTip(row.prop, lang, 'p')} data-testid="card-row" data-prop={row.key}>
              <span className="row-name">{memberLabel(el, row.prop, row.args, lang)}</span>
              <span className="row-type">{p.method ? L('Methode', 'Method') : tx(DTYPE_LABEL[p.dtype], lang)}</span>
              <span className="port prop" data-port-prop={row.key} data-testid={`port-prop-${row.key}`} style={{ top: ROW_H / 2 }} data-tip={L('Ziehen Sie von hier auf ein Element, um diesen Wert zu verbinden', 'Drag from here to an element to connect this value')} />
            </li>
          );
        })}
      </ul>
      {geo.foldable && (
        <button type="button" className="card-more" data-nodrag data-testid="card-more" onClick={() => update((st) => { const q = st.els.find((x) => x.id === el.id); if (q) q.open = !q.open; })}>
          <Icon name={el.open ? 'up' : 'down'} size={13} />
          {el.open ? L('weniger anzeigen', 'show fewer') : L(`alle ${geo.rows.length + geo.more} anzeigen`, `show all ${geo.rows.length + geo.more}`)}
        </button>
      )}
      {geo.free && (
        <div className="card-free" data-testid="card-free">
          <Icon name="warn" size={14} />
          <span>{L('Noch nicht verbunden: Ziehen Sie die Karte auf das Element, das sie zuerst verwendet.', 'Not connected yet: drag the card onto the element that uses it first.')}</span>
        </div>
      )}
      <span hidden>{EL_H}{SEC_H}{isTrigger(el.type) ? 1 : 0}</span>
    </div>
  );
}
