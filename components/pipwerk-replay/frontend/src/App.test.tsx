import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { FakeBackend, overviewJson, renderWithProviders, seriesJson } from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

describe('App, header and menu', () => {
  it('has the entries Datenbestand and Testkonten and no entry of a later work package', async () => {
    renderWithProviders(<App />);

    const nav = screen.getByRole('navigation', { name: 'Menü' });
    const entries = within(nav).getAllByRole('button');
    expect(entries.map((entry) => entry.textContent)).toEqual(['Datenbestand', 'Testkonten']);
    expect(screen.queryByText('Testlauf')).not.toBeInTheDocument();
    expect(screen.queryByText('Gespeicherte Backtests')).not.toBeInTheDocument();
    expect(screen.queryByText('Einzelschritt-Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Backtest')).not.toBeInTheDocument();
    expect(screen.queryByText('Prototyp')).not.toBeInTheDocument();
    expect(within(screen.getByTestId('header')).getByText('pipwerk replay')).toBeInTheDocument();
    await screen.findByTestId('data');
  });

  it('starts with the data stock and switches the view with the menu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    expect(await screen.findByTestId('data')).toBeInTheDocument();
    expect(screen.getByTestId('menu-data')).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByTestId('menu-accounts'));
    expect(await screen.findByTestId('accounts')).toBeInTheDocument();
    expect(screen.queryByTestId('data')).not.toBeInTheDocument();
    expect(screen.getByTestId('menu-accounts')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('app')).toHaveAttribute('data-view', 'accounts');

    await user.click(screen.getByTestId('menu-data'));
    expect(await screen.findByTestId('data')).toBeInTheDocument();
  });

  it('offers the same entries in the compact menu and closes it after the choice, with Escape and outside', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');

    await user.click(screen.getByTestId('menu-toggle'));
    const pop = screen.getByTestId('menu-pop');
    expect(within(pop).getAllByRole('button').map((entry) => entry.textContent)).toEqual(['Datenbestand', 'Testkonten']);
    await user.click(within(pop).getByTestId('cmenu-accounts'));
    expect(screen.queryByTestId('menu-pop')).not.toBeInTheDocument();
    expect(await screen.findByTestId('accounts')).toBeInTheDocument();

    await user.click(screen.getByTestId('menu-toggle'));
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('menu-pop')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('menu-toggle'));
    await user.click(screen.getByTestId('footer'));
    expect(screen.queryByTestId('menu-pop')).not.toBeInTheDocument();
  });
});

describe('App, language', () => {
  it('shows German without a stored language and the stored English language', async () => {
    backend.language = 'en';
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-accounts')).toHaveTextContent('Test accounts');
    });
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.lang).toBe('en');
  });

  it('stores the chosen language in the backend and changes every text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');
    expect(screen.getByTestId('lang-de')).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByTestId('lang-en'));

    await waitFor(() => {
      expect(screen.getByTestId('menu-data')).toHaveTextContent('Data stock');
    });
    expect(backend.callsTo('PUT', '/api/replay/settings/language')[0]?.body).toEqual({ language: 'en' });
    expect(backend.language).toBe('en');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Data stock of historical price data');
    expect(screen.getByTestId('footer')).toHaveTextContent('Backend: connected');
    expect(screen.getByTestId('footer')).toHaveTextContent('Revision: unknown');
  });

  it('keeps the language and shows a message when saving fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');
    const original = globalThis.fetch;
    globalThis.fetch = (input, init) =>
      String(input).includes('/settings/language') && init?.method === 'PUT'
        ? Promise.resolve(new Response('{}', { status: 500 }))
        : original(input, init);

    await user.click(screen.getByTestId('lang-en'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Die Sprache konnte nicht gespeichert werden.');
    expect(screen.getByTestId('lang-de')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('menu-data')).toHaveTextContent('Datenbestand');
  });

  it('does not store anything in the browser', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');
    await user.click(screen.getByTestId('lang-en'));
    await waitFor(() => {
      expect(screen.getByTestId('menu-data')).toHaveTextContent('Data stock');
    });

    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });
});

describe('App, footer', () => {
  it('shows that the backend is reachable and the revision with a tooltip', async () => {
    backend.revision = {
      revision: '0123456',
      commit: '0123456789abcdef0123456789abcdef01234567',
      committed_at: '2026-10-09T14:52:03+02:00',
    };
    renderWithProviders(<App />);

    const footer = screen.getByTestId('footer');
    await waitFor(() => {
      expect(footer).toHaveTextContent('Backend: verbunden');
    });
    const revision = await screen.findByText('Stand: 0123456');
    expect(revision).toHaveAttribute('data-tip', expect.stringMatching(/^Commit 0123456789abcdef0123456789abcdef01234567 vom \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2} Uhr$/));
    expect(revision).toHaveAttribute('tabindex', '0');
    const describedBy = revision.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)).toHaveTextContent('Commit 0123456789abcdef');
  });

  it('shows that the backend is not reachable', async () => {
    backend.healthy = false;
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('footer')).toHaveTextContent('Backend: nicht erreichbar');
    });
    expect(screen.getByTestId('footer').querySelector('.backend-status')).toHaveAttribute('data-state', 'unreachable');
  });

  it('shows an unknown revision', async () => {
    renderWithProviders(<App />);

    expect(await screen.findByText('Stand: unbekannt')).not.toHaveAttribute('data-tip');
  });
});

describe('App, About dialog', () => {
  it('shows name, revision, license and repository, and gives the focus back on closing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');
    const dialog = screen.getByTestId('dialog-about');
    expect(dialog).not.toHaveAttribute('open');

    const opener = screen.getByTestId('menu-about');
    await user.click(opener);

    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByRole('heading', { name: 'Über pipwerk replay' })).toBeInTheDocument();
    expect(within(dialog).getByText('pipwerk replay')).toBeInTheDocument();
    expect(within(dialog).getByText('GNU General Public License, Version 3')).toBeInTheDocument();
    expect(within(dialog).getByTestId('license-text')).toHaveTextContent('GNU GENERAL PUBLIC LICENSE');
    expect(within(dialog).getByRole('link', { name: 'https://github.com/macodix/pipwerk' })).toHaveAttribute('href', 'https://github.com/macodix/pipwerk');
    expect(within(dialog).getByTestId('about-revision')).toBeInTheDocument();

    await user.click(within(dialog).getByTestId('about-close'));
    expect(dialog).not.toHaveAttribute('open');
    expect(opener).toHaveFocus();
  });

  it('is shown in English', async () => {
    const user = userEvent.setup();
    backend.language = 'en';
    renderWithProviders(<App />, 'en');
    await screen.findByTestId('data');

    await user.click(screen.getByTestId('menu-about'));

    const dialog = screen.getByTestId('dialog-about');
    expect(within(dialog).getByRole('heading', { name: 'About pipwerk replay' })).toBeInTheDocument();
    expect(within(dialog).getByText('Revision')).toBeInTheDocument();
    expect(within(dialog).getByText('License')).toBeInTheDocument();
  });
});

describe('App, text of the user', () => {
  it('sets names from the data stock as text and never as HTML', async () => {
    const name = '<img src=x onerror=alert(1)>';
    backend.overview = overviewJson([seriesJson({ broker: name, instrument: '<b>EURUSD</b>' })]);
    renderWithProviders(<App />);

    await screen.findByTestId('stock-row');

    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('b > b')).toBeNull();
    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getByText('<b>EURUSD</b>')).toBeInTheDocument();
  });
});
