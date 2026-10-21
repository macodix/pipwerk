import { describe, expect, it } from 'vitest';

import { buildSceneInput } from '../arrange/input';
import { buildScene } from '../arrange/scene';
import { newStrategy } from '../document/build';
import { addElement, createSection, setSectionCollapsed } from '../document/ops';
import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import { indexFindings } from '../findings/findingsModel';
import { createI18n } from '../i18n';
import { answerOf } from '../testing/answers';
import { EMA_ELEMENT_IDS, emaTrendfolge } from '../testing/emaTrendfolge';
import { inventedStrategy, inventedTypes, stepElement } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import type { TypeIndex } from '../model/typeIndex';
import type { Selection, WireMode } from '../state/studioState';
import { buildFlow, type CardData, type StepData, type WireEdgeData } from './flowModel';

const i18n = createI18n('de');

function flowOf(
  document: StrategyDocument,
  types: TypeIndex,
  options: { wires?: WireMode; selection?: Selection; references?: Map<string, { instance: string; property: string }[]>; sentence?: string } = {},
) {
  const scene = buildScene(buildSceneInput(document, types, 'de', new Set(), options.references ?? new Map()), 'v');
  return buildFlow({
    document,
    types,
    scene,
    dir: 'v',
    language: 'de',
    t: i18n.t,
    describe: {
      document,
      types,
      language: 'de',
      t: i18n.t,
      answers: () => (options.sentence === undefined ? undefined : answerOf({ sentence: options.sentence })),
    },
    findings: indexFindings(null),
    selection: options.selection ?? { kind: 'strategy' },
    armed: null,
    wires: options.wires ?? 'all',
    selectedEdge: null,
    openCards: new Set(),
  });
}

describe('the drawing area as React Flow shows it (specification E8)', () => {
  const document = parseStrategyDocument(emaTrendfolge());
  const types = testTypes();

  it('has a node for every element, a frame for the management, a lane for the objects, a line for every connection', () => {
    const { nodes, edges } = flowOf(document, types);

    expect(nodes.filter((node) => node.type === 'step')).toHaveLength(12);
    expect(nodes.filter((node) => node.type === 'card')).toHaveLength(3);
    expect(nodes.filter((node) => node.type === 'frame')).toHaveLength(1);
    expect(nodes.filter((node) => node.type === 'lane')).toHaveLength(1);
    expect(edges.filter((edge) => edge.type === 'flow' && !edge.id.startsWith('m:'))).toHaveLength(10);
    expect(edges.filter((edge) => edge.id.startsWith('m:'))).toHaveLength(1);
  });

  it('gives every node the size of its place, so that React Flow does not have to measure it', () => {
    const { nodes } = flowOf(document, types);

    for (const node of nodes) {
      expect(node.width, node.id).toBeGreaterThan(0);
      expect(node.height, node.id).toBeGreaterThan(0);
      expect(node.measured).toEqual({ width: node.width, height: node.height });
    }
  });

  it('connects the lines of the flow at the outputs of the steps by the identifiers of the outputs', () => {
    const { edges } = flowOf(document, types);

    const edge = edges.find((candidate) => candidate.target === EMA_ELEMENT_IDS.direction && candidate.id.startsWith('e:'));
    expect(edge).toMatchObject({ source: EMA_ELEMENT_IDS.cross, sourceHandle: 'wahr', targetHandle: 'in' });
    const management = edges.find((candidate) => candidate.id.startsWith('m:'));
    expect(management).toMatchObject({ source: EMA_ELEMENT_IDS.order, sourceHandle: 'gestellt', target: `frame:${EMA_ELEMENT_IDS.order}` });
  });

  it('draws the lines of values from the rows of a card to the elements that use them: solid for an input, dotted for a name in an expression', () => {
    const withInput = {
      ...document,
      elements: document.elements.map((element) =>
        element.id === EMA_ELEMENT_IDS.direction ? { ...element, inputs: [{ instance: 'ema20', property: 'wert' }] } : element,
      ),
    };
    const references = new Map([[EMA_ELEMENT_IDS.cross, [{ instance: 'ema50', property: 'wert' }]]]);

    const { edges } = flowOf(withInput, types, { references });

    const wires = edges.filter((edge) => edge.type === 'wire');
    expect(wires).toHaveLength(2);
    const solid = wires.find((wire) => (wire.data as WireEdgeData).solid);
    const dotted = wires.find((wire) => !(wire.data as WireEdgeData).solid);
    expect(solid).toMatchObject({ source: EMA_ELEMENT_IDS.ema20, target: EMA_ELEMENT_IDS.direction, sourceHandle: 'prop:wert', targetHandle: 'data' });
    expect(dotted).toMatchObject({ source: EMA_ELEMENT_IDS.ema50, target: EMA_ELEMENT_IDS.cross });
  });

  it('shows no lines of values with "Aus" and only those of the selected element with "Auswahl"', () => {
    const references = new Map([
      [EMA_ELEMENT_IDS.cross, [{ instance: 'ema50', property: 'wert' }]],
      [EMA_ELEMENT_IDS.direction, [{ instance: 'ema20', property: 'wert' }]],
    ]);

    expect(flowOf(document, types, { references, wires: 'off' }).edges.filter((edge) => edge.type === 'wire')).toHaveLength(0);
    expect(flowOf(document, types, { references, wires: 'all' }).edges.filter((edge) => edge.type === 'wire')).toHaveLength(2);
    const selected = flowOf(document, types, { references, wires: 'selection', selection: { kind: 'element', id: EMA_ELEMENT_IDS.cross } });
    expect(selected.edges.filter((edge) => edge.type === 'wire')).toHaveLength(1);
  });

  it('marks the selected element and gives a condition the sentence of its expression', () => {
    const { nodes } = flowOf(document, types, { selection: { kind: 'element', id: EMA_ELEMENT_IDS.cross }, sentence: 'EMA20 kreuzt EMA50' });

    const node = nodes.find((candidate) => candidate.id === EMA_ELEMENT_IDS.cross);
    expect((node?.data as StepData).selected).toBe(true);
    expect((node?.data as StepData).summary).toBe('EMA20 kreuzt EMA50');
  });

  it('shows the type and the settings of an object on its card', () => {
    const { nodes } = flowOf(document, types);

    const card = nodes.find((candidate) => candidate.id === EMA_ELEMENT_IDS.ema20);
    expect((card?.data as CardData).subtitle).toBe('EMA · M15 · Periode 20');
    expect((card?.data as CardData).rows.map((row) => row.id)).toEqual(['wert']);
  });

  it('draws the elements of a folded section as one node and leaves the lines to it', () => {
    let changed = createSection(document, types, EMA_ELEMENT_IDS.trigger, 'Einstieg');
    const section = changed.sections[0];
    changed = {
      ...changed,
      sections: [{ ...(section as NonNullable<typeof section>), elements: [EMA_ELEMENT_IDS.trigger, EMA_ELEMENT_IDS.cross] }],
    };
    changed = setSectionCollapsed(changed, section?.id ?? '', true);

    const { nodes, edges } = flowOf(changed, types);

    expect(nodes.filter((node) => node.type === 'section')).toHaveLength(1);
    expect(nodes.some((node) => node.id === EMA_ELEMENT_IDS.trigger)).toBe(false);
    expect(nodes.some((node) => node.id === EMA_ELEMENT_IDS.cross)).toBe(false);
    const out = edges.find((edge) => edge.source === `sec:${section?.id}`);
    expect(out).toMatchObject({ sourceHandle: 'out', target: EMA_ELEMENT_IDS.direction });
    // the line between the two steps of the section is not drawn
    expect(edges.some((edge) => edge.source === edge.target)).toBe(false);
  });
});

describe('an element of an unknown type (specification 3.7)', () => {
  it('is a step with the identifier of its type, one input and the outputs that have a stored connection', () => {
    const types = inventedTypes();
    let document = newStrategy('S');
    const unknown = stepElement('niemand.kennt', 'Fremd');
    const target = stepElement('zz.do', 'Tun');
    document = addElement(addElement(document, types, unknown, null), types, target, null);
    document = { ...document, connections: [{ id: 'c1', source: unknown.id, output: 'ergebnis_a', target: target.id }] };

    const { nodes, edges } = flowOf(document, types);

    const node = nodes.find((candidate) => candidate.id === unknown.id);
    const data = node?.data as StepData;
    expect(data.unknown).toBe(true);
    expect(data.typeName).toBe('niemand.kennt');
    expect(data.trigger).toBe(false);
    expect(data.outputs.map((output) => output.id)).toEqual(['ergebnis_a']);
    expect(edges[0]).toMatchObject({ source: unknown.id, sourceHandle: 'ergebnis_a', target: target.id });
  });
});

describe('the flow of a strategy built from invented types', () => {
  it('shows a frame for the element that holds a management and knows no type by name', () => {
    const types = inventedTypes();
    const document = inventedStrategy();

    const { nodes } = flowOf(document, types);

    expect(nodes.filter((node) => node.type === 'frame')).toHaveLength(1);
    expect(nodes.filter((node) => node.type === 'card')).toHaveLength(1);
  });
});
