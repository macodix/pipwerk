import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type FinalConnectionState,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type Viewport,
} from '@xyflow/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { buildSceneInput } from '../arrange/input';
import { EL_H, EL_W, buildScene, frameAt, type Dir, type Pt } from '../arrange/scene';
import { connect } from '../document/ops';
import { LIBRARY_DRAG_TYPE } from '../library/dragType';
import { MIDDLE_LAYOUT, matchesMedia } from '../ui/media';
import { isCardElement } from '../model/elements';
import { useStudio } from '../state/StudioContext';
import { Btn } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { EdgeActionsContext, FlowEdge, WireEdge } from './edges';
import { buildFlow, stepAt, type CardData, type FrameData, type SectionNodeData, type StepData } from './flowModel';
import {
  BandNode,
  CanvasActionsContext,
  CardNode,
  FrameNode,
  LaneNode,
  SectionNode,
  StepNode,
  type CanvasActions,
} from './nodes';

const nodeTypes = {
  step: StepNode,
  card: CardNode,
  frame: FrameNode,
  band: BandNode,
  section: SectionNode,
  lane: LaneNode,
} as unknown as NodeTypes;

const edgeTypes = { flow: FlowEdge, wire: WireEdge } as unknown as EdgeTypes;

const TOP_ROOM = 58;

type Drag = { id: string; pos: Pt };

/** The drawing area (specification 5.3) with React Flow: it shows the arrangement and takes dragging, connecting, zoom and fitting. */
export function Canvas() {
  const { studio } = useStudio();
  if (studio.state.document === null) {
    // Without a strategy the drawing area stays empty: the hint "Keine Strategie geöffnet" stands in the properties
    // view and nowhere else (specification 5.3, 5.5; req-ui-016).
    return <div className="canvas" data-region="canvas" data-testid="canvas" data-state="no-strategy" />;
  }
  return (
    <ReactFlowProvider>
      <CanvasView />
    </ReactFlowProvider>
  );
}

function CanvasView() {
  const { studio, types, expressions, findings, describe } = useStudio();
  const { t } = useTranslation();
  const flowApi = useReactFlow();
  const { state, actions, language } = studio;
  const document = state.document;
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<Viewport>({ x: 40, y: 40, zoom: 1 });
  const [ready, setReady] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [dropHint, setDropHint] = useState(false);
  const dir: Dir = document?.orientation === 'horizontal' ? 'h' : 'v';
  const open = useMemo(() => new Set(state.openCards), [state.openCards]);

  const sceneInput = useMemo(() => {
    if (document === null || types === null) {
      return null;
    }
    const places = drag === null ? new Map<string, Pt>() : new Map([[drag.id, drag.pos]]);
    return buildSceneInput(document, types, language, open, expressions.references, places);
  }, [document, drag, expressions.references, language, open, types]);
  const scene = useMemo(() => (sceneInput === null ? null : buildScene(sceneInput, dir)), [dir, sceneInput]);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const flow = useMemo(() => {
    if (document === null || types === null || scene === null || describe === null) {
      return { nodes: [], edges: [] };
    }
    return buildFlow({
      document,
      types,
      scene,
      dir,
      language,
      t,
      describe,
      findings,
      selection: state.selection,
      armed: state.armed,
      wires: state.wires,
      selectedEdge,
      openCards: open,
    });
    // `bump` makes React Flow take the places of the arrangement again after a card was dragged away
  },[bump, describe, dir, document, findings, language, open, scene, selectedEdge, state.armed, state.selection, state.wires, t, types]);

  // --- the view: set when a strategy is opened, never when something is edited (specification 5.3, M3) ---

  const showView = useCallback((view: Viewport) => {
    viewRef.current = view;
    wrapRef.current?.setAttribute('data-view', `${view.x.toFixed(1)},${view.y.toFixed(1)},${view.zoom.toFixed(3)}`);
  }, []);

  const setView = useCallback(
    (view: Viewport) => {
      showView(view);
      void flowApi.setViewport(view, { duration: 0 });
    },
    [flowApi, showView],
  );

  const fit = useCallback(() => {
    const el = wrapRef.current;
    const current = sceneRef.current;
    if (el === null || current === null) {
      return;
    }
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const horizontal = dir === 'h';
    if ((document?.elements.length ?? 0) === 0) {
      // room for the first steps and for the area of the objects next to them
      setView(
        horizontal
          ? { x: 40, y: Math.min(300, vh / 2), zoom: 1 }
          : { x: vw >= 640 ? (vw - 568) / 2 + 332 : vw / 2 - EL_W / 2, y: Math.min(110, vh / 4), zoom: 1 },
      );
      return;
    }
    const b = current.bounds;
    const pad = 22;
    const raw = horizontal ? (vh - TOP_ROOM - pad) / b.h : (vw - 2 * pad) / b.w;
    const zoom = Math.max(0.8, Math.min(1, raw));
    // the flow itself, without the area for objects: where the view starts when everything does not fit
    const flowBoxes = [...current.nodes.values(), ...current.secNodes.values(), ...current.frames, ...current.bands];
    const fx = flowBoxes.length > 0 ? Math.min(...flowBoxes.map((q) => q.x)) : b.x;
    const fy = flowBoxes.length > 0 ? Math.min(...flowBoxes.map((q) => q.y)) : b.y;
    const fitsW = b.w * zoom + 2 * pad <= vw;
    const fitsH = b.h * zoom + TOP_ROOM + pad <= vh;
    // not everything fits: the area for objects together with the beginning of the flow if both fit, otherwise the beginning of the flow
    const laneX = pad - b.x * zoom;
    const laneY = TOP_ROOM - b.y * zoom;
    const x = fitsW
      ? (vw - b.w * zoom) / 2 - b.x * zoom
      : horizontal || (fx + EL_W + 24 - b.x) * zoom + 2 * pad <= vw
        ? laneX
        : pad - fx * zoom;
    const y = fitsH
      ? TOP_ROOM + (vh - TOP_ROOM - b.h * zoom) / 2 - b.y * zoom
      : !horizontal || (fy + EL_H + 24 - b.y) * zoom + TOP_ROOM + pad <= vh
        ? laneY
        : TOP_ROOM - (fy - 40) * zoom;
    setView({ x, y, zoom });
  }, [dir, document?.elements.length, setView]);

  /** Shows everything at once, as large as it fits. */
  const showAll = useCallback(() => {
    const el = wrapRef.current;
    const current = sceneRef.current;
    if (el === null || current === null) {
      return;
    }
    const b = current.bounds;
    const pad = 24;
    const zoom = Math.max(0.2, Math.min(1, (el.clientWidth - 2 * pad) / b.w, (el.clientHeight - TOP_ROOM - pad) / b.h));
    setView({
      zoom,
      x: (el.clientWidth - b.w * zoom) / 2 - b.x * zoom,
      y: TOP_ROOM + (el.clientHeight - TOP_ROOM - b.h * zoom) / 2 - b.y * zoom,
    });
  }, [setView]);

  const zoomBy = useCallback(
    (factor: number) => {
      const el = wrapRef.current;
      if (el === null) {
        return;
      }
      const v = viewRef.current;
      const zoom = Math.min(2, Math.max(0.3, v.zoom * factor));
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      setView({ zoom, x: cx - ((cx - v.x) / v.zoom) * zoom, y: cy - ((cy - v.y) / v.zoom) * zoom });
    },
    [setView],
  );

  // The view is set when a strategy is opened and when the direction changes, after React Flow is ready.
  useLayoutEffect(() => {
    if (ready) {
      fit();
    }
    // `fit` is left out on purpose: the view is set only when a strategy is opened or the direction changes
  }, [ready, state.openCount, dir]);

  // A new or targeted element is brought into view only if it is completely outside of the view, and only as far as needed.
  const revealSerial = state.reveal?.serial;
  useEffect(() => {
    const target = state.reveal;
    const current = sceneRef.current;
    const el = wrapRef.current;
    if (target === null || current === null || el === null || !ready) {
      return;
    }
    const b = current.nodes.get(target.id) ?? current.cards.get(target.id);
    if (b === undefined) {
      return;
    }
    const v = viewRef.current;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const l = b.x * v.zoom + v.x;
    const top = b.y * v.zoom + v.y;
    const r = l + b.w * v.zoom;
    const bottom = top + b.h * v.zoom;
    const margin = 16;
    let dx = 0;
    let dy = 0;
    if (r < margin || l > vw - margin) {
      dx = vw / 2 - (l + r) / 2;
    } else if (l < 0) {
      dx = -l + margin;
    } else if (r > vw) {
      dx = vw - r - margin;
    }
    if (bottom < margin || top > vh - margin) {
      dy = vh / 2 - (top + bottom) / 2;
    } else if (top < 0) {
      dy = -top + margin;
    } else if (bottom > vh) {
      dy = vh - bottom - margin;
    }
    if (dx !== 0 || dy !== 0) {
      setView({ ...v, x: v.x + dx, y: v.y + dy });
    }
    // only a new request moves the view
  }, [revealSerial, ready]);

  // --- selection and actions of the nodes ---

  const canvasActions = useMemo<CanvasActions>(
    () => ({
      selectElement: (id) => {
        actions.select({ kind: 'element', id });
        if (matchesMedia(MIDDLE_LAYOUT)) {
          actions.setPanel('props');
        }
      },
      selectFrame: (owner) => {
        actions.select({ kind: 'frame', id: owner });
      },
      selectSection: (id) => {
        actions.select({ kind: 'section', id });
      },
      clickStep: (id) => {
        const armed = studio.state.armed;
        if (armed !== null && armed.from !== id) {
          if (actions.connectSteps(armed.from, armed.output, id)) {
            return;
          }
        }
        actions.select({ kind: 'element', id });
        if (matchesMedia(MIDDLE_LAYOUT)) {
          actions.setPanel('props');
        }
      },
      armOutput: (from, output) => {
        const armed = studio.state.armed;
        if (armed !== null && armed.from === from && armed.output === output) {
          actions.arm(null);
        } else {
          actions.select({ kind: 'element', id: from });
          actions.arm({ from, output });
        }
      },
      toggleFrame: actions.toggleManagement,
      setSectionCollapsed: actions.setSectionCollapsed,
      renameSection: actions.renameSection,
      toggleCard: actions.toggleCard,
    }),
    [actions, studio.state.armed],
  );

  const onNodeClick = useCallback(
    (_event: unknown, node: Node) => {
      setSelectedEdge(null);
      if (node.type === 'step') {
        canvasActions.clickStep(node.id);
      } else if (node.type === 'card') {
        canvasActions.selectElement(node.id);
      } else if (node.type === 'frame') {
        canvasActions.selectFrame((node.data as FrameData).owner);
      } else if (node.type === 'section') {
        canvasActions.selectSection((node.data as SectionNodeData).section);
      }
    },
    [canvasActions],
  );

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
    actions.arm(null);
    actions.select({ kind: 'strategy' });
  }, [actions]);

  const onEdgeClick = useCallback((_event: unknown, edge: Edge) => {
    setSelectedEdge(edge.id.startsWith('e:') ? edge.id : null);
  }, []);

  const edgeActions = useMemo(
    () => ({
      deleteConnection: (connectionId: string) => {
        setSelectedEdge(null);
        actions.disconnect(connectionId);
      },
    }),
    [actions],
  );

  // --- connecting ---

  const isElement = useCallback(
    (id: string) => document?.elements.some((candidate) => candidate.id === id) ?? false,
    [document],
  );

  /** Connects what was dragged from a connection point to the node: a value becomes an input, an output gets its successor. */
  const connectTo = useCallback(
    (sourceId: string, handle: string | null, targetId: string): boolean => {
      if (!isElement(sourceId) || !isElement(targetId) || sourceId === targetId) {
        return false;
      }
      if (handle !== null && handle.startsWith('prop:')) {
        actions.connectValue(sourceId, handle.slice(5), targetId);
        return true;
      }
      return handle !== null && actions.connectSteps(sourceId, handle, targetId);
    },
    [actions, isElement],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      connectTo(connection.source, connection.sourceHandle, connection.target);
    },
    [connectTo],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid === true || state.fromNode === null || state.fromHandle === null) {
        return;
      }
      // dropped on the body of an element and not on a connection point: the element is the target all the same
      const point = 'changedTouches' in event ? event.changedTouches[0] : event;
      if (point === undefined) {
        return;
      }
      const under = window.document.elementFromPoint(point.clientX, point.clientY);
      const target = under?.closest<HTMLElement>('.react-flow__node')?.dataset.id;
      if (target !== undefined) {
        connectTo(state.fromNode.id, state.fromHandle.id ?? null, target);
      }
    },
    [connectTo],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge): boolean => {
      if (document === null || types === null) {
        return false;
      }
      const handle = connection.sourceHandle ?? '';
      if (handle.startsWith('prop:')) {
        return isElement(connection.target) && connection.target !== connection.source;
      }
      return !('problem' in connect(document, types, connection.source, handle, connection.target));
    },
    [document, isElement, types],
  );

  // --- dragging ---

  const onNodeDrag = useCallback(
    (_event: unknown, node: Node) => {
      if (node.type === 'step') {
        setDrag({ id: node.id, pos: { x: node.position.x, y: node.position.y } });
      }
    },
    [],
  );

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      setDrag(null);
      const current = sceneRef.current;
      if (current === null || document === null || types === null) {
        return;
      }
      if (node.type === 'step') {
        const data = node.data as StepData;
        const center = { x: node.position.x + data.width / 2, y: node.position.y + data.height / 2 };
        const frame = frameAt(current, center, node.id);
        actions.dropStep(node.id, { x: node.position.x, y: node.position.y }, frame?.owner ?? null);
      } else if (node.type === 'card') {
        const data = node.data as CardData;
        const centre = dir === 'v' ? node.position.y + data.height / 2 : node.position.x + data.width / 2;
        const others = [...current.cards.values()].filter((card) => card.id !== node.id);
        const index = others.filter((card) => (dir === 'v' ? card.y + card.h / 2 : card.x + card.w / 2) < centre).length;
        actions.placeObject(node.id, index);
      }
      setBump((value) => value + 1);
    },
    [actions, dir, document, types],
  );

  // --- dropping an entry of the library ---

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropHint(false);
      const current = sceneRef.current;
      const key = event.dataTransfer.getData(LIBRARY_DRAG_TYPE);
      if (key === '' || current === null || document === null || types === null) {
        return;
      }
      const point = flowApi.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const hit = stepAt(current, point);
      const hitElement = hit === undefined ? undefined : document.elements.find((candidate) => candidate.id === hit);
      const frame = frameAt(current, point);
      actions.pauseWizard();
      if (hitElement !== undefined && !isCardElement(hitElement, types)) {
        void actions.insert(key, { after: hitElement.id, flow: hitElement.management_of ?? null });
      } else {
        void actions.insert(key, { after: null, flow: frame?.owner ?? null });
      }
    },
    [actions, document, flowApi, types],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (selectedEdge !== null && (event.key === 'Delete' || event.key === 'Backspace')) {
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          return;
        }
        event.preventDefault();
        edgeActions.deleteConnection(selectedEdge.slice(2));
      }
    },
    [edgeActions, selectedEdge],
  );

  if (document === null) {
    return null;
  }
  const selection = state.selection;
  const selectedName =
    selection.kind === 'element'
      ? actions.elementDisplayName(selection.id)
      : selection.kind === 'strategy'
        ? document.name
        : selection.kind === 'frame'
          ? actions.elementDisplayName(selection.id)
          : (document.sections.find((section) => section.id === selection.id)?.name ?? '');

  return (
    <div
      className="canvas"
      ref={wrapRef}
      data-region="canvas"
      data-testid="canvas"
      data-orient={dir}
      onKeyDown={onKeyDown}
    >
      <svg className="canvas-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 z" className="arrow-head" />
          </marker>
          <marker id="arrow-sel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 z" className="arrow-head sel" />
          </marker>
        </defs>
      </svg>

      <div className="canvas-tools">
        <div className="seg" role="group" aria-label={t('canvas.orientation')}>
          <button
            type="button"
            className={dir === 'v' ? 'on' : ''}
            onClick={() => {
              actions.setOrientation('vertical');
            }}
            data-testid="orient-v"
            data-tip={t('canvas.orientVerticalTip')}
          >
            <Icon name="arrowdown" size={15} />
            <span>{t('canvas.vertical')}</span>
          </button>
          <button
            type="button"
            className={dir === 'h' ? 'on' : ''}
            onClick={() => {
              actions.setOrientation('horizontal');
            }}
            data-testid="orient-h"
            data-tip={t('canvas.orientHorizontalTip')}
          >
            <Icon name="right" size={15} />
            <span>{t('canvas.horizontal')}</span>
          </button>
        </div>
        <div className="seg" role="group" aria-label={t('canvas.wires')}>
          {(['all', 'selection', 'off'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={state.wires === mode ? 'on' : ''}
              onClick={() => {
                actions.setWires(mode);
              }}
              data-testid={`wires-${mode}`}
              data-tip={t(`canvas.wiresTip.${mode}`)}
            >
              <Icon name={mode === 'all' ? 'link' : mode === 'selection' ? 'eye' : 'x'} size={15} />
              <span>{t(`canvas.wiresMode.${mode}`)}</span>
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t('canvas.zoom')}>
          <button
            type="button"
            onClick={() => {
              zoomBy(1 / 1.2);
            }}
            aria-label={t('canvas.zoomOut')}
            data-testid="zoom-out"
            data-tip={t('canvas.zoomOut')}
          >
            <Icon name="zoomout" size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              zoomBy(1.2);
            }}
            aria-label={t('canvas.zoomIn')}
            data-testid="zoom-in"
            data-tip={t('canvas.zoomIn')}
          >
            <Icon name="zoomin" size={16} />
          </button>
          <button type="button" onClick={showAll} aria-label={t('canvas.showAll')} data-testid="zoom-fit" data-tip={t('canvas.showAllTip')}>
            <Icon name="fit" size={16} />
          </button>
          <button type="button" onClick={fit} aria-label={t('canvas.toStart')} data-testid="zoom-start" data-tip={t('canvas.toStartTip')}>
            <Icon name="up" size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              actions.arrangeAgain();
            }}
            aria-label={t('canvas.arrange')}
            data-testid="arrange"
            data-tip={t('canvas.arrangeTip')}
          >
            <Icon name="grid" size={16} />
          </button>
        </div>
      </div>

      <CanvasActionsContext.Provider value={canvasActions}>
        <EdgeActionsContext.Provider value={edgeActions}>
          <div
            className={`viewport${dropHint ? ' drop' : ''}`}
            data-testid="viewport"
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes(LIBRARY_DRAG_TYPE)) {
                event.preventDefault();
                setDropHint(true);
              }
            }}
            onDragLeave={() => {
              setDropHint(false);
            }}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={flow.nodes}
              edges={flow.edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultViewport={{ x: 40, y: 40, zoom: 1 }}
              minZoom={0.3}
              maxZoom={2}
              panOnScroll
              zoomOnScroll={false}
              zoomOnDoubleClick={false}
              deleteKeyCode={null}
              selectionKeyCode={null}
              multiSelectionKeyCode={null}
              selectNodesOnDrag={false}
              nodeDragThreshold={5}
              nodeClickDistance={5}
              connectOnClick={false}
              connectionRadius={24}
              nodesFocusable={false}
              edgesFocusable={false}
              onNodeClick={onNodeClick}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              onPaneClick={onPaneClick}
              onEdgeClick={onEdgeClick}
              onConnect={onConnect}
              onConnectEnd={onConnectEnd}
              isValidConnection={isValidConnection}
              onInit={() => {
                setReady(true);
              }}
              onMove={(_event, view) => {
                showView(view);
              }}
              colorMode="light"
            />
          </div>
        </EdgeActionsContext.Provider>
      </CanvasActionsContext.Provider>

      <details className="legend">
        <summary>{t('canvas.legend')}</summary>
        <div className="legend-row">
          <svg width="46" height="12" aria-hidden="true">
            <path d="M2 6 H36" className="edge-line" />
            <path d="M34 2 L42 6 L34 10z" className="arrow-head" />
          </svg>
          <span>{t('canvas.legendFlow')}</span>
        </div>
        <div className="legend-row">
          <svg width="46" height="12" aria-hidden="true">
            <path d="M2 6 H36" className="legend-management" />
          </svg>
          <span>{t('canvas.legendManagement')}</span>
        </div>
        <div className="legend-row">
          <svg width="46" height="12" aria-hidden="true">
            <path d="M2 6 H44" className="legend-wire" />
          </svg>
          <span>{t('canvas.legendWire')}</span>
        </div>
        <div className="legend-row">
          <svg width="46" height="12" aria-hidden="true">
            <path d="M2 6 H44" className="legend-wire name" />
          </svg>
          <span>{t('canvas.legendWireExpression')}</span>
        </div>
      </details>

      <div className="sel-bar">
        <span>{selectedName}</span>
        <Btn
          small
          kind="primary"
          testid="open-props"
          onClick={() => {
            actions.setPanel('props');
          }}
        >
          {t('canvas.properties')}
        </Btn>
      </div>
    </div>
  );
}
