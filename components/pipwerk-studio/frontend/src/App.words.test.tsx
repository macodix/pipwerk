import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { emaTrendfolge } from './testing/emaTrendfolge';

// Specification 5.4, point "Begriffe" (defect F4 of the fourth acceptance): the words of the table, the explanation of
// "Hauptablauf", the sentence above the rules of the strategy and "(noch ohne Name)".

const MAIN_FLOW_DE = 'Der Hauptablauf ist der Ablauf der Strategie ab ihren Auslösern, ohne die Schritte in den Order- und Positionsverwaltungen.';
const MAIN_FLOW_EN = 'The main flow is the flow of the strategy from its triggers, without the steps inside the order and position managements.';

type Json = Record<string, unknown>;

/** "EMA-Trendfolge" with the name of the strategy and of the first instance removed. */
function withoutNames(): Json {
  const document = JSON.parse(JSON.stringify(emaTrendfolge())) as { name: string; id: string; elements: { instance: { name: string } | null }[] };
  document.name = '';
  const first = document.elements.find((element) => element.instance !== null);
  if (first?.instance) {
    first.instance.name = '';
  }
  return document as unknown as Json;
}

async function openEma(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
}

describe('the words of the table (specification 5.4, "Begriffe")', () => {
  it('names the origin of an instance with the kind and the name of the type, and its settings with its name, in German', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    clickNode(nodeByName('EMA20'));

    await waitFor(() => {
      expect(screen.getByTestId('element-origin')).toHaveTextContent('EMA20 – Indikator EMA');
    });
    expect(within(screen.getByTestId('sec-settings')).getByRole('heading', { name: 'Einstellungen von „EMA20“' })).toBeInTheDocument();
  });

  it('names them in English', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await switchLanguage(user, 'English');
    await openEma(user);

    clickNode(nodeByName('EMA20'));

    await waitFor(() => {
      expect(screen.getByTestId('element-origin')).toHaveTextContent('EMA20 – indicator EMA');
    });
    expect(within(screen.getByTestId('sec-settings')).getByRole('heading', { name: 'Settings of “EMA20”' })).toBeInTheDocument();
  });

  it('heads the values that need no element "Handelsdaten: Order, Position, Strategie" and says why, in both languages', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    const section = screen.getByTestId('sec-application-objects');
    expect(within(section).getByRole('heading', { name: 'Handelsdaten: Order, Position, Strategie' })).toBeInTheDocument();
    expect(section).toHaveTextContent('Diese Werte brauchen kein Element auf der Zeichenfläche. Sie stehen in Formeln und Regeln zur Wahl, wo sie verwendbar sind.');

    await switchLanguage(user, 'English');
    await waitFor(() => {
      expect(within(screen.getByTestId('sec-application-objects')).getByRole('heading', { name: 'Trading data: order, position, strategy' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('sec-application-objects')).toHaveTextContent(
      'These values need no element on the canvas. They are offered in formulas and rules wherever they can be used.',
    );
  });

  it('says above the rules of the strategy that rules are optional and what a rule of the strategy applies to', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    expect(screen.getByTestId('sec-rules')).toHaveTextContent('Regeln sind freiwillig. Eine Regel der Strategie gilt für jede Order der Strategie.');

    await switchLanguage(user, 'English');
    await waitFor(() => {
      expect(screen.getByTestId('sec-rules')).toHaveTextContent('Rules are optional. A rule of the strategy applies to every order of the strategy.');
    });
  });

  it('explains "Hauptablauf" under "Gehört zu" when it stands there, and not for a step in a management', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    clickNode(nodeByName('Kreuzen'));

    const section = await screen.findByTestId('sec-management');
    expect(within(section).getByTestId('main-flow-explanation')).toHaveTextContent(MAIN_FLOW_DE);

    clickNode(nodeByName('Order ausgefuehrt'));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue('Order ausgefuehrt');
    });
    // the step lies in the management of "Order aufgeben": the field shows that, and "Hauptablauf" is not explained
    expect(screen.getByTestId('sec-management')).toHaveTextContent('Order- und Positionsverwaltung von „Order aufgeben“');
    expect(screen.queryByTestId('main-flow-explanation')).toBeNull();
  });

  it('explains "main flow" in English under "Belongs to"', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await switchLanguage(user, 'English');
    await openEma(user);

    clickNode(nodeByName('Kreuzen'));

    expect(await screen.findByTestId('main-flow-explanation')).toHaveTextContent(MAIN_FLOW_EN);
  });

  it('explains "Hauptablauf" once as the second sentence of a finding that names it', async () => {
    const user = userEvent.setup();
    mockApi({ findings: () => [{ level: 'hint', code: 'flow.main_without_trigger', element: null, subject: null, details: {} }] });
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await menu(user, 'new');

    await waitFor(() => {
      expect(screen.getByTestId('findings-box')).toHaveTextContent(`Hauptablauf ohne Auslöser: Die Strategie startet nie, auch wenn eine Order- und Positionsverwaltung eigene Auslöser hat. ${MAIN_FLOW_DE}`);
    });
    expect(screen.getByTestId('findings-box').textContent?.split(MAIN_FLOW_DE)).toHaveLength(2);
  });

  it('writes "(noch ohne Name)" for a strategy, an element and an instance without a name, and in the list of "Öffnen"', async () => {
    const user = userEvent.setup();
    const unnamed = withoutNames();
    mockApi({ strategies: [unnamed] });
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await menu(user, 'open');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('(noch ohne Name)')).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent('(ohne Name)');
    await user.click(within(dialog).getByText('(noch ohne Name)'));

    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('(noch ohne Name)');
    });
    // the instance without a name: its card and its properties view
    clickNode(nodeByName('(noch ohne Name)'));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue('');
    });
    expect(screen.getByTestId('element-name')).toHaveAttribute('placeholder', '(noch ohne Name)');
    expect(screen.getByTestId('element-origin')).toHaveTextContent('(noch ohne Name) – Indikator EMA');
  });

  it('writes "(no name yet)" in English in the list of "Open"', async () => {
    const user = userEvent.setup();
    mockApi({ strategies: [withoutNames()] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await switchLanguage(user, 'English');

    await menu(user, 'open');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('(no name yet)')).toBeInTheDocument();
  });
});
