import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StrategyDocument } from '../document/types';
import { updateElement, setElementBinding } from '../document/ops';
import { loadTestcase } from '../testing/fixtures';
import { NAMES_DEBOUNCE_MS, useLiveNames } from './useLiveNames';

const document = loadTestcase('str-03');
const condition = document.elements.find((element) => element.type === 'flow.condition')!;
const place = { element: condition.id, subject: null, field: 'parameter:ausdruck' };

type Pending = { document: StrategyDocument; resolve: (answer: unknown) => void; signal: AbortSignal };

function mockCheck(): Pending[] {
  const pending: Pending[] = [];
  vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      init.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'));
      });
      pending.push({
        document: JSON.parse(String(init.body)) as StrategyDocument,
        signal: init.signal as AbortSignal,
        resolve: (answer) => {
          resolve(new Response(JSON.stringify(answer), { status: 200 }));
        },
      });
    });
  });
  return pending;
}

function answer(identifier: string) {
  return {
    findings: [],
    names_truncated: false,
    expressions: [
      {
        element: condition.id,
        subject: null,
        field: 'parameter:ausdruck',
        names: [
          {
            start: 0,
            end: identifier.length,
            identifier,
            resolved: true,
            previous: false,
            segments: [{ identifier, start: 0, end: identifier.length }],
          },
        ],
      },
    ],
  };
}

function withText(base: StrategyDocument, text: string): StrategyDocument {
  return setElementBinding(base, condition.id, 'parameters', 'ausdruck', { kind: 'expression', value: text });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useLiveNames', () => {
  it('asks once after a pause, not at every key press', async () => {
    const pending = mockCheck();
    const { rerender } = renderHook(({ doc }) => useLiveNames(doc), { initialProps: { doc: withText(document, 'a') } });

    for (const text of ['ab', 'abc', 'abcd']) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS - 100);
      });
      rerender({ doc: withText(document, text) });
    }
    expect(pending).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });

    expect(pending).toHaveLength(1);
    expect(pending[0]?.document.elements.find((element) => element.id === condition.id)?.parameters.ausdruck?.value).toBe('abcd');
  });

  it('gives the names for the text they were asked for, and for no other text', async () => {
    const pending = mockCheck();
    const { result, rerender } = renderHook(({ doc }) => useLiveNames(doc), { initialProps: { doc: withText(document, 'Konto') } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });
    await act(async () => {
      pending[0]?.resolve(answer('Konto'));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.namesFor(place, 'Konto')?.[0]?.identifier).toBe('Konto');
    // The user has typed on: the positions of the old answer do not fit the new text.
    expect(result.current.namesFor(place, 'Konto.')).toBeUndefined();
    expect(result.current.namesFor({ ...place, field: 'parameter:other' }, 'Konto')).toBeUndefined();
    rerender({ doc: withText(document, 'Konto.') });
    expect(result.current.namesFor(place, 'Konto.')).toBeUndefined();
  });

  it('lets an older answer not replace a newer one', async () => {
    const pending = mockCheck();
    const { result, rerender } = renderHook(({ doc }) => useLiveNames(doc), { initialProps: { doc: withText(document, 'alt') } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });
    expect(pending).toHaveLength(1);

    rerender({ doc: withText(document, 'neu') });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });
    expect(pending).toHaveLength(2);
    // The first request was aborted when the second was made.
    expect(pending[0]?.signal.aborted).toBe(true);

    await act(async () => {
      pending[1]?.resolve(answer('neu'));
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      pending[0]?.resolve(answer('alt'));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.namesFor(place, 'neu')?.[0]?.identifier).toBe('neu');
    expect(result.current.namesFor(place, 'alt')).toBeUndefined();
  });

  it('does not ask again when only an element is moved', async () => {
    const pending = mockCheck();
    const { rerender } = renderHook(({ doc }) => useLiveNames(doc), { initialProps: { doc: document } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });
    expect(pending).toHaveLength(1);

    rerender({ doc: updateElement(document, condition.id, { x: 777, y: 888 }) });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS * 3);
    });

    expect(pending).toHaveLength(1);
  });

  it('asks nothing without an open strategy and forgets the names when it is closed', async () => {
    const pending = mockCheck();
    const { result, rerender } = renderHook(({ doc }) => useLiveNames(doc), {
      initialProps: { doc: withText(document, 'Konto') as StrategyDocument | null },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });
    await act(async () => {
      pending[0]?.resolve(answer('Konto'));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.namesFor(place, 'Konto')).toBeDefined();

    rerender({ doc: null });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS * 2);
    });

    expect(pending).toHaveLength(1);
    expect(result.current.namesFor(place, 'Konto')).toBeUndefined();
  });

  it('shows no names if the check fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network error')));
    const { result } = renderHook(() => useLiveNames(withText(document, 'Konto')));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NAMES_DEBOUNCE_MS);
    });

    expect(result.current.namesFor(place, 'Konto')).toBeUndefined();
  });
});
