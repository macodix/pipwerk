import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DataView } from './DataView';
import { periodProblem } from './DeleteDialog';
import {
  DELETIONS_PATH,
  FakeBackend,
  INSTRUMENT_JSON,
  deletionJson,
  json,
  renderWithProviders,
  rowJson,
} from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

type User = ReturnType<typeof userEvent.setup>;

function bodies(kind: string) {
  return backend.callsTo('POST', `${DELETIONS_PATH}/${kind}`).map((call) => call.body);
}

function seriesCalls() {
  return backend.callsTo('GET', '/api/v1/market-data/series');
}

async function openDetails(user: User, index = 0): Promise<void> {
  const rows = await screen.findAllByTestId('stock-row');
  await user.click(rows[index] as HTMLElement);
  await screen.findByTestId('stock-detail');
}

describe('DeleteDialog, a whole series', () => {
  beforeEach(() => {
    backend.rows = [rowJson(), rowJson({ instrument: 'GBPUSD', data: 'ticks' })];
    backend.brokers = ['Demo-Server'];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
  });

  it('asks first what would be deleted, names it and says that it cannot be undone, and deletes only after the confirmation', async () => {
    backend.deletionAnswer = (kind, body) =>
      json(200, deletionJson({ kind, deleted: body.confirm === true, candle_count: 1234 }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);

    await user.click(screen.getByTestId('delete-open'));
    const dialog = screen.getByTestId('dialog-delete');
    expect(within(dialog).getByRole('heading', { name: 'Reihe löschen' })).toBeInTheDocument();
    expect(bodies('series')).toEqual([]);
    await user.click(screen.getByTestId('delete-next'));

    const question = await screen.findByTestId('delete-question');
    expect(bodies('series')).toEqual([{ broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1', confirm: false }]);
    expect(within(dialog).getByRole('heading', { name: 'Reihe löschen?' })).toBeInTheDocument();
    expect(screen.getByTestId('delete-fact-broker')).toHaveTextContent('Demo-Server');
    expect(screen.getByTestId('delete-fact-instrument')).toHaveTextContent('EURUSD');
    expect(screen.getByTestId('delete-fact-data')).toHaveTextContent('Kerzen H1');
    expect(screen.getByTestId('delete-extent')).toHaveTextContent('Gelöscht werden 1.234 Kerzen.');
    expect(question).toHaveTextContent('Das Löschen lässt sich nicht rückgängig machen.');
    expect(bodies('series')).toHaveLength(1);

    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
    });
    expect(bodies('series')).toEqual([
      { broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1', confirm: false },
      { broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1', confirm: true },
    ]);
    expect(screen.getByTestId('delete-notice')).toHaveTextContent('Gelöscht: Kerzen H1 von EURUSD bei Demo-Server.');
  });

  it('says "1 Kerze" for one candle and names ticks', async () => {
    backend.deletionAnswer = (kind, body) =>
      json(200, deletionJson({ kind, deleted: body.confirm === true, data: 'ticks', candle_count: 0, tick_count: 1 }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user, 1);

    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByTestId('delete-extent')).toHaveTextContent('Gelöscht wird 1 Tick.');
  });

  it('deletes nothing when the question is answered with "Abbrechen"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));
    await screen.findByTestId('delete-question');

    await user.click(screen.getByTestId('delete-cancel'));

    expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
    expect(bodies('series').map((body) => (body as { confirm: boolean }).confirm)).toEqual([false]);
    expect(screen.queryByTestId('delete-notice')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('stock-row')).toHaveLength(2);
  });

  it('reads the table, the details, the brokers and the broker for test runs again after the deletion and closes the details of the gone series', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    const before = seriesCalls().length;
    const brokersBefore = backend.callsTo('GET', '/api/v1/market-data/brokers').length;
    backend.deletionAnswer = (kind, body) => {
      if (body.confirm === true) {
        backend.rows = backend.rows.slice(1);
      }
      return json(200, deletionJson({ kind, deleted: body.confirm === true }));
    };

    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));
    await screen.findByTestId('delete-question');
    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(1);
    });
    expect(seriesCalls().length).toBeGreaterThan(before);
    expect(backend.callsTo('GET', '/api/v1/market-data/brokers').length).toBeGreaterThan(brokersBefore);
    expect(screen.queryByTestId('stock-detail')).not.toBeInTheDocument();
    expect(screen.getByTestId('stock-row')).toHaveAttribute('data-instrument', 'GBPUSD');
  });

  it('names the broker that goes with the last data and that no broker for test runs is chosen then', async () => {
    backend.testRunBroker = 'Demo-Server';
    backend.deletionAnswer = (kind, body) => {
      const deleted = body.confirm === true;
      if (deleted) {
        backend.rows = [];
        backend.brokers = [];
        backend.testRunBroker = null;
      }
      return json(
        200,
        deletionJson({
          kind,
          deleted,
          broker_removed: true,
          test_run_broker_reset: true,
          test_run_broker: deleted ? { broker: null, chosen: false } : { broker: 'Demo-Server', chosen: true },
        }),
      );
    };
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await waitFor(() => {
      expect(screen.getByTestId('select-test-broker')).toHaveDisplayValue('Demo-Server');
    });

    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByTestId('delete-broker-goes')).toHaveTextContent(
      'Danach hat der Broker Demo-Server keine Daten mehr und kommt im Datenbestand nicht mehr vor.',
    );
    expect(screen.getByTestId('delete-test-broker')).toHaveTextContent(
      'Demo-Server ist als „Broker für Testläufe“ gewählt. Danach ist kein Broker gewählt.',
    );
    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('stock-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('delete-notice')).toHaveTextContent('Es ist jetzt kein Broker für Testläufe gewählt.');
    expect(screen.getByTestId('select-test-broker')).toHaveDisplayValue('kein Broker');
    expect(screen.queryByTestId('test-broker-applies')).not.toBeInTheDocument();
  });
});

describe('DeleteDialog, a period', () => {
  beforeEach(() => {
    backend.rows = [rowJson({ data: 'm1' })];
    backend.brokers = ['Demo-Server'];
  });

  async function choosePeriod(user: User, start: string, end: string): Promise<void> {
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-scope-period'));
    fireEvent.change(screen.getByTestId('delete-start'), { target: { value: start } });
    fireEvent.change(screen.getByTestId('delete-end'), { target: { value: end } });
  }

  it('sends the period in UTC to the minute, asks first, names the period and deletes after the confirmation', async () => {
    backend.deletionAnswer = (kind, body) =>
      json(
        200,
        deletionJson({
          kind,
          deleted: body.confirm === true,
          data: 'm1',
          start: '2026-01-05T08:00:00Z',
          end: '2026-01-05T10:30:00Z',
          candle_count: 150,
          series_count: 0,
        }),
      );
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await choosePeriod(user, '2026-01-05T08:00', '2026-01-05T10:30');

    await user.click(screen.getByTestId('delete-next'));

    await screen.findByTestId('delete-question');
    expect(bodies('period')).toEqual([
      {
        broker: 'Demo-Server',
        instrument: 'EURUSD',
        data: 'm1',
        start: '2026-01-05T08:00:00Z',
        end: '2026-01-05T10:30:00Z',
        confirm: false,
      },
    ]);
    expect(bodies('series')).toEqual([]);
    expect(screen.getByRole('heading', { name: 'Zeitraum löschen?' })).toBeInTheDocument();
    expect(screen.getByTestId('delete-fact-period')).toHaveTextContent('05.01.2026 08:00 – 05.01.2026 10:30');
    expect(screen.getByTestId('delete-extent')).toHaveTextContent('Gelöscht werden 150 Kerzen.');
    expect(screen.getByTestId('delete-irreversible')).toBeInTheDocument();
    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
    });
    expect((bodies('period')[1] as { confirm: boolean }).confirm).toBe(true);
    expect(screen.getByTestId('delete-notice')).toHaveTextContent(
      'Gelöscht: Kerzen M1 von EURUSD bei Demo-Server, von 05.01.2026 08:00 bis 05.01.2026 10:30 (UTC).',
    );
    // The series is still there: its details stay open.
    expect(screen.getByTestId('stock-detail')).toBeInTheDocument();
  });

  it('says that the series is removed when the period holds all its data', async () => {
    backend.deletionAnswer = (kind, body) =>
      json(200, deletionJson({ kind, deleted: body.confirm === true, data: 'm1', start: '2026-01-05T08:00:00Z', end: '2026-01-05T10:30:00Z', series_count: 1 }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await choosePeriod(user, '2026-01-05T08:00', '2026-01-05T10:30');

    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByText('Danach hat die Reihe keine Daten mehr und entfällt.')).toBeInTheDocument();
  });

  it.each([
    ['', ''],
    ['2026-01-05T08:00', ''],
    ['2026-01-05T10:00', '2026-01-05T08:00'],
    ['2026-01-05T08:00', '2026-01-05T08:00'],
    ['1969-12-31T23:00', '2026-01-05T08:00'],
    ['2026-01-05T08:00', '2100-01-01T00:01'],
  ])('does not ask for the period %j to %j and names the next step', async (start, end) => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await choosePeriod(user, start, end);

    expect(screen.getByTestId('delete-next')).toBeDisabled();
    expect(screen.getByTestId('delete-period-hint')).toHaveTextContent('Nächster Schritt');
    expect(bodies('period')).toEqual([]);
  });

  it('accepts a period from 1970 to 2100', () => {
    expect(periodProblem('1970-01-01T00:00', '2100-01-01T00:00')).toBe(false);
    expect(periodProblem('2026-01-05T08:00', '2026-01-05T08:01')).toBe(false);
  });

  it('shows the message of the backend for a period without data and offers only to close', async () => {
    backend.deletionAnswer = () => json(404, { detail: 'x', code: 'period_empty', message: 'x' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await choosePeriod(user, '2026-02-05T08:00', '2026-02-05T10:30');

    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByTestId('delete-ask-error')).toHaveTextContent('Die Reihe hat in diesem Zeitraum keine Daten. Nächster Schritt');
    expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-question')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('delete-cancel'));
    expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
  });
});

describe('DeleteDialog, contract data', () => {
  it('has no choice, asks at once and deletes the contract data after the confirmation; the series stays', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
    backend.deletionAnswer = (kind, body) => {
      if (body.confirm === true) {
        delete backend.contracts['Demo-Server|EURUSD'];
      }
      return json(
        200,
        deletionJson({ kind, deleted: body.confirm === true, data: null, candle_count: 0, series_count: 0, instrument_count: 1 }),
      );
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await screen.findByTestId('contract-contractSize');

    await user.click(screen.getByTestId('delete-contract-open'));

    expect(await screen.findByTestId('delete-question')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-next')).not.toBeInTheDocument();
    expect(bodies('contract')).toEqual([{ broker: 'Demo-Server', instrument: 'EURUSD', confirm: false }]);
    expect(screen.getByRole('heading', { name: 'Kontraktdaten löschen?' })).toBeInTheDocument();
    expect(screen.getByTestId('delete-extent')).toHaveTextContent('Gelöscht werden die Kontraktdaten von EURUSD bei diesem Broker.');
    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('delete-notice')).toHaveTextContent('Gelöscht: Kontraktdaten von EURUSD bei Demo-Server.');
    expect(await screen.findByTestId('contract-missing')).toBeInTheDocument();
    expect(screen.getByTestId('stock-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-contract-open')).not.toBeInTheDocument();
  });

  it('offers only the deletion of the contract data for a row of contract data', async () => {
    backend.rows = [rowJson({ data: 'contract', first: null, last: null })];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);

    expect(screen.getByTestId('delete-contract-open')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-open')).not.toBeInTheDocument();
  });

  it('offers no deletion of contract data when the instrument has none at this broker', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await screen.findByTestId('contract-missing');

    expect(screen.getByTestId('delete-open')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-contract-open')).not.toBeInTheDocument();
  });
});

describe('DeleteDialog, all data of a broker', () => {
  beforeEach(() => {
    backend.rows = [rowJson(), rowJson({ broker: 'Other-Server', instrument: 'XAUUSD', data: 'ticks' })];
    backend.brokers = ['Demo-Server', 'Other-Server'];
  });

  it('is offered only when the filter names one broker', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findAllByTestId('stock-row');
    expect(screen.queryByTestId('broker-delete')).not.toBeInTheDocument();

    await user.type(screen.getByTestId('filter-broker'), 'Demo');

    expect(await screen.findByTestId('delete-broker-open')).toHaveTextContent('Alle Daten dieses Brokers löschen …');
    expect(screen.getByTestId('delete-broker-name')).toHaveTextContent('Demo-Server');

    await user.clear(screen.getByTestId('filter-broker'));
    await user.type(screen.getByTestId('filter-broker'), 'Server');

    expect(await screen.findByTestId('delete-broker-hint')).toHaveTextContent('Nächster Schritt: Geben Sie den Namen eines einzelnen Brokers ein');
    expect(screen.queryByTestId('delete-broker-open')).not.toBeInTheDocument();
  });

  it('asks what would be deleted, names series, candles, ticks and instruments, and deletes after the confirmation', async () => {
    backend.testRunBroker = 'Demo-Server';
    backend.deletionAnswer = (kind, body) => {
      const deleted = body.confirm === true;
      if (deleted) {
        backend.rows = backend.rows.filter((row) => row.broker !== 'Demo-Server');
        backend.brokers = ['Other-Server'];
        backend.testRunBroker = null;
      }
      return json(
        200,
        deletionJson({
          kind,
          deleted,
          instrument: null,
          data: null,
          candle_count: 2000,
          tick_count: 30,
          series_count: 3,
          instrument_count: 2,
          broker_removed: true,
          test_run_broker_reset: true,
          test_run_broker: deleted ? { broker: 'Other-Server', chosen: false } : { broker: 'Demo-Server', chosen: true },
        }),
      );
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findAllByTestId('stock-row');
    await user.type(screen.getByTestId('filter-broker'), 'Demo');
    await user.click(await screen.findByTestId('delete-broker-open'));

    const question = await screen.findByTestId('delete-question');

    expect(bodies('broker')).toEqual([{ broker: 'Demo-Server', confirm: false }]);
    expect(screen.getByRole('heading', { name: 'Alle Daten dieses Brokers löschen?' })).toBeInTheDocument();
    expect(screen.getByTestId('delete-extent')).toHaveTextContent(
      'Es werden gelöscht: 3 Reihen mit 2.000 Kerzen und 30 Ticks sowie die Kontraktdaten von 2 Instrumenten.',
    );
    expect(question).toHaveTextContent('Das Löschen lässt sich nicht rückgängig machen.');
    expect(screen.getByTestId('delete-test-broker')).toBeInTheDocument();
    await user.click(screen.getByTestId('delete-confirm'));

    await waitFor(() => {
      expect(screen.queryByTestId('dialog-delete')).not.toBeInTheDocument();
    });
    expect((bodies('broker')[1] as { confirm: boolean }).confirm).toBe(true);
    expect(screen.getByTestId('delete-notice')).toHaveTextContent(
      'Gelöscht: alle Daten von Demo-Server. Es ist jetzt kein Broker für Testläufe gewählt.',
    );
    // The broker for test runs: none is chosen, the one that applies is named.
    await waitFor(() => {
      expect(screen.getByTestId('select-test-broker')).toHaveDisplayValue('– keiner gewählt –');
    });
    expect(screen.getByTestId('test-broker-applies')).toHaveTextContent('Other-Server');
    expect(within(screen.getByTestId('select-test-broker')).getAllByRole('option').map((option) => option.textContent)).toEqual([
      '– keiner gewählt –',
      'Other-Server',
    ]);
    await waitFor(() => {
      expect(screen.getByTestId('stock-nomatch')).toBeInTheDocument();
    });
  });
});

describe('DeleteDialog, refusals', () => {
  beforeEach(() => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
  });

  const IMPORT_RUNNING = { detail: 'Data cannot be deleted while an import process exists. End it first.', reason: 'import_running' };

  it('shows the reason when the question is refused because of an import (409) and deletes nothing', async () => {
    backend.deletionAnswer = () => json(409, IMPORT_RUNNING);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));

    await user.click(screen.getByTestId('delete-next'));

    const error = await screen.findByTestId('delete-ask-error');
    expect(error).toHaveTextContent('Es besteht ein Import-Vorgang. Solange er besteht, lässt sich nichts löschen.');
    expect(error).toHaveTextContent('Nächster Schritt');
    expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument();
    expect(bodies('series')).toHaveLength(1);
  });

  it('shows the reason when the deletion itself is refused (409), keeps the dialog and deletes nothing', async () => {
    backend.deletionAnswer = (kind, body) =>
      body.confirm === true ? json(409, IMPORT_RUNNING) : json(200, deletionJson({ kind }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));
    await screen.findByTestId('delete-question');

    await user.click(screen.getByTestId('delete-confirm'));

    expect(await screen.findByTestId('delete-error')).toHaveTextContent('Es besteht ein Import-Vorgang.');
    expect(screen.getByTestId('dialog-delete')).toBeInTheDocument();
    expect(screen.getByTestId('delete-confirm')).toBeEnabled();
    expect(screen.queryByTestId('delete-notice')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('stock-row')).toHaveLength(1);
  });

  it('says that the backend is not reachable when the deletion cannot be sent', async () => {
    backend.deletionAnswer = (kind, body) => {
      if (body.confirm === true) {
        throw new TypeError('Failed to fetch');
      }
      return json(200, deletionJson({ kind }));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));
    await user.click(screen.getByTestId('delete-next'));
    await screen.findByTestId('delete-question');

    await user.click(screen.getByTestId('delete-confirm'));

    expect(await screen.findByTestId('delete-error')).toHaveTextContent('Das Backend ist nicht erreichbar. Nächster Schritt');
  });
});

describe('DeleteDialog, English and text', () => {
  it('shows the question in English', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    backend.deletionAnswer = (kind, body) => json(200, deletionJson({ kind, deleted: body.confirm === true, candle_count: 1 }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await openDetails(user);

    await user.click(screen.getByTestId('delete-open'));
    expect(screen.getByRole('heading', { name: 'Delete series' })).toBeInTheDocument();
    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByTestId('delete-extent')).toHaveTextContent('1 candle will be deleted.');
    expect(screen.getByTestId('delete-irreversible')).toHaveTextContent('Deleting cannot be undone.');
    expect(screen.getByTestId('delete-confirm')).toHaveTextContent('Delete for good');
  });

  it('sets names as text and never as HTML', async () => {
    const name = '<img src=x onerror=alert(1)>';
    backend.rows = [rowJson({ broker: name })];
    backend.brokers = [name];
    backend.deletionAnswer = (kind, body) => json(200, deletionJson({ kind, deleted: body.confirm === true, broker: name }));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDetails(user);
    await user.click(screen.getByTestId('delete-open'));

    await user.click(screen.getByTestId('delete-next'));

    expect(await screen.findByTestId('delete-fact-broker')).toHaveTextContent(name);
    expect(document.querySelector('img')).toBeNull();
  });

  it('explains the buttons that open the deletion', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findAllByTestId('stock-row');
    await user.type(screen.getByTestId('filter-broker'), 'Demo');
    await screen.findByTestId('delete-broker-open');
    await openDetails(user);
    await screen.findByTestId('delete-contract-open');

    for (const id of ['delete-open', 'delete-contract-open', 'delete-broker-open']) {
      expect(screen.getByTestId(id).getAttribute('data-tip')?.length ?? 0, id).toBeGreaterThan(30);
    }
  });
});
