import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { Finding } from './api/objects';
import type { StrategyDocument } from './document/types';
import {
  clickEmptyArea,
  clickNode,
  elementNodes,
  insertFromLibrary,
  menu,
  nodeByTitle,
  openStored,
  waitForReady,
} from './testing/actions';
import { mockBackend } from './testing/backend';
import { loadTestcase } from './testing/fixtures';
import { renderWithProviders } from './test-utils';

const stored = loadTestcase('str-03');

function titleField(): HTMLInputElement {
  return screen.getByLabelText('Bezeichnung') as HTMLInputElement;
}

async function start(options: Parameters<typeof mockBackend>[0] = {}) {
  const user = userEvent.setup();
  const backend = mockBackend(options);
  renderWithProviders(<App />);
  await waitForReady();
  return { user, backend };
}

async function typeTitle(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.clear(titleField());
  await user.type(titleField(), text);
}

describe('a new strategy', () => {
  it('shows an empty drawing area without any element and stores nothing yet', async () => {
    const { user, backend } = await start();

    await menu(user, 'Neue Strategie');

    expect(elementNodes()).toHaveLength(0);
    expect(document.querySelectorAll('.react-flow__node')).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Strategie' })).toBeInTheDocument();
    expect(backend.requests('POST', /strategies$/)).toHaveLength(0);
    expect(backend.requests('PUT', /strategies/)).toHaveLength(0);
    expect(backend.requests('POST', /check$/)).toHaveLength(0);
  });

  it('places no trigger by itself and chooses no type: a trigger is there only after the user takes it from the library', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');
    await menu(user, 'Speichern');
    await waitFor(() => {
      expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    });
    expect((backend.requests('POST', /strategies$/)[0]?.body as StrategyDocument).elements).toEqual([]);

    await insertFromLibrary(user, /^Kerzenschluss/);

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(1);
    });
    expect(nodeByTitle('Kerzenschluss')).toHaveTextContent('Kerzenschluss');
  });

  it('is checked without a finding: "Prüfen" of the empty strategy shows the number 0 and no text', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');

    await menu(user, 'Prüfen');

    expect(await screen.findByText('Befunde: 0')).toBeInTheDocument();
    expect(backend.requests('POST', /\/api\/v1\/check$/).length).toBeGreaterThan(0);
    expect((backend.requests('POST', /\/api\/v1\/check$/)[0]?.body as StrategyDocument).elements).toEqual([]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    const properties = screen.getByRole('complementary', { name: 'Eigenschaften' });
    expect(within(properties).queryByText(/Auslöser/)).toBeNull();
  });

  it('is saved with POST the first time and with PUT afterwards, and always', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');
    await insertFromLibrary(user, /^Kerzenschluss/);
    clickEmptyArea();
    await typeTitle(user, 'Meine Strategie');

    await menu(user, 'Speichern');

    await waitFor(() => {
      expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    });
    const sent = backend.requests('POST', /strategies$/)[0]?.body as StrategyDocument;
    expect(sent.title).toBe('Meine Strategie');
    expect(sent.elements).toHaveLength(1);
    const [id] = Array.from(backend.strategies.keys());

    // Nothing was changed, and it is saved again: with PUT, on the path of the identifier given by the backend.
    await menu(user, 'Speichern');

    await waitFor(() => {
      expect(backend.requests('PUT', /strategies\/.+/)).toHaveLength(1);
    });
    expect(backend.requests('PUT', /strategies\/.+/)[0]?.url).toBe(`/api/v1/strategies/${id}`);
    expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    expect((backend.requests('PUT', /strategies\/.+/)[0]?.body as StrategyDocument).id).toBe(id);
  });

  it.each([200, 201] as const)('takes the answer %s of PUT as a successful save', async (status) => {
    const { user, backend } = await start({ replaceStatus: status, findings: [{ level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} }] });
    await menu(user, 'Neue Strategie');
    await menu(user, 'Speichern');
    await waitFor(() => {
      expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    });
    await menu(user, 'Speichern');

    await waitFor(() => {
      expect(backend.requests('PUT', /strategies\/.+/)).toHaveLength(1);
    });
    expect(await screen.findByText('Befunde: 1')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the findings of the save without a message to click away: the number, the marked element, the text', async () => {
    const trigger = (document: StrategyDocument): Finding[] => [
      { level: 'error', code: 'parameter.missing', element: document.elements[0]!.id, subject: null, details: { parameter: 'zeiteinheit' } },
      { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
    ];
    const { user } = await start({ findings: trigger });
    await menu(user, 'Neue Strategie');
    await insertFromLibrary(user, /^Kerzenschluss/);
    clickEmptyArea();
    expect(screen.queryByText(/^Befunde:/)).toBeNull();

    await menu(user, 'Speichern');

    expect(await screen.findByText('Befunde: 2')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    // The finding without an element is in the property view of the strategy.
    const properties = screen.getByRole('complementary', { name: 'Eigenschaften' });
    expect(within(properties).getByText('Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt.')).toBeInTheDocument();
    // The element with the error is marked red, with the word.
    expect(nodeByTitle('Kerzenschluss').querySelector('.element-node')).toHaveAttribute('data-severity', 'error');
    expect(nodeByTitle('Kerzenschluss')).toHaveTextContent('Fehler');
    // Selected, its property view has the text beside the properties.
    clickNode(nodeByTitle('Kerzenschluss'));
    expect(await within(properties).findByText('Der Pflichtparameter „Zeiteinheit“ hat keinen Wert.')).toBeInTheDocument();
  });

  it('marks an element with a hint orange', async () => {
    const { user } = await start({
      findings: (document) => [{ level: 'hint', code: 'trigger.unconnected', element: document.elements[0]!.id, subject: null, details: {} }],
    });
    await menu(user, 'Neue Strategie');
    await insertFromLibrary(user, /^Kerzenschluss/);

    await menu(user, 'Prüfen');

    expect(await screen.findByText('Befunde: 1')).toBeInTheDocument();
    expect(nodeByTitle('Kerzenschluss').querySelector('.element-node')).toHaveAttribute('data-severity', 'hint');
    expect(nodeByTitle('Kerzenschluss')).toHaveTextContent('Hinweis');
    expect(screen.getByText('Befunde: 1')).toHaveAttribute('title', '0 Fehler, 1 Hinweise');
  });

  it('is checked with "Prüfen": POST to the check with the open document, findings shown, nothing stored', async () => {
    const { user, backend } = await start({
      findings: [{ level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} }],
    });
    await menu(user, 'Neue Strategie');

    await menu(user, 'Prüfen');

    expect(await screen.findByText('Befunde: 1')).toBeInTheDocument();
    expect(backend.requests('POST', /\/api\/v1\/check$/).length).toBeGreaterThan(0);
    expect(backend.requests('POST', /strategies$/)).toHaveLength(0);
    expect(screen.getByText('Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt.')).toBeInTheDocument();
  });
});

describe('opening a stored strategy', () => {
  it('lists title, description and the last change, with the unreadable ones marked and not openable', async () => {
    const { user } = await start({ strategies: [stored], unreadable: ['11111111-1111-4111-8111-111111111111'] });

    await menu(user, 'Öffnen');

    const dialog = await screen.findByRole('dialog', { name: 'Strategie öffnen' });
    const rows = await within(dialog).findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]!).getByRole('button', { name: 'EMA-Trendfolge' })).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/^Testfall str-03/)).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/\d\d\.\d\d\.\d{4}, \d\d:\d\d Uhr/)).toBeInTheDocument();
    expect(within(rows[2]!).getByText('nicht lesbar')).toBeInTheDocument();
    expect(within(rows[2]!).queryByRole('button')).toBeNull();
  });

  it('loads it onto the drawing area: elements, a frame for the management, the strategy selected, nothing changed', async () => {
    const { user } = await start({ strategies: [stored] });

    await openStored(user, 'EMA-Trendfolge');

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });
    expect(document.querySelectorAll('.react-flow__node-management')).toHaveLength(1);
    expect(titleField()).toHaveValue('EMA-Trendfolge');
    expect(screen.queryByRole('dialog')).toBeNull();
    // The check follows the opening, so the number of findings is known.
    expect(await screen.findByText('Befunde: 0')).toBeInTheDocument();
  });

  it('shows the error and keeps the open document when opening fails', async () => {
    const { user } = await start({ strategies: [stored], fail: { read: { status: 500, body: { detail: 'The object file could not be read.' } } } });
    await menu(user, 'Neue Strategie');
    await typeTitle(user, 'Offen');

    await openStored(user, 'EMA-Trendfolge');
    await user.click(within(screen.getByRole('dialog', { name: 'Ungespeicherte Änderungen' })).getByRole('button', { name: 'Verwerfen' }));

    const alert = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht geöffnet werden.' });
    expect(within(alert).getByText('Das Backend hat die Anfrage mit dem Status 500 abgelehnt.')).toBeInTheDocument();
    expect(within(alert).getByText('The object file could not be read.')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    // The strategy that was open stays open and keeps its change.
    expect(titleField()).toHaveValue('Offen');
  });

  it('shows an error of the list in the dialog and lets the user try again', async () => {
    const user = userEvent.setup();
    let fail = true;
    const backend = mockBackend({ strategies: [stored] });
    renderWithProviders(<App />);
    await waitForReady();
    // The first answer fails, the next one works.
    const original = globalThis.fetch;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      if (fail && String(input) === '/api/v1/strategies') {
        fail = false;
        return Promise.resolve(new Response(JSON.stringify({ detail: 'The object directory of pipwerk Studio cannot be read.' }), { status: 500 }));
      }
      return original(input, init);
    });

    await menu(user, 'Öffnen');
    const dialog = await screen.findByRole('dialog', { name: 'Strategie öffnen' });

    expect(await within(dialog).findByText('Die Liste der Strategien konnte nicht gelesen werden.')).toBeInTheDocument();
    expect(within(dialog).getByText('The object directory of pipwerk Studio cannot be read.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Erneut versuchen' }));
    expect(await within(dialog).findByRole('button', { name: 'EMA-Trendfolge' })).toBeInTheDocument();
    expect(backend.requests('GET', /strategies$/).length).toBeGreaterThan(0);
  });

  it('closes with "Abbrechen" and leaves everything as it was', async () => {
    const { user } = await start({ strategies: [stored] });

    await menu(user, 'Öffnen');
    const dialog = await screen.findByRole('dialog', { name: 'Strategie öffnen' });
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(elementNodes()).toHaveLength(0);
  });
});

describe('unsaved changes', () => {
  async function changed(options: Parameters<typeof mockBackend>[0] = { strategies: [stored] }) {
    const started = await start(options);
    await menu(started.user, 'Neue Strategie');
    await typeTitle(started.user, 'Geändert');
    return started;
  }

  function question() {
    return screen.getByRole('dialog', { name: 'Ungespeicherte Änderungen' });
  }

  it.each([
    ['Neue Strategie', async (user: ReturnType<typeof userEvent.setup>) => menu(user, 'Neue Strategie')],
    ['Schließen', async (user: ReturnType<typeof userEvent.setup>) => menu(user, 'Schließen')],
    ['Öffnen', async (user: ReturnType<typeof userEvent.setup>) => openStored(user, 'EMA-Trendfolge')],
  ])('asks before "%s": save, discard, cancel', async (_name, act) => {
    const { user } = await changed();

    await act(user);

    const dialog = question();
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Speichern', 'Verwerfen', 'Abbrechen']);
  });

  it('does not ask without a change', async () => {
    const { user } = await start({ strategies: [stored] });
    await menu(user, 'Neue Strategie');

    await menu(user, 'Neue Strategie');
    expect(screen.queryByRole('dialog')).toBeNull();
    await menu(user, 'Schließen');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(elementNodes()).toHaveLength(0);
  });

  it('does not ask after the strategy was saved, and asks again after the next change', async () => {
    const { user } = await changed();
    await menu(user, 'Speichern');
    await waitFor(() => {
      expect(screen.getByLabelText('Bezeichnung')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled();
    });

    await menu(user, 'Schließen');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(elementNodes()).toHaveLength(0);
  });

  it('"Abbrechen" leaves the strategy open and changed', async () => {
    const { user } = await changed();
    await menu(user, 'Schließen');

    await user.click(within(question()).getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(titleField()).toHaveValue('Geändert');
    expect(elementNodes()).toHaveLength(0);
  });

  it('Escape is the same as "Abbrechen"', async () => {
    const { user } = await changed();
    await menu(user, 'Schließen');
    const dialog = question();

    dialog.dispatchEvent(new Event('close'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(titleField()).toHaveValue('Geändert');
    void user;
  });

  it('"Verwerfen" discards the changes and does what was asked: closes', async () => {
    const { user, backend } = await changed();
    await menu(user, 'Schließen');

    await user.click(within(question()).getByRole('button', { name: 'Verwerfen' }));

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(0);
    });
    expect(backend.requests('POST', /strategies$/)).toHaveLength(0);
    expect(screen.getByText('Die Arbeitsfläche ist leer.')).toBeInTheDocument();
  });

  it('"Verwerfen" before "Neue Strategie" gives a new strategy without the changes', async () => {
    const { user } = await changed();
    await menu(user, 'Neue Strategie');

    await user.click(within(question()).getByRole('button', { name: 'Verwerfen' }));

    await waitFor(() => {
      expect(titleField()).toHaveValue('');
    });
    expect(elementNodes()).toHaveLength(0);
  });

  it('"Speichern" saves first and then does what was asked: opens the chosen strategy', async () => {
    const { user, backend } = await changed();
    await openStored(user, 'EMA-Trendfolge');

    await user.click(within(question()).getByRole('button', { name: 'Speichern' }));

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });
    expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    expect((backend.requests('POST', /strategies$/)[0]?.body as StrategyDocument).title).toBe('Geändert');
    expect(titleField()).toHaveValue('EMA-Trendfolge');
  });

  it('"Speichern" that fails shows the error and does not do what was asked; the strategy stays open', async () => {
    const { user, backend } = await changed({
      strategies: [stored],
      fail: { create: { status: 413, body: { detail: 'The document is too large to be stored.' } } },
    });
    await menu(user, 'Schließen');

    await user.click(within(question()).getByRole('button', { name: 'Speichern' }));

    const alert = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht gespeichert werden.' });
    expect(within(alert).getByText('The document is too large to be stored.')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(titleField()).toHaveValue('Geändert');
    expect(elementNodes()).toHaveLength(0);
    expect(backend.strategies.size).toBe(1);
  });
});

describe('failing requests', () => {
  it('saving: the error is shown with its cause, the document stays, and it can be saved again', async () => {
    const { user, backend } = await start({ fail: { create: { status: 500, body: { detail: 'The object file could not be written or deleted.' } } } });
    await menu(user, 'Neue Strategie');
    await typeTitle(user, 'Wichtig');

    await menu(user, 'Speichern');

    const alert = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht gespeichert werden.' });
    expect(within(alert).getByText('The object file could not be written or deleted.')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(titleField()).toHaveValue('Wichtig');
    expect(backend.strategies.size).toBe(0);
    // Still unsaved: closing asks.
    await menu(user, 'Schließen');
    expect(screen.getByRole('dialog', { name: 'Ungespeicherte Änderungen' })).toBeInTheDocument();
  });

  it('saving: a backend that is not reachable is told as such', async () => {
    const { user } = await start({ fail: { create: 'network-error' } });
    await menu(user, 'Neue Strategie');

    await menu(user, 'Speichern');

    const alert = await screen.findByRole('alertdialog');
    expect(within(alert).getByText('Das Backend ist nicht erreichbar.')).toBeInTheDocument();
  });

  it('checking: the error is shown and the document stays', async () => {
    const { user } = await start({ fail: { check: { status: 500, body: { detail: 'x' } } } });
    await menu(user, 'Neue Strategie');
    await typeTitle(user, 'Bleibt');

    await menu(user, 'Prüfen');

    const alert = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht geprüft werden.' });
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(titleField()).toHaveValue('Bleibt');
  });

  it('an answer that does not have the expected form is not used', async () => {
    const { user } = await start({ fail: { create: { status: 200, body: { id: 'x' } } } });
    await menu(user, 'Neue Strategie');

    await menu(user, 'Speichern');

    const alert = await screen.findByRole('alertdialog');
    expect(within(alert).getByText('Das Backend hat eine unerwartete Antwort geschickt.')).toBeInTheDocument();
  });
});

describe('deleting', () => {
  it('asks first; "Abbrechen" deletes nothing', async () => {
    const { user, backend } = await start({ strategies: [stored] });
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });

    await menu(user, 'Löschen');
    const dialog = screen.getByRole('dialog', { name: 'Strategie löschen?' });
    expect(within(dialog).getByText('Die Strategie „EMA-Trendfolge“ wird gelöscht.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    expect(backend.requests('DELETE', /strategies/)).toHaveLength(0);
    expect(elementNodes()).toHaveLength(stored.elements.length);
  });

  it('deletes the open strategy after the question and closes it', async () => {
    const { user, backend } = await start({ strategies: [stored] });
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });

    await menu(user, 'Löschen');
    await user.click(within(screen.getByRole('dialog', { name: 'Strategie löschen?' })).getByRole('button', { name: 'Löschen' }));

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(0);
    });
    expect(backend.requests('DELETE', /strategies/)).toHaveLength(1);
    expect(backend.requests('DELETE', /strategies/)[0]?.url).toBe(`/api/v1/strategies/${stored.id}`);
    expect(backend.strategies.size).toBe(0);
  });

  it('keeps the strategy open if deleting fails, and tells why', async () => {
    const { user } = await start({
      strategies: [stored],
      fail: { delete: { status: 409, body: { detail: 'The object file cannot be read or does not fit the document schema. It is left unchanged.' } } },
    });
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });

    await menu(user, 'Löschen');
    await user.click(within(screen.getByRole('dialog', { name: 'Strategie löschen?' })).getByRole('button', { name: 'Löschen' }));

    const alert = await screen.findByRole('alertdialog', { name: 'Die Strategie konnte nicht gelöscht werden.' });
    expect(within(alert).getByText(/cannot be read/)).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(elementNodes()).toHaveLength(stored.elements.length);
  });

  it('only closes a strategy that was never saved, without a request', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');

    await menu(user, 'Löschen');
    const dialog = screen.getByRole('dialog', { name: 'Strategie löschen?' });
    expect(within(dialog).getByText('Sie wurde noch nicht gespeichert; es wird nur die geöffnete Strategie verworfen.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(0);
    });
    expect(backend.requests('DELETE', /strategies/)).toHaveLength(0);
  });
});

describe('the menu', () => {
  it('lets only "Neue Strategie", "Öffnen" and "Einstellungen" work without a strategy', async () => {
    await start();

    const enabled = within(screen.getByRole('navigation', { name: 'Menü' }))
      .getAllByRole('button')
      .filter((button) => !(button as HTMLButtonElement).disabled)
      .map((button) => button.textContent);

    expect(enabled).toEqual(['Neue Strategie', 'Öffnen', 'Einstellungen']);
  });

  it('does not create or open a strategy while the type descriptions are not loaded', async () => {
    const user = userEvent.setup();
    mockBackend({ fail: {} });
    // The answer of the type descriptions never comes.
    const original = globalThis.fetch;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes('element-types') ? new Promise<Response>(() => undefined) : original(input, init),
    );
    renderWithProviders(<App />);

    expect(screen.getByRole('button', { name: 'Neue Strategie' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Öffnen' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
    expect(screen.getByRole('dialog', { name: 'Einstellungen' })).toBeInTheDocument();
  });

  it('tells when the type descriptions cannot be loaded and offers to try again', async () => {
    const user = userEvent.setup();
    mockBackend({ elementTypes: { types: 3 } });
    renderWithProviders(<App />);

    const alert = await screen.findByText(/Die Typbeschreibungen konnten nicht geladen werden/);
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neue Strategie' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    void user;
  });
});
