import { describe, expect, it } from 'vitest';

import { reportFromDocument } from '../model/uses';
import { buildUsageModel } from '../model/uses';
import { parseStrategyDocument } from '../document/parse';
import { setSectionCollapsed, createSection, setPosition, toggleManagementCollapsed } from '../document/ops';
import type { StrategyDocument } from '../document/types';
import type { TypeIndex } from '../model/typeIndex';
import { EMA_ELEMENT_IDS, emaTrendfolge } from '../testing/emaTrendfolge';
import { inventedStrategy, inventedTypes } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { emaReferences, instanceUsage, reportOf, usesOf } from '../testing/uses';
import { buildSceneInput } from './input';
import { CARD_GAP, CARD_W, EL_H, EL_W, buildScene, frameAt, type Box, type Dir, type Scene } from './scene';

function overlaps(a: Box, b: Box): boolean {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 1 && oy > 1;
}

function sceneOf(document: StrategyDocument, types: TypeIndex, dir: Dir, references = emaReferences(), open = new Set<string>()): Scene {
  return buildScene(buildSceneInput(document, types, 'de', open, usesOf(document, types, references)), dir);
}

function sceneOfEma(dir: Dir): Scene {
  return sceneOf(parseStrategyDocument(emaTrendfolge()), testTypes(), dir);
}

const managed = [
  EMA_ELEMENT_IDS.mgmtTrigger,
  EMA_ELEMENT_IDS.executed,
  EMA_ELEMENT_IDS.crossAgainst,
  EMA_ELEMENT_IDS.closePosition,
  EMA_ELEMENT_IDS.newStop,
  EMA_ELEMENT_IDS.improved,
  EMA_ELEMENT_IDS.modifyPosition,
];

function box(map: Map<string, Box>, id: string): Box {
  const found = map.get(id);
  if (found === undefined) {
    throw new Error(`no box for ${id}`);
  }
  return found;
}

describe('arrangement of "EMA-Trendfolge" (specification 5.3, E8)', () => {
  it.each<[Dir]>([['v'], ['h']])('lets no two boxes overlap (direction %s)', (dir) => {
    const scene = sceneOfEma(dir);
    const boxes: [string, Box][] = [...scene.nodes.entries(), ...scene.cards.entries()];

    expect(boxes.length).toBe(15);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i] as [string, Box];
        const b = boxes[j] as [string, Box];
        expect(overlaps(a[1], b[1]), `${a[0]} and ${b[0]}`).toBe(false);
      }
    }
  });

  it.each<[Dir]>([['v'], ['h']])('keeps the steps of the management inside its frame and all others outside (direction %s)', (dir) => {
    const scene = sceneOfEma(dir);
    const frame = scene.frames.find((candidate) => candidate.owner === EMA_ELEMENT_IDS.order);

    expect(frame).toBeDefined();
    for (const [id, box] of scene.nodes) {
      const inside = managed.includes(id as (typeof managed)[number]);
      if (inside) {
        expect(box.x, id).toBeGreaterThanOrEqual((frame as Box).x);
        expect(box.y, id).toBeGreaterThanOrEqual((frame as Box).y);
        expect(box.x + box.w, id).toBeLessThanOrEqual((frame as Box).x + (frame as Box).w);
        expect(box.y + box.h, id).toBeLessThanOrEqual((frame as Box).y + (frame as Box).h);
      } else {
        expect(overlaps(box, frame as Box), `${id} lies in the frame of a management it does not belong to`).toBe(false);
      }
    }
  });

  it('puts every object beside the element of its first use: to the left in the vertical flow, above it in the horizontal flow', () => {
    const vertical = sceneOfEma('v');
    const horizontal = sceneOfEma('h');
    // the condition "Kreuzen" is the first element that uses EMA20 and EMA50, "StopLoss" the first that uses ATR14
    const homes: [string, string][] = [
      [EMA_ELEMENT_IDS.ema20, EMA_ELEMENT_IDS.cross],
      [EMA_ELEMENT_IDS.ema50, EMA_ELEMENT_IDS.cross],
      [EMA_ELEMENT_IDS.atr14, EMA_ELEMENT_IDS.stop],
    ];

    for (const [card, home] of homes) {
      const left = box(vertical.cards, card);
      const element = box(vertical.nodes, home);
      expect(left.x + left.w + CARD_GAP, card).toBeLessThanOrEqual(element.x + 0.5);
      expect(left.y, card).toBeGreaterThanOrEqual(element.y - 0.5);
      expect(left.y, card).toBeLessThan(element.y + 2 * EL_H + 40);
      const above = box(horizontal.cards, card);
      const target = box(horizontal.nodes, home);
      expect(above.y + above.h + CARD_GAP, card).toBeLessThanOrEqual(target.y + 0.5);
      expect(above.x, card).toBeGreaterThanOrEqual(target.x - 0.5);
    }
  });

  it('has no area, no box and no note for objects', () => {
    const scene = sceneOfEma('v');

    expect(Object.keys(scene)).not.toContain('lane');
    expect(scene.cards.size).toBe(3);
  });

  it('puts the trigger of the main flow above the condition that follows it', () => {
    const scene = sceneOfEma('v');
    const trigger = box(scene.nodes, EMA_ELEMENT_IDS.trigger);
    const condition = box(scene.nodes, EMA_ELEMENT_IDS.cross);

    expect(trigger.y + trigger.h).toBeLessThan(condition.y);
  });

  it('draws a line for every connection and the line of the management', () => {
    const scene = sceneOfEma('v');

    expect(scene.edges.filter((edge) => edge.connection !== null)).toHaveLength(10);
    expect(scene.edges.filter((edge) => edge.connection === null && edge.mgmt)).toHaveLength(1);
  });

  it('draws one line of values for each object and element that uses it, all ending at the one connection point on the side of the objects', () => {
    const vertical = sceneOfEma('v');
    const horizontal = sceneOfEma('h');

    // EMA20 and EMA50: Kreuzen, Richtung and the condition of the management; ATR14: StopLoss and the new stop
    expect(vertical.links).toHaveLength(8);
    const toCross = vertical.links.filter((line) => line.dst === EMA_ELEMENT_IDS.cross);
    expect(toCross.map((line) => line.src).sort()).toEqual([EMA_ELEMENT_IDS.ema20, EMA_ELEMENT_IDS.ema50].sort());
    for (const line of vertical.links) {
      const target = box(vertical.nodes, line.dst);
      expect(line.pts[1], line.key).toEqual({ x: target.x, y: target.y + target.h / 2 });
    }
    for (const line of horizontal.links) {
      const target = box(horizontal.nodes, line.dst);
      expect(line.pts[1], line.key).toEqual({ x: target.x + target.w / 2, y: target.y });
    }
  });

  it('marks the line to the element of the first use and none of the others', () => {
    const scene = sceneOfEma('v');

    const first = scene.links.filter((line) => line.first);
    expect(first.map((line) => `${line.src}>${line.dst}`).sort()).toEqual(
      [
        `${EMA_ELEMENT_IDS.ema20}>${EMA_ELEMENT_IDS.cross}`,
        `${EMA_ELEMENT_IDS.ema50}>${EMA_ELEMENT_IDS.cross}`,
        `${EMA_ELEMENT_IDS.atr14}>${EMA_ELEMENT_IDS.stop}`,
      ].sort(),
    );
    expect(scene.links.filter((line) => !line.first)).toHaveLength(5);
  });

  it('gives a step the place the user gave it, and the objects beside it follow', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const types = testTypes();
    const input = buildSceneInput(document, types, 'de', new Set(), usesOf(document, types, emaReferences()), new Map([[EMA_ELEMENT_IDS.cross, { x: 900, y: 50 }]]));
    const scene = buildScene(input, 'v');

    const placed = box(scene.nodes, EMA_ELEMENT_IDS.cross);
    expect(placed.x).toBe(900);
    expect(placed.y).toBe(50);
    expect(box(scene.cards, EMA_ELEMENT_IDS.ema20).x).toBe(900 - CARD_GAP - CARD_W);
    expect(box(scene.cards, EMA_ELEMENT_IDS.ema20).y).toBe(50);
  });

  it('finds the frame at a point, and no frame for a point in the main flow', () => {
    const scene = sceneOfEma('v');
    const frame = scene.frames[0] as Box & { owner: string };

    expect(frameAt(scene, { x: frame.x + 5, y: frame.y + 5 })?.owner).toBe(frame.owner);
    expect(frameAt(scene, { x: frame.x - 500, y: frame.y - 500 })).toBeUndefined();
  });

  it('shows a card with the properties that are used', () => {
    const scene = sceneOfEma('v');
    const card = scene.cards.get(EMA_ELEMENT_IDS.ema20);

    expect(card?.rows).toEqual(['wert']);
    expect(card?.more).toBe(0);
  });
});

describe('objects beside the elements that use them (specification 3.3, 5.3)', () => {
  const types = testTypes();

  it('puts an object that only another object uses beside the card of that object, further away from the element', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    // EMA50 is used only by EMA20, which "Kreuzen" uses; the first use of EMA50 is that of EMA20
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
    expect(uses.homes.get(EMA_ELEMENT_IDS.ema50)).toBe(EMA_ELEMENT_IDS.ema20);

    for (const dir of ['v', 'h'] as const) {
      const scene = buildScene(buildSceneInput(document, types, 'de', new Set(), uses), dir);
      const inner = box(scene.cards, EMA_ELEMENT_IDS.ema20);
      const outer = box(scene.cards, EMA_ELEMENT_IDS.ema50);
      const step = box(scene.nodes, EMA_ELEMENT_IDS.cross);
      if (dir === 'v') {
        expect(inner.x + inner.w).toBeLessThan(step.x);
        expect(outer.x + outer.w).toBeLessThan(inner.x);
      } else {
        expect(inner.y + inner.h).toBeLessThan(step.y);
        expect(outer.y + outer.h).toBeLessThan(inner.y);
      }
      // the line leads from card to card
      const line = scene.links.find((candidate) => candidate.src === EMA_ELEMENT_IDS.ema50);
      expect(line?.dst).toBe(EMA_ELEMENT_IDS.ema20);
      expect(line?.first).toBe(true);
      // and nothing covers anything
      const boxes = [...scene.nodes.values(), ...scene.cards.values()];
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          expect(overlaps(boxes[i] as Box, boxes[j] as Box)).toBe(false);
        }
      }
    }
  });

  it('puts an object that no element uses beside the flow without covering anything', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    for (const dir of ['v', 'h'] as const) {
      const scene = sceneOf(document, types, dir, new Map());
      const flow = [...scene.nodes.values(), ...scene.frames];
      const right = Math.max(...flow.map((b) => b.x + b.w));
      const bottom = Math.max(...flow.map((b) => b.y + b.h));

      expect(scene.cards.size).toBe(3);
      for (const card of scene.cards.values()) {
        if (dir === 'v') {
          expect(card.x).toBeGreaterThan(right);
        } else {
          expect(card.y).toBeGreaterThan(bottom);
        }
        for (const other of flow) {
          expect(overlaps(card, other)).toBe(false);
        }
      }
      const cards = [...scene.cards.values()];
      for (let i = 0; i < cards.length; i += 1) {
        for (let j = i + 1; j < cards.length; j += 1) {
          expect(overlaps(cards[i] as Box, cards[j] as Box)).toBe(false);
        }
      }
    }
  });

  it('leaves an object where the user put it, also when an element uses it, and the line follows', () => {
    let document = parseStrategyDocument(emaTrendfolge());
    document = setPosition(document, EMA_ELEMENT_IDS.ema20, { x: -700, y: 400 });

    const scene = sceneOf(document, types, 'v');

    expect(box(scene.cards, EMA_ELEMENT_IDS.ema20)).toMatchObject({ x: -700, y: 400 });
    const line = scene.links.find((candidate) => candidate.src === EMA_ELEMENT_IDS.ema20 && candidate.dst === EMA_ELEMENT_IDS.cross);
    expect(line?.pts[0]).toMatchObject({ x: -700 + CARD_W });
    // the other objects do not move because of it
    expect(box(scene.cards, EMA_ELEMENT_IDS.ema50).x).toBeLessThan(box(scene.nodes, EMA_ELEMENT_IDS.cross).x);
  });

  it('shows no card whose element lies in a folded management', () => {
    const document = toggleManagementCollapsed(parseStrategyDocument(emaTrendfolge()), EMA_ELEMENT_IDS.order);
    // ATR14 is used only inside the management: with the management folded in, its card is not shown either
    const references = new Map([[EMA_ELEMENT_IDS.newStop, [{ instance: 'atr14', property: 'wert' }]]]);

    const scene = sceneOf(document, types, 'v', references);

    expect(scene.nodes.has(EMA_ELEMENT_IDS.newStop)).toBe(false);
    expect(scene.cards.has(EMA_ELEMENT_IDS.atr14)).toBe(false);
    expect(scene.links.some((line) => line.src === EMA_ELEMENT_IDS.atr14)).toBe(false);
    // the objects nobody uses stay beside the flow
    expect(scene.cards.has(EMA_ELEMENT_IDS.ema20)).toBe(true);
  });
});

describe('rows of a card (specification 5.3)', () => {
  const types = inventedTypes();

  it('shows the first three properties of an object nobody uses, and all after "Alle anzeigen"', () => {
    const document = inventedStrategy();
    const meter = document.elements.find((element) => element.instance?.key === 'messer');

    const closed = sceneOf(document, types, 'v', new Map());
    const opened = sceneOf(document, types, 'v', new Map(), new Set([meter?.id ?? '']));

    const card = closed.cards.get(meter?.id ?? '');
    expect(card?.rows).toHaveLength(3);
    expect(card?.more).toBe(1);
    expect(card?.toggle).toBe(true);
    const all = opened.cards.get(meter?.id ?? '');
    expect(all?.rows).toHaveLength(4);
    expect(all?.more).toBe(0);
    expect(all?.toggle).toBe(true);
    expect((all?.h ?? 0)).toBeGreaterThan(card?.h ?? 0);
  });

  it('shows the used properties of an object that an element uses, and those only', () => {
    const document = inventedStrategy();
    const meter = document.elements.find((element) => element.instance?.key === 'messer');

    const scene = sceneOf(document, types, 'v', new Map([[document.elements.find((element) => element.name === 'Weiche')?.id ?? '', [{ instance: 'messer', property: 'stand' }]]]));

    expect(scene.cards.get(meter?.id ?? '')?.rows).toEqual(['stand']);
    expect(scene.cards.get(meter?.id ?? '')?.more).toBe(3);
  });
});

describe('arrangement from invented types (specification E2)', () => {
  it('arranges a strategy of types the interface does not know by name', () => {
    const document = inventedStrategy();
    const types = inventedTypes();
    const scene = sceneOf(document, types, 'v', new Map());
    const place = document.elements.find((element) => element.type === 'zz.place');

    expect(scene.frames.map((frame) => frame.owner)).toEqual([place?.id]);
    expect(scene.cards.size).toBe(1);
    expect(scene.nodes.size).toBe(6);
    const frame = scene.frames[0] as Box;
    const inside = document.elements.filter((element) => element.management_of === place?.id);
    for (const element of inside) {
      const box = scene.nodes.get(element.id) as Box;
      expect(box.y).toBeGreaterThanOrEqual(frame.y);
      expect(box.y + box.h).toBeLessThanOrEqual(frame.y + frame.h);
    }
  });

  it('replaces the steps of a collapsed section by one box and the steps of a folded management by a short frame', () => {
    const types = inventedTypes();
    let document = inventedStrategy();
    const start = document.elements.find((element) => element.name === 'Beginn');
    const when = document.elements.find((element) => element.name === 'Weiche');
    const place = document.elements.find((element) => element.type === 'zz.place');
    document = createSection(document, types, start?.id ?? '', 'Anfang');
    const section = document.sections[0];
    document = { ...document, sections: [{ ...(section as NonNullable<typeof section>), elements: [start?.id ?? '', when?.id ?? ''] }] };
    document = setSectionCollapsed(document, section?.id ?? '', true);
    document = toggleManagementCollapsed(document, place?.id ?? '');

    const scene = sceneOf(document, types, 'v', new Map());

    expect(scene.secNodes.size).toBe(1);
    expect(scene.rep.get(start?.id ?? '')).toBe(`sec:${section?.id}`);
    expect(scene.frames[0]?.collapsed).toBe(true);
    expect((scene.frames[0] as Box).h).toBeLessThan(80);
  });

  it('puts an object beside the box of a collapsed section when its element lies in it', () => {
    const types = inventedTypes();
    let document = inventedStrategy();
    const start = document.elements.find((element) => element.name === 'Beginn');
    const when = document.elements.find((element) => element.name === 'Weiche');
    const meter = document.elements.find((element) => element.instance?.key === 'messer');
    document = createSection(document, types, start?.id ?? '', 'Anfang');
    const section = document.sections[0];
    document = { ...document, sections: [{ ...(section as NonNullable<typeof section>), elements: [start?.id ?? '', when?.id ?? ''] }] };
    document = setSectionCollapsed(document, section?.id ?? '', true);

    const scene = sceneOf(document, types, 'v', new Map([[when?.id ?? '', [{ instance: 'messer', property: 'stand' }]]]));

    const sectionBox = scene.secNodes.get(`sec:${section?.id}`) as Box;
    const card = scene.cards.get(meter?.id ?? '') as Box;
    expect(card.x + card.w).toBeLessThan(sectionBox.x);
    expect(scene.links.some((line) => line.src === meter?.id && line.dst === when?.id)).toBe(true);
    void EL_W;
  });
});

describe('from the document to the drawing area and back', () => {
  it('derives the same arrangement from the same document and moves an object only by the place in the document', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const types = testTypes();

    const first = sceneOf(document, types, 'v');
    const second = sceneOf(parseStrategyDocument(JSON.parse(JSON.stringify(document))), types, 'v');
    expect([...second.cards.entries()]).toEqual([...first.cards.entries()]);

    const moved = sceneOf(setPosition(document, EMA_ELEMENT_IDS.atr14, { x: 5, y: 6 }), types, 'v');
    expect(box(moved.cards, EMA_ELEMENT_IDS.atr14)).toMatchObject({ x: 5, y: 6 });
    // the objects beside "Kreuzen" stay beside it, and the card of ATR14 no longer takes room beside "StopLoss"
    for (const id of [EMA_ELEMENT_IDS.ema20, EMA_ELEMENT_IDS.ema50]) {
      const card = box(moved.cards, id);
      expect(card.x + card.w + CARD_GAP).toBeLessThanOrEqual(box(moved.nodes, EMA_ELEMENT_IDS.cross).x + 0.5);
    }
    expect(box(moved.nodes, EMA_ELEMENT_IDS.stop).x).toBeLessThanOrEqual(box(first.nodes, EMA_ELEMENT_IDS.stop).x);
  });

  it('reads the report of the document: the stored element of the first use counts if it uses the instance, else the first element', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const types = testTypes();
    const direction = document.elements.map((element) =>
      element.id === EMA_ELEMENT_IDS.ema20 && element.instance !== undefined && element.instance !== null
        ? { ...element, instance: { ...element.instance, first_use: EMA_ELEMENT_IDS.direction } }
        : element,
    );
    const stored = { ...document, elements: direction };

    const report = reportFromDocument(stored, types, emaReferences());

    expect(report.instances.find((item) => item.instance === 'ema20')?.firstUse).toBe(EMA_ELEMENT_IDS.direction);
    expect(report.instances.find((item) => item.instance === 'ema50')?.firstUse).toBe(EMA_ELEMENT_IDS.cross);
    // a stored element that does not use the instance is not the first use
    const wrong = { ...document, elements: document.elements.map((element) => (element.id === EMA_ELEMENT_IDS.atr14 && element.instance ? { ...element, instance: { ...element.instance, first_use: EMA_ELEMENT_IDS.trigger } } : element)) };
    expect(reportFromDocument(wrong, types, emaReferences()).instances.find((item) => item.instance === 'atr14')?.firstUse).toBe(EMA_ELEMENT_IDS.stop);
  });
});
