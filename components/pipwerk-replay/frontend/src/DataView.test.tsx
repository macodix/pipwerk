import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DataView } from './DataView';
import {
  FakeBackend,
  INSTRUMENT_JSON,
  acquisitionJson,
  importResultJson,
  json,
  overviewJson,
  renderWithProviders,
  seriesJson,
} from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

const GAP = { start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' };

describe('DataView, overview', () => {
  it('names the next step when the data stock is empty', async () => {
    renderWithProviders(<DataView />);

    expect(await screen.findByTestId('stock-empty')).toHaveTextContent('Nächster Schritt: Importieren Sie unten eine Datei oder stoßen Sie die Beschaffung an.');
    expect(screen.getByTestId('instr-empty')).toHaveTextContent('Nächster Schritt');
    expect(screen.getByTestId('import-empty')).toHaveTextContent('Nächster Schritt');
    expect(screen.getByTestId('source-empty')).toHaveTextContent('Nächster Schritt');
  });

  it('shows series per broker, instrument and time unit with periods, gaps and amount', async () => {
    backend.overview = overviewJson([
      seriesJson({ missing: [GAP], missing_count: 1 }),
      seriesJson({ unit: 'ticks', count: 54321, instrument: 'GBPUSD', covered: [
        { start: '2026-01-05T08:00:00Z', end: '2026-01-05T09:00:00Z' },
        { start: '2026-01-06T08:00:00Z', end: '2026-01-06T09:00:00Z' },
        { start: '2026-01-07T08:00:00Z', end: '2026-01-07T09:00:00Z' },
        { start: '2026-01-08T08:00:00Z', end: '2026-01-08T09:00:00Z' },
        { start: '2026-01-09T08:00:00Z', end: '2026-01-09T09:00:00Z' },
      ], covered_count: 5 }),
    ]);
    renderWithProviders(<DataView />);

    const rows = await screen.findAllByTestId('stock-row');
    expect(rows).toHaveLength(2);
    const first = within(rows[0] as HTMLElement);
    expect(first.getByText('Demo-Server')).toBeInTheDocument();
    expect(first.getByText('EURUSD')).toBeInTheDocument();
    expect(first.getByText('Kerzen H1')).toBeInTheDocument();
    expect(first.getByTestId('stock-periods')).toHaveTextContent('05.01.2026 00:00 – 10.01.2026 00:00');
    expect(first.getByTestId('stock-gaps')).toHaveTextContent('07.01.2026 04:00 – 07.01.2026 09:00');
    expect(first.getByTestId('stock-gaps')).toHaveAttribute('data-gap-count', '1');
    const second = within(rows[1] as HTMLElement);
    expect(second.getByText('Ticks')).toBeInTheDocument();
    expect(second.getByTestId('stock-gaps')).toHaveTextContent('keine');
    expect(second.getByTestId('stock-periods')).toHaveTextContent('und 2 weitere');
    expect(second.getByText('54.321')).toBeInTheDocument();
  });

  it('shows the English texts and the date format of English', async () => {
    backend.overview = overviewJson([seriesJson()]);
    renderWithProviders(<DataView />, 'en');

    const row = await screen.findByTestId('stock-row');
    expect(row).toHaveTextContent('Candles H1');
    expect(row).toHaveTextContent('2026-01-05 00:00 – 2026-01-10 00:00');
    expect(screen.getByRole('heading', { name: 'Data stock of historical price data' })).toBeInTheDocument();
  });

  it('says how many series are shown when the answer is cut', async () => {
    backend.overview = { ...overviewJson([seriesJson()]), series_total: 1500 };
    renderWithProviders(<DataView />);

    expect(await screen.findByTestId('stock-cut')).toHaveTextContent('Gezeigt werden 1 von 1500 Einträgen.');
  });

  it('shows the reason when the data stock cannot be read', async () => {
    backend.overviewAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    renderWithProviders(<DataView />);

    expect(await screen.findByTestId('stock-error')).toHaveTextContent('Der Datenbestand konnte nicht gelesen oder geändert werden.');
  });

  it('shows the details of the instruments per broker', async () => {
    backend.overview = overviewJson([seriesJson()], [
      { broker: 'Demo-Server', instrument: 'EURUSD', acquired_at: '2026-01-05T08:00:00Z' },
    ]);
    backend.instruments = [INSTRUMENT_JSON];
    renderWithProviders(<DataView />);

    const row = await screen.findByTestId('instr-row');
    await waitFor(() => {
      expect(row).toHaveTextContent('100.000');
    });
    expect(row).toHaveTextContent('Demo-Server');
    expect(row).toHaveTextContent('05.01.2026 08:00');
    expect(row).toHaveTextContent('0,00001');
    expect(row).toHaveTextContent('1 USD');
    expect(row).toHaveTextContent('-6,5 / 2,1');
    expect(row).toHaveTextContent('Mittwoch');
    expect(row).toHaveTextContent('–');
  });
});

describe('DataView, default source', () => {
  it('shows none, sets a broker of the data stock and removes it again', async () => {
    const user = userEvent.setup();
    backend.overview = overviewJson([seriesJson()]);
    renderWithProviders(<DataView />);

    expect(await screen.findByTestId('default-source-current')).toHaveTextContent('Es ist keine Standardquelle festgelegt.');
    expect(screen.getByTestId('source-set')).toBeDisabled();
    expect(screen.getByTestId('source-clear')).toBeDisabled();

    await user.type(screen.getByTestId('source-broker'), 'Demo-Server');
    await user.click(screen.getByTestId('source-set'));

    await waitFor(() => {
      expect(screen.getByTestId('default-source-current')).toHaveTextContent('Standardquelle: Demo-Server');
    });
    expect(backend.callsTo('PUT', '/api/replay/settings/default-source')[0]?.body).toEqual({ broker: 'Demo-Server' });
    expect(screen.getByTestId('source-clear')).toBeEnabled();

    await user.click(screen.getByTestId('source-clear'));
    await waitFor(() => {
      expect(screen.getByTestId('default-source-current')).toHaveTextContent('keine Standardquelle');
    });
    expect(backend.callsTo('PUT', '/api/replay/settings/default-source')[1]?.body).toEqual({ broker: null });
  });

  it('does not accept a name with blanks at its ends', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('default-source-current');

    await user.type(screen.getByTestId('source-broker'), ' x');

    expect(screen.getByTestId('source-set')).toBeDisabled();
    expect(screen.getByText(/Der Name darf nicht leer sein/)).toBeInTheDocument();
  });
});

const CSV = 'Date\tTime\tOpen\tHigh\tLow\tClose\tTickVol\tVol\tSpread\n2026.01.05\t08:00:00\t1.1\t1.2\t1.0\t1.15\t10\t0\t12\n';

function csvFile(name = 'EURUSD_H1.csv'): File {
  return new File([CSV], name, { type: 'text/csv' });
}

describe('DataView, import', () => {
  it('imports a CSV file with broker, instrument, time unit and time zone and shows the result', async () => {
    const user = userEvent.setup();
    backend.defaultSource = 'Demo-Server';
    backend.importAnswer = () =>
      json(200, importResultJson({
        accepted: 1000,
        replaced: 2,
        rejected: [{ row: 7, reason: 'high_below_low' }],
        rejected_count: 1,
      }));
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), csvFile());

    expect(screen.getByTestId('import-name')).toHaveTextContent('EURUSD_H1.csv');
    expect(screen.getByTestId('import-format')).toHaveTextContent('Format erkannt: CSV');
    // The default source is proposed for the broker.
    await waitFor(() => {
      expect(screen.getByTestId('import-broker')).toHaveValue('Demo-Server');
    });
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(screen.getByText('Nächster Schritt: Füllen Sie alle Felder mit Stern aus.')).toBeInTheDocument();

    await user.type(screen.getByTestId('import-instrument'), 'EURUSD');
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Athens');
    await user.selectOptions(screen.getByTestId('import-time-unit'), 'm15');
    expect(screen.getByTestId('import-run')).toBeEnabled();
    await user.click(screen.getByTestId('import-run'));

    const result = await screen.findByTestId('import-result');
    const call = backend.callsTo('POST', '/api/v1/market-data/imports/csv')[0];
    expect(call?.contentType).toBe('text/csv');
    expect(Object.fromEntries(call?.query ?? [])).toEqual({
      kind: 'candles',
      broker: 'Demo-Server',
      instrument: 'EURUSD',
      time_unit: 'm15',
      timezone: 'Europe/Athens',
    });
    expect(call?.body).toBeInstanceOf(Blob);
    expect(screen.getByTestId('import-summary')).toHaveTextContent('1.000 Zeilen übernommen, davon 2 als Ersatz');
    expect(screen.getByTestId('import-series')).toHaveTextContent('Demo-Server · EURUSD · Kerzen H1');
    expect(screen.getByTestId('import-period')).toHaveTextContent('05.01.2026 08:00 – 05.01.2026 10:00');
    expect(screen.getByTestId('import-rejected-count')).toHaveTextContent('1');
    const rejected = within(result).getByTestId('import-rejected-row');
    expect(rejected).toHaveTextContent('7');
    expect(rejected).toHaveTextContent('Hoch liegt unter Tief.');
    // The overview is read again.
    await waitFor(() => {
      expect(backend.callsTo('GET', '/api/v1/market-data/overview').length).toBeGreaterThan(1);
    });
  });

  it('sends ticks without a time unit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), csvFile('ticks.csv'));
    await user.type(screen.getByTestId('import-broker'), 'Demo-Server');
    await user.type(screen.getByTestId('import-instrument'), 'EURUSD');
    await user.selectOptions(screen.getByTestId('import-kind'), 'ticks');
    await user.type(screen.getByTestId('import-timezone'), 'UTC');
    expect(screen.queryByTestId('import-time-unit')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('import-run'));

    await screen.findByTestId('import-result');
    const query = backend.callsTo('POST', '/api/v1/market-data/imports/csv')[0]?.query;
    expect(query?.get('kind')).toBe('ticks');
    expect(query?.has('time_unit')).toBe(false);
  });

  it('imports a JSON file without further input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'candles.json', { type: 'application/json' }));

    expect(screen.queryByTestId('import-broker')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('import-run'));
    await screen.findByTestId('import-result');
    const call = backend.callsTo('POST', '/api/v1/market-data/imports/json')[0];
    expect(call?.contentType).toBe('application/json');
    expect(call?.body).toBeInstanceOf(Blob);
  });

  it('refuses a file with another format before anything is sent', async () => {
    // The attribute `accept` filters the file dialog only; a file of another kind can still arrive.
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['x'], 'notes.txt', { type: 'text/plain' }));

    expect(screen.getByTestId('import-format-unknown')).toHaveTextContent('Format nicht erkannt. Erlaubt sind JSON und CSV.');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(backend.calls.filter((call) => call.path.includes('/imports/'))).toHaveLength(0);
  });

  it.each([
    ['header_invalid', 'Die Kopfzeile der CSV-Datei passt nicht.'],
    ['timezone_unknown', 'Die Zeitzone ist unbekannt.'],
    ['no_rows', 'Die Datei enthält keine Zeilen.'],
  ])('shows the reason when the whole file is refused (%s)', async (code, text) => {
    const user = userEvent.setup();
    backend.importAnswer = () => json(422, { detail: 'The file is refused.', code, message: 'fixed' });
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'x.json'));
    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-error')).toHaveTextContent(text);
    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
  });

  it('shows the English reason of a refused file and of rejected rows', async () => {
    const user = userEvent.setup();
    backend.importAnswer = () =>
      json(200, importResultJson({ rejected: [{ row: 3, reason: 'local_time_not_existing' }], rejected_count: 5 }));
    renderWithProviders(<DataView />, 'en');
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'x.json'));
    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByText('This local time does not exist (change to daylight saving time).')).toBeInTheDocument();
    expect(screen.getByText('Showing the first 1 of 5 rejected rows.')).toBeInTheDocument();
  });

  it('shows that the file is too large', async () => {
    const user = userEvent.setup();
    backend.importAnswer = () => json(413, { detail: 'The request body is larger than the limit.' });
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'x.json'));
    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-error')).toHaveTextContent('Die Datei ist größer als erlaubt.');
  });

  it('can import again after a result', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('import-empty');

    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'x.json'));
    await user.click(screen.getByTestId('import-run'));
    await screen.findByTestId('import-result');
    await user.upload(screen.getByTestId('import-file'), new File(['{}'], 'x.json'));

    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('import-run'));
    await screen.findByTestId('import-result');
    expect(backend.callsTo('POST', '/api/v1/market-data/imports/json')).toHaveLength(2);
  });
});

describe('DataView, acquisition by hand', () => {
  async function fill(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await screen.findByTestId('procure-card');
    await user.type(screen.getByTestId('proc-instrument'), 'EURUSD');
    // Fields for date and time take a value as a whole (typing into them is a matter of the browser).
    fireEvent.change(screen.getByTestId('proc-from'), { target: { value: '2026-01-05T00:00' } });
    fireEvent.change(screen.getByTestId('proc-to'), { target: { value: '2026-01-06T00:00' } });
  }

  it('names the next step as long as no instrument is given', async () => {
    renderWithProviders(<DataView />);

    await screen.findByTestId('procure-card');
    expect(screen.getByTestId('proc-next-step')).toHaveTextContent('Nächster Schritt: Geben Sie das Instrument an');
    expect(screen.getByTestId('proc-start')).toBeDisabled();
  });

  it('starts an acquisition of candles for whole days (UTC) and shows the result', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () =>
      json(202, acquisitionJson('finished', { state: 'succeeded', result: importResultJson({ accepted: 24 }), omitted_count: 0 }));
    renderWithProviders(<DataView />);
    await fill(user);
    await user.selectOptions(screen.getByTestId('proc-tf'), 'm15');
    await user.click(screen.getByTestId('proc-start'));

    const result = await screen.findByTestId('proc-result');
    expect(result).toHaveAttribute('data-state', 'succeeded');
    expect(screen.getByTestId('proc-summary')).toHaveTextContent('Beschafft und importiert: 24 Zeilen, Zeitraum 05.01.2026 08:00 – 05.01.2026 10:00 (UTC).');
    expect(backend.callsTo('POST', '/api/v1/market-data/acquisitions')[0]?.body).toEqual({
      parts: [{ kind: 'candles', instrument: 'EURUSD', time_unit: 'm15', start: '2026-01-05T00:00:00Z', end: '2026-01-06T00:00:00Z' }],
    });
  });

  it('shows the progress while the acquisition runs and the result after it', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () => json(202, acquisitionJson('running', { state: 'running' }));
    backend.acquisitionStates = [
      acquisitionJson('running', { state: 'running' }),
      acquisitionJson('finished', { state: 'succeeded', result: importResultJson(), omitted_count: 4 }),
    ];
    renderWithProviders(<DataView />);
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    expect(await screen.findByTestId('proc-progress')).toBeInTheDocument();
    expect(screen.getByTestId('proc-start')).toBeDisabled();
    const result = await screen.findByTestId('proc-result', undefined, { timeout: 4000 });
    expect(result).toHaveAttribute('data-state', 'succeeded');
    expect(screen.getByTestId('proc-detail')).toHaveTextContent('Die Quelle hat 4 Zeilen ausgelassen');
    expect(screen.queryByTestId('proc-progress')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('proc-start')).toBeEnabled();
    });
  });

  it('starts an acquisition of ticks and of the instrument details with the right parts', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await fill(user);

    await user.selectOptions(screen.getByTestId('proc-kind'), 'ticks');
    expect(screen.queryByTestId('proc-tf')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('proc-start'));
    await screen.findByTestId('proc-result');
    await user.selectOptions(screen.getByTestId('proc-kind'), 'instrument');
    expect(screen.queryByTestId('proc-from')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('proc-start'));
    await waitFor(() => {
      expect(backend.callsTo('POST', '/api/v1/market-data/acquisitions')).toHaveLength(2);
    });

    const bodies = backend.callsTo('POST', '/api/v1/market-data/acquisitions').map((call) => call.body);
    expect(bodies[0]).toEqual({ parts: [{ kind: 'ticks', instrument: 'EURUSD', start: '2026-01-05T00:00:00Z', end: '2026-01-06T00:00:00Z' }] });
    expect(bodies[1]).toEqual({ parts: [{ kind: 'instrument', instrument: 'EURUSD' }] });
  });

  it.each([
    ['symbol_unknown', 'Symbol beim Broker unbekannt', 'Das Instrument ist beim Broker unbekannt.'],
    ['source_unreachable', 'Quelle nicht erreichbar', 'Quelle nicht erreichbar. Prüfen Sie'],
    ['no_data', 'Daten beim Broker nicht vorhanden', 'Der Broker hat für diesen Zeitraum keine Daten.'],
    ['terminal_unavailable', 'MetaTrader 5 nicht erreichbar', 'MetaTrader 5 ist nicht erreichbar.'],
    ['range_too_large', 'Zeitraum zu groß', 'Der Zeitraum ist zu groß.'],
  ])('shows the reason of a failed part (%s)', async (code, reason, text) => {
    const user = userEvent.setup();
    backend.acquisitionStart = () =>
      json(202, acquisitionJson('finished', { state: 'failed', error: { code, reason, file_error: null } }));
    renderWithProviders(<DataView />);
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    const result = await screen.findByTestId('proc-result');
    expect(result).toHaveAttribute('data-state', 'failed');
    expect(result).toHaveAttribute('data-code', code);
    expect(screen.getByTestId('proc-error-text')).toHaveTextContent(text);
  });

  it('shows the German reason of an unknown code of the source', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () =>
      json(202, acquisitionJson('finished', { state: 'failed', error: { code: 'new_code', reason: 'Neuer Grund der Quelle', file_error: null } }));
    renderWithProviders(<DataView />);
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    expect(await screen.findByTestId('proc-error-text')).toHaveTextContent('Neuer Grund der Quelle');
  });

  it('names the file error when the import refused the data of the source', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () =>
      json(202, acquisitionJson('finished', { state: 'failed', error: { code: 'import_refused', reason: 'x', file_error: 'no_rows' } }));
    renderWithProviders(<DataView />);
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    expect(await screen.findByTestId('proc-error-text')).toHaveTextContent('Der Import hat die Daten der Quelle abgelehnt: Die Datei enthält keine Zeilen.');
  });

  it('says that no source is set up and what to do', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () => json(409, { detail: 'No source is set up.', code: 'no_source', reason: 'Keine Quelle eingerichtet' });
    renderWithProviders(<DataView />);
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    const text = await screen.findByTestId('proc-error-text');
    expect(text).toHaveTextContent('Keine Quelle eingerichtet. Nächster Schritt: Tragen Sie Adresse und Schlüssel der Quelle');
    expect(screen.getByTestId('proc-result')).toHaveAttribute('data-state', 'failed');
  });

  it('shows the English text of a failed part', async () => {
    const user = userEvent.setup();
    backend.acquisitionStart = () =>
      json(202, acquisitionJson('finished', { state: 'failed', error: { code: 'symbol_unknown', reason: 'Symbol beim Broker unbekannt', file_error: null } }));
    renderWithProviders(<DataView />, 'en');
    await fill(user);
    await user.click(screen.getByTestId('proc-start'));

    expect(await screen.findByTestId('proc-error-text')).toHaveTextContent('The instrument is unknown at the broker.');
  });

  it.each([
    ['an end that equals the start', '2026-01-05T00:00'],
    ['an end before the start', '2026-01-04T23:59'],
    ['no end', ''],
  ])('refuses a period with %s', async (_name, end) => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await fill(user);

    fireEvent.change(screen.getByTestId('proc-to'), { target: { value: end } });

    expect(screen.getByTestId('proc-start')).toBeDisabled();
    expect(screen.getByTestId('proc-next-step')).toHaveTextContent('Der Zeitraum ist ungültig');
  });

  it('takes a period of minutes, for ticks of a part of a day', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await fill(user);
    await user.selectOptions(screen.getByTestId('proc-kind'), 'ticks');
    fireEvent.change(screen.getByTestId('proc-from'), { target: { value: '2026-01-05T08:00' } });
    fireEvent.change(screen.getByTestId('proc-to'), { target: { value: '2026-01-05T08:30' } });

    await user.click(screen.getByTestId('proc-start'));

    await waitFor(() => {
      expect(backend.callsTo('POST', '/api/v1/market-data/acquisitions')).toHaveLength(1);
    });
    expect(backend.callsTo('POST', '/api/v1/market-data/acquisitions')[0]?.body).toEqual({
      parts: [{ kind: 'ticks', instrument: 'EURUSD', start: '2026-01-05T08:00:00Z', end: '2026-01-05T08:30:00Z' }],
    });
  });

  it('starts with the last seven whole days up to the start of today (UTC)', async () => {
    renderWithProviders(<DataView />);
    await screen.findByTestId('procure-card');

    const from = (screen.getByTestId('proc-from') as HTMLInputElement).value;
    const to = (screen.getByTestId('proc-to') as HTMLInputElement).value;

    expect(to).toBe(`${new Date().toISOString().slice(0, 10)}T00:00`);
    expect((new Date(`${to}:00Z`).getTime() - new Date(`${from}:00Z`).getTime()) / 86_400_000).toBe(7);
  });
});

describe('DataView, explanations', () => {
  it('gives every field an explanation for the mouse and the keyboard', async () => {
    const user = userEvent.setup();
    backend.overview = overviewJson([seriesJson()]);
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await user.upload(screen.getByTestId('import-file'), csvFile());

    const fields = document.querySelectorAll('[data-testid^="field-"]');
    expect(fields.length).toBeGreaterThanOrEqual(10);
    for (const field of fields) {
      const label = field.querySelector('.field-label');
      expect(label?.getAttribute('data-tip')?.trim(), field.getAttribute('data-testid') ?? '').toBeTruthy();
      expect(field.querySelector<HTMLElement>('.info')?.tabIndex).toBe(0);
    }
  });
});
