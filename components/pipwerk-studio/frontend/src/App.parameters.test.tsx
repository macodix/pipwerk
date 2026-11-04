import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { choose, clickNode, nodeByName, offeredChoices, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';

// Specification 5.4 (order 24, F5, F6): the strategy parameters stand in the properties view of the strategy and are
// created, changed and removed only there; a field only chooses among them and leads to the strategy when there is
// nothing to choose. The tests run on the type descriptions of the product and "EMA-Trendfolge".

async function openEma(language: 'Deutsch' | 'English' = 'Deutsch') {
  const user = userEvent.setup();
  const api = mockApi();
  renderWithProviders(<App />, 'de');
  await waitForReady();
  if (language === 'English') {
    await switchLanguage(user, 'English');
  }
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
  return { user, api };
}

const rowOf = (name: string): HTMLElement =>
  screen.getAllByTestId('param-row').find((row) => row.textContent?.includes(name)) as HTMLElement;

/** Removes the strategy parameter of the name through its editor and the question. */
async function removeParameter(user: Awaited<ReturnType<typeof openEma>>['user'], name: string, button: string): Promise<void> {
  if (screen.queryByTestId('param-delete') === null) {
    await user.click(rowOf(name));
  }
  await user.click(screen.getByTestId('param-delete'));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: button }));
}

describe('the strategy parameters in the properties view of the strategy (F6)', () => {
  it('list name, data type in the words of the library and value of each one, between the description and the rules', async () => {
    await openEma();

    const section = screen.getByTestId('sec-parameters');
    expect(screen.queryByTestId('param-strip')).toBeNull();
    const rows = within(section).getAllByTestId('param-row');
    expect(rows).toHaveLength(2);
    const zeiteinheit = rowOf('Zeiteinheit');
    expect(within(zeiteinheit).getByTestId('param-datatype')).toHaveTextContent('Zeiteinheit');
    expect(within(zeiteinheit).getByTestId('param-shown-value')).toHaveTextContent('M15');
    const stop = rowOf('Stop abstand');
    expect(within(stop).getByTestId('param-datatype')).toHaveTextContent('Zahl');
    expect(within(stop).getByTestId('param-shown-value')).toHaveTextContent('0');
    // the area is the third one of the properties view of the strategy: after name and description, before the rules
    const order = Array.from(screen.getByTestId('props-strategy').querySelectorAll<HTMLElement>('.psec')).map((element) =>
      element.getAttribute('data-testid'),
    );
    expect(order.indexOf('sec-parameters')).toBe(2);
    expect(order.indexOf('sec-rules')).toBe(3);
    // there is no empty note while there are strategy parameters
    expect(within(section).queryByTestId('param-empty')).toBeNull();
  });

  it('open name and value with a click, and change them', async () => {
    const { user, api } = await openEma();

    await user.click(rowOf('Stop abstand'));
    const name = screen.getByTestId('param-name');
    await user.clear(name);
    await user.type(name, 'Abstand');
    await user.click(screen.getByTestId('param-done'));
    expect(screen.queryByTestId('param-edit')).toBeNull();
    expect(within(rowOf('Abstand')).getByTestId('param-shown-value')).toHaveTextContent('0');

    await user.click(rowOf('Zeiteinheit'));
    await choose(user, screen.getByTestId('param-value'), 'H1');
    expect(within(rowOf('Zeiteinheit')).getByTestId('param-shown-value')).toHaveTextContent('H1');

    await user.click(screen.getByTestId('menu-save'));
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
    });
    const stored = api.requests('PUT', /strategies/).at(-1)?.body as { parameters: { name: string; value: unknown }[] };
    expect(stored.parameters.find((parameter) => parameter.name === 'Abstand')).toBeDefined();
    expect(stored.parameters.find((parameter) => parameter.name === 'Zeiteinheit')?.value).toBe('h1');
  });

  it('remove one only after the question, and keep it when the question is cancelled', async () => {
    const { user } = await openEma();

    await removeParameter(user, 'Stop abstand', 'Abbrechen');
    expect(screen.getAllByTestId('param-row')).toHaveLength(2);
    await removeParameter(user, 'Stop abstand', 'Entfernen');
    await waitFor(() => {
      expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    });
  });

  it('say what a strategy parameter is when there is none, in both languages', async () => {
    const { user } = await openEma();
    await removeParameter(user, 'Stop abstand', 'Entfernen');
    await waitFor(() => {
      expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    });
    await removeParameter(user, 'Zeiteinheit', 'Entfernen');

    const empty = await screen.findByTestId('param-empty');
    expect(empty).toHaveTextContent(
      'Ein Strategieparameter ist ein Wert, den Sie hier einmal festlegen und in mehreren Feldern verwenden, zum Beispiel eine Zeiteinheit.',
    );
    expect(screen.getByTestId('param-new')).toHaveTextContent('Neuer Strategieparameter');
    await switchLanguage(user, 'English');
    expect(await screen.findByTestId('param-empty')).toHaveTextContent(
      'A strategy parameter is a value you set here once and use in several fields, for example a timeframe.',
    );
    expect(screen.getByTestId('param-new')).toHaveTextContent('New strategy parameter');
  });

  it('create one with name, data type and value, and give a time unit its list of values', async () => {
    const { user, api } = await openEma();

    await user.click(screen.getByTestId('param-new'));
    expect(screen.getByTestId('param-new-form')).toBeInTheDocument();
    await user.type(screen.getByTestId('param-new-name'), 'Signalzeiteinheit');
    await choose(user, screen.getByTestId('param-new-type'), 'Zeiteinheit');
    await choose(user, screen.getByTestId('param-new-value'), 'H4');
    await user.click(screen.getByTestId('param-new-create'));

    const row = await waitFor(() => rowOf('Signalzeiteinheit'));
    expect(within(row).getByTestId('param-datatype')).toHaveTextContent('Zeiteinheit');
    expect(within(row).getByTestId('param-shown-value')).toHaveTextContent('H4');
    await user.click(screen.getByTestId('menu-save'));
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
    });
    const stored = api.requests('PUT', /strategies/).at(-1)?.body as { parameters: { name: string; datatype: string; value: unknown }[] };
    expect(stored.parameters.find((parameter) => parameter.name === 'Signalzeiteinheit')).toMatchObject({ datatype: 'time_unit', value: 'h4' });
  });
});

describe('a field chooses among the strategy parameters and creates none (F6)', () => {
  it('lists only the strategy parameters of a fitting data type, with no input and no "Anlegen" in the field', async () => {
    const { user } = await openEma();
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-zeiteinheit');

    await choose(user, within(field).getByTestId('kind-zeiteinheit'), 'aus einem Strategieparameter');
    expect(await offeredChoices(user, within(field).getByTestId('param-select'))).toEqual(['Strategieparameter wählen …', 'Zeiteinheit']);
    expect(within(field).queryByRole('textbox')).toBeNull();
    expect(within(field).queryByRole('button', { name: /Anlegen|Neuer Strategieparameter/ })).toBeNull();
    expect(within(field).queryByTestId('param-go')).toBeNull();
  });

  it('says why nothing can be chosen, leads to the strategy with the data type preselected, and back to the field', async () => {
    const { user, api } = await openEma();
    // no time unit among the strategy parameters any more
    await removeParameter(user, 'Zeiteinheit', 'Entfernen');
    await waitFor(() => {
      expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    });
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-zeiteinheit');
    await choose(user, within(field).getByTestId('kind-zeiteinheit'), 'aus einem Strategieparameter');

    // a number fits no time unit: the sentence names the data type of the field, and there is a way to the strategy
    expect(within(field).getByTestId('param-hint')).toHaveTextContent(
      'Es gibt noch keinen Strategieparameter für „Zeiteinheit“. Strategieparameter legen Sie in der Strategie an.',
    );
    expect(within(field).queryByRole('textbox')).toBeNull();
    await user.click(within(field).getByTestId('param-go'));

    const section = await screen.findByTestId('sec-parameters');
    expect(screen.getByTestId('props-strategy')).toBeInTheDocument();
    expect(within(section).getByTestId('param-new-form')).toBeInTheDocument();
    expect(within(section).getByTestId('param-new-type')).toHaveTextContent('Zeiteinheit');
    expect(within(section).getByTestId('param-back')).toHaveTextContent('Zurück zu „EMA20“');
    await user.type(within(section).getByTestId('param-new-name'), 'Meine Zeiteinheit');
    await user.click(within(section).getByTestId('param-new-create'));
    await waitFor(() => {
      expect(rowOf('Meine Zeiteinheit')).toBeDefined();
    });

    await user.click(screen.getByTestId('param-back'));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue('EMA20');
    });
    const back = screen.getByTestId('field-zeiteinheit');
    expect(within(back).getByTestId('kind-zeiteinheit')).toHaveTextContent('aus einem Strategieparameter');
    await choose(user, within(back).getByTestId('param-select'), 'Meine Zeiteinheit');
    expect(within(back).getByTestId('param-select')).toHaveTextContent('Meine Zeiteinheit');
    // no way back any more once the element is selected again
    await user.click(screen.getByTestId('crumb-strategy'));
    expect(screen.queryByTestId('param-back')).toBeNull();
    await user.click(screen.getByTestId('menu-save'));
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
    });
  });

  it('lets the way back lapse when the strategy is closed or the element is removed, without an error', async () => {
    const { user } = await openEma();
    await removeParameter(user, 'Zeiteinheit', 'Entfernen');
    await waitFor(() => {
      expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    });
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-zeiteinheit');
    await choose(user, within(field).getByTestId('kind-zeiteinheit'), 'aus einem Strategieparameter');
    await user.click(within(field).getByTestId('param-go'));
    expect(await screen.findByTestId('param-back')).toBeInTheDocument();

    // another element: the way back lapses, the form for the new strategy parameter is not shown any more
    clickNode(nodeByName('EMA50'));
    await user.click(screen.getByTestId('crumb-strategy'));
    expect(screen.queryByTestId('param-back')).toBeNull();
    expect(screen.queryByTestId('param-new-form')).toBeNull();

    // the strategy is closed
    clickNode(nodeByName('EMA20'));
    await choose(user, within(await screen.findByTestId('field-zeiteinheit')).getByTestId('kind-zeiteinheit'), 'aus einem Strategieparameter');
    await user.click(screen.getByTestId('param-go'));
    expect(await screen.findByTestId('param-back')).toBeInTheDocument();
    await user.click(screen.getByTestId('menu-close'));
    const dialog = screen.queryByRole('dialog');
    if (dialog !== null) {
      await user.click(within(dialog).getByRole('button', { name: 'Verwerfen' }));
    }
    await waitFor(() => {
      expect(screen.queryByTestId('sec-parameters')).toBeNull();
    });
    expect(screen.queryByTestId('param-back')).toBeNull();
  });

  it('write the same words in English', async () => {
    const { user } = await openEma('English');
    await removeParameter(user, 'Zeiteinheit', 'Remove');
    await waitFor(() => {
      expect(screen.getAllByTestId('param-row')).toHaveLength(1);
    });
    clickNode(nodeByName('EMA20'));
    const field = await screen.findByTestId('field-zeiteinheit');
    await choose(user, within(field).getByTestId('kind-zeiteinheit'), 'from a strategy parameter');
    expect(within(field).getByTestId('param-hint')).toHaveTextContent(
      'There is no strategy parameter for “time unit” yet. You create strategy parameters in the strategy.',
    );
    expect(within(field).getByTestId('param-go')).toHaveTextContent('Go to strategy');
    await user.click(within(field).getByTestId('param-go'));
    expect(await screen.findByTestId('param-back')).toHaveTextContent('Back to “EMA20”');
    expect(screen.getByTestId('param-new-form')).toBeInTheDocument();
    expect(screen.getByTestId('param-new-type')).toHaveTextContent('time unit');
    expect(screen.getByTestId('param-new-create')).toHaveTextContent('Create');
  });
});
