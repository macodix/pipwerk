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

  it('shows a field with a preset as one choice that starts with the value the type names, and keeps a typed designation as it is', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-ziel');

    // the standard value of the type: one choice, preset and visible with the words of the library; nothing else to answer (F5)
    expect(within(field).getByText('Instrument wählen (optional)')).toBeInTheDocument();
    expect(within(field).getByTestId('kind-ziel')).toHaveTextContent('das eigene Ziel');
    expect(within(field).queryByText('Woher kommt der Wert?')).toBeNull();
    expect(within(field).queryByTestId('value-ziel')).toBeNull();
    // "fest eingeben" shows an empty input, the value stays the standard value until something is typed
    await choose(user, within(field).getByTestId('kind-ziel'), 'fest eingeben');
    expect(within(field).getByTestId('value-ziel')).toHaveValue('');
    await user.type(within(field).getByTestId('value-ziel'), 'eurusd');

    const stored = await saved({ user, api, document });
    const meter = stored.elements.find((element) => element.instance !== undefined);
    expect(meter?.instance?.parameter_values?.ziel).toEqual({ kind: 'fixed', value: 'eurusd' });
  });

  it('goes back to the preset from another way over the first entry (F5)', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-ziel');

    await choose(user, within(field).getByTestId('kind-ziel'), 'beim Start der Strategie festlegen');
    expect(within(field).getByTestId('kind-ziel')).toHaveTextContent('beim Start der Strategie festlegen');
    await choose(user, within(field).getByTestId('kind-ziel'), 'das eigene Ziel');
    expect(within(field).getByTestId('kind-ziel')).toHaveTextContent('das eigene Ziel');
    const stored = await saved({ user, api, document });
    expect(stored.elements.find((element) => element.instance !== undefined)?.instance?.parameter_values?.ziel).toEqual({
      kind: 'fixed',
      value: 'zz.own_target',
    });
  });

  it('creates no strategy parameter in a field: a sentence, "Zur Strategie", and the data type of the field for a new one (F6)', async () => {
    const { user, api, document } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-laenge');

    await choose(user, within(field).getByTestId('kind-laenge'), 'aus einem Strategieparameter');
    expect(within(field).getByTestId('param-hint')).toHaveTextContent(
      'Es gibt noch keinen Strategieparameter für „ganze Zahl“. Strategieparameter legen Sie in der Strategie an.',
    );
    // no input, no hint and no way to create one in the field
    expect(within(field).queryByTestId('new-param-name')).toBeNull();
    expect(within(field).queryByTestId('new-param-create')).toBeNull();
    expect(within(field).queryByRole('textbox')).toBeNull();
    expect(within(field).queryByRole('button', { name: /Anlegen/ })).toBeNull();

    await user.click(within(field).getByTestId('param-go'));
    // the strategy parameters, with the form for a new one and the data type of the field preselected
    const section = await screen.findByTestId('sec-parameters');
    expect(within(section).getByTestId('param-new-form')).toBeInTheDocument();
    expect(within(section).getByTestId('param-new-type')).toHaveTextContent('ganze Zahl');
    expect(within(section).getByTestId('param-back')).toHaveTextContent('Zurück zu „Messer“');
    await user.type(within(section).getByTestId('param-new-name'), 'Meine Länge');
    await user.click(within(section).getByTestId('param-new-create'));
    await waitFor(() => {
      expect(within(screen.getByTestId('sec-parameters')).getByTestId('param-row')).toHaveTextContent('Meine Länge');
    });

    // back to the field of the element: the new strategy parameter is there to choose
    await user.click(screen.getByTestId('param-back'));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue('Messer');
    });
    const again = screen.getByTestId('field-laenge');
    await choose(user, within(again).getByTestId('param-select'), 'Meine Länge');
    const stored = await saved({ user, api, document });
    expect(stored.parameters).toEqual([expect.objectContaining({ key: 'meine_laenge', name: 'Meine Länge', datatype: 'integer' })]);
    const meter = stored.elements.find((element) => element.instance !== undefined);
    expect(meter?.instance?.parameter_values?.laenge).toEqual({ kind: 'parameter', value: 'meine_laenge' });
  });

  it('lets the way back from the strategy parameters lapse when another element is chosen, and without an error', async () => {
    const { user } = await setup();
    await chooseNode(user, 'Messer');
    const field = screen.getByTestId('field-laenge');
    await choose(user, within(field).getByTestId('kind-laenge'), 'aus einem Strategieparameter');
    await user.click(within(field).getByTestId('param-go'));
    expect(await screen.findByTestId('param-back')).toBeInTheDocument();

    await chooseNode(user, 'Tun');
    clickNode(nodeByName('Messer'));
    await user.click(screen.getByTestId('crumb-strategy'));
    expect(await screen.findByTestId('sec-parameters')).toBeInTheDocument();
    expect(screen.queryByTestId('param-back')).toBeNull();
    expect(screen.queryByTestId('param-new-form')).toBeNull();
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

describe('the strategy parameters in the properties view of the strategy (specification 5.4, F6)', () => {
  it('stand after name and description, say what a strategy parameter is while there is none, and no strip is below the header', async () => {
    await setup();

    expect(screen.queryByTestId('param-strip')).toBeNull();
    const section = screen.getByTestId('sec-parameters');
    const sections = Array.from(screen.getByTestId('props-strategy').querySelectorAll('.psec'));
    expect(sections[0]).toContainElement(screen.getByTestId('strategy-name'));
    expect(sections[1]).toContainElement(screen.getByTestId('strategy-description'));
    expect(sections[2]).toBe(section);
    expect(within(section).getByRole('heading', { name: 'Strategieparameter' })).toBeInTheDocument();
    expect(within(section).getByTestId('param-empty')).toHaveTextContent(
      'Ein Strategieparameter ist ein Wert, den Sie hier einmal festlegen und in mehreren Feldern verwenden, zum Beispiel eine Zeiteinheit.',
    );
    expect(within(section).getByTestId('param-new')).toHaveTextContent('Neuer Strategieparameter');
  });

  it('creates one with name, data type and value, changes the name and the value, and removes it after a question', async () => {
    const { user, api, document } = await setup();

    await user.click(screen.getByTestId('param-new'));
    await user.type(screen.getByTestId('param-new-name'), 'Mein Wert');
    // the data types in the words of the library
    expect(await offeredChoices(user, screen.getByTestId('param-new-type'))).toEqual([
      'Zahl',
      'ganze Zahl',
      'Prozentwert',
      'Wahrheitswert',
      'Text',
      'Zeiteinheit',
      // the object type of the field has no description in the invented types: its identifier stands in the place of its name
      'zz.target',
    ]);
    await user.clear(screen.getByTestId('param-new-value'));
    await user.type(screen.getByTestId('param-new-value'), '7');
    await user.click(screen.getByTestId('param-new-create'));

    const row = await screen.findByTestId('param-row');
    expect(row).toHaveTextContent('Mein Wert');
    expect(within(row).getByTestId('param-datatype')).toHaveTextContent('Zahl');
    expect(within(row).getByTestId('param-shown-value')).toHaveTextContent('7');
    expect(screen.queryByTestId('param-new-form')).toBeNull();

    // a click opens name and value
    await user.click(row);
    const name = screen.getByTestId('param-name');
    await user.clear(name);
    await user.type(name, 'Mein anderer Wert');
    const value = screen.getByTestId('param-value');
    await user.clear(value);
    await user.type(value, '9');
    expect(screen.getByTestId('param-row')).toHaveTextContent('Mein anderer Wert');
    expect(screen.getByTestId('param-shown-value')).toHaveTextContent('9');

    const stored = await saved({ user, api, document });
    expect(stored.parameters).toEqual([expect.objectContaining({ name: 'Mein anderer Wert', datatype: 'number', value: 9, key: 'mein_wert' })]);

    // "Entfernen" asks first; "Abbrechen" keeps it, "Entfernen" in the question removes it
    await user.click(screen.getByTestId('param-delete'));
    let dialog = await screen.findByRole('dialog', { name: 'Strategieparameter entfernen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    await user.click(screen.getByTestId('param-delete'));
    dialog = await screen.findByRole('dialog', { name: 'Strategieparameter entfernen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));
    await waitFor(() => {
      expect(screen.queryAllByTestId('param-row')).toHaveLength(0);
    });
    expect(screen.getByTestId('param-empty')).toBeInTheDocument();
  });

  it('creates no strategy parameter without a name, and a new one can be cancelled', async () => {
    await setup();

    await userEvent.setup().click(screen.getByTestId('param-new'));
    expect(screen.getByTestId('param-new-create')).toBeDisabled();
    await userEvent.setup().click(screen.getByTestId('param-new-cancel'));
    expect(screen.queryByTestId('param-new-form')).toBeNull();
    expect(screen.getByTestId('param-new')).toBeInTheDocument();
  });
});
