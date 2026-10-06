import { focusManager, onlineManager } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LanguageSelect } from './LanguageSelect';
import { LANGUAGE_REQUEST_TIMEOUT_MS } from './settingsApi';
import { createGate, mockFetchRoutes, renderWithProviders, type RouteResponse } from './test-utils';

// The tests are grouped by the state sequences of the language display. Each
// sequence fixes the displayed language (select value and label text), the
// state of the select and the message. The same table is described in
// docs/technical/pipwerk-studio.md, section 2.4.
//
//   A  first read:     A1 running, A2 succeeds, A3 fails, A4 times out,
//                      A5 repeated read after a failed first read, A6 offline
//   B  saving:         B1 running, B2 succeeds, B3 fails, B4 after a failed first read,
//                      B5 times out, B6 offline
//   C  later reads:    C1 succeeds, C2 fails, C3 succeeds after a failed first read,
//                      C4 succeeds after a failed save without confirmed language
//   D  overlap:        D1 read running when a save succeeds, D2 read started while saving,
//                      D3 read finishes while saving, then the save fails,
//                      D4 read running when a save starts, then the save fails
//   E  repeated saves: E1 second save while one runs, E2 retry after a failed save

const LOAD_ERROR_DE =
  'Die gespeicherte Sprache konnte nicht gelesen werden. Es wird die Standardsprache Deutsch angezeigt.';
const SAVE_ERROR_DE =
  'Die Sprache konnte nicht gespeichert werden. Die zuletzt bestätigte Sprache bleibt aktiv.';
const SAVE_ERROR_EN = 'The language could not be saved. The last confirmed language stays active.';
const SAVE_UNCONFIRMED_ERROR_DE =
  'Die Sprache konnte nicht gespeichert werden. Es wird die Standardsprache Deutsch angezeigt, weil die gespeicherte Sprache nicht gelesen werden konnte.';
const LANGUAGE_BODY = (language: 'de' | 'en'): RouteResponse => ({
  status: 200,
  body: { language },
});

function select(): HTMLSelectElement {
  return screen.getByRole('combobox');
}

async function waitUntilEnabled(): Promise<void> {
  await waitFor(() => expect(select()).not.toBeDisabled());
}

function refocusWindow(): void {
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('LanguageSelect, A: first read', () => {
  it('A1: keeps the select disabled and shows no message while the read is running', () => {
    mockFetchRoutes({ getLanguage: 'pending' });
    renderWithProviders(<LanguageSelect />);

    expect(select()).toBeDisabled();
    expect(select()).toHaveValue('de');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('A2: starts German when German is stored', async () => {
    mockFetchRoutes({ getLanguage: LANGUAGE_BODY('de') });
    renderWithProviders(<LanguageSelect />);

    await waitUntilEnabled();
    expect(select()).toHaveValue('de');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('A2: shows English when English is stored', async () => {
    mockFetchRoutes({ getLanguage: LANGUAGE_BODY('en') });
    renderWithProviders(<LanguageSelect />, 'en');

    expect(await screen.findByDisplayValue('English')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it.each([
    ['a network error', 'network-error' as const],
    ['an HTTP error', { status: 503, body: { detail: 'invalid' } }],
  ])('A3: shows the read message, German and a usable select when the read fails with %s', async (_n, route) => {
    mockFetchRoutes({ getLanguage: route });
    renderWithProviders(<LanguageSelect />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(LOAD_ERROR_DE);
    expect(alert).not.toHaveTextContent('gespeichert werden');
    await waitUntilEnabled();
    expect(select()).toHaveValue('de');
  });
});

describe('LanguageSelect, B: saving', () => {
  it('B1: shows the requested language in select and texts, disabled and without message, while saving', async () => {
    mockFetchRoutes({ getLanguage: LANGUAGE_BODY('de'), putLanguage: 'pending' });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();

    await user.selectOptions(select(), 'en');

    await waitFor(() => expect(screen.getByText('Language')).toBeInTheDocument());
    expect(select()).toHaveValue('en');
    expect(select()).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('B2: switches from German to English and back and keeps the select usable', async () => {
    mockFetchRoutes({ getLanguage: LANGUAGE_BODY('de') });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();

    await user.selectOptions(select(), 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));
    await waitUntilEnabled();
    expect(screen.getByText('Language')).toBeInTheDocument();

    await user.selectOptions(select(), 'de');
    await waitFor(() => expect(select()).toHaveValue('de'));
    await waitUntilEnabled();
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('B3: shows the save message and returns to the confirmed language when saving fails', async () => {
    mockFetchRoutes({
      getLanguage: LANGUAGE_BODY('de'),
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();

    await user.selectOptions(select(), 'en');

    expect(await screen.findByRole('alert')).toHaveTextContent(SAVE_ERROR_DE);
    await waitFor(() => expect(select()).toHaveValue('de'));
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(select()).not.toBeDisabled();
  });

  it('B4: after a failed first read, shows no message while saving and none after it succeeded', async () => {
    const put = createGate();
    mockFetchRoutes({ getLanguage: 'network-error', putLanguage: () => put.promise });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');

    await user.selectOptions(select(), 'en');
    await waitFor(() => expect(select()).toBeDisabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    put.release(LANGUAGE_BODY('en'));
    await waitUntilEnabled();
    expect(select()).toHaveValue('en');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('B4: after a failed first read and a failed save, reports that no language is confirmed', async () => {
    mockFetchRoutes({
      getLanguage: 'network-error',
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');

    await user.selectOptions(select(), 'en');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(SAVE_UNCONFIRMED_ERROR_DE),
    );
    expect(select()).toHaveValue('de');
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(select()).not.toBeDisabled();
  });
});

describe('LanguageSelect, C: later reads', () => {
  it('C1: takes over the language the backend reports after a later successful read', async () => {
    let answer: RouteResponse = LANGUAGE_BODY('en');
    mockFetchRoutes({ getLanguage: () => answer });
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));

    answer = LANGUAGE_BODY('de');
    refocusWindow();

    await waitFor(() => expect(select()).toHaveValue('de'));
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('C2: keeps the confirmed language and shows no message when a later read fails', async () => {
    let answer: RouteResponse = LANGUAGE_BODY('en');
    mockFetchRoutes({ getLanguage: () => answer });
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));

    answer = 'network-error';
    refocusWindow();

    await settle();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(select()).toHaveValue('en');
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('C3: removes the read message when a later read succeeds after a failed first read', async () => {
    let answer: RouteResponse = 'network-error';
    mockFetchRoutes({ getLanguage: () => answer });
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');

    answer = LANGUAGE_BODY('en');
    refocusWindow();

    await waitFor(() => expect(select()).toHaveValue('en'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('C4: switches the save message once a later read confirmed a language', async () => {
    let answer: RouteResponse = 'network-error';
    mockFetchRoutes({
      getLanguage: () => answer,
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');
    await user.selectOptions(select(), 'en');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(SAVE_UNCONFIRMED_ERROR_DE),
    );

    answer = LANGUAGE_BODY('en');
    refocusWindow();

    await waitFor(() => expect(select()).toHaveValue('en'));
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_ERROR_EN);
  });
});

describe('LanguageSelect, D: reads overlapping with saving', () => {
  it('D1: an older read answer arriving after a successful save does not overwrite it', async () => {
    const staleRead = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? LANGUAGE_BODY('en') : staleRead.promise;
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));
    refocusWindow();
    await waitFor(() => expect(reads).toBe(2));

    await user.selectOptions(select(), 'de');
    await waitFor(() => expect(select()).toHaveValue('de'));
    await waitUntilEnabled();
    staleRead.release(LANGUAGE_BODY('en'));
    await settle();

    expect(select()).toHaveValue('de');
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('D2: a read started while saving does not overwrite the saved language', async () => {
    const put = createGate();
    const staleRead = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? LANGUAGE_BODY('en') : staleRead.promise;
      },
      putLanguage: () => put.promise,
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));
    await user.selectOptions(select(), 'de');
    await waitFor(() => expect(select()).toBeDisabled());
    refocusWindow();
    await waitFor(() => expect(reads).toBe(2));

    put.release(LANGUAGE_BODY('de'));
    await waitUntilEnabled();
    staleRead.release(LANGUAGE_BODY('en'));
    await settle();

    expect(select()).toHaveValue('de');
    expect(screen.getByText('Sprache')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('D3: a read finishing while saving does not change the display; a failed save then shows what the read confirmed', async () => {
    const put = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return LANGUAGE_BODY(reads === 1 ? 'de' : 'en');
      },
      putLanguage: () => put.promise,
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();
    await user.selectOptions(select(), 'en');
    await waitFor(() => expect(select()).toBeDisabled());
    refocusWindow();
    await waitFor(() => expect(reads).toBe(2));
    await settle();

    expect(select()).toHaveValue('en');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    put.release({ status: 500, body: { detail: 'error' } });

    // The read confirmed English, so the message appears in English.
    expect(await screen.findByRole('alert')).toHaveTextContent(SAVE_ERROR_EN);
    expect(select()).toHaveValue('en');
  });
});

describe('LanguageSelect, E: repeated saves', () => {
  it('E1: sends only one save request while one is running', async () => {
    const put = createGate();
    let puts = 0;
    mockFetchRoutes({
      getLanguage: LANGUAGE_BODY('de'),
      putLanguage: () => {
        puts += 1;
        return put.promise;
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();

    await user.selectOptions(select(), 'en');
    await waitFor(() => expect(select()).toBeDisabled());
    await user.selectOptions(select(), 'de');

    expect(puts).toBe(1);
    expect(select()).toHaveValue('en');
    put.release(LANGUAGE_BODY('en'));
    await waitUntilEnabled();
    expect(select()).toHaveValue('en');
  });

  it('E2: a retry after a failed save removes the message while running and after success', async () => {
    const answers: RouteResponse[] = [{ status: 500, body: { detail: 'error' } }];
    const retry = createGate();
    let puts = 0;
    mockFetchRoutes({
      getLanguage: LANGUAGE_BODY('de'),
      putLanguage: () => {
        puts += 1;
        return answers[puts - 1] ?? retry.promise;
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();
    await user.selectOptions(select(), 'en');
    expect(await screen.findByRole('alert')).toHaveTextContent(SAVE_ERROR_DE);
    await waitFor(() => expect(select()).toHaveValue('de'));
    await waitUntilEnabled();

    await user.selectOptions(select(), 'en');
    await waitFor(() => expect(select()).toBeDisabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    retry.release(LANGUAGE_BODY('en'));
    await waitUntilEnabled();
    expect(select()).toHaveValue('en');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('LanguageSelect, A5 and B4: repeated read while no language is confirmed', () => {
  it('A5: disables the select and hides the read message during a repeated read, and shows it again if that fails', async () => {
    const retry = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? 'network-error' : retry.promise;
      },
    });
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');
    await waitUntilEnabled();

    refocusWindow();
    await waitFor(() => expect(select()).toBeDisabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(select()).toHaveValue('de');

    retry.release('network-error');
    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_ERROR_DE);
    await waitUntilEnabled();
  });

  it('B4: keeps the message and disables the select during a repeated read after a failed save without confirmed language', async () => {
    const retry = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? 'network-error' : retry.promise;
      },
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />);
    await screen.findByRole('alert');
    await user.selectOptions(select(), 'en');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(SAVE_UNCONFIRMED_ERROR_DE),
    );

    refocusWindow();
    await waitFor(() => expect(select()).toBeDisabled());
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_UNCONFIRMED_ERROR_DE);
    expect(select()).toHaveValue('de');

    retry.release('network-error');
    await waitUntilEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_UNCONFIRMED_ERROR_DE);
  });
});

describe('LanguageSelect, D4: read running when a save starts', () => {
  it('D4: a failed save keeps the confirmed language, shows the save message and still applies the read answer', async () => {
    const read = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? LANGUAGE_BODY('en') : read.promise;
      },
      putLanguage: { status: 500, body: { detail: 'error' } },
    });
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelect />, 'en');
    await waitFor(() => expect(select()).toHaveValue('en'));
    refocusWindow();
    await waitFor(() => expect(reads).toBe(2));

    await user.selectOptions(select(), 'de');

    expect(await screen.findByRole('alert')).toHaveTextContent(SAVE_ERROR_EN);
    await waitFor(() => expect(select()).toHaveValue('en'));
    expect(select()).not.toBeDisabled();

    // The read was not cancelled: its answer reports the real backend state.
    read.release(LANGUAGE_BODY('de'));
    await waitFor(() => expect(select()).toHaveValue('de'));
    expect(reads).toBe(2);
  });
});

describe('LanguageSelect, time limit of the requests', () => {
  afterEach(() => {
    vi.useRealTimers();
    onlineManager.setOnline(true);
  });

  async function advance(ms: number): Promise<void> {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it('A4: a first read that does not answer in time counts as failed (read message, usable select)', async () => {
    vi.useFakeTimers();
    mockFetchRoutes({ getLanguage: 'pending' });
    renderWithProviders(<LanguageSelect />);
    expect(select()).toBeDisabled();

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS / 2);
    expect(select()).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS / 2 + 100);
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_DE);
    expect(select()).not.toBeDisabled();
    expect(select()).toHaveValue('de');
  });

  it('B5: a save that does not answer in time counts as failed (save message, confirmed language)', async () => {
    mockFetchRoutes({ getLanguage: LANGUAGE_BODY('de'), putLanguage: 'pending' });
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.change(select(), { target: { value: 'en' } });
    });
    await advance(0);
    expect(select()).toBeDisabled();
    expect(select()).toHaveValue('en');

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS / 2);
    expect(select()).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS / 2 + 100);
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_ERROR_DE);
    expect(select()).not.toBeDisabled();
    expect(select()).toHaveValue('de');
  });

  it('D1: cancelling a read because a save succeeded is not a failure and shows no message', async () => {
    vi.useFakeTimers();
    const staleRead = createGate();
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return reads === 1 ? LANGUAGE_BODY('en') : staleRead.promise;
      },
    });
    renderWithProviders(<LanguageSelect />, 'en');
    await advance(0);
    expect(select()).toHaveValue('en');
    refocusWindow();
    await advance(0);
    expect(reads).toBe(2);

    await act(async () => {
      fireEvent.change(select(), { target: { value: 'de' } });
    });
    await advance(0);
    await advance(LANGUAGE_REQUEST_TIMEOUT_MS * 2);

    expect(select()).toHaveValue('de');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('A6: a first read is sent although the browser reports being offline and ends with the read message after the time limit', async () => {
    vi.useFakeTimers();
    onlineManager.setOnline(false);
    let reads = 0;
    mockFetchRoutes({
      getLanguage: () => {
        reads += 1;
        return 'pending';
      },
    });
    renderWithProviders(<LanguageSelect />);
    await advance(0);

    expect(reads).toBe(1);
    expect(select()).toBeDisabled();

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS + 100);
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_ERROR_DE);
    expect(select()).not.toBeDisabled();
  });

  it('B6: a save is sent although the browser reports being offline and ends with the save message after the time limit', async () => {
    let puts = 0;
    mockFetchRoutes({
      getLanguage: LANGUAGE_BODY('de'),
      putLanguage: () => {
        puts += 1;
        return 'pending';
      },
    });
    renderWithProviders(<LanguageSelect />);
    await waitUntilEnabled();
    vi.useFakeTimers();
    onlineManager.setOnline(false);

    await act(async () => {
      fireEvent.change(select(), { target: { value: 'en' } });
    });
    await advance(0);

    expect(puts).toBe(1);
    expect(select()).toBeDisabled();

    await advance(LANGUAGE_REQUEST_TIMEOUT_MS + 100);
    expect(screen.getByRole('alert')).toHaveTextContent(SAVE_ERROR_DE);
    expect(select()).not.toBeDisabled();
    expect(select()).toHaveValue('de');
  });
});
