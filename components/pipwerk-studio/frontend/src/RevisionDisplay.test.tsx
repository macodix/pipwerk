import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { RevisionDisplay } from './RevisionDisplay';
import { mockFetchRoutes, mockFetchResponse, renderWithProviders } from './test-utils';

describe('RevisionDisplay', () => {
  it('shows the revision in German', async () => {
    mockFetchResponse(200, { revision: 'abc1234' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: abc1234')).toBeInTheDocument();
  });

  it('shows the revision in English', async () => {
    mockFetchResponse(200, { revision: 'abc1234' });
    renderWithProviders(<RevisionDisplay />, 'en');

    expect(await screen.findByText('Revision: abc1234')).toBeInTheDocument();
  });

  it('shows unknown while the request is running', () => {
    mockFetchRoutes({ revision: 'pending' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(screen.getByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it('shows unknown for null', async () => {
    mockFetchResponse(200, { revision: null });
    renderWithProviders(<RevisionDisplay />, 'en');

    expect(await screen.findByText('Revision: unknown')).toBeInTheDocument();
  });

  it('shows unknown on an HTTP error', async () => {
    mockFetchResponse(503, { detail: 'unavailable' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it('shows unknown on a network error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network error')));
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it.each([
    { revision: 'abc123' },
    { revision: 'abc12345' },
    { revision: 'ABC1234' },
    { revision: 'xyz1234' },
    { revision: 1234567 },
    { revision: 'abc1234', extra: true },
    {},
    [],
    null,
    'abc1234',
  ])('shows unknown for the invalid response %j', async (body) => {
    mockFetchResponse(200, body);
    renderWithProviders(<RevisionDisplay />, 'en');

    // Let the request settle; the invalid answer must not change the display.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText('Revision: unknown')).toBeInTheDocument();
  });
});

describe('RevisionDisplay in the footer', () => {
  it('sits right next to the backend status', async () => {
    mockFetchRoutes({ revision: { status: 200, body: { revision: 'abc1234' } } });
    renderWithProviders(<App />, 'de');

    const revision = await screen.findByText('Stand: abc1234');
    const backend = await screen.findByText('Backend: verbunden');
    expect(revision.closest('footer')).toBe(backend.closest('footer'));
    expect(backend.compareDocumentPosition(revision) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(backend.nextElementSibling).toBe(revision);
  });

  it('switches the label with the language', async () => {
    const user = userEvent.setup();
    mockFetchRoutes({ revision: { status: 200, body: { revision: 'abc1234' } } });
    renderWithProviders(<App />);
    expect(await screen.findByText('Stand: abc1234')).toBeInTheDocument();
    await screen.findByDisplayValue('Deutsch');

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(await screen.findByText('Revision: abc1234')).toBeInTheDocument();
    expect(screen.queryByText('Stand: abc1234')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Language'), 'Deutsch');

    expect(await screen.findByText('Stand: abc1234')).toBeInTheDocument();
  });
});
