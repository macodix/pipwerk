import { applyNodeChanges } from '@xyflow/react';
import { describe, expect, it } from 'vitest';

import type { ElementDocument, StrategyDocument } from '../document/types';
import { loadTestcase, realTypes } from '../testing/fixtures';
import { inventedTypes } from '../testing/inventedTypes';
import {
  absolutePosition,
  documentToFlow,
  flowToDocument,
  flowToFrames,
  isElementNode,
  isFrameNode,
  MANAGEMENT_HANDLE,
  type FlowContext,
  type FlowModel,
} from './flowModel';
import { frameNodeId, syncFrames } from './layout';

function context(overrides: Partial<FlowContext> = {}): FlowContext {
  return {
    types: realTypes,
    language: 'de',
    frames: {},
    collapsed: new Set(),
    selectedNodes: new Set(),
    selectedEdges: new Set(),
    severities: new Map(),
    ...overrides,
  };
}

function elementNode(flow: FlowModel, id: string) {
  const node = flow.nodes.find((candidate) => candidate.id === id);
  if (node === undefined || !isElementNode(node)) {
    throw new Error(`no element node ${id}`);
  }
  return node;
}

describe.each(['str-01', 'str-03'] as const)('document → drawing area → document with %s', (name) => {
  const document = loadTestcase(name);

  it('gives the same document back, without loss', () => {
    const flow = documentToFlow(document, context());

    const back = flowToDocument(document, flow);

    expect(back).toEqual(document);
    expect(back).toBe(document);
  });

  it('gives the same document back after changes without effect (measuring, selecting nothing)', () => {
    const flow = documentToFlow(document, context());
    const nodes = applyNodeChanges(
      flow.nodes.map((node) => ({
        type: 'dimensions' as const,
        id: node.id,
        dimensions: { width: 10, height: 10 },
      })),
      flow.nodes,
    );

    expect(flowToDocument(document, { ...flow, nodes })).toEqual(document);
  });

  it('shows every element as a node with its connections as edges', () => {
    const flow = documentToFlow(document, context());

    const elementNodes = flow.nodes.filter(isElementNode);
    expect(elementNodes.map((node) => node.id).sort()).toEqual(document.elements.map((element) => element.id).sort());
    const connectionEdges = flow.edges.filter((edge) => edge.data?.kind === 'connection');
    expect(connectionEdges).toHaveLength(document.connections.length);
    for (const edge of connectionEdges) {
      const source = elementNode(flow, edge.source);
      expect(source.data.outputs.map((output) => output.id)).toContain(edge.sourceHandle);
    }
  });

  it('shows the management as a frame, connected to the element that places the order', () => {
    const flow = documentToFlow(document, context());

    const frames = flow.nodes.filter(isFrameNode);
    expect(frames).toHaveLength(1);
    const frame = frames[0]!;
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    expect(frame.data.ownerId).toBe(owner.id);
    expect(frame.id).toBe(frameNodeId(owner.id));
    const frameEdge = flow.edges.find((edge) => edge.data?.kind === 'management');
    // The frame hangs at the output that the type description names, not at a connector of its own.
    expect(frameEdge).toMatchObject({ source: owner.id, target: frame.id, sourceHandle: 'gestellt' });
    const ownerNode = elementNode(flow, owner.id);
    expect(ownerNode.data.isOwner).toBe(true);
    expect(ownerNode.data.managementHandle).toBe('gestellt');
    expect(ownerNode.data.outputs.find((output) => output.id === 'gestellt')?.connectable).toBe(false);
    expect(ownerNode.data.outputs.filter((output) => output.connectable).map((output) => output.id)).toEqual(['nicht_gestellt']);
    // The elements of the management are inside the frame, the others are not.
    for (const element of document.elements) {
      const node = elementNode(flow, element.id);
      if (element.management_of === null) {
        expect(node.parentId).toBeUndefined();
      } else {
        expect(node.parentId).toBe(frame.id);
      }
    }
  });
});

describe('frames', () => {
  const document = loadTestcase('str-03');
  const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
  const members = document.elements.filter((element) => element.management_of === owner.id);

  it('contain their elements', () => {
    const rects = syncFrames(document, realTypes, {}, (_id, text) => text.de);
    const rect = rects[owner.id]!;

    for (const member of members) {
      expect(member.x).toBeGreaterThanOrEqual(rect.x);
      expect(member.y).toBeGreaterThanOrEqual(rect.y);
      expect(member.x + 200).toBeLessThanOrEqual(rect.x + rect.width);
    }
  });

  it('move their elements when the frame is moved (positions inside the frame are relative)', () => {
    const flow = documentToFlow(document, context());
    const frame = flow.nodes.find(isFrameNode)!;
    const nodes = applyNodeChanges(
      [{ type: 'position', id: frame.id, position: { x: frame.position.x + 100, y: frame.position.y - 30 } }],
      flow.nodes,
    );
    const moved = { ...flow, nodes };

    const result = flowToDocument(document, moved);

    for (const element of document.elements) {
      const after = result.elements.find((candidate) => candidate.id === element.id)!;
      if (element.management_of === owner.id) {
        expect(after.x).toBe(element.x + 100);
        expect(after.y).toBe(element.y - 30);
      } else {
        expect(after.x).toBe(element.x);
        expect(after.y).toBe(element.y);
      }
      expect(after.management_of).toBe(element.management_of);
    }
    expect(flowToFrames(moved, {})[owner.id]!.x).toBe(frame.data.anchor.abs.x + 100);
  });

  it('take over a new management when the node is put into the frame, and drop it when it is pulled out', () => {
    const flow = documentToFlow(document, context());
    const mainNode = elementNode(flow, document.elements.find((element) => element.management_of === null && element.type === 'flow.calculation')!.id);
    const frame = flow.nodes.find(isFrameNode)!;

    const intoFrame = flowToDocument(document, {
      ...flow,
      nodes: flow.nodes.map((node) =>
        node.id === mainNode.id ? { ...node, parentId: frame.id, position: { x: 10, y: 10 } } : node,
      ),
    });
    const inside = intoFrame.elements.find((element) => element.id === mainNode.id)!;
    expect(inside.management_of).toBe(owner.id);
    expect(inside.x).toBe(frame.data.anchor.abs.x + 10);

    const memberNode = elementNode(flow, members[0]!.id);
    const outOfFrame = flowToDocument(document, {
      ...flow,
      nodes: flow.nodes.map((node) => {
        if (node.id !== memberNode.id) {
          return node;
        }
        const { parentId: _parent, ...rest } = node;
        return { ...rest, position: { x: 5, y: 7 } };
      }),
    });
    const outside = outOfFrame.elements.find((element) => element.id === memberNode.id)!;
    expect(outside.management_of).toBeNull();
    expect(outside.x).toBe(5);
    expect(outside.y).toBe(7);
  });

  it('are collapsed: the elements stay in the document and are hidden', () => {
    const flow = documentToFlow(document, context({ collapsed: new Set([owner.id]) }));

    const frame = flow.nodes.find(isFrameNode)!;
    expect(frame.data.collapsed).toBe(true);
    expect(frame.height).toBeLessThan(frame.data.size.height);
    for (const member of members) {
      expect(elementNode(flow, member.id).hidden).toBe(true);
    }
    for (const element of document.elements.filter((e) => e.management_of === null)) {
      expect(elementNode(flow, element.id).hidden).toBe(false);
    }
    // Connections inside the management are hidden, others are not.
    const hiddenEdges = flow.edges.filter((edge) => edge.hidden === true && edge.data?.kind === 'connection');
    expect(hiddenEdges.length).toBeGreaterThan(0);
    expect(flowToDocument(document, flow)).toBe(document);

    const open = documentToFlow(document, context());
    expect(open.nodes.every((node) => node.hidden !== true)).toBe(true);
  });
});

describe('nested managements', () => {
  function nested(): StrategyDocument {
    const document = loadTestcase('str-03');
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    // A second element that places an order, inside the management of the first, with one element in its own management.
    const inner: ElementDocument = {
      ...owner,
      id: '00000000-0000-4000-8000-000000000001',
      x: 700,
      y: 700,
      management_of: owner.id,
      rules: [],
    };
    const innerMember: ElementDocument = {
      ...document.elements.find((element) => element.type === 'flow.close_position')!,
      id: '00000000-0000-4000-8000-000000000002',
      x: 900,
      y: 900,
      management_of: inner.id,
    };
    return { ...document, elements: [...document.elements, inner, innerMember] };
  }

  it('make the frame of the inner management a node inside the outer frame', () => {
    const document = nested();
    const flow = documentToFlow(document, context());

    const outerFrame = flow.nodes.filter(isFrameNode).find((node) => node.parentId === undefined)!;
    const innerFrame = flow.nodes.filter(isFrameNode).find((node) => node.parentId !== undefined)!;
    expect(innerFrame.parentId).toBe(outerFrame.id);
    expect(elementNode(flow, '00000000-0000-4000-8000-000000000002').parentId).toBe(innerFrame.id);
    // A parent comes before its children.
    const order = flow.nodes.map((node) => node.id);
    expect(order.indexOf(outerFrame.id)).toBeLessThan(order.indexOf(innerFrame.id));
    expect(order.indexOf(innerFrame.id)).toBeLessThan(order.indexOf('00000000-0000-4000-8000-000000000002'));
    // The outer frame contains the inner one.
    const rects = syncFrames(document, realTypes, {}, (_id, text) => text.de);
    const outer = rects[outerFrame.data.ownerId]!;
    const inner = rects[innerFrame.data.ownerId]!;
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width);
    expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height);
  });

  it('give the same document back', () => {
    const document = nested();

    expect(flowToDocument(document, documentToFlow(document, context()))).toBe(document);
  });

  it('hide everything inside when the outer frame is collapsed', () => {
    const document = nested();
    const owner = document.elements.find((element) => element.type === 'flow.place_order' && element.management_of === null)!;

    const flow = documentToFlow(document, context({ collapsed: new Set([owner.id]) }));

    const innerFrame = flow.nodes.filter(isFrameNode).find((node) => node.parentId !== undefined)!;
    expect(innerFrame.hidden).toBe(true);
    expect(elementNode(flow, '00000000-0000-4000-8000-000000000002').hidden).toBe(true);
  });
});

describe('references that lead nowhere', () => {
  it('keep their stored value', () => {
    const document = loadTestcase('str-03');
    const broken: StrategyDocument = {
      ...document,
      elements: document.elements.map((element, index) =>
        index === 0 ? { ...element, management_of: '00000000-0000-4000-8000-0000000000ff' } : element,
      ),
      connections: [
        ...document.connections,
        { source: document.elements[0]!.id, output: 'weiter', target: '00000000-0000-4000-8000-0000000000fe' },
      ],
    };

    const flow = documentToFlow(broken, context());

    expect(elementNode(flow, broken.elements[0]!.id).parentId).toBeUndefined();
    expect(flow.withoutEdge).toEqual([broken.connections.length - 1]);
    expect(flowToDocument(broken, flow)).toBe(broken);
  });

  it('do not loop: an element that is in its own management is shown in the main flow', () => {
    const document = loadTestcase('str-03');
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    const looped: StrategyDocument = {
      ...document,
      elements: document.elements.map((element) =>
        element.id === owner.id ? { ...element, management_of: owner.id } : element,
      ),
    };

    const flow = documentToFlow(looped, context());

    expect(elementNode(flow, owner.id).parentId).toBeUndefined();
    expect(flowToDocument(looped, flow)).toBe(looped);
  });
});

describe('positions', () => {
  it('keep fractional coordinates exactly', () => {
    const document = loadTestcase('str-03');
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    const fractional: StrategyDocument = {
      ...document,
      elements: document.elements.map((element) =>
        element.management_of === owner.id ? { ...element, x: element.x + 0.1, y: element.y + 0.7 } : element,
      ),
    };

    const flow = documentToFlow(fractional, context());

    expect(flowToDocument(fractional, flow)).toBe(fractional);
    const member = fractional.elements.find((element) => element.management_of === owner.id)!;
    const node = elementNode(flow, member.id);
    expect(absolutePosition(node, new Map(flow.nodes.map((candidate) => [candidate.id, candidate])))).toEqual({
      x: member.x,
      y: member.y,
    });
  });

  it('follow a moved element', () => {
    const document = loadTestcase('str-01');
    const flow = documentToFlow(document, context());
    const first = document.elements[0]!;

    const moved = flowToDocument(document, {
      ...flow,
      nodes: applyNodeChanges([{ type: 'position', id: first.id, position: { x: 12.5, y: 34.25 } }], flow.nodes),
    });

    expect(moved.elements[0]).toMatchObject({ x: 12.5, y: 34.25 });
    expect(moved.elements.slice(1)).toEqual(document.elements.slice(1));
    expect(moved.connections).toEqual(document.connections);
  });
});

describe('removing', () => {
  it('drops an element and its connections', () => {
    const document = loadTestcase('str-03');
    const flow = documentToFlow(document, context());
    const removed = document.elements.find((element) => element.name === 'richtung')!;

    const result = flowToDocument(document, {
      ...flow,
      nodes: applyNodeChanges([{ type: 'remove', id: removed.id }], flow.nodes),
      edges: flow.edges.filter((edge) => edge.source !== removed.id && edge.target !== removed.id),
    });

    expect(result.elements.map((element) => element.id)).not.toContain(removed.id);
    expect(result.connections.some((c) => c.source === removed.id || c.target === removed.id)).toBe(false);
    expect(result.connections).toHaveLength(document.connections.length - 2);
  });

  it('drops a connection when its edge is removed', () => {
    const document = loadTestcase('str-03');
    const flow = documentToFlow(document, context());
    const edge = flow.edges.find((candidate) => candidate.data?.kind === 'connection')!;

    const result = flowToDocument(document, { ...flow, edges: flow.edges.filter((candidate) => candidate !== edge) });

    expect(result.connections).toHaveLength(document.connections.length - 1);
    expect(result.elements).toEqual(document.elements);
  });

  it('moves the elements of a deleted management to the main flow', () => {
    const document = loadTestcase('str-03');
    const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
    const flow = documentToFlow(document, context());

    const result = flowToDocument(document, {
      ...flow,
      nodes: applyNodeChanges([{ type: 'remove', id: owner.id }], flow.nodes),
    });

    expect(result.elements.map((element) => element.id)).not.toContain(owner.id);
    for (const element of result.elements) {
      expect(element.management_of).toBeNull();
    }
  });
});

describe('unknown types', () => {
  const unknownId = '00000000-0000-4000-8000-0000000000aa';

  function withUnknown(): StrategyDocument {
    const document = loadTestcase('str-03');
    const trigger = document.elements.find((element) => element.type === 'trigger.candle_close' && element.management_of === null)!;
    const unknown: ElementDocument = {
      id: unknownId,
      type: 'vendor.mystery',
      title: '',
      name: null,
      x: 300,
      y: 300,
      parameters: { secret: { kind: 'fixed', value: 3 } },
      properties: {},
      rules: [],
      management_of: null,
    };
    return {
      ...document,
      elements: [...document.elements, unknown],
      connections: [
        ...document.connections,
        { source: trigger.id, output: 'weiter', target: unknownId },
        { source: unknownId, output: 'left', target: trigger.id },
        { source: unknownId, output: 'right', target: trigger.id },
      ],
    };
  }

  it('show the identifier of the type, one input and one output per stored output, none connectable', () => {
    const document = withUnknown();

    const node = elementNode(documentToFlow(document, context()), unknownId);

    expect(node.data.nodeKind).toBe('unknown');
    expect(node.data.title).toBe('vendor.mystery');
    expect(node.data.subtitle).toBe('vendor.mystery');
    expect(node.data.hasInput).toBe(true);
    expect(node.data.outputs.map((output) => [output.id, output.connectable])).toEqual([
      ['left', false],
      ['right', false],
    ]);
  });

  it('keep their values when the document comes back', () => {
    const document = withUnknown();
    const flow = documentToFlow(document, context());

    expect(flowToDocument(document, flow)).toBe(document);
    const moved = flowToDocument(document, {
      ...flow,
      nodes: applyNodeChanges([{ type: 'position', id: unknownId, position: { x: 1, y: 2 } }], flow.nodes),
    });
    expect(moved.elements.find((element) => element.id === unknownId)).toEqual({
      ...document.elements.find((element) => element.id === unknownId),
      x: 1,
      y: 2,
    });
  });
});

describe('the management of invented types', () => {
  const base = loadTestcase('str-03');
  const template = base.elements[0]!;
  const launch: ElementDocument = { ...template, id: 'launch', type: 'zz.launch', title: 'Launch', management_of: null, rules: [] };
  const inner: ElementDocument = { ...template, id: 'inner', type: 'zz.sweep', title: 'Sweep', management_of: 'launch', rules: [] };
  const plain: ElementDocument = { ...template, id: 'plain', type: 'zz.sweep', title: 'Plain', management_of: null, rules: [] };
  const document: StrategyDocument = { ...base, elements: [launch, inner, plain], connections: [] };
  const inventedContext = context({ types: inventedTypes });

  it('hangs the frame at the output the description names, which is not the first one', () => {
    const flow = documentToFlow(document, inventedContext);

    expect(flow.edges.find((edge) => edge.data?.kind === 'management')).toMatchObject({
      source: 'launch',
      target: frameNodeId('launch'),
      sourceHandle: 'sent',
    });
    const node = elementNode(flow, 'launch');
    expect(node.data.managementHandle).toBe('sent');
    expect(node.data.outputs.map((output) => [output.id, output.connectable])).toEqual([
      ['refused', true],
      ['sent', false],
    ]);
    expect(elementNode(flow, 'inner').parentId).toBe(frameNodeId('launch'));
    expect(flowToDocument(document, flow)).toBe(document);
  });

  it('uses a connector of its own for an element whose type has no such output but that another element names', () => {
    const named: StrategyDocument = { ...document, elements: [launch, inner, { ...plain, management_of: 'inner' }] };

    const flow = documentToFlow(named, inventedContext);

    const edge = flow.edges.find((candidate) => candidate.data?.kind === 'management' && candidate.source === 'inner');
    expect(edge).toMatchObject({ target: frameNodeId('inner'), sourceHandle: MANAGEMENT_HANDLE });
    expect(elementNode(flow, 'inner').data.managementHandle).toBe(MANAGEMENT_HANDLE);
    expect(elementNode(flow, 'plain').data.managementHandle).toBeNull();
  });

  it('has no frame for a type without an output that holds the management', () => {
    const flow = documentToFlow({ ...document, elements: [plain] }, inventedContext);

    expect(flow.nodes.filter(isFrameNode)).toEqual([]);
  });
});

describe('display', () => {
  it('shows the name of the instance for an object and the title for other elements, in the language', () => {
    const document = loadTestcase('str-03');
    const ema = document.elements.find((element) => element.type === 'EMA')!;
    const condition = document.elements.find((element) => element.type === 'flow.condition')!;

    const german = documentToFlow(document, context());
    const english = documentToFlow(document, context({ language: 'en' }));

    expect(elementNode(german, ema.id).data.title).toBe(ema.instance!.name);
    expect(elementNode(german, ema.id).data.subtitle).toBe('EMA');
    expect(elementNode(german, condition.id).data.title).toBe(condition.title);
    expect(elementNode(german, condition.id).data.subtitle).toBe('Bedingung');
    expect(elementNode(english, condition.id).data.subtitle).toBe('Condition');
    expect(elementNode(english, condition.id).data.title).toBe(condition.title);
  });

  it('marks the severity of an element', () => {
    const document = loadTestcase('str-03');
    const element = document.elements[0]!;

    const flow = documentToFlow(document, context({ severities: new Map([[element.id, 'error' as const]]) }));

    expect(elementNode(flow, element.id).data.severity).toBe('error');
    expect(elementNode(flow, document.elements[1]!.id).data.severity).toBeNull();
  });
});
