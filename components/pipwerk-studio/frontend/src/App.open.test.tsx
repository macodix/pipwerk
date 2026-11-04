import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';

describe('opening "EMA-Trendfolge"', () => {
  it('shows the elements of the strategy with the names after specification 3.7', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();

    await openStored(user, 'EMA-Trendfolge');

    await waitFor(() => {
      expect(nodeByName('Kreuzen')).toBeInTheDocument();
    });
    expect(nodeByName('EMA20')).toBeInTheDocument();
    expect(nodeByName('Order ausgefuehrt')).toBeInTheDocument();
    expect(screen.getAllByTestId('param-row')).toHaveLength(2);
    expect(within(screen.getByTestId('sec-parameters')).getByText('Stop abstand')).toBeInTheDocument();
    expect(screen.queryByTestId('param-strip')).toBeNull();
    await menu(user, 'check');
  });
});
