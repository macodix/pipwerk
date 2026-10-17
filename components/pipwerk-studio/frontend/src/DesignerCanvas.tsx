import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Dispatch,
  type DragEvent,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  applyEdgeChangesToState,
  applyNodeChangesToState,
  assignManagement,
  connect,
  isValidConnection,
  syncedFrames,
} from './canvas/canvasEditing';
import { ElementNode } from './canvas/ElementNode';
import {
  documentToFlow,
  isElementNode,
  type FlowContext,
  type FlowEdge,
  type FlowModel,
  type FlowNode,
  type Severity,
} from './canvas/flowModel';
import type { Point } from './canvas/layout';
import { CanvasActionsContext, ManagementNode } from './canvas/ManagementNode';
import type { SupportedLanguage } from './i18n';
import { LIBRARY_DRAG_TYPE, parseSource, type LibrarySource } from './library/libraryModel';
import type { TypeIndex } from './model/typeIndex';
import type { EditorAction, EditorState } from './state/editorState';

/** What the rest of the application can ask of the drawing area. */
export type CanvasApi = {
  /** The center of the visible part of the drawing area, in the coordinates of the document. */
  centerPoint: () => Point;
};

type DesignerCanvasProps = {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  /** `null` while the type descriptions are not loaded. */
  types: TypeIndex | null;
  language: SupportedLanguage;
  severities: ReadonlyMap<string, Severity>;
  /** An entry of the element library was dropped at a point of the drawing area. */
  onDropEntry: (source: LibrarySource, point: Point) => void;
  apiRef: Ref<CanvasApi>;
};

// The node types stand outside the component: React Flow compares them by identity.
const nodeTypes = { element: ElementNode, management: ManagementNode } as unknown as NodeTypes;

const EMPTY_FLOW: FlowModel = { nodes: [], edges: [], withoutEdge: [] };

function Canvas({ state, dispatch, types, language, severities, onDropEntry, apiRef }: DesignerCanvasProps) {
  const { t } = useTranslation();
  const reactFlow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { document } = state;

  const collapsed = useMemo(() => new Set(state.collapsed), [state.collapsed]);
  const selectedNodes = useMemo(
    () => new Set(state.selection.kind === 'elements' ? state.selection.ids : []),
    [state.selection],
  );
  const selectedEdges = useMemo(() => new Set(state.selectedEdges), [state.selectedEdges]);

  const flow = useMemo<FlowModel>(() => {
    if (document === null || types === null) {
      return EMPTY_FLOW;
    }
    const context: FlowContext = {
      types,
      language,
      frames: state.frames,
      collapsed,
      selectedNodes,
      selectedEdges,
      severities,
    };
    return documentToFlow(document, context);
  }, [document, types, language, state.frames, collapsed, selectedNodes, selectedEdges, severities]);

  // The frames follow the document: a new element that places an order gets one, and a frame grows around its elements.
  useEffect(() => {
    if (document !== null && types !== null) {
      dispatch({ type: 'framesSynced', frames: syncedFrames(document, types, state.frames, language) });
    }
  }, [document, types, state.frames, language, dispatch]);

  // A strategy that was opened or created is shown completely.
  useEffect(() => {
    if (state.document === null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      // An area without a size (not yet laid out) cannot be fitted.
      if ((wrapperRef.current?.clientWidth ?? 0) > 0 && (wrapperRef.current?.clientHeight ?? 0) > 0) {
        void reactFlow.fitView({ padding: 0.2, maxZoom: 1 });
      }
    }, 0);
    return () => {
      clearTimeout(timer);
    };
    // Only a new generation fits the view; moving an element must not.
  }, [state.generation]);

  useImperativeHandle(
    apiRef,
    () => ({
      centerPoint: () => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        return reactFlow.screenToFlowPosition({
          x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
          y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
        });
      },
    }),
    [reactFlow],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      if (document === null) {
        return;
      }
      if (!changes.some((change) => change.type === 'position' || change.type === 'remove' || change.type === 'select')) {
        return;
      }
      dispatch({ type: 'canvasChanged', ...applyNodeChangesToState(flow, changes, document, state.frames) });
    },
    [document, dispatch, flow, state.frames],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdge>[]) => {
      if (document === null) {
        return;
      }
      if (!changes.some((change) => change.type === 'remove' || change.type === 'select')) {
        return;
      }
      dispatch({ type: 'canvasChanged', ...applyEdgeChangesToState(flow, changes, document, state.frames) });
    },
    [document, dispatch, flow, state.frames],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (types === null) {
        return;
      }
      dispatch({ type: 'edited', change: (current) => connect(current, types, connection) });
    },
    [dispatch, types],
  );

  const validConnection = useCallback(
    (connection: { source: string; target: string; sourceHandle?: string | null }) =>
      document !== null && types !== null && isValidConnection(document, types, connection),
    [document, types],
  );

  const onNodeDragStop = useCallback(
    (_event: unknown, _node: FlowNode, nodes: FlowNode[]) => {
      if (types === null) {
        return;
      }
      const ids = nodes.filter(isElementNode).map((node) => node.id);
      dispatch({
        type: 'edited',
        change: (current) => ids.reduce((next, id) => assignManagement(next, types, state.frames, collapsed, id), current),
      });
      // An element that was put into a frame is inside it afterwards: the frame grows if needed.
      dispatch({
        type: 'framesGrow',
        grow: (current, frames) => syncedFrames(current, types, frames, language, true),
      });
    },
    [collapsed, dispatch, language, state.frames, types],
  );

  const actions = useMemo(
    () => ({ toggleCollapse: (ownerId: string) => dispatch({ type: 'toggleCollapse', ownerId }) }),
    [dispatch],
  );

  function onDragOver(event: DragEvent): void {
    if (event.dataTransfer.types.includes(LIBRARY_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function onDrop(event: DragEvent): void {
    const source = parseSource(event.dataTransfer.getData(LIBRARY_DRAG_TYPE));
    if (source === null) {
      return;
    }
    event.preventDefault();
    onDropEntry(source, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }

  return (
    <div ref={wrapperRef} className="designer-canvas-flow">
      <CanvasActionsContext.Provider value={actions}>
        <ReactFlow<FlowNode, FlowEdge>
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={validConnection}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => {
            dispatch({ type: 'select', selection: { kind: 'strategy' } });
          }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.1}
          nodesConnectable={document !== null}
        >
          <Background />
          <Controls showInteractive={false} aria-label={t('canvas.controls')} />
        </ReactFlow>
      </CanvasActionsContext.Provider>
      {document === null ? <p className="designer-canvas-hint">{t('canvas.empty')}</p> : null}
    </div>
  );
}

export function DesignerCanvas(props: DesignerCanvasProps) {
  const { t } = useTranslation();
  return (
    <section className="designer-canvas" aria-label={t('canvas.label')}>
      <ReactFlowProvider>
        <Canvas {...props} />
      </ReactFlowProvider>
    </section>
  );
}
