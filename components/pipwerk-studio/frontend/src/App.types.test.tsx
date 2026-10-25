import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { ElementDocument, InputDocument, StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { UNKNOWN_GROUP, inventedStrategy, inventedTypesWithMethodJson } from './testing/inventedTypes';

// Specification E2, 3.1, 3.3, 7: the interface is built from the type descriptions and knows no single type. A type
// description with a method and a group the interface has no name for is no reason to stop; a document with inputs of
// every kind is opened and saved without losing a field (order 11).

const gauge: ElementDocument = {
  id: '99999999-9999-4999-8999-999999999999',
  type: 'zz.gauge',
  name: null,
  key: null,
  position: null,
  parameters: {},
  properties: {},
  inputs: [],
  rules: [],
  management_of: null,
  instance: {
    name: 'Pegel',
    key: 'pegel',
    object_type: 'zz.gauge',
    origin: { object_type: 'zz.gauge', template_id: null },
    first_use: null,
    parameter_values: { takt: { kind: 'fixed', value: 'fast' } },
  },
};

const inputsOfEveryKind: InputDocument[] = [
  { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false },
  { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: true },
  { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5], refresh: false },
  { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [7], refresh: true },
];

function strategyWithInputs(): StrategyDocument {
  const document = inventedStrategy();
  const doIt = document.elements.find((element) => element.name === 'Tun') as ElementDocument;
  const meter = document.elements.find((element) => element.instance?.key === 'messer') as ElementDocument;
  const withUse: ElementDocument = { ...meter, instance: { ...(meter.instance as NonNullable<ElementDocument['instance']>), first_use: doIt.id } };
  return {
    ...document,
    elements: document.elements.map((element) => (element === doIt ? { ...doIt, inputs: inputsOfEveryKind } : element === meter ? withUse : element)).concat(gauge),
  };
}

async function open(user: ReturnType<typeof userEvent.setup>, document: StrategyDocument) {
  const api = mockApi({ types: inventedTypesWithMethodJson, strategies: [document as unknown as Record<string, unknown>] });
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, document.name);
  await waitFor(() => {
    expect(nodeByName('Weiche')).toBeInTheDocument();
  });
  return api;
}

describe('a type description with a method and a group the interface does not know', () => {
  it('shows the group behind the known ones with its identifier as the name, and its entry like any other', async () => {
    const user = userEvent.setup();
    await open(user, inventedStrategy());

    const groups = screen.getAllByTestId('lib-group');
    expect(groups.map((group) => group.getAttribute('data-group'))).toEqual(['flow', 'indicators', 'trends', 'market', 'actions', 'rules', UNKNOWN_GROUP]);
    const unknown = groups.at(-1) as HTMLElement;
    expect(within(unknown).getByRole('button', { name: new RegExp(UNKNOWN_GROUP) })).toBeInTheDocument();
    const item = within(unknown).getByTestId('lib-item');
    expect(item).toHaveAttribute('data-label', 'Pegel');
    expect(item).toHaveAttribute('data-tip', 'Erklärung Pegel');
  });

  it('lays out an object of such a type and builds its properties view from the description', async () => {
    const user = userEvent.setup();
    await open(user, inventedStrategy());

    await user.click(within(screen.getAllByTestId('lib-group').at(-1) as HTMLElement).getByTestId('lib-item'));

    await waitFor(() => {
      expect(nodeByName('Pegel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('element-name')).toHaveValue('Pegel');
    const props = within(screen.getByTestId('props-element'));
    expect(props.getByText('Takt')).toBeInTheDocument();
    expect(props.getByText('Stand')).toBeInTheDocument();
  });

  it('shows the group with the name of the interface when the interface has one', async () => {
    const user = userEvent.setup();
    await open(user, inventedStrategy());

    const known = screen.getAllByTestId('lib-group')[0] as HTMLElement;
    expect(within(known).getByRole('button', { name: /Ablaufsteuerung/ })).toBeInTheDocument();
  });
});

describe('a document with inputs of every kind', () => {
  it('is opened and saved with the five fields of every input and the first use of an instance as they were', async () => {
    const user = userEvent.setup();
    const document = strategyWithInputs();
    const api = await open(user, document);

    // the strategy is renamed, nothing else is changed
    const field = screen.getByTestId('strategy-name');
    await user.clear(field);
    await user.type(field, 'Anders');
    await menu(user, 'save');

    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const stored = api.requests('PUT', /strategies/)[0]?.body as StrategyDocument;
    const doIt = stored.elements.find((element) => element.name === 'Tun');
    expect(doIt?.inputs).toEqual(inputsOfEveryKind);
    expect(stored.elements.find((element) => element.instance?.key === 'messer')?.instance?.first_use).toBe(doIt?.id);
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.first_use).toBeNull();
  });

  it('shows an input of a method like a value of the object and keeps it when another input is removed', async () => {
    const user = userEvent.setup();
    const document = strategyWithInputs();
    const api = await open(user, document);
    clickNode(nodeByName('Tun'));
    await screen.findByTestId('props-element');

    // the two entries of "messer.stand" are one value; the two methods with other arguments are two values
    const rows = within(screen.getByTestId('sec-used')).getAllByTestId('used-row');
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.getAttribute('data-kind'))).toEqual(['property', 'method', 'method']);
    await user.click(within(rows[0] as HTMLElement).getByTestId('used-messer-stand-remove'));
    await menu(user, 'save');

    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const stored = api.requests('PUT', /strategies/)[0]?.body as StrategyDocument;
    const kept = stored.elements.find((element) => element.name === 'Tun')?.inputs ?? [];
    // the property "stand" of "messer" goes (both entries of it), the two inputs of the method stay as they are
    expect(kept.filter((input) => input.kind === 'method')).toEqual(inputsOfEveryKind.slice(2));
  });
});
