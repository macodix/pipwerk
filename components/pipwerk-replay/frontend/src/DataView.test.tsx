import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DataView } from './DataView';
import {
  FakeBackend,
  INSTRUMENT_JSON,
  hintJson,
  json,
  readForm,
  refusedJson,
  renderWithProviders,
  rowJson,
  takenJson,
} from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

const GAP = { start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' };

/** 25 rows PAIR01 to PAIR25 of one broker. */
function manyRows(count = 25) {
  return Array.from({ length: count }, (_, index) =>
    rowJson({ instrument: `PAIR${String(index + 1).padStart(2, '0')}` }),
  );
}

function seriesCalls() {
  return backend.callsTo('GET', '/api/v1/market-data/series');
}

describe('DataView, bar and headings', () => {
  it('has the bar with the import button and the broker for test runs above the table', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    renderWithProviders(<DataView />);

    await screen.findByTestId('stock-row');

    const bar = screen.getByTestId('data-bar');
    expect(within(bar).getByRole('button', { name: 'Datei importieren …' })).toBeInTheDocument();
    expect(within(bar).getByLabelText('Broker für Testläufe')).toBe(screen.getByTestId('select-test-broker'));
    expect(bar.compareDocumentPosition(screen.getByTestId('stock'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('has short headings and none of the removed areas, and no text about "unten" or "oben"', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await user.click(screen.getByTestId('stock-row'));
    await screen.findByTestId('stock-detail');
    await user.click(screen.getByTestId('import-open'));

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual(
      expect.arrayContaining(['Datenbestand', 'Datenreihen', 'Datei importieren', 'Lücken', 'Kontraktdaten']),
    );
    const text = document.body.textContent ?? '';
    for (const removed of ['Was vorliegt', 'Angaben zum Instrument je Broker', 'Datei von Hand importieren', 'Beschaffung von Hand anstoßen']) {
      expect(text).not.toContain(removed);
    }
    expect(text).not.toMatch(/\b(unten|oben)\b/);
    expect(text).not.toMatch(/beschaff|Standardquelle/i);
  });

  it('explains every field with a text', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await user.click(screen.getByTestId('import-open'));
    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'EURUSD_H1.csv'));
    await screen.findByTestId('import-item');

    const fields = document.querySelectorAll('[data-testid^="field-"]');
    expect(fields.length).toBeGreaterThanOrEqual(7);
    for (const field of fields) {
      const tip = field.querySelector('.field-label')?.getAttribute('data-tip') ?? '';
      expect(tip.length, field.getAttribute('data-testid') ?? '').toBeGreaterThan(10);
      expect(field.querySelector('.info')).toHaveAttribute('tabindex', '0');
    }
    for (const header of screen.getByTestId('stock-table').querySelectorAll('th')) {
      expect(header.getAttribute('data-tip')?.length ?? 0).toBeGreaterThan(10);
    }
  });
});

describe('DataView, table', () => {
  it('names the next step when the data stock is empty and offers the import', async () => {
    renderWithProviders(<DataView />);

    const note = await screen.findByTestId('stock-empty');

    expect(note).toHaveTextContent('Nächster Schritt: Holen Sie Kursdaten mit pipwerk-fetch-mt5 auf dem Rechner von MetaTrader 5');
    expect(note).toHaveTextContent('„Datei importieren …“');
    expect(screen.queryByTestId('stock-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stock-filters')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-test-broker')).toBeDisabled();
    expect(screen.getByTestId('select-test-broker')).toHaveDisplayValue('kein Broker');
  });

  it('shows one row per series with broker, instrument, data, period in days and gaps', async () => {
    backend.rows = [
      rowJson({ gap_count: 2 }),
      rowJson({ data: 'ticks', first: '2026-01-05T08:00:00.250000Z', last: '2026-01-06T10:00:00Z' }),
      rowJson({ instrument: 'GBPUSD', data: 'contract', first: null, last: null }),
    ];
    renderWithProviders(<DataView />);

    const rows = await screen.findAllByTestId('stock-row');

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Demo-ServerEURUSDKerzen H105.01.2026 – 09.01.20262');
    expect(rows[0]).toHaveAttribute('data-data', 'h1');
    expect(rows[1]).toHaveTextContent('Ticks05.01.2026 – 06.01.20260');
    expect(rows[2]).toHaveTextContent('Demo-ServerGBPUSDKontraktdaten––');
    const headers = within(screen.getByTestId('stock-table')).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['Broker', 'Instrument', 'Daten', 'Zeitraum', 'Lücken']);
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–3 von 3 Reihen');
  });

  it('shows the English texts and the date format of English', async () => {
    backend.rows = [rowJson(), rowJson({ instrument: 'GBPUSD', data: 'contract', first: null, last: null })];
    renderWithProviders(<DataView />, 'en');

    const rows = await screen.findAllByTestId('stock-row');

    expect(rows[0]).toHaveTextContent('Candles H12026-01-05 – 2026-01-09');
    expect(rows[1]).toHaveTextContent('Contract data');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Data stock');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–2 of 2 series');
    expect(screen.getByRole('button', { name: 'Import files …' })).toBeInTheDocument();
  });

  it('pages through the rows on the server, ten at a time', async () => {
    backend.rows = manyRows(25);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await screen.findAllByTestId('stock-row');
    expect(screen.getAllByTestId('stock-row')).toHaveLength(10);
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–10 von 25 Reihen');
    expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 1 von 3');
    expect(screen.getByTestId('page-prev')).toBeDisabled();
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('0');
    expect(seriesCalls().at(-1)?.query.get('limit')).toBe('10');

    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('stock-count')).toHaveTextContent('11–20 von 25 Reihen');
    });
    expect(screen.getAllByTestId('stock-row')[0]).toHaveAttribute('data-instrument', 'PAIR11');
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('10');

    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('stock-count')).toHaveTextContent('21–25 von 25 Reihen');
    });
    expect(screen.getAllByTestId('stock-row')).toHaveLength(5);
    expect(screen.getByTestId('page-next')).toBeDisabled();

    await user.click(screen.getByTestId('page-prev'));
    await waitFor(() => {
      expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 2 von 3');
    });
  });

  it('filters by broker, instrument and data on the server and starts again at page one', async () => {
    backend.rows = [
      ...manyRows(15),
      rowJson({ broker: 'Other-Server', instrument: 'XAUUSD', data: 'h12' }),
      rowJson({ broker: 'Other-Server', instrument: 'XAUUSD', data: 'ticks' }),
    ];
    backend.brokers = ['Demo-Server', 'Other-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findAllByTestId('stock-row');
    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 2 von 2');
    });

    await user.type(screen.getByTestId('filter-broker'), 'OTHER');

    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(2);
    });
    expect(seriesCalls().at(-1)?.query.get('broker')).toBe('OTHER');
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('0');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–2 von 2 Reihen (gefiltert)');

    await user.type(screen.getByTestId('filter-instrument'), 'xau');
    await user.type(screen.getByTestId('filter-data'), 'Kerzen H12');
    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(1);
    });
    expect(seriesCalls().at(-1)?.query.get('instrument')).toBe('xau');
    expect(seriesCalls().at(-1)?.query.get('data')).toBe('h12');
  });

  it('says that no series matches the filter, keeps the filters and shows all rows again after clearing', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');

    await user.type(screen.getByTestId('filter-instrument'), 'ZZZ');

    expect(await screen.findByTestId('stock-nomatch')).toHaveTextContent('Keine Reihe passt zum Filter. Nächster Schritt: Ändern Sie einen Filter oder leeren Sie ihn.');
    expect(screen.getByTestId('filter-instrument')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('stock-count')).toHaveTextContent('0 Reihen');

    await user.clear(screen.getByTestId('filter-instrument'));
    expect(await screen.findByTestId('stock-row')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-nomatch')).not.toBeInTheDocument();
  });

  it('maps the displayed names of the data to their identifiers in the filter', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');

    for (const [typed, sent] of [['Kontraktdaten', 'contract'], ['Candles H1', 'h1'], ['tick', 'tick']]) {
      await user.clear(screen.getByTestId('filter-data'));
      await user.type(screen.getByTestId('filter-data'), typed as string);
      await waitFor(() => {
        expect(seriesCalls().at(-1)?.query.get('data')).toBe(sent);
      });
    }
  });

  it('shows the error when the data stock cannot be read', async () => {
    backend.seriesAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    renderWithProviders(<DataView />);

    const error = await screen.findByTestId('stock-error');

    expect(error).toHaveTextContent('Der Datenbestand konnte nicht gelesen werden.');
    expect(error).toHaveTextContent('Nächster Schritt');
  });
});

describe('DataView, details of a row', () => {
  it('shows all gaps and the contract data of the instrument at this broker after a click', async () => {
    backend.rows = [rowJson({ gap_count: 2 })];
    backend.gaps['Demo-Server|EURUSD|h1'] = [GAP, { start: '2026-01-08T00:00:00Z', end: '2026-01-08T02:00:00Z', reason: 'gap' }];
    backend.contracts['Demo-Server|EURUSD'] = { ...INSTRUMENT_JSON, margin_per_lot: 3650 };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    const row = await screen.findByTestId('stock-row');
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await user.click(row);

    const detail = await screen.findByTestId('stock-detail');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('gap-item').map((item) => item.textContent)).toEqual([
      '07.01.2026 04:00 – 07.01.2026 09:00',
      '08.01.2026 00:00 – 08.01.2026 02:00',
    ]);
    expect(within(detail).getByRole('heading', { name: 'Lücken' })).toBeInTheDocument();
    expect(within(detail).getByRole('heading', { name: 'Kontraktdaten' })).toBeInTheDocument();
    expect(screen.getByTestId('contract-contractSize')).toHaveTextContent('100.000');
    expect(screen.getByTestId('contract-tickValue')).toHaveTextContent('1 USD');
    expect(screen.getByTestId('contract-swap')).toHaveTextContent('-6,5 / 2,1');
    expect(screen.getByTestId('contract-tripleSwap')).toHaveTextContent('Mittwoch');
    expect(screen.getByTestId('contract-margin')).toHaveTextContent('3.650');
    expect(screen.getByTestId('contract-contractFrom')).toHaveTextContent('05.01.2026 08:00');
    const query = backend.callsTo('GET', '/api/v1/market-data/series/details')[0]?.query;
    expect([query?.get('broker'), query?.get('instrument'), query?.get('data')]).toEqual(['Demo-Server', 'EURUSD', 'h1']);

    await user.click(row);
    expect(screen.queryByTestId('stock-detail')).not.toBeInTheDocument();
  });

  it('opens with the keyboard and tells that there are no gaps', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const row = await screen.findByTestId('stock-row');

    row.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByTestId('gaps-none')).toHaveTextContent('Keine Lücken.');
    expect(row).toHaveAttribute('data-tip', 'Klicken zeigt die Einzelheiten dieser Reihe.');
  });

  it('says in a sentence that a test run does not start when the contract data are missing', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    const note = await screen.findByTestId('contract-missing');
    expect(note).toHaveTextContent('Ein Testlauf mit diesem Instrument startet dann nicht.');
    expect(note).toHaveTextContent('pipwerk-fetch-mt5');
    expect(screen.queryByTestId('contract-contractSize')).not.toBeInTheDocument();
  });

  it('shows only the contract data for a row of contract data', async () => {
    backend.rows = [rowJson({ data: 'contract', first: null, last: null })];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    expect(await screen.findByTestId('detail-contract')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-gaps')).not.toBeInTheDocument();
    expect(screen.getByTestId('contract-margin')).toHaveTextContent('–');
  });

  it('says how many gaps are shown when the list is cut', async () => {
    backend.rows = [rowJson({ gap_count: 5000 })];
    backend.gaps['Demo-Server|EURUSD|h1'] = [GAP];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    expect(await screen.findByTestId('gaps-cut')).toHaveTextContent('Gezeigt werden 1 von 5.000 Lücken.');
  });

  it('shows a message when the details cannot be read and closes the details with the next page', async () => {
    backend.rows = manyRows(12);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const rows = await screen.findAllByTestId('stock-row');
    // The row is gone from the data stock by the time the details are asked for.
    backend.rows = backend.rows.slice(1);

    await user.click(rows[0] as HTMLElement);

    expect(await screen.findByTestId('detail-error')).toHaveTextContent('Die Einzelheiten konnten nicht gelesen werden.');
    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.queryByTestId('stock-detail')).not.toBeInTheDocument();
    });
  });
});

describe('DataView, broker for test runs', () => {
  it('offers only the brokers of the data stock and shows the one that applies', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Zeta-Server', 'Alpha-Server'];
    renderWithProviders(<DataView />);

    const select = await screen.findByTestId('select-test-broker');

    await waitFor(() => {
      expect(select).toHaveDisplayValue('Alpha-Server');
    });
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['Zeta-Server', 'Alpha-Server']);
  });

  it('sets the broker through the web API', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const select = await screen.findByTestId('select-test-broker');
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Alpha-Server');
    });

    await user.selectOptions(select, 'Zeta-Server');

    await waitFor(() => {
      expect(backend.callsTo('PUT', '/api/replay/settings/test-run-broker')[0]?.body).toEqual({ broker: 'Zeta-Server' });
    });
    expect(backend.testRunBroker).toBe('Zeta-Server');
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Zeta-Server');
    });
  });

  it('shows a message with the next step when the broker cannot be set', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const select = await screen.findByTestId('select-test-broker');
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Alpha-Server');
    });
    backend.brokers = ['Alpha-Server'];

    await user.selectOptions(select, 'Zeta-Server');

    expect(await screen.findByTestId('test-broker-error')).toHaveTextContent('Nächster Schritt');
  });
});

describe('DataView, dialog "Datei importieren"', () => {
  async function openDialog(user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> {
    await user.click(await screen.findByTestId('import-open'));
    return screen.getByTestId('dialog-import');
  }

  async function chooseFiles(user: ReturnType<typeof userEvent.setup>, files: File[]): Promise<void> {
    await user.upload(screen.getByTestId('import-files'), files);
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(files.length);
    });
  }

  function item(name: string): HTMLElement {
    const found = screen.getAllByTestId('import-item').find((candidate) => candidate.getAttribute('data-name') === name);
    if (found === undefined) {
      throw new Error(`no item ${name}`);
    }
    return found;
  }

  it('opens from the bar, names the next step while empty and closes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const dialog = await openDialog(user);

    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByRole('heading', { name: 'Datei importieren' })).toBeInTheDocument();
    expect(screen.getByTestId('import-empty')).toHaveTextContent('Nächster Schritt: Wählen Sie Dateien im Format JSON oder CSV.');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(screen.queryByTestId('field-import-timezone')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('import-close'));

    expect(screen.queryByTestId('dialog-import')).not.toBeInTheDocument();
    expect(screen.getByTestId('import-open')).toHaveFocus();
  });

  it('presets instrument and data from the preview and the broker from the JSON files that agree', async () => {
    backend.brokers = ['Demo-Server'];
    backend.hints['a.json'] = hintJson('a.json', { broker: 'Server-X', instrument: 'EURUSD', data: 'h1' });
    backend.hints['b.json'] = hintJson('b.json', { broker: 'Server-X', instrument: 'GBPUSD', data: 'contract' });
    backend.hints['USDJPY_M15_202601050000_202601050100.csv'] = hintJson('USDJPY_M15_202601050000_202601050100.csv', {
      instrument: 'USDJPY',
      data: 'm15',
    });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [
      new File(['{}'], 'a.json'),
      new File(['{}'], 'b.json'),
      new File(['x'], 'USDJPY_M15_202601050000_202601050100.csv'),
    ]);

    expect(screen.getByTestId('import-broker')).toHaveValue('Server-X');
    expect(within(item('a.json')).getByTestId('import-instrument')).toHaveValue('EURUSD');
    expect(within(item('a.json')).getByTestId('import-data')).toHaveTextContent('Kerzen H1');
    expect(within(item('b.json')).getByTestId('import-data')).toHaveTextContent('Kontraktdaten');
    expect(within(item('b.json')).queryByRole('combobox')).not.toBeInTheDocument();
    const csv = item('USDJPY_M15_202601050000_202601050100.csv');
    expect(within(csv).getByTestId('import-instrument')).toHaveValue('USDJPY');
    expect(within(csv).getByTestId('import-data')).toHaveValue('m15');
    expect(within(csv).getByTestId('import-data')).toHaveDisplayValue('Kerzen M15');
    // The time zone appears only because a CSV file is there.
    expect(screen.getByTestId('field-import-timezone')).toBeInTheDocument();
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Nächster Schritt: Geben Sie die Zeitzone der CSV-Dateien an');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    // The brokers of the data stock are suggested.
    expect(Array.from(document.querySelectorAll('#import-brokers option')).map((option) => option.getAttribute('value'))).toEqual(['Demo-Server']);
  });

  it('leaves the broker empty when the JSON files name different brokers, and keeps what the user typed', async () => {
    backend.hints['a.json'] = hintJson('a.json', { broker: 'Server-X', instrument: 'EURUSD', data: 'h1' });
    backend.hints['b.json'] = hintJson('b.json', { broker: 'Server-Y', instrument: 'EURUSD', data: 'h4' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [new File(['{}'], 'a.json'), new File(['{}'], 'b.json')]);

    expect(screen.getByTestId('import-broker')).toHaveValue('');
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Nächster Schritt: Geben Sie den Broker an.');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    await user.type(screen.getByTestId('import-broker'), 'Mein Broker');
    expect(screen.getByTestId('import-run')).toBeEnabled();
    expect(screen.queryByTestId('field-import-timezone')).not.toBeInTheDocument();
  });

  it('marks a file without a recognised instrument or data and blocks the import until it is completed', async () => {
    backend.hints['export.csv'] = hintJson('export.csv');
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'export.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Athens');

    const csv = item('export.csv');
    expect(csv).toHaveAttribute('data-state', 'needs');
    expect(within(csv).getByTestId('import-missing')).toHaveTextContent('Instrument oder Daten nicht erkannt.');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Ergänzen Sie Instrument und Daten der markierten Dateien');

    await user.type(within(csv).getByTestId('import-instrument'), 'EURUSD');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    await user.selectOptions(within(csv).getByTestId('import-data'), 'Kerzen H4');

    expect(csv).toHaveAttribute('data-state', 'ready');
    expect(screen.getByTestId('import-run')).toBeEnabled();
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Klicken Sie auf „Importieren“');
  });

  it('removes a file from the list', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'A', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv'), new File(['x'], 'unknown.csv')]);
    expect(screen.getByTestId('import-run')).toBeDisabled();

    await user.click(within(item('unknown.csv')).getByTestId('import-remove'));

    expect(screen.getAllByTestId('import-item')).toHaveLength(1);
    expect(screen.queryByTestId('field-import-timezone')).toBeInTheDocument();
  });

  it('imports all files in one process and lists the result per file, a refused file beside the others', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    backend.hints['a.json'] = hintJson('a.json', { broker: 'New-Server', instrument: 'EURUSD', data: 'h1' });
    backend.hints['GBPUSD_H4.csv'] = hintJson('GBPUSD_H4.csv', { instrument: 'GBPUSD', data: 'h4' });
    backend.hints['bad.json'] = hintJson('bad.json', { instrument: 'XAUUSD', data: 'm1' });
    backend.importAnswer = (names) => {
      backend.rows = [...backend.rows, rowJson({ broker: 'New-Server', instrument: 'GBPUSD', data: 'h4' })];
      backend.brokers = ['Demo-Server', 'New-Server'];
      return json(200, {
        files: [
          takenJson(names[0] as string, { rejected: [{ row: 3, reason: 'high_below_open' }], rejected_count: 4, accepted: 1200, replaced: 12 }),
          takenJson(names[1] as string, { instrument: 'GBPUSD', unit: 'h4' }),
          refusedJson(names[2] as string, 'json_invalid'),
        ],
        imported_count: 2,
        refused_count: 1,
      });
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await openDialog(user);
    await chooseFiles(user, [new File(['{}'], 'a.json'), new File(['x'], 'GBPUSD_H4.csv'), new File(['{'], 'bad.json')]);
    await user.clear(screen.getByTestId('import-broker'));
    await user.type(screen.getByTestId('import-broker'), 'New-Server');
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Athens');
    await user.selectOptions(within(item('GBPUSD_H4.csv')).getByTestId('import-data'), 'Kerzen H1');

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('2 von 3 Dateien sind importiert. Abgelehnt: 1.');
    const calls = backend.callsTo('POST', '/api/v1/market-data/imports');
    expect(calls).toHaveLength(1);
    expect(readForm(calls[0]?.body)).toEqual({
      broker: 'New-Server',
      timezone: 'Europe/Athens',
      files: ['a.json', 'GBPUSD_H4.csv', 'bad.json'],
      instrument: ['EURUSD', 'GBPUSD', 'XAUUSD'],
      data: ['h1', 'h1', 'm1'],
    });
    const first = item('a.json');
    expect(first).toHaveAttribute('data-state', 'done');
    expect(within(first).getByTestId('import-result')).toHaveTextContent('1.200 Zeilen übernommen, davon 12 als Ersatz. Zeitraum: 05.01.2026 08:00 – 05.01.2026 10:00 (UTC).');
    expect(within(first).getByTestId('import-rejected')).toHaveTextContent('4 Zeilen abgelehnt:');
    expect(within(first).getByTestId('import-rejected-row')).toHaveTextContent('Zeile 3: Hoch liegt unter der Eröffnung.');
    expect(within(first).getByText('und 3 weitere')).toBeInTheDocument();
    expect(within(first).getByTestId('import-instrument')).toBeDisabled();
    expect(item('GBPUSD_H4.csv')).toHaveAttribute('data-state', 'done');
    const refused = item('bad.json');
    expect(refused).toHaveAttribute('data-state', 'failed');
    expect(within(refused).getByTestId('import-result')).toHaveTextContent('Abgelehnt: Die Datei ist kein gültiges JSON. Nächster Schritt');
    // The table behind the dialog and the brokers are read again.
    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(2);
    });
    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll('#import-brokers option')).map((option) => option.getAttribute('value')),
      ).toEqual(['Demo-Server', 'New-Server']);
    });
    // Only the refused file is left to import; the others are done.
    expect(screen.getByTestId('import-run')).toBeEnabled();
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Ergänzen Sie die abgelehnten Dateien');
  });

  it('imports only the refused file again after the user corrected it', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    backend.hints['b.csv'] = hintJson('b.csv', { instrument: 'GBPUSD', data: 'h1' });
    let round = 0;
    backend.importAnswer = (names) => {
      round += 1;
      return json(200, {
        files: names.map((name) => (round === 1 && name === 'b.csv' ? refusedJson(name, 'timezone_unknown') : takenJson(name))),
        imported_count: round === 1 ? 1 : names.length,
        refused_count: round === 1 ? 1 : 0,
      });
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv'), new File(['x'], 'b.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Nowhere');
    await user.click(screen.getByTestId('import-run'));
    await screen.findByTestId('import-summary');
    expect(within(item('b.csv')).getByTestId('import-result')).toHaveTextContent('Die Zeitzone ist unbekannt.');

    await user.clear(screen.getByTestId('import-timezone'));
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Athens');
    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('1 von 1 Dateien sind importiert.');
    });
    const second = readForm(backend.callsTo('POST', '/api/v1/market-data/imports')[1]?.body);
    expect(second.files).toEqual(['b.csv']);
    expect(second.timezone).toBe('Europe/Athens');
    expect(item('b.csv')).toHaveAttribute('data-state', 'done');
    expect(screen.getByTestId('import-run')).toBeDisabled();
  });

  it('drops the refusal of a file when the user changes it', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    backend.importAnswer = (names) =>
      json(200, { files: names.map((name) => refusedJson(name, 'series_invalid')), imported_count: 0, refused_count: 1 });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');
    await user.click(screen.getByTestId('import-run'));
    expect(await screen.findByTestId('import-result')).toHaveTextContent('Abgelehnt');

    await user.type(within(item('a.csv')).getByTestId('import-instrument'), 'X');

    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
    expect(item('a.csv')).toHaveAttribute('data-state', 'ready');
  });

  it('marks an unreadable JSON file, does not block the others and lets the import refuse it', async () => {
    backend.hints['broken.json'] = hintJson('broken.json', { error: 'json_invalid' });
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [new File(['{'], 'broken.json'), new File(['x'], 'a.csv')]);

    const broken = item('broken.json');
    expect(within(broken).getByTestId('import-unreadable')).toHaveTextContent('Die Datei ist kein gültiges JSON.');
    expect(within(broken).getByTestId('import-unreadable')).toHaveTextContent('Die Datei wird beim Import abgelehnt.');
    expect(within(broken).queryByTestId('import-instrument')).not.toBeInTheDocument();
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');
    expect(screen.getByTestId('import-run')).toBeEnabled();
  });

  it.each([
    [413, 'too_many_files', 'Es sind zu viele Dateien auf einmal.'],
    [413, 'batch_too_large', 'Die Dateien sind zusammen zu groß.'],
    [422, 'no_files', 'Es ist keine Datei gewählt.'],
  ])('shows an import refused as a whole in plain language (%s %s)', async (status, code, text) => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    backend.importAnswer = () => json(status, { detail: 'The import is refused as a whole.', code, message: 'x' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');

    await user.click(screen.getByTestId('import-run'));

    const error = await screen.findByTestId('import-error');
    expect(error).toHaveTextContent(text);
    expect(error).toHaveTextContent('Nächster Schritt');
    expect(screen.getByTestId('import-run')).toBeEnabled();
    expect(item('a.csv')).toHaveAttribute('data-state', 'ready');
  });

  it.each([
    [() => json(403, { detail: 'The request comes from a web page of another origin.' }), 'weil sie von einer Webseite mit anderer Adresse kommt'],
    [() => json(429, { detail: 'Too many imports are running. Try again later.' }), 'Das Backend ist gerade ausgelastet.'],
    [() => json(413, { detail: 'The request body is larger than the limit.' }), 'Die Dateien sind zusammen größer als erlaubt.'],
  ])('translates the status of an error of the web API', async (answer, text) => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    backend.importAnswer = answer;
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-error')).toHaveTextContent(text);
  });

  it('says that the backend is not reachable', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await user.type(screen.getByTestId('import-broker'), 'B');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');
    backend.importAnswer = () => {
      throw new TypeError('Failed to fetch');
    };

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-error')).toHaveTextContent('Das Backend ist nicht erreichbar. Nächster Schritt');
  });

  it('shows a message when the files cannot be read for the preview', async () => {
    backend.previewAnswer = () => json(413, { detail: 'The import is refused as a whole.', code: 'too_many_files', message: 'x' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'a.csv'));

    expect(await screen.findByTestId('import-read-error')).toHaveTextContent('Die Dateien konnten nicht gelesen werden. Es sind zu viele Dateien auf einmal.');
    expect(screen.queryByTestId('import-item')).not.toBeInTheDocument();
  });

  it('adds files to the list when it chooses again', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'A', data: 'h1' });
    backend.hints['b.csv'] = hintJson('b.csv', { instrument: 'B', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);

    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'b.csv'));

    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(2);
    });
  });

  it('sets file names and brokers as text and never as HTML', async () => {
    const name = '<img src=x onerror=alert(1)>.csv';
    backend.hints[name] = hintJson(name, { instrument: '<b>EURUSD</b>', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [new File(['x'], name)]);

    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('b > b')).toBeNull();
    expect(within(screen.getByTestId('import-list')).getByText(name, { exact: false })).toBeInTheDocument();
    expect(screen.getByTestId('import-instrument')).toHaveValue('<b>EURUSD</b>');
  });

  it('shows the dialog in English', async () => {
    backend.hints['a.csv'] = hintJson('a.csv');
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));

    expect(screen.getByRole('heading', { name: 'Import files' })).toBeInTheDocument();
    expect(screen.getByTestId('import-empty')).toHaveTextContent('Next step: choose files in JSON or CSV format.');

    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'a.csv'));
    await screen.findByTestId('import-item');

    expect(screen.getByTestId('import-missing')).toHaveTextContent('Instrument or data not recognised.');
    expect(screen.getByTestId('field-import-timezone')).toHaveTextContent('Time zone of the CSV files');
  });
});
