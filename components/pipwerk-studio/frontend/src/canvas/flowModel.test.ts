import { describe, expect, it } from 'vitest';

import { buildSceneInput } from '../arrange/input';
import { buildScene } from '../arrange/scene';
import { newStrategy } from '../document/build';
import { addElement, addInput, createSection, setFirstUse, setSectionCollapsed } from '../document/ops';
import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import { indexFindings } from '../findings/findingsModel';
import { createI18n } from '../i18n';
import { answerOf } from '../testing/answers';
import { EMA_ELEMENT_IDS, emaTrendfolge } from '../testing/emaTrendfolge';
import { inventedStrategy, inventedTypes, inventedTypesWithMethod, stepElement } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { emaReferences, instanceUsage, reportOf, usesOf } from '../testing/uses';
import type { ExpressionReference } from '../model/elements';
import { buildUsageModel, type UsageModel } from '../model/uses';
import type { TypeIndex } from '../model/typeIndex';
import type { Selection, WireMode } from '../state/studioState';
import { buildFlow, lineShown, memberText, REFRESH_SIGN, type CardData, type StepData, type WireEdgeData } from './flowModel';

const i18n = createI18n('de');

function flowOf(
  document: StrategyDocument,
  types: TypeIndex,
  options: {
    wires?: WireMode;
    selection?: Selection;
    references?: Map<string, ExpressionReference[]>;
    uses?: UsageModel;
    connecting?: string | null;
    sentence?: string;
    dir?: 'v' | 'h';
  } = {},
) {
  const uses = options.uses ?? usesOf(document, types, options.references ?? emaReferences());
  const dir = options.dir ?? 'v';
  const scene = buildScene(buildSceneInput(document, types, 'de', new Set(), uses), dir);
  return buildFlow({
    document,
    types,
    scene,
    uses,
    dir,
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
    wires: options.wires ?? 'selection',
    connecting: options.connecting ?? null,
    selectedEdge: null,
    openCards: new Set(),
  });
}

const wiresOf = (edges: ReturnType<typeof flowOf>['edges']) => edges.filter((edge) => edge.type === 'wire');

describe('the drawing area as React Flow shows it (specification E8)', () => {
  const document = parseStrategyDocument(emaTrendfolge());
  const types = testTypes();

  it('has a node for every element and a frame for the management, no area for objects, a line for every connection', () => {
    const { nodes, edges } = flowOf(document, types);

    expect(nodes.filter((node) => node.type === 'step')).toHaveLength(12);
    expect(nodes.filter((node) => node.type === 'card')).toHaveLength(3);
    expect(nodes.filter((node) => node.type === 'frame')).toHaveLength(1);
    expect(nodes.map((node) => node.type)).not.toContain('lane');
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
    // the lines of the objects of the section end at its box
    expect(wiresOf(edges).some((edge) => edge.target === `sec:${section?.id}`)).toBe(true);
  });
});

describe('the lines of values (specification 5.3)', () => {
  const document = parseStrategyDocument(emaTrendfolge());
  const types = testTypes();

  it('always shows the line to the element of the first use, solid and in the colour of the object', () => {
    for (const mode of ['all', 'selection', 'off'] as const) {
      const wires = wiresOf(flowOf(document, types, { wires: mode }).edges).filter((edge) => (edge.data as WireEdgeData).first);

      expect(wires.map((edge) => `${edge.source}>${edge.target}`).sort(), mode).toEqual(
        [
          `${EMA_ELEMENT_IDS.ema20}>${EMA_ELEMENT_IDS.cross}`,
          `${EMA_ELEMENT_IDS.ema50}>${EMA_ELEMENT_IDS.cross}`,
          `${EMA_ELEMENT_IDS.atr14}>${EMA_ELEMENT_IDS.stop}`,
        ].sort(),
      );
    }
    const colors = wiresOf(flowOf(document, types).edges).map((edge) => (edge.data as WireEdgeData).color);
    expect(new Set(colors).size).toBe(3);
  });

  it('shows the lines of the further uses with "Alle", those of the selection with "Auswahl", and none with "Aus"', () => {
    const more = (options: Parameters<typeof flowOf>[2]) =>
      wiresOf(flowOf(document, types, options).edges).filter((edge) => !(edge.data as WireEdgeData).first);

    expect(more({ wires: 'all' })).toHaveLength(5);
    expect(more({ wires: 'off' })).toHaveLength(0);
    expect(more({ wires: 'selection' })).toHaveLength(0);
    // the selected element: the further uses of EMA20 and EMA50 at "Richtung" and at the condition of the management
    const direction = more({ wires: 'selection', selection: { kind: 'element', id: EMA_ELEMENT_IDS.direction } });
    expect(direction.map((edge) => edge.source).sort()).toEqual([EMA_ELEMENT_IDS.ema20, EMA_ELEMENT_IDS.ema50].sort());
    expect(direction.every((edge) => edge.target === EMA_ELEMENT_IDS.direction)).toBe(true);
    // the selected object: all its further uses
    const object = more({ wires: 'selection', selection: { kind: 'element', id: EMA_ELEMENT_IDS.atr14 } });
    expect(object.map((edge) => edge.target)).toEqual([EMA_ELEMENT_IDS.newStop]);
  });

  it('decides what is shown by the switch alone', () => {
    const further = { first: false, src: 'card', dst: 'step' };
    const first = { first: true, src: 'card', dst: 'step' };

    expect(lineShown(first, 'off', null)).toBe(true);
    expect(lineShown(further, 'off', 'step')).toBe(false);
    expect(lineShown(further, 'all', null)).toBe(true);
    expect(lineShown(further, 'selection', null)).toBe(false);
    expect(lineShown(further, 'selection', 'step')).toBe(true);
    expect(lineShown(further, 'selection', 'card')).toBe(true);
    expect(lineShown(further, 'selection', 'other')).toBe(false);
  });

  it('is one line per object and element, whose label names all its values', () => {
    const withTwo = new Map<string, ExpressionReference[]>([
      [EMA_ELEMENT_IDS.cross, [{ instance: 'ema20', property: 'wert' }, { instance: 'ema20', property: 'periode' }]],
    ]);

    const wires = wiresOf(flowOf(document, types, { references: withTwo }).edges).filter((edge) => edge.source === EMA_ELEMENT_IDS.ema20);

    expect(wires).toHaveLength(1);
    expect((wires[0]?.data as WireEdgeData).label).toBe('Wert, periode');
  });

  it('names a method with its arguments and marks "Aktualisieren" with its own sign', () => {
    const methodTypes = inventedTypesWithMethod();
    const gauge = stepElement('zz.gauge', '', {
      name: null,
      instance: {
        name: 'Pegel',
        key: 'pegel',
        object_type: 'zz.gauge',
        origin: { object_type: 'zz.gauge', template_id: null },
        parameter_values: { takt: { kind: 'fixed', value: 'fast' } },
      },
    });
    const doIt = stepElement('zz.do', 'Tun', {
      inputs: [
        { instance: 'pegel', property: 'stand', kind: 'property', arguments: [], refresh: true },
        { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5], refresh: false },
      ],
    });
    let strategy = newStrategy('S');
    strategy = addElement(addElement(strategy, methodTypes, gauge, null), methodTypes, doIt, null);

    const { edges, nodes } = flowOf(strategy, methodTypes, { references: new Map() });

    const wire = wiresOf(edges)[0];
    expect((wire?.data as WireEdgeData).label).toBe(`Stand ${REFRESH_SIGN}, Mittel(3; 0,5)`);
    expect((wire?.data as WireEdgeData).refresh).toBe(true);
    const card = nodes.find((node) => node.id === gauge.id)?.data as CardData;
    expect(card.rows.map((row) => `${row.id}:${row.datatype}`)).toEqual(['stand:Zahl', 'mittel:Methode']);
    expect(card.rows.every((row) => row.used)).toBe(true);
  });

  it('writes numbers, truth values and texts as the user reads them', () => {
    const rows = new Map();
    const t = i18n.t;

    expect(memberText({ name: 'm', kind: 'method', arguments: [1.5, true, 'x'], refresh: false }, rows, 'de', t)).toBe('m(1,5; ja; "x")');
    expect(memberText({ name: 'm', kind: 'method', arguments: [1.5], refresh: false }, rows, 'en', createI18n('en').t)).toBe('m(1.5)');
    expect(memberText({ name: 'm', kind: 'property', arguments: [], refresh: true }, rows, 'de', t)).toBe(`m ${REFRESH_SIGN}`);
  });

  it('gives an element one connection point for values, shown only when a line ends there', () => {
    const { nodes } = flowOf(document, types, { wires: 'off' });

    const data = (id: string) => nodes.find((node) => node.id === id)?.data as StepData;
    expect(data(EMA_ELEMENT_IDS.cross).wireCount).toBe(2);
    expect(data(EMA_ELEMENT_IDS.stop).wireCount).toBe(1);
    // with "Aus" the further uses are hidden, so no line ends at the later elements
    expect(data(EMA_ELEMENT_IDS.direction).wireCount).toBe(0);
    expect(data(EMA_ELEMENT_IDS.newStop).wireCount).toBe(0);
    const all = flowOf(document, types, { wires: 'all' }).nodes;
    expect((all.find((node) => node.id === EMA_ELEMENT_IDS.direction)?.data as StepData).wireCount).toBe(2);
  });

  it('draws a line from card to card for an object that only another object uses', () => {
    const report = reportOf({
      instances: [
        instanceUsage({ instance: 'ema20', element: EMA_ELEMENT_IDS.ema20, firstUse: EMA_ELEMENT_IDS.cross, firstUseSource: 'flow' }),
        instanceUsage({ instance: 'ema50', element: EMA_ELEMENT_IDS.ema50, firstUse: EMA_ELEMENT_IDS.cross, firstUseSource: 'instance' }),
      ],
      elements: [
        {
          element: EMA_ELEMENT_IDS.cross,
          uses: [
            { instance: 'ema20', kind: 'expression', byInstance: null, members: [{ name: 'wert', kind: 'property', arguments: [], refresh: false }] },
            { instance: 'ema50', kind: 'data_link', byInstance: 'ema20', members: [{ name: 'wert', kind: 'property', arguments: [], refresh: false }] },
          ],
        },
      ],
    });
    const uses = buildUsageModel(document, types, report, new Map());

    const wires = wiresOf(flowOf(document, types, { uses }).edges);

    const link = wires.find((edge) => edge.source === EMA_ELEMENT_IDS.ema50);
    expect(link).toMatchObject({ target: EMA_ELEMENT_IDS.ema20, targetHandle: 'data', sourceHandle: 'prop:wert' });
    expect((link?.data as WireEdgeData).first).toBe(true);
  });

  it('writes an object with no use as not connected and gives it no line', () => {
    const { nodes, edges } = flowOf(document, types, { references: new Map() });

    expect(wiresOf(edges)).toHaveLength(0);
    for (const node of nodes.filter((candidate) => candidate.type === 'card')) {
      expect((node.data as CardData).unconnected).toBe(true);
    }
  });

  it('marks the elements that take a value and those that do not while a value is being connected', () => {
    const report = reportOf({
      instances: [
        instanceUsage({
          instance: 'ema20',
          element: EMA_ELEMENT_IDS.ema20,
          firstUse: EMA_ELEMENT_IDS.cross,
          firstUseSource: 'flow',
          usableEverywhere: false,
          usableAt: [EMA_ELEMENT_IDS.cross, EMA_ELEMENT_IDS.direction],
        }),
      ],
    });
    const uses = buildUsageModel(document, types, report, emaReferences());

    const { nodes } = flowOf(document, types, { uses, connecting: EMA_ELEMENT_IDS.ema20 });

    const accepts = (id: string) => (nodes.find((node) => node.id === id)?.data as StepData).accepts;
    expect(accepts(EMA_ELEMENT_IDS.cross)).toBe(true);
    expect(accepts(EMA_ELEMENT_IDS.direction)).toBe(true);
    expect(accepts(EMA_ELEMENT_IDS.stop)).toBe(false);
    expect(accepts(EMA_ELEMENT_IDS.executed)).toBe(false);
    const idle = flowOf(document, types, { uses }).nodes.find((node) => node.id === EMA_ELEMENT_IDS.stop)?.data as StepData;
    expect(idle.accepts).toBeNull();
  });

  it('takes the element of the first use from the document when the user connected the object first', () => {
    let changed = addInput(document, EMA_ELEMENT_IDS.executed, { instance: 'atr14', property: 'wert' });
    changed = setFirstUse(changed, EMA_ELEMENT_IDS.atr14, EMA_ELEMENT_IDS.executed);

    const wires = wiresOf(flowOf(changed, types, { wires: 'off', references: new Map() }).edges);

    expect(wires.map((edge) => `${edge.source}>${edge.target}`)).toEqual([`${EMA_ELEMENT_IDS.atr14}>${EMA_ELEMENT_IDS.executed}`]);
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
