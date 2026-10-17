import { describe, expect, it } from 'vitest';

import { loadTestcase, realTypes } from '../testing/fixtures';
import type { ElementDocument, StrategyDocument } from '../document/types';
import {
  assignManagement,
  connect,
  cornerForCenter,
  freePosition,
  isValidConnection,
  ownerAtPoint,
  syncedFrames,
} from './canvasEditing';
import { NODE_WIDTH, frameAt, nodeHeight, syncFrames } from './layout';

const document = loadTestcase('str-03');
const owner = document.elements.find((element) => element.type === 'flow.place_order')!;
const calculation = document.elements.find((element) => element.name === 'richtung')!;
const member = document.elements.find((element) => element.management_of === owner.id)!;
const frames = syncedFrames(document, realTypes, {}, 'de');

describe('connections', () => {
  it('may start at an output of an element and end at an element', () => {
    expect(isValidConnection(document, realTypes, { source: calculation.id, target: owner.id, sourceHandle: 'weiter' })).toBe(true);
  });

  it.each([
    ['an output the type does not have', { sourceHandle: 'wahr' }],
    ['no output', { sourceHandle: null }],
    ['a source that is not an element', { source: 'frame:x', sourceHandle: 'weiter' }],
    ['a target that is not an element', { target: 'frame:x', sourceHandle: 'weiter' }],
  ])('may not start at %s', (_name, change) => {
    const base = { source: calculation.id, target: owner.id, sourceHandle: 'weiter' as string | null };

    expect(isValidConnection(document, realTypes, { ...base, ...change })).toBe(false);
  });

  it('may not start at an element of an unknown type', () => {
    const unknown: ElementDocument = { ...calculation, id: 'u', type: 'vendor.mystery' };
    const next = { ...document, elements: [...document.elements, unknown] };

    expect(isValidConnection(next, realTypes, { source: 'u', target: owner.id, sourceHandle: 'weiter' })).toBe(false);
  });

  it('is added to the document, once, and returns to an earlier element (specification 5.3)', () => {
    const connection = { source: owner.id, target: calculation.id, sourceHandle: 'nicht_gestellt', targetHandle: null };

    const once = connect(document, realTypes, connection);
    const twice = connect(once, realTypes, connection);

    expect(once.connections.at(-1)).toEqual({ source: owner.id, output: 'nicht_gestellt', target: calculation.id });
    expect(twice).toBe(once);
  });

  it('is not added if it is not allowed', () => {
    expect(connect(document, realTypes, { source: calculation.id, target: owner.id, sourceHandle: 'wahr', targetHandle: null })).toBe(document);
  });
});

describe('the management of a dragged element', () => {
  function moved(element: ElementDocument, x: number, y: number): StrategyDocument {
    return {
      ...document,
      elements: document.elements.map((candidate) => (candidate.id === element.id ? { ...candidate, x, y } : candidate)),
    };
  }

  const rect = frames[owner.id]!;

  it('is the frame whose area contains its center', () => {
    const inside = moved(calculation, rect.x + 60, rect.y + 60);

    const next = assignManagement(inside, realTypes, frames, new Set(), calculation.id);

    expect(next.elements.find((element) => element.id === calculation.id)?.management_of).toBe(owner.id);
  });

  it('is empty again when the element is pulled out', () => {
    const outside = moved(member, rect.x + rect.width + 300, rect.y);

    const next = assignManagement(outside, realTypes, frames, new Set(), member.id);

    expect(next.elements.find((element) => element.id === member.id)?.management_of).toBeNull();
  });

  it('stays the same if the element stays where it was', () => {
    expect(assignManagement(document, realTypes, frames, new Set(), member.id)).toBe(document);
    expect(assignManagement(document, realTypes, frames, new Set(), calculation.id)).toBe(document);
  });

  it('is not changed by a frame that is collapsed: nothing can be put into it', () => {
    const inside = moved(calculation, rect.x + 60, rect.y + 60);

    expect(assignManagement(inside, realTypes, frames, new Set([owner.id]), calculation.id)).toBe(inside);
  });

  it('is the innermost of two frames', () => {
    const innerOwner: ElementDocument = { ...owner, id: 'inner', management_of: owner.id, x: rect.x + 40, y: rect.y + 60, rules: [] };
    const innerMember: ElementDocument = { ...member, id: 'innerMember', management_of: 'inner', x: rect.x + 50, y: rect.y + 140 };
    const nested: StrategyDocument = { ...document, elements: [...document.elements, innerOwner, innerMember] };
    const nestedFrames = syncedFrames(nested, realTypes, {}, 'de');
    const innerRect = nestedFrames.inner!;

    const dropped = {
      ...nested,
      elements: nested.elements.map((element) =>
        element.id === calculation.id
          ? { ...element, x: innerRect.x + 20, y: innerRect.y + 50, management_of: null }
          : element,
      ),
    };

    expect(assignManagement(dropped, realTypes, nestedFrames, new Set(), calculation.id).elements.find((e) => e.id === calculation.id)?.management_of).toBe('inner');
  });

  it('does not put an element that places an order into its own frame', () => {
    const inOwnFrame = moved(owner, rect.x + 50, rect.y + 50);

    const next = assignManagement(inOwnFrame, realTypes, frames, new Set(), owner.id);

    expect(next.elements.find((element) => element.id === owner.id)?.management_of).toBeNull();
  });

  it('is found for a point by the frame it lies in', () => {
    expect(ownerAtPoint(document, realTypes, frames, new Set(), { x: rect.x + 10, y: rect.y + 10 })).toBe(owner.id);
    expect(ownerAtPoint(document, realTypes, frames, new Set(), { x: rect.x - 10, y: rect.y - 10 })).toBeNull();
    expect(ownerAtPoint(document, realTypes, frames, new Set([owner.id]), { x: rect.x + 10, y: rect.y + 10 })).toBeNull();
  });
});

describe('frames', () => {
  it('stand around the elements of the management, with room', () => {
    const rect = frames[owner.id]!;
    const members = document.elements.filter((element) => element.management_of === owner.id);

    expect(Math.min(...members.map((element) => element.x))).toBeGreaterThan(rect.x);
    expect(Math.min(...members.map((element) => element.y))).toBeGreaterThan(rect.y);
    expect(Math.max(...members.map((element) => element.x + NODE_WIDTH))).toBeLessThan(rect.x + rect.width);
  });

  it('exist for each element that places an order, empty ones below the element', () => {
    const lonely: StrategyDocument = {
      ...document,
      elements: document.elements.map((element) => (element.management_of === owner.id ? { ...element, management_of: null } : element)),
    };

    const rects = syncedFrames(lonely, realTypes, {}, 'de');

    expect(Object.keys(rects)).toEqual([owner.id]);
    expect(rects[owner.id]!.y).toBeGreaterThan(owner.y);
  });

  it('do not shrink and do not move by themselves, but grow around a new element', () => {
    const rect = frames[owner.id]!;
    const farAway: StrategyDocument = {
      ...document,
      elements: document.elements.map((element) => (element.id === member.id ? { ...element, x: rect.x + rect.width + 500 } : element)),
    };

    // While an element is dragged the frame stays as it is, so that the element can leave it.
    expect(syncFrames(farAway, realTypes, frames, (_id, text) => text.de)).toEqual(frames);
    const grown = syncFrames(farAway, realTypes, frames, (_id, text) => text.de, true)[owner.id]!;

    expect(grown.x).toBe(rect.x);
    expect(grown.y).toBe(rect.y);
    expect(grown.width).toBeGreaterThan(rect.width + 400);
    expect(syncFrames(document, realTypes, frames, (_id, text) => text.de)).toEqual(frames);
  });

  it('are dropped when their element is gone', () => {
    const without = { ...document, elements: document.elements.filter((element) => element.id !== owner.id) };

    expect(Object.keys(syncedFrames(without, realTypes, frames, 'de'))).toEqual([]);
  });

  it('choose the smallest of two frames at a point', () => {
    expect(
      frameAt(
        { a: { x: 0, y: 0, width: 100, height: 100 }, b: { x: 10, y: 10, width: 20, height: 20 } },
        { x: 15, y: 15 },
      ),
    ).toBe('b');
    expect(frameAt({ a: { x: 0, y: 0, width: 100, height: 100 } }, { x: 150, y: 15 })).toBeNull();
  });
});

describe('where a new element goes', () => {
  const box = { x: 100, y: 100 };
  const taken: StrategyDocument = { ...document, elements: [{ ...calculation, ...box, management_of: null }] };

  it('is the point itself if nothing is there', () => {
    expect(freePosition(taken, realTypes, { x: 500, y: 500 })).toEqual({ x: 500, y: 500 });
    expect(freePosition({ ...document, elements: [] }, realTypes, { x: 5, y: 6 })).toEqual({ x: 5, y: 6 });
  });

  it('is moved to the right of an element that covers the point, also if it only covers part of the new element', () => {
    expect(freePosition(taken, realTypes, { x: 100, y: 100 })).toEqual({ x: 100 + NODE_WIDTH + 24, y: 100 });
    expect(freePosition(taken, realTypes, { x: 180, y: 110 }).x).toBeGreaterThanOrEqual(100 + NODE_WIDTH + 12);
  });

  it('does not cover any element, however many stand around', () => {
    const crowd: StrategyDocument = {
      ...document,
      elements: [-1, 0, 1].flatMap((column) =>
        [-1, 0, 1].map((row, index) => ({
          ...calculation,
          id: `e${column}${row}${index}`,
          x: 400 + column * (NODE_WIDTH + 24),
          y: 400 + row * (nodeHeight(1) + 24),
          management_of: null,
        })),
      ),
    };

    const place = freePosition(crowd, realTypes, { x: 400, y: 400 });

    for (const element of crowd.elements) {
      const apart =
        place.x >= element.x + NODE_WIDTH || place.x + NODE_WIDTH <= element.x || place.y >= element.y + nodeHeight(1) || place.y + nodeHeight(1) <= element.y;
      expect(apart).toBe(true);
    }
  });

  it('has its center at the point', () => {
    expect(cornerForCenter({ x: 200, y: 100 }, 1)).toEqual({ x: 200 - NODE_WIDTH / 2, y: 100 - nodeHeight(1) / 2 });
  });
});
