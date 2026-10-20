import { describe, expect, it } from 'vitest';

import { parseStrategyDocument } from '../document/parse';
import { setSectionCollapsed, createSection, toggleManagementCollapsed } from '../document/ops';
import { EMA_ELEMENT_IDS, emaTrendfolge } from '../testing/emaTrendfolge';
import { inventedStrategy, inventedTypes } from '../testing/inventedTypes';
import { testTypes } from '../testing/typeDescriptions';
import { buildSceneInput } from './input';
import { buildScene, frameAt, type Box, type Dir, type Scene } from './scene';

function overlaps(a: Box, b: Box): boolean {
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ox > 1 && oy > 1;
}

function sceneOfEma(dir: Dir): Scene {
  const document = parseStrategyDocument(emaTrendfolge());
  return buildScene(buildSceneInput(document, testTypes(), 'de', new Set(), new Map()), dir);
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

  it('puts the area for objects next to the flow (vertical) and above it (horizontal)', () => {
    const vertical = sceneOfEma('v');
    const horizontal = sceneOfEma('h');
    const flowLeft = Math.min(...[...vertical.nodes.values()].map((box) => box.x));
    const cardsRight = Math.max(...[...vertical.cards.values()].map((box) => box.x + box.w));
    const flowTop = Math.min(...[...horizontal.nodes.values()].map((box) => box.y));
    const cardsBottom = Math.max(...[...horizontal.cards.values()].map((box) => box.y + box.h));

    expect(cardsRight).toBeLessThanOrEqual(flowLeft);
    expect(cardsBottom).toBeLessThanOrEqual(flowTop);
  });

  it('puts the trigger of the main flow above the condition that follows it', () => {
    const scene = sceneOfEma('v');
    const trigger = scene.nodes.get(EMA_ELEMENT_IDS.trigger) as Box;
    const condition = scene.nodes.get(EMA_ELEMENT_IDS.cross) as Box;

    expect(trigger.y + trigger.h).toBeLessThan(condition.y);
  });

  it('draws a line for every connection and the line of the management', () => {
    const scene = sceneOfEma('v');

    expect(scene.edges.filter((edge) => edge.connection !== null)).toHaveLength(10);
    expect(scene.edges.filter((edge) => edge.connection === null && edge.mgmt)).toHaveLength(1);
  });

  it('gives a step the place the user gave it', () => {
    const document = parseStrategyDocument(emaTrendfolge());
    const input = buildSceneInput(document, testTypes(), 'de', new Set(), new Map(), new Map([[EMA_ELEMENT_IDS.direction, { x: 900, y: 50 }]]));
    const scene = buildScene(input, 'v');

    const box = scene.nodes.get(EMA_ELEMENT_IDS.direction) as Box;
    expect(box.x).toBe(900);
    expect(box.y).toBe(50);
  });

  it('finds the frame at a point, and no frame for a point in the main flow', () => {
    const scene = sceneOfEma('v');
    const frame = scene.frames[0] as Box & { owner: string };

    expect(frameAt(scene, { x: frame.x + 5, y: frame.y + 5 })?.owner).toBe(frame.owner);
    expect(frameAt(scene, { x: frame.x - 500, y: frame.y - 500 })).toBeUndefined();
  });

  it('shows a card with the properties that are used and, for a card without use, the first three', () => {
    const scene = sceneOfEma('v');
    const card = scene.cards.get(EMA_ELEMENT_IDS.ema20);

    expect(card?.rows).toEqual(['wert']);
    expect(card?.more).toBe(0);
  });
});

describe('arrangement from invented types (specification E2)', () => {
  it('arranges a strategy of types the interface does not know by name', () => {
    const document = inventedStrategy();
    const types = inventedTypes();
    const scene = buildScene(buildSceneInput(document, types, 'en', new Set(), new Map()), 'v');
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

    const scene = buildScene(buildSceneInput(document, types, 'en', new Set(), new Map()), 'v');

    expect(scene.secNodes.size).toBe(1);
    expect(scene.rep.get(start?.id ?? '')).toBe(`sec:${section?.id}`);
    expect(scene.frames[0]?.collapsed).toBe(true);
    expect((scene.frames[0] as Box).h).toBeLessThan(80);
  });
});
