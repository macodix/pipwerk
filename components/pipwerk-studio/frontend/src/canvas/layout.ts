import type { TypeDescription } from '../api/elementTypes';
import { getOwn, setOwn } from '../document/own';
import type { ElementDocument, StrategyDocument } from '../document/types';
import { isManagementOwnerType, type NodeKind, type TypeIndex } from '../model/typeIndex';

/** Geometry of the drawing area: sizes of elements and frames and the rule for where a frame stands. */

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** The frame of a management, by the identifier of the element that places the order. Absolute coordinates. */
export type FrameRects = Record<string, Rect>;

/** Narrower than the step of 200 in the positions of the test cases, so that two neighbors leave room for a connection. */
export const NODE_WIDTH = 160;
export const NODE_MIN_HEIGHT = 56;
export const OUTPUT_ROW_HEIGHT = 22;
export const NODE_TOP = 34;
export const FRAME_PADDING = 40;
export const FRAME_HEADER_HEIGHT = 36;
export const FRAME_MIN_WIDTH = 420;
export const FRAME_MIN_HEIGHT = 240;
/** Gap between the element that places the order and its empty frame. */
const FRAME_GAP = 60;

export const FRAME_PREFIX = 'frame:';

export function frameNodeId(ownerId: string): string {
  return `${FRAME_PREFIX}${ownerId}`;
}

export type OutputHandle = {
  id: string;
  label: string;
  /** A new connection can start here. */
  connectable: boolean;
  /** The output is stored in a connection but the type does not have it. */
  stored: boolean;
};

export function nodeHeight(outputCount: number): number {
  return Math.max(NODE_MIN_HEIGHT, NODE_TOP + outputCount * OUTPUT_ROW_HEIGHT + 6);
}

export type OutputLabel = (outputId: string, label: { de: string; en: string }) => string;

/**
 * The outputs an element shows. They are the outputs of the type; an output
 * that a stored connection names and the type does not have is added, so that
 * the connection can be seen and deleted. An element of an unknown type has an
 * output per stored output, with the stored identifier; no new connection
 * starts there.
 */
export function elementOutputs(
  document: StrategyDocument,
  element: ElementDocument,
  type: TypeDescription | undefined,
  label: OutputLabel,
): OutputHandle[] {
  const outputs: OutputHandle[] = (type?.outputs ?? []).map((output) => ({
    id: output.id,
    label: label(output.id, output.label),
    // No connection starts at the output that holds the management (specification 5.3).
    connectable: !output.holdsManagement,
    stored: false,
  }));
  const known = new Set(outputs.map((output) => output.id));
  for (const connection of document.connections) {
    if (connection.source === element.id && !known.has(connection.output)) {
      known.add(connection.output);
      outputs.push({ id: connection.output, label: connection.output, connectable: false, stored: true });
    }
  }
  return outputs;
}

/** Whether the element has an input: elements of the flow, elements of an unknown type, and every target of a connection. */
export function elementHasInput(
  document: StrategyDocument,
  element: ElementDocument,
  nodeKind: NodeKind,
): boolean {
  return (
    nodeKind === 'flow' ||
    nodeKind === 'unknown' ||
    document.connections.some((connection) => connection.target === element.id)
  );
}

// --- managements -----------------------------------------------------------------------

/**
 * The elements that have a frame: the elements whose type has an output that
 * holds the management (from the type description) and every existing element
 * that another element names as its management.
 */
export function ownerIds(document: StrategyDocument, index: TypeIndex): Set<string> {
  const ids = new Set<string>();
  const existing = new Set(document.elements.map((element) => element.id));
  for (const element of document.elements) {
    if (isManagementOwnerType(index.byId.get(element.type))) {
      ids.add(element.id);
    }
    if (element.management_of !== null && existing.has(element.management_of)) {
      ids.add(element.management_of);
    }
  }
  return ids;
}

/**
 * The management an element belongs to: the identifier of the element that
 * places the order, or `null` in the main flow. A reference to an element that
 * does not exist and a reference that leads back to the element itself count
 * as the main flow for the display; the document keeps the stored value.
 */
export function containerOf(
  document: StrategyDocument,
  owners: ReadonlySet<string>,
  element: ElementDocument,
): string | null {
  const owner = element.management_of;
  if (owner === null || !owners.has(owner) || owner === element.id) {
    return null;
  }
  const byId = new Map(document.elements.map((item) => [item.id, item]));
  let current = byId.get(owner);
  const seen = new Set<string>([element.id]);
  while (current !== undefined) {
    if (seen.has(current.id)) {
      return null;
    }
    seen.add(current.id);
    const next: string | null = current.management_of;
    current = next !== null && owners.has(next) ? byId.get(next) : undefined;
  }
  return owner;
}

/** Container of every element, computed once. */
export function containers(document: StrategyDocument, owners: ReadonlySet<string>): Map<string, string | null> {
  const result = new Map<string, string | null>();
  for (const element of document.elements) {
    result.set(element.id, containerOf(document, owners, element));
  }
  return result;
}

/** Number of frames an element lies in. */
export function depthOf(
  containerById: ReadonlyMap<string, string | null>,
  elementId: string,
): number {
  let depth = 0;
  let current = containerById.get(elementId) ?? null;
  const seen = new Set<string>([elementId]);
  while (current !== null && !seen.has(current)) {
    seen.add(current);
    depth += 1;
    current = containerById.get(current) ?? null;
  }
  return depth;
}

export function elementBox(
  document: StrategyDocument,
  element: ElementDocument,
  index: TypeIndex,
  label: OutputLabel,
): Rect {
  const type = index.byId.get(element.type);
  const outputs = elementOutputs(document, element, type, label);
  return { x: element.x, y: element.y, width: NODE_WIDTH, height: nodeHeight(outputs.length) };
}

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** The frame that fits around the members of a management (or stands below its element if there are none). */
function fitFrame(members: readonly Rect[], ownerBox: Rect): Rect {
  const [first, ...rest] = members;
  if (first === undefined) {
    return {
      x: ownerBox.x,
      y: ownerBox.y + ownerBox.height + FRAME_GAP,
      width: FRAME_MIN_WIDTH,
      height: FRAME_MIN_HEIGHT,
    };
  }
  const box = rest.reduce(union, first);
  return {
    x: box.x - FRAME_PADDING,
    y: box.y - FRAME_PADDING - FRAME_HEADER_HEIGHT,
    width: Math.max(FRAME_MIN_WIDTH, box.width + 2 * FRAME_PADDING),
    height: Math.max(FRAME_MIN_HEIGHT, box.height + 2 * FRAME_PADDING + FRAME_HEADER_HEIGHT),
  };
}

/**
 * Brings the stored frames in line with the document: every owner has a frame
 * (a new one fits around its members, or stands below the element if it has no
 * members) and a frame that no longer has an owner is dropped. With `grow` a
 * frame also grows until it contains its members and the frames inside it; that
 * is done when an element has been dropped into a frame or put there, never
 * while an element is being dragged (it could then never leave the frame). A
 * frame never shrinks and never moves by itself.
 */
export function syncFrames(
  document: StrategyDocument,
  index: TypeIndex,
  stored: FrameRects,
  label: OutputLabel,
  grow = false,
): FrameRects {
  const owners = ownerIds(document, index);
  const containerById = containers(document, owners);
  const boxes = new Map(document.elements.map((element) => [element.id, elementBox(document, element, index, label)]));
  // Inner frames first, so that an outer frame can grow around them.
  const ordered = Array.from(owners).sort(
    (a, b) => depthOf(containerById, b) - depthOf(containerById, a),
  );
  const result: FrameRects = {};
  for (const ownerId of ordered) {
    const members: Rect[] = [];
    for (const element of document.elements) {
      if (containerById.get(element.id) === ownerId) {
        const box = boxes.get(element.id);
        if (box !== undefined) {
          members.push(box);
        }
        const inner = getOwn(result, element.id);
        if (inner !== undefined) {
          members.push(inner);
        }
      }
    }
    const ownerBox = boxes.get(ownerId) ?? { x: 0, y: 0, width: NODE_WIDTH, height: NODE_MIN_HEIGHT };
    let rect = getOwn(stored, ownerId) ?? fitFrame(members, ownerBox);
    for (const member of grow ? members : []) {
      if (!contains(rect, member)) {
        rect = union(rect, {
          x: member.x - FRAME_PADDING,
          y: member.y - FRAME_PADDING,
          width: member.width + 2 * FRAME_PADDING,
          height: member.height + 2 * FRAME_PADDING,
        });
      }
    }
    setOwn(result, ownerId, rect);
  }
  return result;
}

/**
 * The innermost frame that contains the point, or `null`. Frames of the owners
 * in `exclude` and frames in `hidden` are not considered.
 */
export function frameAt(
  rects: FrameRects,
  point: Point,
  exclude: ReadonlySet<string> = new Set(),
  hidden: ReadonlySet<string> = new Set(),
): string | null {
  let best: string | null = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const [ownerId, rect] of Object.entries(rects)) {
    if (exclude.has(ownerId) || hidden.has(ownerId)) {
      continue;
    }
    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    ) {
      const area = rect.width * rect.height;
      if (area < bestArea) {
        best = ownerId;
        bestArea = area;
      }
    }
  }
  return best;
}

/** The owner itself and every owner inside its management, for any depth. */
export function ownersInside(
  containerById: ReadonlyMap<string, string | null>,
  owners: ReadonlySet<string>,
  ownerId: string,
): Set<string> {
  const result = new Set<string>([ownerId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const candidate of owners) {
      const container = containerById.get(candidate) ?? null;
      if (!result.has(candidate) && container !== null && result.has(container)) {
        result.add(candidate);
        grew = true;
      }
    }
  }
  return result;
}

/** Elements and frames that a collapsed frame hides, for any depth. Frames are named by their node identifier. */
export function hiddenByCollapse(
  document: StrategyDocument,
  owners: ReadonlySet<string>,
  collapsed: ReadonlySet<string>,
): { elements: Set<string>; owners: Set<string> } {
  const containerById = containers(document, owners);
  const hiddenOwners = new Set<string>();
  for (const ownerId of owners) {
    // An owner is hidden if any frame above it is collapsed.
    let current = containerById.get(ownerId) ?? null;
    const seen = new Set<string>([ownerId]);
    while (current !== null && !seen.has(current)) {
      if (collapsed.has(current)) {
        hiddenOwners.add(ownerId);
        break;
      }
      seen.add(current);
      current = containerById.get(current) ?? null;
    }
  }
  const hiddenElements = new Set<string>();
  for (const element of document.elements) {
    let current = containerById.get(element.id) ?? null;
    const seen = new Set<string>([element.id]);
    while (current !== null && !seen.has(current)) {
      if (collapsed.has(current)) {
        hiddenElements.add(element.id);
        break;
      }
      seen.add(current);
      current = containerById.get(current) ?? null;
    }
  }
  return { elements: hiddenElements, owners: hiddenOwners };
}
