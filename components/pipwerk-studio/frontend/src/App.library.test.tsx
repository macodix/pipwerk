import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { LIBRARY_DRAG_TYPE } from './library/dragType';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';

// Order 20 (F1, F3, F8; specification 3.3, 5.2, 5.3, 5.5): the library says when it is usable, marks the triggers and
// tells steps from suppliers of values; the interface says why a connection or a first element is not possible.

function entry(label: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(`[data-testid="lib-item"][data-label="${label}"]`);
  if (found.length === 0) {
    throw new Error(`No entry ${label}`);
  }
  return found[0] as HTMLElement;
}

function group(id: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-testid="lib-group"][data-group="${id}"]`) as HTMLElement;
}

const CLOSED = 'Die Elemente sind erst verwendbar, wenn Sie „Neue Strategie“ oder „Öffnen“ gewählt haben.';

describe('the library without an open strategy (F1)', () => {
  it('says in the library that the elements are not usable yet, and the sentence stays', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    const note = within(screen.getByTestId('library')).getByTestId('library-closed');
    expect(note).toHaveTextContent(CLOSED);
    // it does not stand on the drawing area (specification 5.3)
    expect(screen.getByTestId('canvas')).not.toHaveTextContent('erst verwendbar');

    // working in the library does not take it away
    await user.click(entry('Kerzenschluss'));
    await user.type(screen.getByTestId('library-search'), 'k');
    expect(screen.getByTestId('library-closed')).toHaveTextContent(CLOSED);
    expect(screen.queryByTestId('message')).toBeNull();
  });

  it('shows the entries as not usable; click, key and drag change nothing; the explanation stays', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    const trigger = entry('Kerzenschluss');

    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(trigger).toHaveAttribute('draggable', 'false');
    expect(trigger).toHaveClass('closed');
    expect(trigger).toHaveAttribute('data-tip', expect.stringMatching(/\S/));
    expect(trigger).toHaveAttribute('tabindex', '0');

    await user.click(trigger);
    trigger.focus();
    await user.keyboard('{Enter}');
    fireEvent.dragStart(trigger, { dataTransfer: { setData: () => undefined, effectAllowed: '' } });

    expect(screen.queryByTestId('message')).toBeNull();
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-state', 'no-strategy');
    expect(api.requests('POST', /\/api\/v1\/insert/)).toHaveLength(0);
    // the short message "Öffnen Sie zuerst eine Strategie …" is replaced by the sentence
    expect(document.body.textContent).not.toContain('Öffnen Sie zuerst eine Strategie');
  });

  it('is in English as well', async () => {
    mockApi({ language: 'en' });
    renderWithProviders(<App />, 'en');
    await waitFor(() => {
      expect(screen.getByTestId('menu-new')).toBeEnabled();
    });

    expect(screen.getByTestId('library-closed')).toHaveTextContent('The elements can only be used once you have chosen "New strategy" or "Open".');
  });

  it('is gone after "Neue Strategie", and the entries can be used and dragged', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await menu(user, 'new');

    await waitFor(() => {
      expect(screen.queryByTestId('library-closed')).toBeNull();
    });
    expect(entry('Kerzenschluss')).toHaveAttribute('aria-disabled', 'false');
    expect(entry('Kerzenschluss')).toHaveAttribute('draggable', 'true');
    expect(entry('Kerzenschluss')).not.toHaveClass('closed');
    await user.click(entry('Kerzenschluss'));
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
    });
  });

  it('comes back after "Schließen"', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await waitFor(() => {
      expect(screen.queryByTestId('library-closed')).toBeNull();
    });

    await menu(user, 'close');
    await user.click(await screen.findByRole('button', { name: 'Verwerfen' }));

    await waitFor(() => {
      expect(screen.getByTestId('library-closed')).toBeInTheDocument();
    });
  });
});

describe('triggers in the library (F3)', () => {
  it('marks exactly the triggers with "Auslöser", from the kind of the type description', async () => {
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    const flow = group('flow');
    const marked = within(flow)
      .getAllByTestId('lib-item')
      .filter((item) => within(item).queryByTestId('lib-trigger') !== null)
      .map((item) => item.dataset.label);
    expect(marked).toEqual(['Kerzenschluss', 'Tick', 'Manuell']);
    expect(within(entry('Kerzenschluss')).getByTestId('lib-trigger')).toHaveTextContent('Auslöser');
    // the marks are text with an explanation, not a colour alone
    expect(within(entry('Kerzenschluss')).getByTestId('lib-trigger')).toHaveAttribute('data-tip', expect.stringContaining('startet die Strategie'));
    // "Tick" as an object of the market data is no trigger
    expect(within(group('market')).queryByTestId('lib-trigger')).toBeNull();
    expect(within(entry('Bedingung')).queryByTestId('lib-trigger')).toBeNull();
    // groups and their order stay
    expect(Array.from(document.querySelectorAll('[data-testid="lib-group"]')).map((item) => (item as HTMLElement).dataset.group)).toEqual([
      'flow',
      'calculation',
      'indicators',
      'trends',
      'market',
      'account',
      'actions',
      'rules',
    ]);
  });

  it('says that a strategy begins with a trigger when the first element is none, and still lays it out', async () => {
    const user = userEvent.setup();
    mockApi({ findings: () => [{ level: 'error', code: 'flow.main_without_trigger', element: null, subject: null, details: {} }] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('1 Befund');
    });

    await user.click(entry('Bedingung'));

    const message = await screen.findByTestId('message');
    expect(within(screen.getByTestId('props')).getByTestId('message')).toBe(message);
    expect(message).toHaveTextContent('Eine Strategie beginnt mit einem Auslöser. Wählen Sie zuerst Kerzenschluss, Tick oder Manuell in der Elementbibliothek.');
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
    });
    expect(screen.getByTestId('findings-count')).toHaveTextContent('1 Befund');
    expect(screen.getByTestId('canvas')).not.toHaveTextContent('Eine Strategie beginnt mit einem Auslöser');
  });

  it('says it for a drop onto the empty drawing area as well', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');

    fireEvent.drop(await screen.findByTestId('viewport'), {
      clientX: 120,
      clientY: 90,
      dataTransfer: { getData: (type: string) => (type === LIBRARY_DRAG_TYPE ? (entry('Berechnung').dataset.lib ?? '') : ''), types: [LIBRARY_DRAG_TYPE] },
    });

    expect(await screen.findByTestId('message')).toHaveTextContent('Eine Strategie beginnt mit einem Auslöser.');
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
    });
  });

  it('says nothing when the first element is a trigger, and nothing when a step follows a trigger', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');

    await user.click(entry('Kerzenschluss'));
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
    });
    await user.click(entry('Bedingung'));
    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(2);
    });

    expect(document.body.textContent).not.toContain('Eine Strategie beginnt mit einem Auslöser. Wählen');
  });

  it('says it for "Verbindung" in an empty strategy', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');

    await user.click(entry('Verbindung'));

    expect(await screen.findByTestId('message')).toHaveTextContent('Eine Strategie beginnt mit einem Auslöser.');
    expect(screen.queryByTestId('armed-banner')).toBeNull();
  });

  it('names the triggers in the hint of the empty strategy', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');

    const hint = await screen.findByTestId('empty-strategy-hint');
    expect(hint).toHaveTextContent('In der Elementbibliothek sind die Auslöser gekennzeichnet: Kerzenschluss, Tick oder Manuell.');
    expect(hint.textContent).not.toContain('Ablaufsteuerung');
  });
});

describe('steps and suppliers of values (F8)', () => {
  it('marks the groups: steps in the flow, suppliers of values', async () => {
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    for (const [id, role, text] of [
      ['flow', 'step', 'Schritt im Ablauf'],
      ['calculation', 'step', 'Schritt im Ablauf'],
      ['actions', 'step', 'Schritt im Ablauf'],
      ['indicators', 'value', 'liefert Werte'],
      ['trends', 'value', 'liefert Werte'],
      ['market', 'value', 'liefert Werte'],
      ['account', 'value', 'liefert Werte'],
      ['rules', 'value', 'liefert Werte'],
    ] as const) {
      const mark = within(group(id)).getByTestId('lib-group-role');
      expect(mark).toHaveAttribute('data-role', role);
      expect(mark).toHaveTextContent(text);
      expect(mark).toHaveAttribute('data-tip', expect.stringMatching(/\S/));
    }
  });

  it('is in English as well', async () => {
    mockApi({ language: 'en' });
    renderWithProviders(<App />, 'en');
    await waitFor(() => {
      expect(screen.getByTestId('menu-new')).toBeEnabled();
    });

    expect(within(group('flow')).getByTestId('lib-group-role')).toHaveTextContent('Step in the flow');
    expect(within(group('indicators')).getByTestId('lib-group-role')).toHaveTextContent('supplies values');
    expect(within(entry('Candle close')).getByTestId('lib-trigger')).toHaveTextContent('Trigger');
  });

  it('shows steps and objects in different shapes, and the legend names both', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(nodeByName('Kreuzen')).toBeInTheDocument();
    });

    // steps are boxes of the class "node", objects are cards of the class "card" (the styles give them different shapes)
    expect(nodeByName('Kreuzen')).toHaveClass('node');
    expect(document.querySelectorAll('[data-testid="card"]').length).toBeGreaterThan(0);
    expect(document.querySelector('[data-testid="card"]')).toHaveClass('card');
    expect(document.querySelector('[data-testid="card"]')).not.toHaveClass('node');
    const legend = document.querySelector('.legend') as HTMLElement;
    expect(within(legend).getByTestId('legend-step')).toHaveTextContent('Schritt im Ablauf: Rechteck mit Eingang oben und Ausgang unten');
    expect(within(legend).getByTestId('legend-object')).toHaveTextContent('Objekt, liefert Werte: abgerundete Karte');
  });

  describe('says why a connection is not possible', () => {
    async function openEma(user: ReturnType<typeof userEvent.setup>): Promise<void> {
      mockApi();
      renderWithProviders(<App />, 'de');
      await waitForReady();
      await openStored(user, 'EMA-Trendfolge');
      await waitFor(() => {
        expect(nodeByName('Kreuzen')).toBeInTheDocument();
      });
    }

    function firstCardName(): string {
      return (document.querySelector('[data-testid="card"]') as HTMLElement).dataset.nodeName as string;
    }

    it('when an object is chosen as the next step of a step', async () => {
      const user = userEvent.setup();
      await openEma(user);
      const object = firstCardName();
      clickNode(nodeByName('Kreuzen'));
      await screen.findByTestId('props-element');
      await user.click(entry('Verbindung'));
      await screen.findByTestId('armed-banner');

      clickNode(nodeByName(object));

      const message = await screen.findByTestId('message');
      expect(message).toHaveTextContent(`„${object}“ liefert Werte und gehört nicht in den Ablauf.`);
      expect(message).toHaveTextContent('Verbinden Sie einen seiner Werte mit dem Schritt, der ihn braucht');
      expect(screen.queryByTestId('armed-banner')).toBeNull();
    });

    it('when an object is chosen to continue from', async () => {
      const user = userEvent.setup();
      await openEma(user);
      const object = firstCardName();
      clickNode(nodeByName(object));

      await user.click(entry('Verbindung'));

      const message = await screen.findByTestId('message');
      expect(message).toHaveTextContent(`„${object}“ liefert Werte und gehört nicht in den Ablauf.`);
      expect(message).toHaveTextContent('Ziehen Sie eine Linie von einem seiner Werte');
    });

    it('when a value is chosen and another object is chosen to take it', async () => {
      const user = userEvent.setup();
      await openEma(user);
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="card"]'));
      expect(cards.length).toBeGreaterThan(1);
      const [from, to] = cards as [HTMLElement, HTMLElement];
      const port = from.querySelector<HTMLElement>('[data-testid="card-row"] .port.prop') as HTMLElement;
      fireEvent.click(port);
      await screen.findByTestId('armed-banner');

      clickNode(to);

      expect(await screen.findByTestId('armed-banner')).toHaveTextContent(`„${to.dataset.nodeName}“ nimmt keinen Wert an.`);
    });

    it('with no step chosen', async () => {
      const user = userEvent.setup();
      await openEma(user);

      await user.click(entry('Verbindung'));

      expect(await screen.findByTestId('message')).toHaveTextContent('Wählen Sie zuerst den Schritt, von dem es weitergeht.');
    });
  });
});
