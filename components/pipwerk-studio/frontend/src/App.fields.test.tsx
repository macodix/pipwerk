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
    expect(within(screen.getByTestId('field-instrument')).getByTestId('preset-text-instrument')).toHaveTextContent('the instrument the strategy runs on');
    expect(within(screen.getByTestId('field-instrument')).getByTestId('preset-other-instrument')).toHaveTextContent('choose another instrument');
  });

  it('show the instrument as "das Instrument, auf dem die Strategie läuft" and say that the user has nothing to choose', async () => {
    await openEma();
    clickNode(nodeByName('EMA20'));

    const field = await screen.findByTestId('field-instrument');
    expect(within(field).getByTestId('preset-text-instrument')).toHaveTextContent('das Instrument, auf dem die Strategie läuft');
    expect(within(field).getByText('Dafür müssen Sie nichts wählen.')).toBeInTheDocument();
    expect(within(field).getByTestId('preset-other-instrument')).toHaveTextContent('anderes Instrument wählen');
    // the question and the answers appear only after "anderes Instrument wählen"
    expect(within(field).queryByText('Woher kommt der Wert?')).toBeNull();
    expect(within(field).queryByTestId('kind-instrument')).toBeNull();
  });

  it('choose another instrument, enter its designation, and go back to the instrument the strategy runs on', async () => {
    const run = await openEma();
    const { user } = run;
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-instrument');

    await user.click(within(field).getByTestId('preset-other-instrument'));
    expect(within(field).getByText('Woher kommt der Wert?')).toBeInTheDocument();
    // nothing entered so far: the standard value stays (shown as the value "Instrument der Anwendung" once "fest eingeben" is chosen)
    await choose(user, within(field).getByTestId('kind-instrument'), 'fest eingeben');
    expect(within(field).getByTestId('value-instrument')).toHaveValue('instrument_der_anwendung');
    await choose(user, within(field).getByTestId('value-instrument'), 'Andere Bezeichnung …');
    await user.type(within(field).getByTestId('value-instrument-text'), 'eurusd');
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'eurusd' });

    // the way back
    await user.click(within(field).getByTestId('preset-back-instrument'));
    expect(within(field).getByTestId('preset-text-instrument')).toHaveTextContent('das Instrument, auf dem die Strategie läuft');
    expect(valueOf(await saved(run), 'EMA20', 'instrument')).toEqual({ kind: 'fixed', value: 'instrument_der_anwendung' });
  });

  it('keep the standard value when "anderes Instrument wählen" is chosen and nothing is entered', async () => {
    const run = await openEma();
    const { user } = run;
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-instrument');

    await user.click(within(field).getByTestId('preset-other-instrument'));
    await user.click(within(field).getByTestId('preset-back-instrument'));

    expect(within(field).getByTestId('preset-text-instrument')).toBeInTheDocument();
    const value = valueOf(await saved(run), 'EMA20', 'instrument');
    expect(value === undefined || (value.kind === 'fixed' && value.value === 'instrument_der_anwendung')).toBe(true);
  });

  it('show the instrument in words also at the order, where it is a property of the order', async () => {
    await openEma();
    clickNode(nodeByName('Order aufgeben'));

    const order = await screen.findByTestId('sec-order');
    const instrument = within(order).getByTestId('field-instrument');
    expect(within(instrument).getByTestId('preset-text-instrument')).toHaveTextContent('das Instrument, auf dem die Strategie läuft');
    expect(screen.queryByText(/Belegung/)).toBeNull();
  });
});
