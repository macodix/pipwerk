import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { newStrategy } from './document/build';
import type { StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { inventedStrategy, inventedTypesJson, meterElement } from './testing/inventedTypes';

// Specification 5.1, 5.3 "Keine Hinweise", 5.5, req-ui-016, defect M1: hints and short messages stand in
// the properties view and nowhere else. The drawing area shows none in any state. Windows stay above the interface.

/** What on the drawing area could be a hint: a card with advice, a button of a hint, the old banner of a connection. */
function hintsOnCanvas(): string[] {
  const canvas = screen.getByTestId('canvas');
  const found: string[] = [];
  for (const selector of ['.hint-box', '.empty-card', '.canvas-empty', '.toast', '.message-bar', '[data-testid="armed-banner"]', '[data-testid="empty-library"]', '[data-testid="empty-new"]', '[data-testid="empty-open"]', '[data-testid="frame-empty"]', '[data-testid="canvas-empty"]', '[data-testid="canvas-no-strategy"]']) {
    if (canvas.querySelector(selector) !== null) {
      found.push(selector);
    }
  }
  for (const text of ['Nächster Schritt', 'Keine Strategie geöffnet', 'Noch leer. Wählen Sie', 'Hier erscheinen', 'Klicken Sie jetzt']) {
    if ((canvas.textContent ?? '').includes(text)) {
      found.push(text);
    }
  }
  return found;
}

function occurrences(text: string): number {
  return (document.body.textContent ?? '').split(text).length - 1;
}

describe('"Keine Strategie geöffnet" (defect M1, specification 5.5)', () => {
  it('appears once, in the properties view, and the drawing area shows no hint', async () => {
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    expect(occurrences('Keine Strategie geöffnet')).toBe(1);
    expect(within(screen.getByTestId('props')).getByText('Keine Strategie geöffnet')).toBeInTheDocument();
    expect(hintsOnCanvas()).toEqual([]);
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-state', 'no-strategy');
  });

  it('is told once in English as well', async () => {
    mockApi({ language: 'en' });
    renderWithProviders(<App />, 'en');
    await waitFor(() => {
      expect(screen.getByTestId('menu-new')).toBeEnabled();
    });

    expect(occurrences('No strategy open')).toBe(1);
    expect(within(screen.getByTestId('props')).getByText('No strategy open')).toBeInTheDocument();
    expect(hintsOnCanvas()).toEqual([]);
  });

  it('shows the properties view first below 1100 pixels when no strategy is open (specification 5.1)', async () => {
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'props');
  });
});

describe('the hint of an empty strategy (specification 5.5)', () => {
  async function newEmptyStrategy(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await menu(user, 'new');
    // "Neue Strategie" opens an empty drawing area; below 1100 pixels the properties view with the hint is shown
    await screen.findByTestId('empty-strategy-hint');
    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'props');
  }

  it('stands in the properties view above the fields of the strategy and nowhere on the drawing area, and names the trigger as the first step', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await newEmptyStrategy(user);

    const hint = await screen.findByTestId('empty-strategy-hint');
    expect(within(screen.getByTestId('props')).getByTestId('empty-strategy-hint')).toBe(hint);
    expect(hint).toHaveTextContent('Nächster Schritt: Beginnen Sie mit einem Auslöser.');
    expect(hint).toHaveTextContent('Ablaufsteuerung');
    // E6: a strategy does not calculate; the trigger is the event that starts it
    expect(hint).toHaveTextContent('das Ereignis, das die Strategie startet');
    expect(hint.textContent).not.toMatch(/rechn/);
    expect(hint.textContent).not.toMatch(/Assist/);
    const name = screen.getByTestId('strategy-name');
    // the hint comes before the name of the strategy in the view
    expect(hint.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hintsOnCanvas()).toEqual([]);
    expect(occurrences('Keine Strategie geöffnet')).toBe(0);
    expect(occurrences('Die Strategie ist leer')).toBe(1);
  });

  it('offers "Elementbibliothek zeigen", which shows the library', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await newEmptyStrategy(user);

    await user.click(await screen.findByTestId('empty-library'));

    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'library');
  });

  it('offers no assistant after "Neue Strategie" and is gone as soon as the strategy has an element (E9)', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await newEmptyStrategy(user);

    expect(document.body.textContent).not.toMatch(/Assist/);
    expect(screen.getByTestId('empty-strategy-hint').querySelectorAll('button')).toHaveLength(1);
    expect(screen.getByTestId('props-strategy')).toBeInTheDocument();

    await user.click(
      document.querySelector<HTMLElement>('[data-testid="lib-item"][data-label="Kerzenschluss"]') as HTMLElement,
    );
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
    });
    await user.click(screen.getByTestId('crumb-strategy'));
    expect(screen.queryByTestId('empty-strategy-hint')).toBeNull();
  });

  it('is in English as well, and the English interface has no German text in it', async () => {
    const user = userEvent.setup();
    mockApi({ language: 'en' });
    renderWithProviders(<App />, 'en');
    await waitFor(() => {
      expect(screen.getByTestId('menu-new')).toBeEnabled();
    });
    await menu(user, 'new');

    const hint = await screen.findByTestId('empty-strategy-hint');
    expect(hint).toHaveTextContent('The strategy is empty');
    expect(hint).toHaveTextContent('the event that starts the strategy');
    expect(hint.textContent).not.toMatch(/Nächster|Strategie|Assist|assist|calculat/);
  });
});

describe('the hint of an order and position management without steps (specification 5.5)', () => {
  function withEmptyManagement(): StrategyDocument {
    const document = inventedStrategy();
    const elements = document.elements.filter((element) => element.management_of === null);
    const ids = new Set(elements.map((element) => element.id));
    return {
      ...document,
      elements,
      connections: document.connections.filter((connection) => ids.has(connection.source) && ids.has(connection.target)),
    };
  }

  it('stands in the properties view of its frame and not on the drawing area', async () => {
    const user = userEvent.setup();
    const document = withEmptyManagement();
    mockApi({ types: inventedTypesJson, strategies: [document as unknown as Record<string, unknown>] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'Erfundene Strategie');
    await waitFor(() => {
      expect(nodeByName('Ausführen')).toBeInTheDocument();
    });

    expect(hintsOnCanvas()).toEqual([]);
    clickNode(await screen.findByTestId('frame'));

    const frame = await screen.findByTestId('props-frame');
    expect(within(screen.getByTestId('props')).getByTestId('props-frame')).toBe(frame);
    expect(frame).toHaveTextContent('Der Rahmen ist noch leer');
    expect(frame).toHaveTextContent('Order- und Positionsverwaltung');
    expect(hintsOnCanvas()).toEqual([]);
  });

  it('is not shown on the drawing area when the frame is collapsed or when it is selected', async () => {
    const user = userEvent.setup();
    const document = withEmptyManagement();
    mockApi({ types: inventedTypesJson, strategies: [document as unknown as Record<string, unknown>] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'Erfundene Strategie');
    await screen.findByTestId('frame');

    await user.click(screen.getByTestId('frame-toggle'));
    expect(hintsOnCanvas()).toEqual([]);
    await user.click(screen.getByTestId('frame-toggle'));
    clickNode(screen.getByTestId('frame'));
    expect(hintsOnCanvas()).toEqual([]);
  });
});

describe('a card without a connection', () => {
  it('shows no hint on the drawing area; the finding stands in the properties view and names the object', async () => {
    const user = userEvent.setup();
    const card = meterElement('Messer', 'messer');
    const document: StrategyDocument = { ...newStrategy('Karte allein'), elements: [card] };
    mockApi({
      types: inventedTypesJson,
      strategies: [document as unknown as Record<string, unknown>],
      findings: () => [{ level: 'error', code: 'instance.unconnected', element: card.id, subject: 'messer', details: { instance: 'messer' } }],
    });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'Karte allein');
    await waitFor(() => {
      expect(nodeByName('Messer')).toBeInTheDocument();
    });

    expect(hintsOnCanvas()).toEqual([]);
    clickNode(nodeByName('Messer'));
    const finding = await screen.findByTestId('finding');
    expect(within(screen.getByTestId('props')).getByTestId('finding')).toBe(finding);
    expect(finding).toHaveTextContent('„Messer“ ist mit keinem Element verbunden. Es wird nirgends verwendet.');
    expect(finding).toHaveTextContent('So beheben Sie es: Verbinden Sie das Objekt mit dem Element, das seine Werte zuerst braucht, oder entfernen Sie es.');
    expect(hintsOnCanvas()).toEqual([]);
  });
});

describe('short messages (specification 5.1)', () => {
  it('stand in the properties view, not on the drawing area, and disappear on their own', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    // an entry of the library without an open strategy: the message says what to do first
    await user.click(document.querySelector<HTMLElement>('[data-testid="lib-item"]') as HTMLElement);

    const message = await screen.findByTestId('message');
    expect(within(screen.getByTestId('props')).getByTestId('message')).toBe(message);
    expect(message).toHaveTextContent('Öffnen Sie zuerst eine Strategie');
    expect(screen.queryByTestId('toast')).toBeNull();
    expect(hintsOnCanvas()).toEqual([]);
  });

  it('mark the tab of the properties view while the library hides it (below 1100 pixels)', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await user.click(within(screen.getByTestId('library')).getByTestId('tab-library'));
    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'library');
    expect(within(screen.getByTestId('library')).getByTestId('tab-props')).not.toHaveAttribute('data-marked');

    await user.click(document.querySelector<HTMLElement>('[data-testid="lib-item"]') as HTMLElement);

    await waitFor(() => {
      expect(within(screen.getByTestId('library')).getByTestId('tab-props')).toHaveAttribute('data-marked', 'true');
    });
    expect(screen.getByTestId('bar-props')).toHaveAttribute('data-marked', 'true');
    expect(screen.getByTestId('bar-library')).not.toHaveAttribute('data-marked');
    // the properties view shows the message; going there takes the mark away only when the message is gone
    await user.click(within(screen.getByTestId('library')).getByTestId('tab-props'));
    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'props');
    expect(screen.getByTestId('bar-props')).not.toHaveAttribute('data-marked');
  });
});

describe('connecting with a click (specification 5.2, 5.3)', () => {
  async function openEma(user: ReturnType<typeof userEvent.setup>): Promise<ReturnType<typeof mockApi>> {
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(nodeByName('Kreuzen')).toBeInTheDocument();
    });
    return api;
  }

  function entry(label: string): HTMLElement {
    return document.querySelector<HTMLElement>(`[data-testid="lib-item"][data-label="${label}"]`) as HTMLElement;
  }

  it('asks for the next step in the properties view and not on the drawing area, then connects the step', async () => {
    const user = userEvent.setup();
    const api = await openEma(user);
    clickNode(nodeByName('Richtung'));
    await screen.findByTestId('props-element');

    await user.click(entry('Verbindung'));

    const prompt = await screen.findByTestId('armed-banner');
    expect(within(screen.getByTestId('props')).getByTestId('armed-banner')).toBe(prompt);
    expect(prompt).toHaveTextContent('Wählen Sie jetzt den nächsten Schritt.');
    expect(hintsOnCanvas()).toEqual([]);

    // the next step that is chosen becomes the successor of "Richtung" (instead of "StopLoss")
    clickNode(nodeByName('Order aufgeben'));
    await waitFor(() => {
      expect(screen.queryByTestId('armed-banner')).toBeNull();
    });
    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const stored = api.requests('PUT', /strategies/)[0]?.body as StrategyDocument;
    const from = stored.elements.find((element) => element.name === 'Richtung');
    const to = stored.elements.find((element) => element.name === 'Order aufgeben');
    expect(stored.connections.filter((connection) => connection.source === from?.id).map((connection) => [connection.output, connection.target])).toEqual([
      ['weiter', to?.id],
    ]);
  });

  it('can be left with "Abbrechen"', async () => {
    const user = userEvent.setup();
    await openEma(user);
    clickNode(nodeByName('Richtung'));
    await screen.findByTestId('props-element');
    await user.click(entry('Verbindung'));
    const prompt = await screen.findByTestId('armed-banner');

    await user.click(within(prompt).getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByTestId('armed-banner')).toBeNull();
  });

  it('says first to choose a step when none is chosen', async () => {
    const user = userEvent.setup();
    await openEma(user);

    await user.click(entry('Verbindung'));

    expect(await screen.findByTestId('message')).toHaveTextContent('Wählen Sie zuerst den Schritt, von dem es weitergeht.');
    expect(screen.queryByTestId('armed-banner')).toBeNull();
  });

  it('has an explanation for the entry, and the entry cannot be dragged', async () => {
    const user = userEvent.setup();
    await openEma(user);

    expect(entry('Verbindung')).toHaveAttribute('data-tip', expect.stringContaining('ohne zu ziehen'));
    expect(entry('Verbindung')).toHaveAttribute('draggable', 'false');
    expect(entry('Kerzenschluss')).toHaveAttribute('draggable', 'true');
    void user;
  });
});

describe('windows stay above the interface (specification 5.5)', () => {
  it('shows a confirmed error in a window and not as a message of the properties view', async () => {
    const user = userEvent.setup();
    mockApi({ fail: { replace: { status: 422, body: { detail: 'x', code: 'document.too_large', params: { limit_bytes: 2097152 } } } } });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(nodeByName('Kreuzen')).toBeInTheDocument();
    });
    await user.clear(screen.getByTestId('strategy-name'));
    await user.type(screen.getByTestId('strategy-name'), 'Anders');

    await menu(user, 'save');

    const dialog = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht gespeichert werden.' });
    expect(dialog).toHaveTextContent('Das Dokument ist zu groß, um gespeichert zu werden (Grenze: 2097152 Byte).');
    expect(within(screen.getByTestId('props')).queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByTestId('message')).toBeNull();
  });
});
