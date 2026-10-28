import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { inventedStrategy, inventedTypesJson } from './testing/inventedTypes';

// Specification 5.3: the drawing area has no area for objects; the switch "Weitere Verwendungen" starts with "Auswahl";
// the legend explains the lines; a value is connected by clicking its row and then an element, and only an element at
// which the instance is usable takes it (order 12). The lines themselves are tested with the model (`flowModel.test`) and
// in the browser (`e2e/canvas.spec`).

type Json = Record<string, unknown>;

async function open(document: StrategyDocument, usage?: (document: Json) => Json) {
  const user = userEvent.setup();
  const api = mockApi({ types: inventedTypesJson, strategies: [document as unknown as Json], usage });
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, document.name);
  await waitFor(() => {
    expect(nodeByName('Weiche')).toBeInTheDocument();
  });
  return { user, api };
}

/** The strategy in which nobody uses the meter: the condition no longer names it. */
function strategyWithUnusedMeter(): StrategyDocument {
  const document = inventedStrategy();
  return {
    ...document,
    elements: document.elements.map((element) =>
      element.name === 'Weiche' ? { ...element, parameters: { formel: { kind: 'expression', value: '1 > 0' } } } : element,
    ),
  };
}

function ids(document: StrategyDocument) {
  const byName = (name: string) => document.elements.find((element) => element.name === name)?.id ?? '';
  return {
    meter: document.elements.find((element) => element.instance?.key === 'messer')?.id ?? '',
    when: byName('Weiche'),
    doIt: byName('Tun'),
    place: byName('Ausführen'),
  };
}

function report(document: Json, part: Json): Json {
  const meter = (document.elements as Json[]).find((element) => (element.instance as Json | undefined)?.key === 'messer')?.id;
  return {
    instances: [
      {
        instance: 'messer',
        name: 'Messer',
        element: meter,
        object_type: 'zz.meter',
        can_refresh: false,
        connected: true,
        first_use: null,
        first_use_source: null,
        usable_everywhere: true,
        usable_at: [],
        usable_at_omitted: false,
        ...part,
      },
    ],
    elements: [],
    strategy_rules: [],
    truncated: false,
  };
}

describe('the switch "Weitere Verwendungen" and the legend (specification 5.3)', () => {
  it('has no area for objects, starts with "Auswahl" and switches between the three positions', async () => {
    const { user } = await open(inventedStrategy());

    expect(screen.queryByTestId('lane')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lane-empty')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Objekte und ihre Werte');
    const group = screen.getByTestId('wires-switch');
    expect(within(group).getByText('Weitere Verwendungen')).toBeInTheDocument();
    expect(screen.getByTestId('wires-selection')).toHaveClass('on');
    expect(screen.getByTestId('wires-all')).not.toHaveClass('on');

    await user.click(screen.getByTestId('wires-all'));
    expect(screen.getByTestId('wires-all')).toHaveClass('on');
    expect(screen.getByTestId('wires-selection')).not.toHaveClass('on');
    await user.click(screen.getByTestId('wires-off'));
    expect(screen.getByTestId('wires-off')).toHaveClass('on');
    await user.click(screen.getByTestId('wires-selection'));
    expect(screen.getByTestId('wires-selection')).toHaveClass('on');
  });

  it('explains the lines in a legend: flow, management, first use, further uses and "Aktualisieren"', async () => {
    await open(inventedStrategy());

    const legend = document.querySelector('.legend');
    expect(legend).not.toBeNull();
    const rows = Array.from(legend?.querySelectorAll('.legend-row') ?? []).map((row) => row.textContent);
    expect(rows).toHaveLength(5);
    expect(rows.join('|')).toContain('durchgezogen');
    expect(rows.join('|')).toContain('gestrichelt');
    expect(rows.join('|')).toContain('Aktualisieren');
  });

  it('names the part of the flow at "gestellt" "Order- und Positionsverwaltung" in the frame, the legend and the buttons (E1)', async () => {
    await open(inventedStrategy());

    const frame = screen.getByTestId('frame');
    expect(frame).toHaveTextContent('Order- und Positionsverwaltung · Ausführen');
    expect(screen.getByTestId('frame-toggle')).toHaveAccessibleName('Order- und Positionsverwaltung einklappen');
    expect(document.querySelector('.legend')?.textContent).toContain('Order- und Positionsverwaltung einer Order');
    expect(screen.getByTestId('canvas').textContent?.replace(/Order- und Positionsverwaltung/g, '')).not.toMatch(/Verwaltung/);
  });

  it('shows no name of a program library on the drawing area, and the drawing area stays operable (B3)', async () => {
    await open(inventedStrategy());

    const canvas = screen.getByTestId('canvas');
    expect(canvas.textContent).not.toMatch(/React ?Flow/i);
    expect(canvas.querySelector('.react-flow__pane')).not.toBeNull();
    expect(screen.getAllByTestId('node').length).toBeGreaterThan(0);
  });

  it('puts no hint and no button of a hint on the drawing area, also not for an object without a connection', async () => {
    await open(strategyWithUnusedMeter());

    const canvas = screen.getByTestId('canvas');
    expect(within(canvas).queryByRole('status')).not.toBeInTheDocument();
    expect(canvas.querySelector('.empty-card')).toBeNull();
    expect(nodeByName('Messer')).toHaveAttribute('data-unconnected', '1');
  });
});

describe('connecting a value by clicking (specification 5.3)', () => {
  it('writes an input and makes the element the one of the first use when the object is not used yet', async () => {
    const document = strategyWithUnusedMeter();
    const { user, api } = await open(document, (current) => report(current, { connected: false }));
    const { meter, doIt } = ids(document);

    fireEvent.click(within(nodeByName('Messer')).getByTestId('port-prop-stand'));
    await screen.findByTestId('armed-banner');
    expect(screen.getByTestId('armed-banner')).toHaveTextContent('Wählen Sie jetzt das Element, das den Wert verwenden soll.');
    clickNode(nodeByName('Tun'));
    await waitFor(() => {
      expect(screen.queryByTestId('armed-banner')).not.toBeInTheDocument();
    });

    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const stored = api.requests('PUT', /strategies/)[0]?.body as StrategyDocument;
    expect(stored.elements.find((element) => element.id === doIt)?.inputs).toEqual([
      { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false },
    ]);
    expect(stored.elements.find((element) => element.id === meter)?.instance?.first_use).toBe(doIt);
  });

  it('refuses an element at which the instance is not usable, says why, and takes another one', async () => {
    const document = inventedStrategy();
    const { meter, when, doIt } = ids(document);
    const { user, api } = await open(document, (current) =>
      report(current, { first_use: when, first_use_source: 'flow', usable_everywhere: false, usable_at: [when] }),
    );

    fireEvent.click(within(nodeByName('Messer')).getByTestId('port-prop-stand'));
    await screen.findByTestId('armed-banner');
    // the report of the backend names the elements at which the object is usable
    await waitFor(() => {
      expect(nodeByName('Tun')).toHaveAttribute('data-accepts', 'no');
    });
    expect(nodeByName('Weiche')).toHaveAttribute('data-accepts', 'yes');
    clickNode(nodeByName('Tun'));

    const banner = await screen.findByTestId('armed-banner');
    await waitFor(() => {
      expect(banner).toHaveTextContent('lässt sich an „Tun“ nicht verwenden');
    });
    expect(banner).toHaveTextContent('zuerst an „Weiche“ ermittelt');
    // the element did not get an input, and the wish to connect is still there
    expect(screen.getByTestId('armed-banner')).toBeInTheDocument();

    clickNode(nodeByName('Weiche'));
    await waitFor(() => {
      expect(screen.queryByTestId('armed-banner')).not.toBeInTheDocument();
    });
    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const stored = api.requests('PUT', /strategies/)[0]?.body as StrategyDocument;
    expect(stored.elements.find((element) => element.id === doIt)?.inputs).toEqual([]);
    expect(stored.elements.find((element) => element.id === when)?.inputs).toHaveLength(1);
    // the first use stays as it was: the object was used already
    expect(stored.elements.find((element) => element.id === meter)?.instance?.first_use ?? null).toBeNull();
  });

  it('takes a click on the same row back, and a click on the drawing area', async () => {
    const document = inventedStrategy();
    const { user } = await open(document);

    const row = within(nodeByName('Messer')).getByTestId('port-prop-stand');
    fireEvent.click(row);
    await screen.findByTestId('armed-banner');
    fireEvent.click(row);
    await waitFor(() => {
      expect(screen.queryByTestId('armed-banner')).not.toBeInTheDocument();
    });
    fireEvent.click(row);
    await screen.findByTestId('armed-banner');
    await user.click(within(screen.getByTestId('armed-banner')).getByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => {
      expect(screen.queryByTestId('armed-banner')).not.toBeInTheDocument();
    });
  });
});
