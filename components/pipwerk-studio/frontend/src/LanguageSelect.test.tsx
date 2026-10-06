import { focusManager } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LanguageSelect } from './LanguageSelect';
import { mockFetchRoutes, renderWithProviders, type RouteResponse } from './test-utils';

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

  it('keeps the select disabled while the initial determination is still open', () => {
    // The GET call stays open for the whole test.
    mockFetchRoutes({ getLanguage: 'pending' });
    renderWithProviders(<LanguageSelect />);

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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

  it('shows the save error and keeps the confirmed language when the mutation fails', async () => {
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'de' } },
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());

    await user.selectOptions(screen.getByRole('combobox'), 'en');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.',
    );
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('de'));
    expect(screen.getByText('Sprache')).toBeInTheDocument();
  });

  it.each([
    ['a network error', 'network-error' as const],
    ['an HTTP error', { status: 503, body: { detail: 'invalid' } }],
  ])('shows the read error, not the save error, when the initial read fails with %s', async (_name, route) => {
    mockFetchRoutes({ getLanguage: route });
    renderWithProviders(<LanguageSelect />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.',
    );
    expect(alert).not.toHaveTextContent('gespeichert werden');
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());
    expect(screen.getByRole('combobox')).toHaveValue('de');
  });

  it('clears the read error after a language was saved successfully', async () => {
    mockFetchRoutes({ getLanguage: 'network-error' });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');

    await user.selectOptions(screen.getByRole('combobox'), 'en');

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveValue('en');
  });

  it('shows the requested language in the select and in the texts while saving', async () => {
    // The PUT call stays open, so the save request is still running.
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'de' } },
      putLanguage: 'pending',
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled());

    await user.selectOptions(screen.getByRole('combobox'), 'en');

    await waitFor(() => expect(screen.getByText('Language')).toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveValue('en');
  });

  describe('automatic refetch after a confirmed language', () => {
    function refocusWindow(): void {
      act(() => {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
      });
    }

    it('keeps the confirmed language and shows no message when a later refetch fails', async () => {
      let answer: RouteResponse = { status: 200, body: { language: 'en' } };
      mockFetchRoutes({ getLanguage: () => answer });
      renderWithProviders(<LanguageSelect />, 'en');
      await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('en'));
      expect(screen.getByText('Language')).toBeInTheDocument();

      answer = 'network-error';
      refocusWindow();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('en');
      expect(screen.getByText('Language')).toBeInTheDocument();
    });

    it('takes over the language the backend reports after a later successful refetch', async () => {
      let answer: RouteResponse = { status: 200, body: { language: 'en' } };
      mockFetchRoutes({ getLanguage: () => answer });
      renderWithProviders(<LanguageSelect />, 'en');
      await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('en'));

      answer = { status: 200, body: { language: 'de' } };
      refocusWindow();

      await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('de'));
      expect(screen.getByText('Sprache')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
