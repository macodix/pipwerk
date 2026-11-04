import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { choose, clickNode, menu, nodeByName, offeredChoices, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';

// Specification 5.4 (order 17, E11): the fields of an element ask "Woher kommt der Wert?", the data type stands in the
// explanation and not beside the label, and the instrument is shown in words with the way to choose another one and back.
// The tests run on the type descriptions of the product (a copy of the answer of the backend) and "EMA-Trendfolge".

async function openEma() {
  const user = userEvent.setup();
  const api = mockApi();
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
  return { user, api };
}

type Stored = { elements: { instance?: { name: string; parameter_values?: Record<string, { kind: string; value?: unknown }> } | null }[] };

async function saved({ user, api }: Awaited<ReturnType<typeof openEma>>): Promise<Stored> {
  await menu(user, 'save');
  await waitFor(() => {
    expect(api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
  });
  return api.requests('PUT', /strategies/).at(-1)?.body as Stored;
}

const valueOf = (stored: Stored, name: string, key: string) =>
  stored.elements.find((element) => element.instance?.name === name)?.instance?.parameter_values?.[key];

describe('the fields of an element (specification 5.4, E11)', () => {
  it('ask "Woher kommt der Wert?" at every field, name the answers in the words of the trader, and show no "Belegung"', async () => {
    const { user } = await openEma();
    clickNode(nodeByName('EMA20'));

    const settings = await screen.findByTestId('sec-settings');
    const fields = within(settings).getAllByTestId(/^field-/);
    expect(fields.length).toBeGreaterThan(2);
    for (const field of fields) {
      const id = field.getAttribute('data-field') as string;
      if (id === 'instrument') {
        continue;
      }
      expect(within(field).getByText('Woher kommt der Wert?'), id).toBeInTheDocument();
    }
    expect(screen.queryByText(/Belegung|Bindungsart/)).toBeNull();

    // the five answers, and only the ones that the type description allows for the field
    const period = within(settings).getByTestId('field-periode');
    expect(await offeredChoices(user, within(period).getByTestId('kind-periode'))).toEqual([
      'nicht belegt',
      'fest eingeben',
      'aus einem Strategieparameter',
      'von einem anderen Element',
      'aus einer Formel',
      'beim Start der Strategie festlegen',
    ]);
  });

  it('put the data type into the explanation shown on pointing at the field, in the words of the library, and not beside the label', async () => {
    await openEma();
    clickNode(nodeByName('EMA20'));

    const period = await screen.findByTestId('field-periode');
    // no mark beside the label
    expect(within(period).queryByText(/^(Ganzzahl|ganze Zahl|Zahl|Objekt)$/)).toBeNull();
    const tip = within(period).getByLabelText('Erklärung').getAttribute('data-tip') ?? '';
    expect(tip).toContain('Gefragt ist: ganze Zahl.');
    // a field of an object names the object type
    const instrument = screen.getByTestId('field-instrument');
    expect(within(instrument).getByLabelText('Erklärung').getAttribute('data-tip')).toContain('Gefragt ist: Instrument.');
  });

  it('write the same words in English, and the explanation names the data type in English', async () => {
    const { user } = await openEma();
    await switchLanguage(user, 'English');
    clickNode(nodeByName('EMA20'));

    const period = await screen.findByTestId('field-periode');
    expect(within(period).getByText('Where does the value come from?')).toBeInTheDocument();
    expect(within(period).getByLabelText('Explanation').getAttribute('data-tip')).toContain('Expected: whole number.');
    expect(await offeredChoices(user, within(period).getByTestId('kind-periode'))).toEqual([
      'not assigned',
      'enter a value',
      'from a strategy parameter',
      'from another element',
      'from a formula',
      'set when the strategy starts',
    ]);
    const instrument = screen.getByTestId('field-instrument');
    expect(within(instrument).getByText('Choose instrument (optional)')).toBeInTheDocument();
    expect(within(instrument).getByTestId('kind-instrument')).toHaveTextContent('Default instrument from strategy');
    expect(within(instrument).getByTestId('preset-explanation-instrument')).toHaveTextContent(
      'Without your own choice, the default instrument from the strategy applies. This is the instrument the strategy runs on; it is set only when the strategy starts. Choose an instrument here only if this element is to use a different one.',
    );
    expect(await offeredChoices(user, within(instrument).getByTestId('kind-instrument'))).toEqual([
      'Default instrument from strategy',
      'enter a value',
      'from a strategy parameter',
      'from another element',
      'from a formula',
      'set when the strategy starts',
    ]);
    expect(within(instrument).queryByText('Where does the value come from?')).toBeNull();
  });

  it('label the instrument "Instrument wählen (optional)" with one choice that shows "Voreingestelltes Instrument aus Strategie" and the explanation below it', async () => {
    const { user } = await openEma();
    clickNode(nodeByName('EMA20'));

    const field = await screen.findByTestId('field-instrument');
    expect(within(field).getByText('Instrument wählen (optional)')).toBeInTheDocument();
    // one choice, preset and visible; no question "Woher kommt der Wert?" and no button beside it
    expect(within(field).getAllByTestId(/^kind-/)).toHaveLength(1);
    expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('Voreingestelltes Instrument aus Strategie');
    expect(within(field).queryByText('Woher kommt der Wert?')).toBeNull();
    expect(within(field).queryByRole('button', { name: /wieder das Instrument|anderes Instrument/ })).toBeNull();
    expect(within(field).queryByText(/auf dem die Strategie läuft$/)).toBeNull();
    // the explanation is visible, not only on pointing
    expect(within(field).getByTestId('preset-explanation-instrument')).toHaveTextContent(
      'Ohne eigene Wahl gilt das voreingestellte Instrument aus der Strategie. Das ist das Instrument, auf dem die Strategie läuft; es wird erst beim Start der Strategie festgelegt. Wählen Sie hier nur ein Instrument, wenn dieses Element ein anderes verwenden soll.',
    );
    // nothing to type while the preset applies
    expect(within(field).queryByTestId('value-instrument')).toBeNull();
    // the other entries are the allowed ways to assign, in the words of the trader
    expect(await offeredChoices(user, within(field).getByTestId('kind-instrument'))).toEqual([
      'Voreingestelltes Instrument aus Strategie',
      'fest eingeben',
      'aus einem Strategieparameter',
      'von einem anderen Element',
      'aus einer Formel',
      'beim Start der Strategie festlegen',
    ]);
  });

  it('show an empty input with "zum Beispiel EURUSD" at "fest eingeben"; it stays the preset while it is empty and holds what is typed', async () => {
    const run = await openEma();
    const { user } = run;
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-instrument');

    await choose(user, within(field).getByTestId('kind-instrument'), 'fest eingeben');
    const input = within(field).getByTestId('value-instrument');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'zum Beispiel EURUSD');
    expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('fest eingeben');
    // empty: the preset applies in the document, and the choice shows it again as soon as the input is left
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });
    await user.click(screen.getByTestId('props'));
    await waitFor(() => {
      expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('Voreingestelltes Instrument aus Strategie');
    });
    expect(within(field).queryByTestId('value-instrument')).toBeNull();

    // a typed instrument is kept
    await choose(user, within(field).getByTestId('kind-instrument'), 'fest eingeben');
    await user.type(within(field).getByTestId('value-instrument'), 'EURUSD');
    expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('fest eingeben');
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'EURUSD' });
  });

  it('go back to the preset over the first entry of the choice, from a typed instrument and from another way', async () => {
    const run = await openEma();
    const { user } = run;
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-instrument');

    await choose(user, within(field).getByTestId('kind-instrument'), 'fest eingeben');
    await user.type(within(field).getByTestId('value-instrument'), 'EURUSD');
    await choose(user, within(field).getByTestId('kind-instrument'), 'Voreingestelltes Instrument aus Strategie');
    expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('Voreingestelltes Instrument aus Strategie');
    expect(within(field).queryByTestId('value-instrument')).toBeNull();
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });

    // from "aus einem Strategieparameter"
    await choose(user, within(field).getByTestId('kind-instrument'), 'aus einem Strategieparameter');
    expect(within(field).getByTestId('kind-instrument')).toHaveTextContent('aus einem Strategieparameter');
    await choose(user, within(field).getByTestId('kind-instrument'), 'Voreingestelltes Instrument aus Strategie');
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });
  });

  it('show the same field at the order, with "diese Order" in the explanation', async () => {
    await openEma();
    clickNode(nodeByName('Order aufgeben'));

    const order = await screen.findByTestId('sec-order');
    const instrument = within(order).getByTestId('field-instrument');
    expect(within(instrument).getByText('Instrument wählen (optional)')).toBeInTheDocument();
    expect(within(instrument).getByTestId('kind-instrument')).toHaveTextContent('Voreingestelltes Instrument aus Strategie');
    expect(within(instrument).getByTestId('preset-explanation-instrument')).toHaveTextContent('wenn diese Order ein anderes verwenden soll.');
    expect(within(instrument).getByTestId('preset-explanation-instrument')).not.toHaveTextContent('dieses Element');
    expect(screen.queryByText(/Belegung/)).toBeNull();
  });
});
