// The strategy as in the strategy designer (same arrangement, same look), but only for reading, with the
// markings of a test run: the element that runs now, the elements already visited, breakpoints, rejected
// orders, values on the object cards and a short pop-up with the main values.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as RPointerEvent } from 'react';
import { DTYPE_LABEL, TYPES, fieldTip, isTrigger, propsOf, tx, typeLabel } from './catalog';
import { scopeFor } from './findings';
import type { El, Strategy, Txt } from './model';
import { clone } from './model';
import { kindClass } from './kinds';
import { CARD_HEAD, EL_H, EL_W, ROW_H, buildScene, dataPort, inPort, outPort, pathThrough, wirePath } from './scene';
import type { Box, Dir, Scene } from './scene';
import type { StepRec } from './sim/engine';
import { cardSubtitle, summaryOf } from './summary';
import { Icon, useL } from './ui';
import { useApp } from './store';

const WIRE_COLORS = ['#2f6fb0', '#c2410c', '#15803d', '#a21caf', '#0e7490', '#b45309', '#be123c', '#4d7c0f'];

export interface HoverContent {
  title: string;
  rows: { label: string; value: string; changed: boolean }[];
  note?: string;
}

export interface FlowOverlay {
  now: string | null;
  steps: Map<string, StepRec>;
  activeFlow: string | null;
  instTag: string | null;
  bps: ReadonlySet<string>;
  sel: string | null;
  onSelect: (id: string | null) => void;
  onToggleBp: (id: string) => void;
  cardValue: (elId: string, propId: string) => { text: string; changed: boolean };
  hover: (elId: string) => HoverContent | null;
  /** Changes when the view should reveal the current element. */
  follow: number;
  /** Extra width to the right of the current element that should stay visible (the reason of a rejected order). */
  nowExtra?: number;
  reason: (st: StepRec) => Txt | undefined;
}

type Interact = { k: 'pan'; sx: number; sy: number; vx: number; vy: number; moved: boolean };

/** All sections and management frames open, so that the whole strategy is visible. */
function opened(s: Strategy): Strategy {
  const c = clone(s);
  c.sections.forEach((x) => { x.collapsed = false; });
  c.collapsedMgmt = [];
  return c;
}

export function FlowView({ strategy, overlay, testid = 'flow' }: { strategy: Strategy; overlay?: FlowOverlay; testid?: string }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const s = useMemo(() => opened(strategy), [strategy]);
  const [dir, setDir] = useState<Dir>('v');
  const scene = useMemo(() => buildScene(s, dir), [s, dir]);
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 40, y: 40, z: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const interact = useRef<Interact | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const sc = useMemo(() => scopeFor(s, lang), [s, lang]);
  const cardIndex = useMemo(() => new Map([...scene.cards.keys()].map((k, i) => [k, i])), [scene]);

  const fit = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const b = scene.bounds;
    const top = 50;
    const pad = 14;
    const z = Math.max(0.45, Math.min(1, (vw - 2 * pad) / b.w, dir === 'h' ? (vh - top - pad) / b.h : 10));
    setView({ z, x: (vw - b.w * z) / 2 - b.x * z, y: top - b.y * z + 6 });
  }, [scene, dir]);

  useLayoutEffect(() => {
    fit();
  }, [fit]);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) { first = false; return; }
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // follow the element that runs now: bring it into the view when it is outside
  useEffect(() => {
    const id = overlay?.now;
    if (!id || !wrap.current) return;
    const b = scene.nodes.get(id) ?? scene.cards.get(id);
    if (!b) return;
    const vw = wrap.current.clientWidth;
    const vh = wrap.current.clientHeight;
    setView((v) => {
      const l = b.x * v.z + v.x;
      const t = b.y * v.z + v.y;
      const r = l + (b.w + (overlay?.nowExtra ?? 0)) * v.z;
      const bt = t + b.h * v.z;
      const m = 24;
      let dx = 0;
      let dy = 0;
      if (l < m) dx = m - l;
      else if (r > vw - m) dx = vw - m - r;
      if (t < 56) dy = 56 - t;
      else if (bt > vh - m) dy = vh - m - bt;
      return dx || dy ? { ...v, x: v.x + dx, y: v.y + dy } : v;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay?.follow, overlay?.now, scene]);

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
      } else setView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
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
  const showAll = () => {
    const el = wrap.current;
    if (!el) return;
    const b = scene.bounds;
    const z = Math.max(0.2, Math.min(1, (el.clientWidth - 28) / b.w, (el.clientHeight - 64) / b.h));
    setView({ z, x: (el.clientWidth - b.w * z) / 2 - b.x * z, y: 50 + (el.clientHeight - 50 - b.h * z) / 2 - b.y * z });
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('[data-nodrag]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    interact.current = { k: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const it = interact.current;
    if (!it) return;
    const dx = e.clientX - it.sx;
    const dy = e.clientY - it.sy;
    if (!it.moved && Math.hypot(dx, dy) < 5) return;
    it.moved = true;
    setView({ ...viewRef.current, x: it.vx + dx, y: it.vy + dy });
  };
  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const it = interact.current;
    interact.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    if (!it) return;
    const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const node = under?.closest('[data-node-id]') as HTMLElement | null;
    if (!it.moved) overlay?.onSelect(node ? (node.dataset.nodeId as string) : null);
  };

  const showHover = (id: string, e: React.MouseEvent | React.FocusEvent) => {
    if (!overlay) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ id, x: r.right + 10, y: r.top });
  };

  const world: CSSProperties = { transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` };
  const hv = hover && overlay ? overlay.hover(hover.id) : null;
  const nodeEls = s.els.filter((e) => scene.nodes.has(e.id));

  return (
    <div className="canvas" ref={wrap} data-testid={testid} data-orient={dir} data-view={`${view.x.toFixed(0)},${view.y.toFixed(0)},${view.z.toFixed(2)}`}>
      <div className="canvas-tools" data-nodrag>
        <div className="seg" role="group" aria-label={L('Ausrichtung', 'Orientation')}>
          <button type="button" className={dir === 'v' ? 'on' : ''} onClick={() => setDir('v')} data-testid="orient-v" data-tip={L('Ablauf senkrecht: Eingang oben, Ausgänge unten', 'Flow vertical: entry on top, exits below')}>
            <Icon name="arrowdown" size={15} /><span>{L('Senkrecht', 'Vertical')}</span>
          </button>
          <button type="button" className={dir === 'h' ? 'on' : ''} onClick={() => setDir('h')} data-testid="orient-h" data-tip={L('Ablauf waagerecht von links nach rechts, für breite Bildschirme', 'Flow horizontal from left to right, for wide screens')}>
            <Icon name="right" size={15} /><span>{L('Waagerecht', 'Horizontal')}</span>
          </button>
        </div>
        <div className="seg" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomBy(1 / 1.2)} aria-label={L('Verkleinern', 'Zoom out')} data-testid="zoom-out" data-tip={L('Verkleinern', 'Zoom out')}><Icon name="zoomout" size={16} /></button>
          <button type="button" onClick={() => zoomBy(1.2)} aria-label={L('Vergrößern', 'Zoom in')} data-testid="zoom-in" data-tip={L('Vergrößern', 'Zoom in')}><Icon name="zoomin" size={16} /></button>
          <button type="button" onClick={showAll} aria-label={L('Alles zeigen', 'Show everything')} data-testid="zoom-fit" data-tip={L('Die ganze Strategie auf einmal zeigen (verkleinert)', 'Show the whole strategy at once (zoomed out)')}><Icon name="fit" size={16} /></button>
          <button type="button" onClick={fit} aria-label={L('Zum Anfang', 'To the beginning')} data-testid="zoom-start" data-tip={L('Ansicht an den Anfang der Strategie setzen', 'Move the view to the beginning of the strategy')}><Icon name="up" size={16} /></button>
        </div>
        {overlay && (
          <span className="read-only-tag" data-tip={L('Die Strategie wird nur angesehen. Bearbeiten geht im Strategiedesigner.', 'The strategy is only viewed. Editing is done in the strategy designer.')}>
            <Icon name="lock" size={13} />{L('nur lesen', 'read only')}
          </span>
        )}
      </div>

      <div className="viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { interact.current = null; }} data-testid="viewport">
        <div className="world" style={world} data-testid="world">
          <svg className="edges" width="1" height="1" overflow="visible" aria-hidden="true">
            <defs>
              <marker id={`arrow-${testid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9 z" className="arrow-head" />
              </marker>
              <marker id={`arrow-on-${testid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 L9 5 L0 9 z" className="arrow-head sel" />
              </marker>
            </defs>
            {scene.edges.map((ed) => {
              const taken = !!overlay && !ed.mgmt && overlay.steps.get(ed.from)?.out === ed.out && overlay.steps.has(ed.to);
              return (
                <g key={ed.key} className={`flow-edge${ed.mgmt ? ' mgmt' : ''}${taken ? ' on' : ''}`} data-testid="flow-edge">
                  <path d={pathThrough(ed.pts, dir)} className="edge-line" markerEnd={taken ? `url(#arrow-on-${testid})` : `url(#arrow-${testid})`} />
                </g>
              );
            })}
            {scene.wires.map((w) => {
              const color = WIRE_COLORS[(cardIndex.get(w.src) ?? 0) % WIRE_COLORS.length];
              const selId = overlay?.sel ?? null;
              const rel = selId !== null && (w.src === selId || w.dst === selId);
              return (
                <g key={w.key} className={`wire${w.solid ? ' solid' : ' name'}${rel ? ' on' : ''}${selId !== null && !rel ? ' dim' : ''}`} style={{ color }}>
                  {w.stubs.map((st, i) => <path key={i} d={`M ${st[0].x} ${st[0].y} L ${st[1].x} ${st[1].y}`} className="wire-stub" />)}
                  {w.stubs.length > 1 && <path d={`M ${w.stubs[0][1].x} ${w.stubs[0][1].y} L ${w.stubs[w.stubs.length - 1][1].x} ${w.stubs[w.stubs.length - 1][1].y}`} className="wire-stub" />}
                  <path d={wirePath(w, dir)} className="wire-line" />
                  <circle cx={w.pts[1].x} cy={w.pts[1].y} r="4" className="wire-end" />
                  {w.props.length > 1 && (
                    <g transform={`translate(${(w.pts[0].x + w.pts[1].x) / 2} ${(w.pts[0].y + w.pts[1].y) / 2})`} className="wire-badge">
                      <rect x="-13" y="-9" width="26" height="18" rx="9" />
                      <text textAnchor="middle" dy="4">{w.props.length}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {scene.lane && (
            <div className="lane" style={{ left: scene.lane.x, top: scene.lane.y, width: scene.lane.w, height: scene.lane.h }}>
              <span className="lane-title"><Icon name="layers" size={14} />{L('Objekte und ihre Werte', 'Objects and their values')}</span>
            </div>
          )}

          {scene.bands.map((b) => {
            const sec = s.sections.find((x) => x.id === b.id) as NonNullable<Strategy['sections'][number]>;
            return (
              <div key={b.id} className="band" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} data-section={sec.name}>
                <div className="band-label"><span className="band-name-static">{sec.name}</span></div>
              </div>
            );
          })}

          {scene.frames.map((f) => {
            const order = s.els.find((x) => x.id === f.order) as El;
            const active = overlay?.activeFlow === f.order;
            return (
              <div key={f.order} className={`frame${active ? ' active' : ''}`} style={{ left: f.x, top: f.y, width: f.w, height: f.h }} data-testid="frame" data-active={active ? '1' : '0'}>
                <div className="frame-head">
                  <Icon name="layers" size={15} />
                  <span className="frame-title">{L('Verwaltung', 'Management')} · {order.name}</span>
                  {active && overlay?.instTag && <span className="chip chip-live" data-testid="frame-inst">{L('läuft für Order', 'running for order')} {overlay.instTag}</span>}
                </div>
              </div>
            );
          })}

          {nodeEls.map((el) => (
            <NodeView
              key={el.id} el={el} box={scene.nodes.get(el.id) as Box} s={s} lang={lang} sc={sc} dir={dir} overlay={overlay}
              wireCount={scene.wires.filter((w) => w.dst === el.id).length}
              onHover={showHover} onLeave={() => setHover(null)}
            />
          ))}

          {[...scene.cards.values()].map((c) => {
            const el = s.els.find((x) => x.id === c.id) as El;
            return (
              <CardView
                key={c.id} el={el} geo={c} s={s} lang={lang} dir={dir} overlay={overlay} color={WIRE_COLORS[(cardIndex.get(el.id) ?? 0) % WIRE_COLORS.length]}
                used={scene.usage.filter((u) => u.src === el.id)} wireCount={scene.wires.filter((w) => w.dst === el.id).length} onHover={showHover} onLeave={() => setHover(null)}
              />
            );
          })}
        </div>
      </div>

      {hv && hover && <HoverBox content={hv} x={hover.x} y={hover.y} />}

      <details className="legend" data-nodrag>
        <summary>{L('Legende', 'Legend')}</summary>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H36" className="edge-line" /><path d="M34 2 L42 6 L34 10z" className="arrow-head" /></svg><span>{L('Ablauf: legt die Reihenfolge fest', 'Flow: defines the order')}</span></div>
        <div className="legend-row"><svg width="46" height="12"><path d="M2 6 H44" className="legend-wire" /></svg><span>{L('Wert: Weg eines Werts (farbig, gestrichelt)', 'Value: path of a value (coloured, dashed)')}</span></div>
        {overlay && <div className="legend-row"><span className="legend-dot now" /><span>{L('Dieses Element läuft gerade', 'This element is running now')}</span></div>}
        {overlay && <div className="legend-row"><span className="legend-dot bp" /><span>{L('Haltepunkt', 'Breakpoint')}</span></div>}
        {overlay && <div className="legend-row"><span className="legend-dot changed" /><span>{L('Wert seit dem letzten Schritt geändert', 'Value changed since the last step')}</span></div>}
      </details>
    </div>
  );
}

const portStyle = (p: { x: number; y: number }): CSSProperties => ({ left: p.x, top: p.y });

function outLabel(o: { de: string; en: string }, lang: 'de' | 'en'): string {
  return tx(o, lang);
}

function NodeView({
  el, box, s, lang, sc, dir, overlay, wireCount, onHover, onLeave,
}: {
  el: El;
  box: Box;
  s: Strategy;
  lang: 'de' | 'en';
  sc: ReturnType<typeof scopeFor>;
  dir: Dir;
  overlay?: FlowOverlay;
  wireCount: number;
  onHover: (id: string, e: React.MouseEvent | React.FocusEvent) => void;
  onLeave: () => void;
}) {
  const L = useL();
  const d = TYPES[el.type];
  const k = kindClass(el.type);
  const outs = d?.outputs ?? [];
  const sum = d ? summaryOf(el, s, { ...sc, self: el.id, els: s.els }) : el.type;
  const trigger = isTrigger(el.type);
  const step = overlay?.steps.get(el.id);
  const isNow = overlay?.now === el.id;
  const rejected = !!step?.reject;
  const bp = overlay?.bps.has(el.id) ?? false;
  const selected = overlay?.sel === el.id;
  const reason = step ? overlay?.reason(step) : undefined;
  return (
    <div
      className={`node k-${k}${selected ? ' selected' : ''}${isNow ? ' now' : ''}${step && !isNow ? ' visited' : ''}${rejected ? ' rejected' : ''}${step?.noValue ? ' novalue' : ''}`}
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      data-node-id={el.id}
      data-node-name={el.name}
      data-type={el.type}
      data-now={isNow ? '1' : '0'}
      data-bp={bp ? '1' : '0'}
      data-out={step?.out ?? ''}
      data-rejected={rejected ? '1' : '0'}
      data-testid="node"
      tabIndex={0}
      onMouseEnter={(e) => onHover(el.id, e)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(el.id, e)}
      onBlur={onLeave}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); overlay?.onSelect(el.id); } }}
      aria-label={`${d ? typeLabel(el.type, lang) : el.type}: ${el.name}`}
    >
      {!trigger && <span className="port in" style={portStyle(inPort({ x: 0, y: 0, w: box.w, h: box.h }, dir))} />}
      {wireCount > 0 && <span className="port data" style={portStyle(dataPort({ x: 0, y: 0, w: box.w, h: box.h }, dir))} />}
      {overlay && (
        <button
          type="button" className={`bp-toggle${bp ? ' on' : ''}`} data-nodrag data-testid="bp-toggle" aria-pressed={bp}
          aria-label={bp ? L('Haltepunkt entfernen', 'Remove breakpoint') : L('Haltepunkt setzen', 'Set breakpoint')}
          data-tip={bp ? L('Haltepunkt entfernen. Der Sprung hält hier nicht mehr an.', 'Remove the breakpoint. The jump no longer stops here.') : L('Haltepunkt setzen. Der Sprung hält an, sobald der Ablauf dieses Element erreicht.', 'Set a breakpoint. The jump stops as soon as the flow reaches this element.')}
          onClick={(e) => { e.stopPropagation(); overlay.onToggleBp(el.id); }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
      <div className="node-head">
        <span className={`badge sm b-${k}`}><Icon name={d?.icon ?? 'warn'} size={16} /></span>
        <span className="node-name" title={el.name}>{el.name}</span>
        {rejected && <Icon name="warn" size={16} className="node-flag error" />}
      </div>
      <div className="node-type">{d ? typeLabel(el.type, lang) : el.type}</div>
      <div className="node-sum">{sum}</div>
      {step?.out && <span className={`taken${rejected ? ' bad' : ''}`} data-testid="taken">→ {outLabel(outs.find((o) => o.id === step.out) ?? { de: step.out, en: step.out }, lang)}</span>}
      {step?.noValue && <span className="novalue-chip" data-testid="no-value-chip">{L('Wert fehlt', 'value missing')}</span>}
      {outs.map((o, i) => {
        const p = outPort({ x: 0, y: 0, w: box.w, h: box.h }, i, outs.length, dir);
        const used = s.conns.some((c) => c.from === el.id && c.out === o.id) || !!o.management;
        const took = step?.out === o.id;
        return (
          <Fragment key={o.id}>
            <span className={`port out${used ? ' used' : ''}${o.management ? ' mgmt' : ''}${took ? ' took' : ''}`} style={portStyle(p)} data-port-out={o.id} />
            {outs.length > 1 && (
              <span className={`port-label ${dir}${took ? ' took' : ''}`} style={dir === 'v' ? { left: p.x, top: p.y + 5 } : { left: p.x + 8, top: p.y - 9 }}>{tx(o, lang)}</span>
            )}
          </Fragment>
        );
      })}
      {rejected && reason && (
        <div className="reject-callout" data-testid="reject-callout" role="alert" data-nodrag>
          <Icon name="warn" size={15} />
          <div>
            <strong>{L('Order abgelehnt', 'Order rejected')}</strong>
            <p>{tx(reason, lang)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CardView({
  el, geo, s, lang, dir, overlay, color, used, wireCount, onHover, onLeave,
}: {
  el: El;
  geo: Scene['cards'] extends Map<string, infer V> ? V : never;
  s: Strategy;
  lang: 'de' | 'en';
  dir: Dir;
  overlay?: FlowOverlay;
  color: string;
  used: Scene['usage'];
  wireCount: number;
  onHover: (id: string, e: React.MouseEvent | React.FocusEvent) => void;
  onLeave: () => void;
}) {
  const d = TYPES[el.type];
  const props = propsOf(el);
  const sc = scopeFor(s, lang, el);
  const k = kindClass(el.type);
  const sub = cardSubtitle(el, s, sc);
  const selected = overlay?.sel === el.id;
  return (
    <div
      className={`card k-${k}${selected ? ' selected' : ''}`}
      style={{ left: geo.x, top: geo.y, width: geo.w, height: geo.h, ['--wire' as string]: color }}
      data-node-id={el.id}
      data-node-name={el.name}
      data-type={el.type}
      data-testid="card"
      tabIndex={0}
      onMouseEnter={(e) => onHover(el.id, e)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(el.id, e)}
      onBlur={onLeave}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); overlay?.onSelect(el.id); } }}
      aria-label={`${typeLabel(el.type, lang)}: ${el.name}`}
    >
      {wireCount > 0 && <span className="port data" style={portStyle(dataPort({ x: 0, y: 0, w: geo.w, h: geo.h }, dir))} />}
      <div className="card-head">
        <span className={`badge sm b-${k}`}><Icon name={d?.icon ?? 'warn'} size={16} /></span>
        <div className="card-title">
          <span className="node-name" title={el.name}>{el.name}</span>
          <span className="card-sub">{typeLabel(el.type, lang)}{sub ? ` · ${sub}` : ''}</span>
        </div>
      </div>
      <ul className="card-rows">
        {geo.rows.map((pid) => {
          const p = props.find((q) => q.id === pid);
          if (!p) return null;
          const isUsed = used.some((u) => u.prop === pid);
          const v = overlay?.cardValue(el.id, pid);
          return (
            <li key={pid} className={`card-row${isUsed ? ' used' : ''}${v?.changed ? ' changed' : ''}`} data-tip={fieldTip(pid, lang, 'p')} data-testid="card-row" data-prop={pid} data-changed={v?.changed ? '1' : '0'}>
              <span className="row-name">{tx(p, lang)}</span>
              {v ? <span className="row-value" data-testid="row-value">{v.text}</span> : <span className="row-type">{tx(DTYPE_LABEL[p.dtype], lang)}</span>}
              <span className="port prop" style={{ top: ROW_H / 2 }} />
            </li>
          );
        })}
      </ul>
      <span hidden>{CARD_HEAD}{EL_H}{EL_W}{wireCount}</span>
    </div>
  );
}

function HoverBox({ content, x, y }: { content: HoverContent; x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - 250);
    if (top + r.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - 8 - r.height);
    setPos({ left, top });
  }, [x, y, content]);
  return (
    <div className="hoverbox" ref={ref} style={{ left: pos.left, top: pos.top }} data-testid="hover-values" role="tooltip">
      <strong>{content.title}</strong>
      {content.rows.map((r, i) => (
        <div key={i} className={`hv-row${r.changed ? ' changed' : ''}`}><span>{r.label}</span><b>{r.value}</b></div>
      ))}
      {content.note && <p>{content.note}</p>}
    </div>
  );
}
