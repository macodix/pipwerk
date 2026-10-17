import { MarkerType, type Edge, type Node } from '@xyflow/react';

import type { SupportedLanguage } from '../i18n';
import type { ConnectionDocument, ElementDocument, StrategyDocument } from '../document/types';
import { labelText, nodeKindOf, type NodeKind, type TypeIndex } from '../model/typeIndex';
import {
  FRAME_HEADER_HEIGHT,
  NODE_WIDTH,
  containers,
  depthOf,
  elementHasInput,
  elementOutputs,
  frameNodeId,
  hiddenByCollapse,
  nodeHeight,
  ownerIds,
  syncFrames,
  type FrameRects,
  type OutputHandle,
  type Point,
} from './layout';

/**
 * The model of React Flow for the drawing area. It is derived from the strategy
 * document and from the view state (which frames are collapsed, where the
 * frames stand); `flowToDocument` is the way back (specification E3). Both are
 * pure functions.
 */

/**
 * How a node was derived. If its position in the flow is still the derived one
 * and so is the position of its frame, the document position is taken over
 * unchanged; this keeps fractional coordinates exact (adding and subtracting
 * the origin of a frame is not exact in floating-point numbers).
 */
export type Anchor = { abs: Point; rel: Point; parentAbs: Point };

export type Severity = 'error' | 'hint';

export type ElementNodeData = {
  kind: 'element';
  elementId: string;
  typeId: string;
  nodeKind: NodeKind;
  title: string;
  subtitle: string;
  outputs: OutputHandle[];
  hasInput: boolean;
  /** The element has a frame (a management). */
  isOwner: boolean;
  severity: Severity | null;
  /** The management the element belongs to when the node was derived. */
  container: string | null;
  anchor: Anchor;
};

export type FrameNodeData = {
  kind: 'management';
  ownerId: string;
  title: string;
  collapsed: boolean;
  /** Size of the frame when it is open. */
  size: { width: number; height: number };
  anchor: Anchor;
};

export type ElementFlowNode = Node<ElementNodeData, 'element'>;
export type FrameFlowNode = Node<FrameNodeData, 'management'>;
export type FlowNode = ElementFlowNode | FrameFlowNode;

export type FlowEdgeData =
  | { kind: 'connection'; index: number }
  | { kind: 'management'; ownerId: string };

export type FlowEdge = Edge<FlowEdgeData>;

export type FlowModel = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Connections without an edge (an end that is not an element). They are never removed by a change of the flow. */
  withoutEdge: number[];
};

/** Identifier of the connector at the bottom of an element that carries the frame of its management. */
export const MANAGEMENT_HANDLE = 'management';

export type FlowContext = {
  types: TypeIndex;
  language: SupportedLanguage;
  frames: FrameRects;
  collapsed: ReadonlySet<string>;
  selectedNodes: ReadonlySet<string>;
  selectedEdges: ReadonlySet<string>;
  severities: ReadonlyMap<string, Severity>;
};

export function isElementNode(node: FlowNode): node is ElementFlowNode {
  return node.data.kind === 'element';
}

export function isFrameNode(node: FlowNode): node is FrameFlowNode {
  return node.data.kind === 'management';
}

function elementTitle(element: ElementDocument, ctx: FlowContext): string {
  const type = ctx.types.byId.get(element.type);
  // An element that holds an instance shows the name of the instance, whatever its type.
  if (element.instance !== undefined && element.instance !== null && element.instance.name !== '') {
    return element.instance.name;
  }
  if (element.title !== '') {
    return element.title;
  }
  return type === undefined ? element.type : labelText(type.name, ctx.language);
}

function elementSubtitle(element: ElementDocument, ctx: FlowContext): string {
  const type = ctx.types.byId.get(element.type);
  const typeText = type === undefined ? element.type : labelText(type.name, ctx.language);
  if (element.name !== null && element.name !== '') {
    return `${typeText} · ${element.name}`;
  }
  return typeText;
}

function uniqueEdgeId(base: string, used: Set<string>): string {
  let id = base;
  for (let counter = 2; used.has(id); counter += 1) {
    id = `${base}#${counter}`;
  }
  used.add(id);
  return id;
}

/** Document → drawing area. */
export function documentToFlow(document: StrategyDocument, ctx: FlowContext): FlowModel {
  const label = (_id: string, text: { de: string; en: string }): string => text[ctx.language];
  const owners = ownerIds(document, ctx.types);
  const containerById = containers(document, owners);
  const rects = syncFrames(document, ctx.types, ctx.frames, label);
  const hidden = hiddenByCollapse(document, owners, ctx.collapsed);
  const byId = new Map(document.elements.map((element) => [element.id, element]));

  type Entry = { depth: number; frame: boolean; order: number; node: FlowNode };
  const entries: Entry[] = [];
  let order = 0;

  for (const ownerId of owners) {
    const owner = byId.get(ownerId);
    const rect = rects[ownerId];
    if (owner === undefined || rect === undefined) {
      continue;
    }
    const container = containerById.get(ownerId) ?? null;
    const parentRect = container === null ? undefined : rects[container];
    const origin = parentRect === undefined ? { x: 0, y: 0 } : { x: parentRect.x, y: parentRect.y };
    const collapsed = ctx.collapsed.has(ownerId);
    const node: FrameFlowNode = {
      id: frameNodeId(ownerId),
      type: 'management',
      position: { x: rect.x - origin.x, y: rect.y - origin.y },
      width: rect.width,
      height: collapsed ? FRAME_HEADER_HEIGHT : rect.height,
      measured: { width: rect.width, height: collapsed ? FRAME_HEADER_HEIGHT : rect.height },
      dragHandle: '.management-header',
      deletable: false,
      selectable: false,
      focusable: false,
      hidden: hidden.owners.has(ownerId),
      data: {
        kind: 'management',
        ownerId,
        title: elementTitle(owner, ctx),
        collapsed,
        size: { width: rect.width, height: rect.height },
        anchor: {
          abs: { x: rect.x, y: rect.y },
          rel: { x: rect.x - origin.x, y: rect.y - origin.y },
          parentAbs: origin,
        },
      },
    };
    if (container !== null && parentRect !== undefined) {
      node.parentId = frameNodeId(container);
    }
    entries.push({ depth: depthOf(containerById, ownerId), frame: true, order: order++, node });
  }

  for (const element of document.elements) {
    const type = ctx.types.byId.get(element.type);
    const nodeKind = nodeKindOf(type);
    const outputs = elementOutputs(document, element, type, label);
    const container = containerById.get(element.id) ?? null;
    const parentRect = container === null ? undefined : rects[container];
    const origin = parentRect === undefined ? { x: 0, y: 0 } : { x: parentRect.x, y: parentRect.y };
    const height = nodeHeight(outputs.length);
    const rel = { x: element.x - origin.x, y: element.y - origin.y };
    const node: ElementFlowNode = {
      id: element.id,
      type: 'element',
      position: rel,
      width: NODE_WIDTH,
      height,
      measured: { width: NODE_WIDTH, height },
      ariaLabel: elementTitle(element, ctx),
      selected: ctx.selectedNodes.has(element.id),
      hidden: hidden.elements.has(element.id),
      data: {
        kind: 'element',
        elementId: element.id,
        typeId: element.type,
        nodeKind,
        title: elementTitle(element, ctx),
        subtitle: elementSubtitle(element, ctx),
        outputs,
        hasInput: elementHasInput(document, element, nodeKind),
        isOwner: owners.has(element.id),
        severity: ctx.severities.get(element.id) ?? null,
        container,
        anchor: { abs: { x: element.x, y: element.y }, rel, parentAbs: origin },
      },
    };
    if (container !== null && parentRect !== undefined) {
      node.parentId = frameNodeId(container);
    }
    entries.push({ depth: depthOf(containerById, element.id), frame: false, order: order++, node });
  }

  // A frame comes before the elements inside it, frames before elements of the same depth.
  entries.sort((a, b) => a.depth - b.depth || Number(b.frame) - Number(a.frame) || a.order - b.order);

  const edges: FlowEdge[] = [];
  const withoutEdge: number[] = [];
  const usedIds = new Set<string>();
  document.connections.forEach((connection, index) => {
    const source = byId.get(connection.source);
    const target = byId.get(connection.target);
    if (source === undefined || target === undefined) {
      withoutEdge.push(index);
      return;
    }
    const id = uniqueEdgeId(`c:${connection.source}:${connection.output}:${connection.target}`, usedIds);
    edges.push({
      id,
      source: connection.source,
      sourceHandle: connection.output,
      target: connection.target,
      markerEnd: { type: MarkerType.ArrowClosed },
      ariaLabel: `${elementTitle(source, ctx)} → ${elementTitle(target, ctx)}`,
      selected: ctx.selectedEdges.has(id),
      hidden: hidden.elements.has(connection.source) || hidden.elements.has(connection.target),
      data: { kind: 'connection', index },
    });
  });
  for (const ownerId of owners) {
    if (byId.has(ownerId) && rects[ownerId] !== undefined) {
      edges.push({
        id: `management:${ownerId}`,
        source: ownerId,
        sourceHandle: MANAGEMENT_HANDLE,
        target: frameNodeId(ownerId),
        className: 'management-edge',
        selectable: false,
        deletable: false,
        focusable: false,
        hidden: hidden.elements.has(ownerId) || hidden.owners.has(ownerId),
        data: { kind: 'management', ownerId },
      });
    }
  }

  return { nodes: entries.map((entry) => entry.node), edges, withoutEdge };
}

/** Absolute position of a node, from its position in the flow and the position of its frame. */
export function absolutePosition(node: FlowNode, nodes: ReadonlyMap<string, FlowNode>): Point {
  const seen = new Set<string>();
  function resolve(current: FlowNode): Point {
    if (seen.has(current.id)) {
      return { x: current.position.x, y: current.position.y };
    }
    seen.add(current.id);
    const parent = current.parentId === undefined ? undefined : nodes.get(current.parentId);
    const parentAbs = parent === undefined ? { x: 0, y: 0 } : resolve(parent);
    const anchor = current.data.anchor;
    if (
      current.position.x === anchor.rel.x &&
      current.position.y === anchor.rel.y &&
      parentAbs.x === anchor.parentAbs.x &&
      parentAbs.y === anchor.parentAbs.y
    ) {
      return anchor.abs;
    }
    return { x: current.position.x + parentAbs.x, y: current.position.y + parentAbs.y };
  }
  return resolve(node);
}

/**
 * Drawing area → document. Takes over the positions, the management of each
 * element (the frame it lies in), the connections that still have an edge, and
 * drops the elements that are no longer nodes. Everything else of the document
 * stays as it is.
 */
export function flowToDocument(base: StrategyDocument, flow: FlowModel): StrategyDocument {
  const nodes = new Map(flow.nodes.map((node) => [node.id, node]));
  const elements: ElementDocument[] = [];
  for (const element of base.elements) {
    const node = nodes.get(element.id);
    if (node === undefined || !isElementNode(node)) {
      continue;
    }
    const abs = absolutePosition(node, nodes);
    const parent = node.parentId === undefined ? undefined : nodes.get(node.parentId);
    const frameOwner = parent !== undefined && isFrameNode(parent) ? parent.data.ownerId : null;
    const owner = frameOwner !== null && nodes.has(frameOwner) ? frameOwner : null;
    // A management that did not change keeps its stored value, even a reference that leads nowhere.
    const managementOf = owner === node.data.container ? element.management_of : owner;
    if (abs.x === element.x && abs.y === element.y && managementOf === element.management_of) {
      elements.push(element);
    } else {
      elements.push({ ...element, x: abs.x, y: abs.y, management_of: managementOf });
    }
  }
  const kept = new Set<number>(flow.withoutEdge);
  for (const edge of flow.edges) {
    if (edge.data?.kind === 'connection') {
      kept.add(edge.data.index);
    }
  }
  const present = new Set(elements.map((element) => element.id));
  const connections: ConnectionDocument[] = base.connections.filter(
    (connection, index) =>
      kept.has(index) &&
      (flow.withoutEdge.includes(index) || (present.has(connection.source) && present.has(connection.target))),
  );
  const sameElements =
    elements.length === base.elements.length && elements.every((element, i) => element === base.elements[i]);
  const sameConnections =
    connections.length === base.connections.length &&
    connections.every((connection, i) => connection === base.connections[i]);
  if (sameElements && sameConnections) {
    return base;
  }
  return { ...base, elements, connections };
}

/** Drawing area → frames: the absolute position of each frame. The size stays the one stored. */
export function flowToFrames(flow: FlowModel, stored: FrameRects): FrameRects {
  const nodes = new Map(flow.nodes.map((node) => [node.id, node]));
  const result: FrameRects = {};
  for (const node of flow.nodes) {
    if (!isFrameNode(node)) {
      continue;
    }
    const abs = absolutePosition(node, nodes);
    const known = stored[node.data.ownerId];
    result[node.data.ownerId] = {
      x: abs.x,
      y: abs.y,
      width: known?.width ?? node.data.size.width,
      height: known?.height ?? node.data.size.height,
    };
  }
  return result;
}

export function selectedIds(flow: FlowModel): { nodes: string[]; edges: string[] } {
  return {
    nodes: flow.nodes.filter((node) => node.selected === true && isElementNode(node)).map((node) => node.id),
    edges: flow.edges.filter((edge) => edge.selected === true).map((edge) => edge.id),
  };
}
