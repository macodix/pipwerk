import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';

import { addConnection, findElement, updateElement } from '../document/ops';
import type { StrategyDocument } from '../document/types';
import type { TypeIndex } from '../model/typeIndex';
import {
  flowToDocument,
  flowToFrames,
  isElementNode,
  selectedIds,
  type FlowModel,
} from './flowModel';
import {
  NODE_WIDTH,
  containers,
  elementBox,
  frameAt,
  hiddenByCollapse,
  nodeHeight,
  ownerIds,
  ownersInside,
  syncFrames,
  type FrameRects,
  type Point,
} from './layout';

/**
 * What a change on the drawing area does to the document and the view. The
 * handlers of the drawing area only call these functions.
 */

export type CanvasResult = {
  document: StrategyDocument;
  frames: FrameRects;
  selectedNodes: string[];
  selectedEdges: string[];
};

/** The changes that matter: moving, deleting and selecting. Measuring is not stored. */
function relevant<T extends { type: string }>(changes: readonly T[]): T[] {
  return changes.filter(
    (change) => change.type === 'position' || change.type === 'remove' || change.type === 'select',
  );
}

export function applyNodeChangesToState(
  flow: FlowModel,
  changes: NodeChange<FlowModel['nodes'][number]>[],
  document: StrategyDocument,
  frames: FrameRects,
): CanvasResult {
  const wanted = relevant(changes);
  // A frame is not an element and is not deleted by a change of the drawing area.
  const frameIds = new Set(flow.nodes.filter((node) => !isElementNode(node)).map((node) => node.id));
  const allowed = wanted.filter((change) => change.type !== 'remove' || !frameIds.has(change.id));
  const next: FlowModel = { ...flow, nodes: applyNodeChanges(allowed, flow.nodes) };
  const selection = selectedIds(next);
  return {
    document: flowToDocument(document, next),
    frames: flowToFrames(next, frames),
    selectedNodes: selection.nodes,
    selectedEdges: selectedIds(flow).edges,
  };
}

export function applyEdgeChangesToState(
  flow: FlowModel,
  changes: EdgeChange<FlowModel['edges'][number]>[],
  document: StrategyDocument,
  frames: FrameRects,
): CanvasResult {
  const next: FlowModel = { ...flow, edges: applyEdgeChanges(relevant(changes), flow.edges) };
  return {
    document: flowToDocument(document, next),
    frames,
    selectedNodes: selectedIds(flow).nodes,
    selectedEdges: selectedIds(next).edges,
  };
}

/** Whether a connection may start where the user drew it: from a connectable output of an element to an element. */
export function isValidConnection(
  document: StrategyDocument,
  types: TypeIndex,
  connection: { source: string; target: string; sourceHandle?: string | null },
): boolean {
  const source = findElement(document, connection.source);
  const target = findElement(document, connection.target);
  if (source === undefined || target === undefined || connection.sourceHandle === null || connection.sourceHandle === undefined) {
    return false;
  }
  const type = types.byId.get(source.type);
  if (type === undefined) {
    return false;
  }
  return type.outputs.some((output) => output.id === connection.sourceHandle);
}

/** Adds the connection the user drew. Returns the document unchanged if the connection is not allowed or exists. */
export function connect(document: StrategyDocument, types: TypeIndex, connection: Connection): StrategyDocument {
  if (!isValidConnection(document, types, connection) || connection.sourceHandle === null) {
    return document;
  }
  return addConnection(document, {
    source: connection.source,
    output: connection.sourceHandle,
    target: connection.target,
  });
}

/** The frame (as owner identifier) in which a point lies, or `null` for the main flow. */
export function ownerAtPoint(
  document: StrategyDocument,
  types: TypeIndex,
  frames: FrameRects,
  collapsed: ReadonlySet<string>,
  point: Point,
  exclude: ReadonlySet<string> = new Set(),
): string | null {
  const owners = ownerIds(document, types);
  const hidden = hiddenByCollapse(document, owners, collapsed);
  const hiddenOwners = new Set<string>([...hidden.owners, ...collapsed]);
  return frameAt(frames, point, exclude, hiddenOwners);
}

/**
 * After an element was dragged: the element belongs to the management whose
 * frame contains its center, or to none. Returns the document unchanged if that
 * is what it already did.
 */
export function assignManagement(
  document: StrategyDocument,
  types: TypeIndex,
  frames: FrameRects,
  collapsed: ReadonlySet<string>,
  elementId: string,
): StrategyDocument {
  const element = findElement(document, elementId);
  if (element === undefined) {
    return document;
  }
  const owners = ownerIds(document, types);
  const containerById = containers(document, owners);
  const label = (_id: string, text: { de: string; en: string }): string => text.de;
  const box = elementBox(document, element, types, label);
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  // The frame of the element itself and the frames inside it do not take it in.
  const exclude = owners.has(elementId) ? ownersInside(containerById, owners, elementId) : new Set<string>();
  const found = ownerAtPoint(document, types, frames, collapsed, center, exclude);
  const current = containerById.get(elementId) ?? null;
  if (found === current) {
    return document;
  }
  return updateElement(document, elementId, { management_of: found });
}

// The places next to a point, nearest first: right of it, above, below, left of it, then further out.
const NEIGHBORS: readonly (readonly [number, number])[] = (() => {
  const places: [number, number][] = [];
  for (let i = -6; i <= 6; i += 1) {
    for (let j = -6; j <= 6; j += 1) {
      places.push([i, j]);
    }
  }
  return places.sort(
    (a, b) => Math.abs(a[0]) + Math.abs(a[1]) - (Math.abs(b[0]) + Math.abs(b[1])) || b[0] - a[0] || a[1] - b[1],
  );
})();

/**
 * A position for a new element at `point` where it does not cover another
 * element: the point itself if it is free, otherwise the nearest free place in a
 * grid of the size of an element, preferably to the right.
 */
export function freePosition(document: StrategyDocument, types: TypeIndex, point: Point): Point {
  const label = (_id: string, text: { de: string; en: string }): string => text.de;
  const boxes = document.elements.map((element) => elementBox(document, element, types, label));
  const width = NODE_WIDTH;
  const height = nodeHeight(1);
  const margin = 12;
  const free = (x: number, y: number): boolean =>
    !boxes.some(
      (box) =>
        x < box.x + box.width + margin &&
        x + width + margin > box.x &&
        y < box.y + box.height + margin &&
        y + height + margin > box.y,
    );
  for (const [i, j] of NEIGHBORS) {
    const x = point.x + i * (width + 2 * margin);
    const y = point.y + j * (height + 2 * margin);
    if (free(x, y)) {
      return { x, y };
    }
  }
  return point;
}

/** The top left corner for a new element whose center is to lie at `center`. */
export function cornerForCenter(center: Point, outputCount: number): Point {
  return { x: center.x - NODE_WIDTH / 2, y: center.y - nodeHeight(outputCount) / 2 };
}

/**
 * The frames synchronised with the document, ready to be stored. With `grow` the frames
 * also grow around their elements (after an element was put into a management).
 */
export function syncedFrames(
  document: StrategyDocument,
  types: TypeIndex,
  stored: FrameRects,
  language: 'de' | 'en',
  grow = false,
): FrameRects {
  return syncFrames(document, types, stored, (_id, text) => text[language], grow);
}
