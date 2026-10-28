import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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

    // "Keine Strategie geöffnet" stands in the properties view (specification 5.5)
    await waitFor(() => {
      expect(screen.getByTestId('props-none')).toBeInTheDocument();
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
      expect(screen.getByTestId('props-none')).toBeInTheDocument();
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

describe('the number of findings (specification 5.1)', () => {
  it('is shown at once for a new strategy, not only after "Prüfen" (B1)', async () => {
    const user = userEvent.setup();
    const api = mockApi({ findings: () => [{ level: 'error', code: 'flow.main_without_trigger', element: null, subject: null, details: {} }] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    expect(screen.queryByTestId('findings-count')).toBeNull();

    await menu(user, 'new');

    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('1 Befund');
    });
    expect(api.requests('POST', /\/api\/v1\/check$/)).toHaveLength(1);
    expect(screen.getByTestId('findings-box')).toHaveTextContent('Hauptablauf ohne Auslöser');
  });

  it('brings the list of findings into view in the properties view of the strategy after a click (E2)', async () => {
    const user = userEvent.setup();
    mockApi({ findings: () => [{ level: 'error', code: 'flow.main_without_trigger', element: null, subject: null, details: {} }] });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    const count = await screen.findByTestId('findings-count');
    await waitFor(() => {
      expect(count).toHaveTextContent('1 Befund');
    });
    const scroll = vi.mocked(Element.prototype.scrollIntoView);
    scroll.mockClear();
    // another view is shown first: the click leads back to the strategy and to its list
    await user.click(screen.getByTestId('bar-library'));
    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'library');

    await user.click(count);

    expect(screen.getByTestId('app')).toHaveAttribute('data-panel', 'props');
    expect(screen.getByTestId('props-strategy')).toBeInTheDocument();
    const shown = scroll.mock.contexts.filter((element) => element instanceof HTMLElement && element.dataset.testid === 'sec-findings');
    expect(shown).toHaveLength(1);
    expect(scroll).toHaveBeenLastCalledWith({ block: 'start' });
    expect(within(screen.getByTestId('sec-findings')).getByTestId('finding')).toBeInTheDocument();
    // asked once per click: showing the view again later does not scroll again
    await user.click(screen.getByTestId('bar-library'));
    await user.click(screen.getByTestId('bar-props'));
    expect(scroll.mock.contexts.filter((element) => element instanceof HTMLElement && element.dataset.testid === 'sec-findings')).toHaveLength(1);
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
    // the cause is told in the language of the interface from its identifier (specification 4.2), not as the identifier
    expect(dialog).toHaveTextContent('Das Dokument ist nicht so aufgebaut, wie es sein muss, und wurde nicht angenommen.');
    expect(dialog).not.toHaveTextContent('document.invalid');
    expect(dialog).not.toHaveTextContent('The document does not fit');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');
  });

  it('shows the count of the findings in red only if there is an error; with hints alone it is orange and the tip counts right (order 07)', async () => {
    const user = userEvent.setup();
    let findings: { level: 'error' | 'hint'; code: string; element: null; subject: null; details: Record<string, never> }[] = [
      { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
    ];
    mockApi({ findings: () => findings });
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openEma(user);

    await menu(user, 'check');

    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('1 Befund');
    });
    const pill = screen.getByTestId('findings-count');
    expect(pill).toHaveClass('hints-only');
    expect(pill).not.toHaveClass('bad');
    expect(pill).toHaveAttribute('data-tip', '0 Fehler, 1 Hinweis. Ein Klick zeigt die Befunde.');

    findings = [
      { level: 'error', code: 'flow.not_reached', element: null, subject: null, details: {} },
      { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
      { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
    ];
    await menu(user, 'check');
    await waitFor(() => {
      expect(screen.getByTestId('findings-count')).toHaveTextContent('3 Befunde');
    });
    expect(screen.getByTestId('findings-count')).toHaveClass('bad');
    expect(screen.getByTestId('findings-count')).toHaveAttribute('data-tip', '1 Fehler, 2 Hinweise. Ein Klick zeigt die Befunde.');
  });

  it('shows the findings of "Prüfen" with the way to fix them', async () => {
    const user = userEvent.setup();
    mockApi({
      findings: () => [
        { level: 'error', code: 'flow.not_reached', element: null, subject: null, details: {} },
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
    expect(findings[0]).toHaveTextContent('Kein Auslöser erreicht dieses Element des Ablaufs.');
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
      expect(screen.getByTestId('props-none')).toBeInTheDocument();
    });
    expect(api.strategies.size).toBe(0);
  });
});

describe('the language (specification 5.1, M4)', () => {
  it('switches all texts, also the findings, the dialogs and the library, and shows no German text in the English interface', async () => {
    const user = userEvent.setup();
    mockApi({
      findings: () => [{ level: 'error', code: 'flow.not_reached', element: null, subject: null, details: {} }],
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
      'Ablaufsteuerung',
      'Marktdaten',
      'Aktionen',
      'Befunde',
      'Objekte und ihre Werte',
      'Weitere Verwendungen',
      'gespeichert',
      'Zur Stelle',
      'So beheben Sie es',
      'Order- und Positionsverwaltung',
    ]) {
      expect(text, german).not.toContain(german);
    }
    expect(screen.getByTestId('library')).toHaveTextContent('Flow control');
    expect(screen.getByTestId('library')).toHaveTextContent('Market data');
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

  it('shows the stored directory again after "Abbrechen" of "Dateien verschieben?" (B4), and sends nothing', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'settings');
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    const field = (await within(dialog).findByLabelText('Verzeichnis (absoluter Pfad)')) as HTMLInputElement;
    const stored = field.value;
    expect(stored).not.toBe('');

    fireEvent.change(field, { target: { value: '/neues/verzeichnis' } });
    await user.click(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' }));
    expect(within(dialog).getByText('Dateien verschieben?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    expect(within(dialog).queryByText('Dateien verschieben?')).toBeNull();
    expect((within(dialog).getByLabelText('Verzeichnis (absoluter Pfad)') as HTMLInputElement).value).toBe(stored);
    expect(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' })).toBeDisabled();
    expect(api.requests('PUT', /object-directory/)).toHaveLength(0);
  });

  it('has a designed list for the language, which works with the keyboard and leaves the dialog open on Escape (E4)', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'settings');
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });

    expect(dialog.querySelector('select')).toBeNull();
    const language = within(dialog).getByLabelText('Sprache');
    expect(language).toHaveAttribute('role', 'combobox');
    expect(language).toHaveAttribute('aria-expanded', 'false');
    language.focus();
    await user.keyboard('{ArrowDown}');
    expect(language).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getAllByRole('option').map((option) => option.textContent)).toEqual(['Deutsch', 'English']);
    await user.keyboard('{Escape}');
    expect(language).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('dialog', { name: 'Einstellungen' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    });
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
