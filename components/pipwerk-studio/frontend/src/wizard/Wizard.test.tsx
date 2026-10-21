import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../App';
import { renderWithProviders } from '../test-utils';
import { menu, waitForReady } from '../testing/actions';
import { mockApi } from '../testing/backend';
import { parseStrategyDocument } from '../document/parse';

describe('the guided setup of a new strategy (specification 5.5)', () => {
  it('is offered by "Neue Strategie" and leaves a strategy with the elements of each step', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await menu(user, 'new');
    expect(await screen.findByTestId('wizard')).toBeInTheDocument();

    // 1. the name
    await user.clear(screen.getByTestId('wz-name'));
    await user.type(screen.getByTestId('wz-name'), 'Mein Aufbau');
    await user.click(screen.getByTestId('wz-next'));

    // 2. the trigger: the candle close with a time unit as a strategy parameter
    await user.click((await screen.findAllByTestId('wz-trigger'))[0] as HTMLElement);
    await user.click(screen.getByTestId('wz-next'));

    // 3. two indicators
    await screen.findByTestId('wz-step-3');
    const add = screen.getAllByTestId('wz-add-indicator').find((button) => button.textContent === 'EMA') as HTMLElement;
    await user.click(add);
    await waitFor(() => {
      expect(screen.getAllByTestId('wz-indicator')).toHaveLength(1);
    });
    await user.click(add);
    await waitFor(() => {
      expect(screen.getAllByTestId('wz-indicator')).toHaveLength(2);
    });
    await user.click(screen.getByTestId('wz-next'));

    // 4. the condition: the two values cross
    await screen.findByTestId('wz-step-4');
    const options = within(screen.getByTestId('wz-a')).getAllByRole('option');
    await user.selectOptions(screen.getByTestId('wz-a'), (options[1] as HTMLOptionElement).value);
    await user.selectOptions(screen.getByTestId('wz-b'), (options[2] as HTMLOptionElement).value);
    await user.click(screen.getByTestId('wz-next'));

    // 5. the order, then the end of the setup
    await screen.findByTestId('wz-step-5');
    await user.click(screen.getByTestId('wz-next'));
    await waitFor(() => {
      expect(screen.queryByTestId('wizard')).toBeNull();
    });

    // nothing is stored before "Speichern"
    expect(api.requests('POST', /strategies/)).toHaveLength(0);
    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/strategies$/)).toHaveLength(1);
    });
    const stored = parseStrategyDocument(api.requests('POST', /\/api\/v1\/strategies$/)[0]?.body);
    expect(stored.name).toBe('Mein Aufbau');
    const kinds = stored.elements.map((element) => element.type);
    expect(kinds.filter((type) => type === 'EMA')).toHaveLength(2);
    expect(kinds).toContain('trigger.candle_close');
    expect(kinds).toContain('flow.condition');
    expect(kinds).toContain('flow.place_order');
    const condition = stored.elements.find((element) => element.type === 'flow.condition');
    expect(JSON.stringify(condition)).toContain('PREVIOUS');
    expect(stored.connections.length).toBeGreaterThanOrEqual(2);
  });

  it('can be left at any step: what was laid out stays', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await screen.findByTestId('wizard');
    await user.click(screen.getByTestId('wz-next'));
    await user.click((await screen.findAllByTestId('wz-trigger'))[0] as HTMLElement);
    await user.click(screen.getByTestId('wz-next'));
    await screen.findByTestId('wz-step-3');

    await user.click(screen.getByTestId('wz-leave'));

    expect(screen.queryByTestId('wizard')).toBeNull();
    expect(screen.getByTestId('props-element')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
  });

  it('ends when an entry of the library is used by hand', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await screen.findByTestId('wizard');

    const entry = document.querySelector<HTMLElement>('[data-testid="lib-item"][data-label="Kerzenschluss"]');
    await user.click(entry as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByTestId('wizard')).toBeNull();
    });
    expect(document.querySelectorAll('[data-testid="node"]')).toHaveLength(1);
  });
});
