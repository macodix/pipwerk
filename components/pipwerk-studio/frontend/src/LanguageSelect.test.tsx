import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LanguageSelect } from './LanguageSelect';
import { mockFetchRoutes, renderWithProviders } from './test-utils';

describe('LanguageSelect', () => {
  it('starts German when no language has been stored yet', async () => {
    mockFetchRoutes({ getLanguage: { status: 200, body: { language: 'de' } } });
    renderWithProviders(<LanguageSelect />);

    expect(await screen.findByDisplayValue('Deutsch')).toBeInTheDocument();
  });

  it('shows the initially stored English language once determined', async () => {
    mockFetchRoutes({ getLanguage: { status: 200, body: { language: 'en' } } });
    renderWithProviders(<LanguageSelect />, 'en');

    expect(await screen.findByDisplayValue('English')).toBeInTheDocument();
  });

  it('does not show an unconfirmed persisted language while still initializing', () => {
    // The GET call never resolves within this test, simulating the initial
    // determination still being in progress.
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'en' } },
    });
    renderWithProviders(<LanguageSelect />);

    // Immediately after render and before the query settles, the select is
    // disabled rather than falsely showing a final confirmed language.
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('switches from German to English and persists it via a server mutation', async () => {
    mockFetchRoutes({ getLanguage: { status: 200, body: { language: 'de' } } });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());

    await user.selectOptions(screen.getByRole('combobox'), 'en');

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('en'));
  });

  it('switches from English back to German and persists it via a server mutation', async () => {
    mockFetchRoutes({ getLanguage: { status: 200, body: { language: 'en' } } });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());
    expect(screen.getByRole('combobox')).toHaveValue('en');

    await user.selectOptions(screen.getByRole('combobox'), 'de');

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('de'));
  });

  it('shows an error and keeps the confirmed language when the mutation fails', async () => {
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'de' } },
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());

    await user.selectOptions(screen.getByRole('combobox'), 'en');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('de'));
  });

  it('shows an error and keeps the default language when the initial read fails', async () => {
    mockFetchRoutes({ getLanguage: 'network-error' });
    renderWithProviders(<LanguageSelect />);

    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());
    expect(screen.getByRole('combobox')).toHaveValue('de');
  });
});
