import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { createGate } from './test-utils';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { EMA_ELEMENT_IDS } from './testing/emaTrendfolge';

type Stored = { elements: { id: string; parameters: Record<string, { value?: unknown }> }[] };

/** Holds back the answers of the expression endpoint to a change made of blocks until the test releases them. */
function holdBlockAnswers(): { release: () => void; held: () => number } {
  const original = globalThis.fetch;
  const gate = createGate();
  let held = 0;
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const body: unknown = init?.body !== undefined ? JSON.parse(String(init.body)) : undefined;
    const items = (body as { items?: { blocks?: unknown }[] } | undefined)?.items;
    if (url === '/api/v1/expressions' && items?.some((item) => item.blocks !== undefined) === true) {
      held += 1;
      await gate.promise;
    }
    return original(input, init);
  });
  return { release: () => gate.release({ status: 200, body: null }), held: () => held };
}

describe('saving while the answer for a change of an expression is on its way (race of saving and conversion)', () => {
  it('waits for the answer, so the saved state has the change and the document is saved afterwards', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
    });
    clickNode(nodeByName('Richtung'));
    const panel = await screen.findByTestId('expression-ausdruck');
    const operator = await within(panel).findByTestId('cmp-op');
    await waitFor(() => {
      expect(operator).toHaveValue('>');
    });

    const hold = holdBlockAnswers();
    await user.selectOptions(operator, '<');
    await waitFor(() => {
      expect(hold.held()).toBe(1);
    });
    // the user saves at once; the answer for the change is not there yet
    await menu(user, 'save');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.requests('PUT', /strategies/)).toHaveLength(0);

    hold.release();
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const document = api.requests('PUT', /strategies/)[0]?.body as Stored;
    expect(String(document.elements.find((element) => element.id === EMA_ELEMENT_IDS.direction)?.parameters.ausdruck?.value)).toBe(
      'IF(ema20.wert < ema50.wert; "buy"; "sell")',
    );
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('gespeichert');
    });
    expect(screen.getByTestId('status-pill')).not.toHaveTextContent('ungespeichert');
  });
});
