import type { Edge, Node } from '@xyflow/react';
import type { TFunction } from 'i18next';

import {
  CARD_HEAD,
  CARD_W,
  LANE_GAP,
  ROW_H,
  pathThrough,
  wirePath,
  type Box,
  type Dir,
  type Pt,
  type Scene,
} from '../arrange/scene';
import type { StrategyDocument } from '../document/types';
import type { IndexedFindings } from '../findings/findingsModel';
import type { SupportedLanguage } from '../i18n';
import { cardSubtitle, stepSummary, type DescribeContext } from '../model/describe';
import { elementName, isCardElement, outputsOf, propertyRows } from '../model/elements';
import { iconOf, kindClassOf, labelText, type KindClass, type TypeIndex } from '../model/typeIndex';
import type { Selection, WireMode } from '../state/studioState';

/**
 * The drawing area as React Flow shows it (specification E8, 5.3). The arrangement computes the places; React Flow
 * shows them and takes dragging, connecting, zoom and fitting. The nodes and edges are views of the document, never
 * its state (rules for React Flow in the development rules).
 */

export const WIRE_COLORS = ['#2f6fb0', '#c2410c', '#15803d', '#a21caf', '#0e7490', '#b45309', '#be123c', '#4d7c0f'] as const;

export type Level = 'error' | 'hint' | null;

export type StepOutput = { id: string; label: string; management: boolean; used: boolean; explanation: string };

export type StepData = {
  element: string;
  name: string;
  typeName: string;
  icon: string;
  cls: KindClass;
  summary: string;
  trigger: boolean;
  unknown: boolean;
  level: Level;
  selected: boolean;
  /** The output of this step that was clicked, if any. */
  armed: string | null;
  /** Another step is waiting for a successor: this step can be clicked to become it. */
  armable: boolean;
  outputs: StepOutput[];
  wireCount: number;
  dir: Dir;
  width: number;
  height: number;
};

export type CardRow = { id: string; label: string; datatype: string; explanation: string; used: boolean; y: number };

export type CardData = {
  element: string;
  name: string;
  typeName: string;
  subtitle: string;
  icon: string;
  cls: KindClass;
  level: Level;
  selected: boolean;
  rows: CardRow[];
  /** All properties of the object, shown and hidden. */
  total: number;
  open: boolean;
  wireCount: number;
  color: string;
  dir: Dir;
  width: number;
  height: number;
};

export type FrameData = {
  owner: string;
  title: string;
  collapsed: boolean;
  empty: boolean;
  selected: boolean;
  count: number;
  dir: Dir;
};

export type BandData = { section: string; name: string; selected: boolean };

export type SectionNodeData = { section: string; name: string; count: number; level: Level; selected: boolean; dir: Dir };

export type FlowEdgeData = {
  kind: 'flow' | 'management';
  path: string;
  connection: string | null;
  selected: boolean;
  midpoint: Pt;
  deletable: boolean;
};

export type WireEdgeData = {
  path: string;
  color: string;
  solid: boolean;
  related: boolean;
  dimmed: boolean;
  count: number;
  midpoint: Pt;
  stubs: Pt[][];
  end: Pt;
  label: string;
};

export type StudioNode = Node<
  StepData | CardData | FrameData | BandData | SectionNodeData | { empty?: boolean },
  'step' | 'card' | 'frame' | 'band' | 'section' | 'lane'
>;

export type StudioEdge = Edge<FlowEdgeData | WireEdgeData, 'flow' | 'wire'>;

export type FlowInput = {
  document: StrategyDocument;
  types: TypeIndex;
  scene: Scene;
  dir: Dir;
  language: SupportedLanguage;
  t: TFunction;
  describe: DescribeContext;
  findings: IndexedFindings;
  selection: Selection;
  armed: { from: string; output: string } | null;
  wires: WireMode;
  selectedEdge: string | null;
  openCards: ReadonlySet<string>;
};

/** Where the note "objects belong here" stands while the drawing area has no object. */
export function emptyLanePlace(dir: Dir): Box {
  return dir === 'v' ? { x: -(CARD_W + LANE_GAP) - 14, y: -44, w: 262, h: 112 } : { x: -14, y: -170, w: 262, h: 112 };
}

function levelOf(findings: IndexedFindings, id: string): Level {
  return findings.levelOfElement(id);
}

function worst(levels: Level[]): Level {
  return levels.includes('error') ? 'error' : levels.includes('hint') ? 'hint' : null;
}

/** The nodes and edges React Flow shows for a document and its arrangement. */
export function buildFlow(input: FlowInput): { nodes: StudioNode[]; edges: StudioEdge[] } {
  const { document, types, scene, dir, language, t, describe, findings, selection, armed, wires, selectedEdge } = input;
  const nodes: StudioNode[] = [];
  const edges: StudioEdge[] = [];
  const selectedElement = selection.kind === 'element' ? selection.id : null;
  const rep = (id: string): string => scene.rep.get(id) ?? id;
  const wireCountTo = new Map<string, number>();
  for (const wire of scene.wires) {
    const target = rep(wire.dst);
    wireCountTo.set(target, (wireCountTo.get(target) ?? 0) + 1);
  }
  const cardIndex = new Map([...scene.cards.keys()].map((id, index) => [id, index]));

  // --- lane, frames, bands: the background ---
  if (scene.lane !== null) {
    nodes.push({
      id: 'lane',
      type: 'lane',
      position: { x: scene.lane.x, y: scene.lane.y },
      data: {},
      width: scene.lane.w,
      height: scene.lane.h,
      measured: { width: scene.lane.w, height: scene.lane.h },
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
      zIndex: 0,
      className: 'rf-passive',
    });
  } else if (document.elements.length > 0) {
    // no object yet: the area says what belongs there
    const place = emptyLanePlace(dir);
    nodes.push({
      id: 'lane',
      type: 'lane',
      position: { x: place.x, y: place.y },
      data: { empty: true },
      width: place.w,
      height: place.h,
      measured: { width: place.w, height: place.h },
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
      zIndex: 0,
      className: 'rf-passive',
    });
  }
  for (const frame of scene.frames) {
    const owner = document.elements.find((candidate) => candidate.id === frame.owner);
    if (owner === undefined) {
      continue;
    }
    const data: FrameData = {
      owner: frame.owner,
      title: elementName(owner, types, language),
      collapsed: frame.collapsed,
      empty: frame.empty,
      selected: selection.kind === 'frame' && selection.id === frame.owner,
      count: document.elements.filter((candidate) => candidate.management_of === frame.owner).length,
      dir,
    };
    nodes.push({
      id: `frame:${frame.owner}`,
      type: 'frame',
      position: { x: frame.x, y: frame.y },
      data,
      width: frame.w,
      height: frame.h,
      measured: { width: frame.w, height: frame.h },
      draggable: false,
      selectable: true,
      focusable: false,
      connectable: false,
      zIndex: 0,
    });
  }
  for (const band of scene.bands) {
    const section = document.sections.find((candidate) => candidate.id === band.id);
    if (section === undefined) {
      continue;
    }
    nodes.push({
      id: `band:${band.id}`,
      type: 'band',
      position: { x: band.x, y: band.y },
      data: { section: band.id, name: section.name, selected: selection.kind === 'section' && selection.id === band.id },
      width: band.w,
      height: band.h,
      measured: { width: band.w, height: band.h },
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
      zIndex: 1,
      className: 'rf-passive',
    });
  }

  // --- collapsed sections ---
  for (const [id, box] of scene.secNodes) {
    const section = document.sections.find((candidate) => `sec:${candidate.id}` === id);
    if (section === undefined) {
      continue;
    }
    nodes.push({
      id,
      type: 'section',
      position: { x: box.x, y: box.y },
      data: {
        section: section.id,
        name: section.name,
        count: section.elements.length,
        level: worst(section.elements.map((element) => levelOf(findings, element))),
        selected: selection.kind === 'section' && selection.id === section.id,
        dir,
      },
      width: box.w,
      height: box.h,
      measured: { width: box.w, height: box.h },
      draggable: false,
      selectable: true,
      focusable: true,
      zIndex: 3,
    });
  }

  // --- steps and cards ---
  const usedOutputs = new Set(document.connections.map((connection) => `${connection.source}|${connection.output}`));
  document.elements.forEach((element) => {
    const type = types.byId.get(element.type);
    const box = scene.nodes.get(element.id);
    if (box !== undefined) {
      const trigger = type?.kind === 'trigger';
      const outputs = outputsOf(element, type, document, language).map((output) => ({
        id: output.id,
        label: output.label,
        explanation: output.explanation,
        management: output.management,
        used: output.management || usedOutputs.has(`${element.id}|${output.id}`),
      }));
      const data: StepData = {
        element: element.id,
        name: elementName(element, types, language),
        typeName: type === undefined ? element.type : labelText(type.name, language),
        icon: iconOf(type),
        cls: kindClassOf(type),
        summary: stepSummary(element, type, describe),
        trigger,
        unknown: type === undefined,
        level: levelOf(findings, element.id),
        selected: selectedElement === element.id,
        armed: armed !== null && armed.from === element.id ? armed.output : null,
        armable: armed !== null && armed.from !== element.id && type !== undefined && !trigger,
        outputs,
        wireCount: wireCountTo.get(element.id) ?? 0,
        dir,
        width: box.w,
        height: box.h,
      };
      nodes.push({
        id: element.id,
        type: 'step',
        position: { x: box.x, y: box.y },
        data,
        width: box.w,
        height: box.h,
        measured: { width: box.w, height: box.h },
        draggable: true,
        selectable: true,
        focusable: true,
        zIndex: 3,
        ariaLabel: `${data.typeName}: ${data.name}`,
      });
      return;
    }
    const geo = scene.cards.get(element.id);
    if (geo !== undefined && isCardElement(element, types)) {
      const properties = propertyRows(type, element.instance, language);
      const used = new Set(scene.usage.filter((usage) => usage.src === element.id).map((usage) => usage.prop));
      const rows: CardRow[] = geo.rows.flatMap((id) => {
        const property = properties.find((candidate) => candidate.id === id);
        const y = geo.rowY.get(id);
        if (property === undefined || y === undefined) {
          return [];
        }
        return [
          {
            id,
            label: property.label,
            datatype: t(`datatype.${property.datatype}`),
            explanation: property.explanation,
            used: used.has(id),
            y: y - geo.y,
          },
        ];
      });
      const data: CardData = {
        element: element.id,
        name: elementName(element, types, language),
        typeName: type === undefined ? element.type : labelText(type.name, language),
        subtitle: cardSubtitle(element, type, describe),
        icon: iconOf(type),
        cls: kindClassOf(type),
        level: levelOf(findings, element.id),
        selected: selectedElement === element.id,
        rows,
        total: properties.length,
        open: input.openCards.has(element.id),
        wireCount: wireCountTo.get(element.id) ?? 0,
        color: WIRE_COLORS[(cardIndex.get(element.id) ?? 0) % WIRE_COLORS.length] ?? WIRE_COLORS[0],
        dir,
        width: geo.w,
        height: geo.h,
      };
      nodes.push({
        id: element.id,
        type: 'card',
        position: { x: geo.x, y: geo.y },
        data,
        width: geo.w,
        height: geo.h,
        measured: { width: geo.w, height: geo.h },
        draggable: true,
        selectable: true,
        focusable: true,
        zIndex: 3,
        ariaLabel: `${data.typeName}: ${data.name}`,
      });
    }
  });

  // --- the lines of the flow ---
  for (const edge of scene.edges) {
    if (edge.hidden) {
      continue;
    }
    const source = rep(edge.from);
    const target = edge.to.startsWith('frame:') ? edge.to : rep(edge.to);
    if (source === target) {
      continue;
    }
    const middle = edge.pts[Math.floor(edge.pts.length / 2) - (edge.pts.length % 2 === 0 ? 1 : 0)];
    const next = edge.pts[Math.floor(edge.pts.length / 2)];
    const midpoint: Pt = middle !== undefined && next !== undefined ? { x: (middle.x + next.x) / 2, y: (middle.y + next.y) / 2 } : { x: 0, y: 0 };
    const sourceIsSection = source.startsWith('sec:');
    const id = edge.connection !== null ? `e:${edge.connection}` : `m:${edge.from}`;
    const related = selectedElement !== null && (edge.from === selectedElement || edge.to === selectedElement);
    edges.push({
      id,
      type: 'flow',
      source,
      target,
      sourceHandle: sourceIsSection ? 'out' : edge.out,
      targetHandle: 'in',
      zIndex: 2,
      selectable: edge.connection !== null,
      focusable: false,
      data: {
        kind: edge.mgmt ? 'management' : 'flow',
        path: pathThrough(edge.pts, dir),
        connection: edge.connection,
        selected: selectedEdge === id || related,
        midpoint,
        deletable: edge.connection !== null && selectedEdge === id,
      },
    });
  }

  // --- the lines of the values ---
  if (wires !== 'off') {
    for (const wire of scene.wires) {
      const related = selectedElement !== null && (wire.src === selectedElement || wire.dst === selectedElement);
      if (wires === 'selection' && !related) {
        continue;
      }
      const target = rep(wire.dst);
      const firstProp = wire.props[0];
      if (firstProp === undefined) {
        continue;
      }
      const source = document.elements.find((candidate) => candidate.id === wire.src);
      const targetElement = document.elements.find((candidate) => candidate.id === wire.dst);
      const sourceType = source === undefined ? undefined : types.byId.get(source.type);
      const labels = wire.props.map((prop) => {
        const row = source === undefined ? undefined : propertyRows(sourceType, source.instance, language).find((candidate) => candidate.id === prop);
        return row === undefined ? prop : row.label;
      });
      const a = wire.pts[0];
      const b = wire.pts[1];
      if (a === undefined || b === undefined) {
        continue;
      }
      edges.push({
        id: `w:${wire.key}`,
        type: 'wire',
        source: wire.src,
        target,
        sourceHandle: `prop:${firstProp}`,
        targetHandle: 'data',
        zIndex: 2,
        selectable: false,
        focusable: false,
        data: {
          path: wirePath(wire, dir),
          color: WIRE_COLORS[(cardIndex.get(wire.src) ?? 0) % WIRE_COLORS.length] ?? WIRE_COLORS[0],
          solid: wire.solid,
          related,
          dimmed: selectedElement !== null && !related,
          count: wire.props.length,
          midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          stubs: wire.stubs,
          end: b,
          label: `${source === undefined ? '' : elementName(source, types, language)} → ${
            targetElement === undefined ? '' : elementName(targetElement, types, language)
          }: ${labels.join(', ')}${wire.solid ? '' : ` (${t('canvas.wireOnlyExpression')})`}`,
        },
      });
    }
  }
  return { nodes, edges };
}

/** The box of a card or step at a place, for tests and for the drop. */
export function boxContains(box: Box, point: Pt): boolean {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}

/** The step under a point of the drawing area, or `undefined`. */
export function stepAt(scene: Scene, point: Pt): string | undefined {
  for (const [id, box] of scene.nodes) {
    if (boxContains(box, point)) {
      return id;
    }
  }
  return undefined;
}

export { CARD_HEAD, ROW_H };
