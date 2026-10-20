import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { menu, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { emaTrendfolge } from './testing/emaTrendfolge';

async function openEma(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
}

async function rename(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  const field = screen.getByTestId('strategy-name');
  await user.clear(field);
  await user.type(field, name);
}

describe('unsaved changes (specification 5.5)', () => {
  it('asks before closing: cancel leaves everything as it is', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);
    await rename(user, 'EMA geändert');
    expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');

    await menu(user, 'close');

    const dialog = await screen.findByRole('dialog', { name: 'Ungespeicherte Änderungen' });
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Speichern', 'Verwerfen', 'Abbrechen']);
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA geändert');
    expect(api.requests('PUT', /strategies/)).toHaveLength(0);
  });

  it('asks before closing: discard closes without saving', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);
    await rename(user, 'EMA geändert');

    await menu(user, 'close');
    await user.click(await screen.findByRole('button', { name: 'Verwerfen' }));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-no-strategy')).toBeInTheDocument();
    });
    expect(api.requests('PUT', /strategies/)).toHaveLength(0);
    expect((api.strategies.get(emaTrendfolge().id as string) as { name: string }).name).toBe('EMA-Trendfolge');
  });

  it('asks before closing: save stores, then closes', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);
    await rename(user, 'EMA geändert');

    await menu(user, 'close');
    const dialog = await screen.findByRole('dialog', { name: 'Ungespeicherte Änderungen' });
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-no-strategy')).toBeInTheDocument();
    });
    expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    expect((api.strategies.get(emaTrendfolge().id as string) as { name: string }).name).toBe('EMA geändert');
  });

  it('asks before "Neue Strategie" and before "Öffnen" as well, and does not ask without changes', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    await menu(user, 'new');
    // no changes: no question, the new strategy is open
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('Neue Strategie');
    });
    // a new strategy was never saved: the question comes before opening another one
    await openStored(user, 'EMA-Trendfolge');
    const dialog = await screen.findByRole('dialog', { name: 'Ungespeicherte Änderungen' });
    await user.click(within(dialog).getByRole('button', { name: 'Verwerfen' }));
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
    });
  });
});

describe('saving, checking and deleting', () => {
  it('saves a new strategy with POST, then with PUT, and shows the findings of the answer', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('Neue Strategie');
    });

    await menu(user, 'save');
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('gespeichert');
    });
    expect(api.requests('POST', /\/api\/v1\/strategies$/)).toHaveLength(1);
    expect(screen.getByTestId('findings-count')).toBeInTheDocument();

    await rename(user, 'Anders');
    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
  });

  it('reports a failed save in a dialog in the language of the interface and keeps the changes', async () => {
    const user = userEvent.setup();
    mockApi({ fail: { replace: { status: 422, body: { detail: 'The document does not fit the schema.', code: 'document.invalid', params: {} } } } });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);
    await rename(user, 'Anders');

    await menu(user, 'save');

    const dialog = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht gespeichert werden.' });
    expect(dialog).toHaveTextContent('Ursache document.invalid');
    expect(dialog).not.toHaveTextContent('The document does not fit');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');
  });

  it('shows the findings of "Prüfen" with the way to fix them', async () => {
    const user = userEvent.setup();
    mockApi({
      findings: () => [
        { level: 'error', code: 'flow.no_incoming', element: null, subject: null, details: {} },
        { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
      ],
    });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    await menu(user, 'check');

    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('2 Befunde');
    });
    const findings = screen.getAllByTestId('finding');
    expect(findings).toHaveLength(2);
    expect(findings[0]).toHaveTextContent('Zu diesem Element des Ablaufs führt keine Verbindung.');
    expect(findings[0]).toHaveTextContent('So beheben Sie es: Verbinden Sie einen vorherigen Schritt');
    expect(findings[1]).toHaveTextContent('Hinweis');
  });

  it('deletes the open strategy after a question', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    await menu(user, 'delete');
    const dialog = await screen.findByRole('dialog', { name: 'Strategie löschen?' });
    expect(dialog).toHaveTextContent('EMA-Trendfolge');
    await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-no-strategy')).toBeInTheDocument();
    });
    expect(api.strategies.size).toBe(0);
  });
});

describe('the language (specification 5.1, M4)', () => {
  it('switches all texts, also the findings, the dialogs and the library, and shows no German text in the English interface', async () => {
    const user = userEvent.setup();
    mockApi({
      findings: () => [{ level: 'error', code: 'flow.no_incoming', element: null, subject: null, details: {} }],
    });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);
    await menu(user, 'check');
    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('1 Befund');
    });

    await switchLanguage(user, 'English');

    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('1 finding');
    });
    const text = document.body.textContent ?? '';
    for (const german of [
      'Elementbibliothek',
      'Strategieparameter',
      'Eigenschaften',
      'Speichern',
      'Prüfen',
      'Schließen',
      'Löschen',
      'Einstellungen',
      'Senkrecht',
      'Waagerecht',
      'Legende',
      'Wann wird gerechnet',
      'Befunde',
      'Objekte und ihre Werte',
      'gespeichert',
      'Zur Stelle',
      'So beheben Sie es',
      'Verwaltung',
    ]) {
      expect(text, german).not.toContain(german);
    }
    expect(screen.getByTestId('library')).toHaveTextContent('When to calculate');
    expect(screen.getByTestId('library')).toHaveTextContent('Candle close');
    expect(screen.getAllByTestId('finding')[0]).toHaveTextContent('How to fix it: Connect a previous step');
    // the names of the user are not translated
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });

  it('keeps the language after reloading: it is read from the backend', async () => {
    mockApi({ language: 'en' });
    renderWithProviders(<App />, 'de');

    await waitFor(() => {
      expect(screen.getByTestId('menu-new')).toHaveTextContent('New strategy');
    });
  });
});

describe('the settings (specification 5.5)', () => {
  it('asks "Dateien verschieben?" before the object directory is changed, and sends the answer', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'settings');
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    const field = await within(dialog).findByLabelText('Verzeichnis (absoluter Pfad)');

    fireEvent.change(field, { target: { value: '/neues/verzeichnis' } });
    await user.click(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' }));
    expect(within(dialog).getByText('Dateien verschieben?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));

    await waitFor(() => {
      expect(within(dialog).getByText('Das Objektverzeichnis wurde geändert.')).toBeInTheDocument();
    });
    expect(api.requests('PUT', /object-directory/)[0]?.body).toEqual({ path: '/neues/verzeichnis', move: true });
  });

  it('tells the cause of a refused directory in the language of the interface, not the English text of the answer', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'settings');
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    const field = await within(dialog).findByLabelText('Verzeichnis (absoluter Pfad)');

    fireEvent.change(field, { target: { value: 'relativ' } });
    await user.click(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' }));
    await user.click(within(dialog).getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('Das Objektverzeichnis muss ein absoluter Pfad sein.');
    expect(alert).not.toHaveTextContent('must be absolute');
  });
});
