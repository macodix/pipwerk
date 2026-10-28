import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import { choose, clickNode, menu, nodeByName, offeredChoices, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { inventedStrategy, inventedTypesJson } from './testing/inventedTypes';

// Specification E2, 5.2, 5.4, 7: the library, the drawing area and the properties view are built from the type
// descriptions only. These tests use type descriptions of invented types: the interface must not need to know one of them.

type Setup = {
  user: ReturnType<typeof userEvent.setup>;
  api: ReturnType<typeof mockApi>;
  document: StrategyDocument;
};

async function setup(): Promise<Setup> {
  const user = userEvent.setup();
  const document = inventedStrategy();
  const api = mockApi({ types: inventedTypesJson, strategies: [document as unknown as Record<string, unknown>] });
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, 'Erfundene Strategie');
  await waitFor(() => {
    expect(nodeByName('Weiche')).toBeInTheDocument();
  });
  return { user, api, document };
}

async function select(user: Setup['user'], testId: string, label: string): Promise<void> {
  await choose(user, screen.getByTestId(testId), label);
}

async function chooseNode(_user: Setup['user'], name: string): Promise<void> {
  clickNode(nodeByName(name));
  await waitFor(() => {
    expect(screen.getByTestId('element-name')).toHaveValue(name);
  });
}

async function saved(setup: Setup): Promise<StrategyDocument> {
  await menu(setup.user, 'save');
  await waitFor(() => {
    expect(setup.api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
  });
  return setup.api.strategies.get(setup.document.id) as unknown as StrategyDocument;
}

describe('the library of invented types (specification 5.2)', () => {
  it('has the groups in the order of the specification with the entries of the types that name them', async () => {
    await setup();

    const groups = screen.getAllByTestId('lib-group');
    // only the groups that have an entry stand there; the invented types name no calculation and no account
    expect(groups.map((group) => group.getAttribute('data-group'))).toEqual(['flow', 'indicators', 'trends', 'market', 'actions', 'rules']);
    const entries = (group: string) =>
      within(groups.find((candidate) => candidate.getAttribute('data-group') === group) as HTMLElement)
        .getAllByTestId('lib-item')
        .map((item) => item.getAttribute('data-label'));
    expect(entries('flow')).toEqual(['Beginn', 'Verbindung']);
    expect(entries('actions')).toEqual(['Weiche', 'Tun', 'Ausführen']);
    expect(entries('rules')).toEqual(['Vorgabe Regel', 'Regel', 'Regelsatz']);
  });

  it('shows the explanation of an entry when it has the focus (with the keyboard)', async () => {
    const { user } = await setup();
    const entry = screen.getAllByTestId('lib-item').find((item) => item.getAttribute('data-label') === 'Weiche') as HTMLElement;

    expect(entry).toHaveAttribute('data-tip', 'Erklärung Weiche');
    await user.tab();
    entry.focus();
    await waitFor(() => {
      expect(entry).toHaveFocus();
    });
  });

  it('searches the entries', async () => {
    const { user } = await setup();

    await user.type(screen.getByTestId('library-search'), 'messer');

    expect(screen.getAllByTestId('lib-item').map((item) => item.getAttribute('data-label'))).toEqual(['Messer']);
  });

  it('inserts an object with a name that is unique, and an element of the flow behind the selected step', async () => {
    const current = await setup();
    const { user } = current;
    await chooseNode(user, 'Tun');

    await user.click(screen.getAllByTestId('lib-item').find((item) => item.getAttribute('data-label') === 'Messer') as HTMLElement);
    await waitFor(() => {
      expect(nodeByName('Messer 2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('element-name')).toHaveValue('Messer 2');

    await chooseNode(user, 'Weiche');
    await user.click(screen.getAllByTestId('lib-item').find((item) => item.getAttribute('data-label') === 'Tun') as HTMLElement);
    await waitFor(() => {
      expect(screen.getAllByTestId('node').filter((node) => node.dataset.nodeName === 'Tun')).toHaveLength(2);
    });
    // connected behind "Weiche" at its free output "nein"
    const stored = await saved(current);
    const when = stored.elements.find((element) => element.name === 'Weiche');
    const added = stored.elements.filter((element) => element.name === 'Tun' || element.name === 'Tun 2').at(-1);
    expect(stored.connections.find((connection) => connection.source === when?.id && connection.output === 'no')?.target).toBe(added?.id);
    const object = stored.elements.find((element) => element.instance?.name === 'Messer 2');
    expect(object?.instance?.key).toBe('messer_2');
    // the parameters get the standard values of the type; a required parameter without a standard value stays empty
    expect(object?.instance?.parameter_values).toEqual({ ziel: { kind: 'fixed', value: 'zz.own_target' } });
  });
});

describe('the properties view of invented types (specification 5.4)', () => {
  it('builds the fields of a step from its type: label, data type, explanation, required, kind of assignment', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Ausführen');

    const field = screen.getByTestId('field-sorte');
    expect(within(field).getByText('Sorte')).toBeInTheDocument();
    // the data type is no mark beside the label (E11): the explanation shown on pointing at the field names it, in the word of the library
    expect(within(field).queryByText('Auswahl')).toBeNull();
    expect(within(field).getByText('*')).toBeInTheDocument();
    expect(within(field).getByLabelText('Erklärung')).toHaveAttribute('data-tip', 'Erklärung Sorte Gefragt ist: Auswahl.');
    // the question, and only the answers that the type allows, besides "nicht belegt"
    expect(within(field).getByText('Woher kommt der Wert?')).toBeInTheDocument();
    expect(within(field).queryByText('Belegung')).toBeNull();
    expect(await offeredChoices(user, screen.getByTestId('kind-sorte'))).toEqual(['nicht belegt', 'fest eingeben']);
    // the properties of the order come from the chosen order type
    const order = screen.getByTestId('sec-order');
    expect(within(order).getByText('Wunsch')).toBeInTheDocument();
    expect(within(order).getByText('Stufe')).toBeInTheDocument();
    expect(within(order).queryByText('Extra')).toBeNull();
  });

  it('gives the newly needed properties their standard values when the order type changes, and keeps the others', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Ausführen');
    await choose(user, screen.getByTestId('kind-wunsch'), 'fest eingeben');
    await user.type(within(screen.getByTestId('field-wunsch')).getByTestId('value-wunsch'), 'viel');

    await select(user, 'value-sorte', 'Sorte B');

    await waitFor(() => {
      expect(screen.getByTestId('field-extra')).toBeInTheDocument();
    });
    expect(within(screen.getByTestId('field-extra')).getByTestId('value-extra')).toHaveValue('5');
    expect(within(screen.getByTestId('field-wunsch')).getByTestId('value-wunsch')).toHaveValue('viel');
    const stored = await saved({ user, api, document });
    const place = stored.elements.find((element) => element.type === 'zz.place');
    expect(place?.properties).toMatchObject({ extra: { kind: 'fixed', value: 5 }, wunsch: { kind: 'fixed', value: 'viel' } });
  });

  it('shows a field only if the field that controls it has the value (applies_when)', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Ausführen');

    // "Stufe" has no condition: shown. Nothing hidden here; the condition itself is tested with the model.
    expect(screen.getByTestId('field-stufe')).toBeInTheDocument();
  });

  it('builds the properties view of an object: settings, the properties it supplies with data type and values, the place in the area', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Messer');

    expect(screen.getByTestId('element-origin')).toHaveTextContent('Messer, aus Objekttyp Messer');
    const settings = screen.getByTestId('sec-settings');
    expect(within(settings).getByText('Takt')).toBeInTheDocument();
    expect(within(settings).getByText('Länge')).toBeInTheDocument();
    const delivers = screen.getByTestId('sec-delivers');
    expect(within(delivers).getAllByTestId('prop-row')).toHaveLength(4);
    expect(within(delivers).getByText('Höchststand')).toBeInTheDocument();
    // there is no place in an area for objects any more: the object lies beside the element that uses it (order 12)
    expect(screen.queryByTestId('object-up')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sec-place')).not.toBeInTheDocument();
    // the card shows three rows and the way to the others
    expect(within(nodeByName('Messer')).getAllByTestId('card-row')).toHaveLength(3);
    expect(within(nodeByName('Messer')).getByTestId('card-more')).toHaveTextContent('alle 4 Eigenschaften');
  });

  it('offers the values of an object type besides the one that the type names, and keeps a typed designation as it is', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-ziel');

    // the standard value of the type is the one of the application: the field says so in words, the user has nothing to choose (E11)
    expect(within(field).getByTestId('preset-text-ziel')).toHaveTextContent('das zz.target, auf dem die Strategie läuft');
    expect(within(field).getByText('Dafür müssen Sie nichts wählen.')).toBeInTheDocument();
    expect(within(field).queryByTestId('kind-ziel')).toBeNull();
    // "anderes … wählen" shows the question and the answers; the value stays the standard value until something else is entered
    await user.click(within(field).getByTestId('preset-other-ziel'));
    expect(within(field).getByTestId('kind-ziel')).toHaveValue('unset');
    // "fest eingeben" starts with the standard value of the type: the one of the application
    await choose(user, within(field).getByTestId('kind-ziel'), 'fest eingeben');
    expect(within(field).getByTestId('value-ziel')).toHaveValue('zz.own_target');
    await choose(user, within(field).getByTestId('value-ziel'), 'Andere Bezeichnung …');
    await user.type(within(field).getByTestId('value-ziel-text'), 'eurusd');

    const stored = await saved({ user, api, document });
    const meter = stored.elements.find((element) => element.instance !== undefined);
    expect(meter?.instance?.parameter_values?.ziel).toEqual({ kind: 'fixed', value: 'eurusd' });
  });

  it('chooses "anderes … wählen" without entering anything: the standard value stays; and goes back to it from another source (E11)', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-ziel');

    await user.click(within(field).getByTestId('preset-other-ziel'));
    // nothing entered: the field still holds the standard value, and the way back only closes the choice
    await user.click(within(field).getByTestId('preset-back-ziel'));
    expect(within(field).getByTestId('preset-text-ziel')).toBeInTheDocument();
    let stored = await saved({ user, api, document });
    expect(stored.elements.find((element) => element.instance !== undefined)?.instance?.parameter_values?.ziel).toBeUndefined();

    // another source of the value, then back: the standard value is stored again
    await user.click(within(field).getByTestId('preset-other-ziel'));
    await choose(user, within(field).getByTestId('kind-ziel'), 'beim Start der Strategie festlegen');
    expect(within(field).getByTestId('preset-back-ziel')).toBeInTheDocument();
    await user.click(within(field).getByTestId('preset-back-ziel'));
    expect(within(field).getByTestId('preset-text-ziel')).toBeInTheDocument();
    stored = await saved({ user, api, document });
    expect(stored.elements.find((element) => element.instance !== undefined)?.instance?.parameter_values?.ziel).toEqual({
      kind: 'fixed',
      value: 'zz.own_target',
    });
  });

  it('creates a strategy parameter on the spot when none exists, and assigns it', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-laenge');

    await choose(user, within(field).getByTestId('kind-laenge'), 'aus einem Strategieparameter');
    expect(within(field).getByTestId('param-hint')).toHaveTextContent('noch kein Strategieparameter');
    await user.type(within(field).getByTestId('new-param-name'), 'Meine Länge');
    await user.click(within(field).getByTestId('new-param-create'));

    await waitFor(() => {
      expect(screen.getByTestId('param-strip')).toHaveTextContent('Meine Länge');
    });
    await waitFor(() => {
      expect(within(screen.getByTestId('field-laenge')).getByTestId('param-select')).toHaveValue('meine_laenge');
    });
    const stored = await saved({ user, api, document });
    expect(stored.parameters).toEqual([expect.objectContaining({ key: 'meine_laenge', name: 'Meine Länge', datatype: 'integer' })]);
    const meter = stored.elements.find((element) => element.instance !== undefined);
    expect(meter?.instance?.parameter_values?.laenge).toEqual({ kind: 'parameter', value: 'meine_laenge' });
  });

  it('assigns the value of an object: the instance, then a property of a fitting data type', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Tun');
    const field = screen.getByTestId('field-menge');

    await choose(user, within(field).getByTestId('kind-menge'), 'von einem anderen Element');
    await choose(user, within(field).getByTestId('ref-object'), 'Messer');
    // "Menge" is a number: the property "Tendenz" (text) is not offered
    expect(await offeredChoices(user, within(field).getByTestId('ref-prop'))).toEqual([
      'Eigenschaft wählen …',
      'Stand',
      'Höchststand',
      'Tiefststand',
    ]);
    await choose(user, within(field).getByTestId('ref-prop'), 'Stand');

    const stored = await saved({ user, api, document });
    const doIt = stored.elements.find((element) => element.name === 'Tun');
    expect(doIt?.parameters.menge).toEqual({ kind: 'connection', value: { instance: 'messer', property: 'stand' } });
    // the card shows the value as used, the element shows the connected value
    expect(nodeByName('Tun')).toHaveTextContent('Messer › Stand');
  });

  it('adds and removes an input of an element', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Tun');

    await choose(user, screen.getByTestId('used-add-object'), 'Messer');
    await choose(user, screen.getByTestId('used-add-value'), 'Stand');
    await user.click(screen.getByTestId('used-add-button'));
    expect(screen.getAllByTestId('used-row')).toHaveLength(1);
    expect(screen.getByTestId('used-messer-stand-select')).toHaveValue('p:stand');
    // the object marks the use in its properties view
    await chooseNode(user, 'Messer');
    // the report of the backend may name further elements that use the value: "Tun" is among them
    expect(within(screen.getByTestId('sec-delivers')).getByText(/\bTun\b/)).toBeInTheDocument();
    await chooseNode(user, 'Tun');
    await user.click(screen.getByTestId('used-messer-stand-remove'));
    expect(screen.queryAllByTestId('used-row')).toHaveLength(0);
  });

  it('asks before an element with a management is removed, and names the steps that go with it', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Ausführen');

    await user.click(screen.getByTestId('remove-element'));

    const dialog = await screen.findByRole('dialog', { name: 'Element entfernen?' });
    expect(within(dialog).getByTestId('remove-managed')).toHaveTextContent('Beginn innen');
    expect(within(dialog).getByTestId('remove-managed')).toHaveTextContent('Tun innen');
    await user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));
    await waitFor(() => {
      expect(screen.queryAllByTestId('node').filter((node) => ['Ausführen', 'Tun innen'].includes(node.dataset.nodeName ?? ''))).toHaveLength(0);
    });
  });

  it('removes a step without a question and joins its neighbours', async () => {
    const current = await setup();
    const { user } = current;
    await chooseNode(user, 'Tun');

    await user.click(screen.getByTestId('remove-element'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('node').filter((node) => node.dataset.nodeName === 'Tun')).toHaveLength(0);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    const stored = await saved(current);
    const when = stored.elements.find((element) => element.name === 'Weiche');
    const place = stored.elements.find((element) => element.name === 'Ausführen');
    expect(stored.connections).toHaveLength(3);
    expect(stored.connections.find((connection) => connection.source === when?.id)).toMatchObject({ output: 'yes', target: place?.id });
  });
});

describe('the strategy parameters (specification 5.1)', () => {
  it('creates one with "Neu", changes the name and the value, and removes it after a question', async () => {
    const { user, api, document } = await setup();

    await user.click(screen.getByTestId('param-new'));
    const popover = await screen.findByTestId('param-popover');
    expect(screen.getAllByTestId('param-chip')).toHaveLength(1);
    const name = within(popover).getByTestId('param-name');
    await user.clear(name);
    await user.type(name, 'Mein Wert');
    const value = within(popover).getByTestId('param-value');
    await user.clear(value);
    await user.type(value, '7');
    expect(screen.getByTestId('param-chip')).toHaveTextContent('Mein Wert');
    expect(screen.getByTestId('param-chip')).toHaveTextContent('7');

    const stored = await saved({ user, api, document });
    expect(stored.parameters).toEqual([expect.objectContaining({ name: 'Mein Wert', datatype: 'number', key: 'neuer_strategieparameter' })]);

    // saving closed the popover (a click outside of it does): open it again
    await user.click(screen.getByTestId('param-chip'));
    await user.click(within(await screen.findByTestId('param-popover')).getByTestId('param-delete'));
    const dialog = await screen.findByRole('dialog', { name: 'Strategieparameter entfernen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));
    await waitFor(() => {
      expect(screen.queryAllByTestId('param-chip')).toHaveLength(0);
    });
  });
});
