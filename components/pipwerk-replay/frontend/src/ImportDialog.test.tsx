import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TOTAL_LIMIT_TEXT } from '../checks/forbiddenTexts';

import { DataView } from './DataView';
import { busy } from './importProcess';
import {
  FakeBackend,
  IMPORT_PROCESS_PATH,
  hintJson,
  json,
  readForm,
  refusedJson,
  renderWithProviders,
  rowJson,
  takenJson,
} from './test-utils';

let backend: FakeBackend;
const pause = { ...busy };

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

afterEach(() => {
  busy.pauseMs = pause.pauseMs;
  busy.tries = pause.tries;
});

type User = ReturnType<typeof userEvent.setup>;

async function openDialog(user: User): Promise<HTMLElement> {
  await user.click(await screen.findByTestId('import-open'));
  return screen.getByTestId('dialog-import');
}

async function chooseFiles(user: User, files: File[]): Promise<void> {
  const before = screen.queryAllByTestId('import-item').length;
  await user.upload(screen.getByTestId('import-files'), files);
  await waitFor(() => {
    expect(screen.getAllByTestId('import-item')).toHaveLength(before + files.length);
  });
}

function item(name: string): HTMLElement {
  const found = screen.getAllByTestId('import-item').find((candidate) => candidate.getAttribute('data-name') === name);
  if (found === undefined) {
    throw new Error(`no item ${name}`);
  }
  return found;
}

function stateOf(name: string): string | null {
  return item(name).getAttribute('data-state');
}

/** Names `f01.csv` to `fNN.csv` that the preview knows (instrument and data). */
function csvNames(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `f${String(index + 1).padStart(2, '0')}.csv`);
}

function knowCsv(names: string[]): void {
  for (const name of names) {
    backend.hints[name] = hintJson(name, { instrument: name.slice(0, 3).toUpperCase(), data: 'h1' });
  }
}

async function fillBasics(user: User, broker = 'B', timezone = 'UTC'): Promise<void> {
  await user.clear(screen.getByTestId('import-broker'));
  await user.type(screen.getByTestId('import-broker'), broker);
  if (screen.queryByTestId('import-timezone') !== null) {
    await user.clear(screen.getByTestId('import-timezone'));
    await user.type(screen.getByTestId('import-timezone'), timezone);
  }
}

/** A request of a file that waits until the test lets it go. */
function gate() {
  let release: (response: Response) => void = () => undefined;
  const promise = new Promise<Response>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function fileCalls() {
  return backend.calls.filter((call) => call.method === 'POST' && /\/import-processes\/[^/]+\/files$/.test(call.path));
}

function processCalls(suffix: string) {
  return backend.calls.filter((call) => call.method === 'POST' && call.path.endsWith(suffix));
}

describe('ImportDialog, choosing files', () => {
  it('opens from the bar, names the next step while empty and closes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const dialog = await openDialog(user);

    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByRole('heading', { name: 'Datei importieren' })).toBeInTheDocument();
    expect(screen.getByTestId('import-empty')).toHaveTextContent(
      'Nächster Schritt: Laden Sie Dateien im Format JSON oder CSV hoch oder wählen Sie Dateien im Importverzeichnis.',
    );
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(screen.queryByTestId('field-import-timezone')).not.toBeInTheDocument();
    expect(screen.queryByTestId('import-cancel')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('import-close'));

    expect(screen.queryByTestId('dialog-import')).not.toBeInTheDocument();
    expect(screen.getByTestId('import-open')).toHaveFocus();
  });

  it('says that any number of files may be chosen and that one click imports them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    const intro = screen.getByText(/Wählen Sie so viele Dateien/);

    expect(intro).toHaveTextContent('Klicken Sie dann einmal auf „Importieren“');
    expect(intro.textContent ?? '').not.toMatch(TOTAL_LIMIT_TEXT);
  });

  it('asks the preview once per file and presets instrument and data, and the broker from the JSON files that agree', async () => {
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

    const previews = backend.callsTo('POST', '/api/v1/market-data/import-preview');
    expect(previews.map((call) => readForm(call.body).files)).toEqual([
      ['a.json'],
      ['b.json'],
      ['USDJPY_M15_202601050000_202601050100.csv'],
    ]);
    expect(screen.getByTestId('import-broker')).toHaveValue('Server-X');
    expect(within(item('a.json')).getByTestId('import-instrument')).toHaveValue('EURUSD');
    expect(within(item('a.json')).getByTestId('import-data')).toHaveTextContent('Kerzen H1');
    expect(within(item('b.json')).getByTestId('import-data')).toHaveTextContent('Kontraktdaten');
    expect(within(item('b.json')).queryByRole('combobox')).not.toBeInTheDocument();
    const csv = item('USDJPY_M15_202601050000_202601050100.csv');
    expect(within(csv).getByTestId('import-instrument')).toHaveValue('USDJPY');
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
    await fillBasics(user, 'B', 'Europe/Athens');

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
    await fillBasics(user);
    expect(screen.getByTestId('import-run')).toBeEnabled();
  });

  it('puts a file above the limit per file into the list with the limit named', async () => {
    backend.previewAnswer = (name) =>
      name === 'big.json'
        ? json(413, { detail: 'The file is larger than the limit of 32 MiB per file.', code: 'too_large', max_bytes: 33554432 })
        : json(200, hintJson(name));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [new File(['{'], 'big.json')]);

    expect(within(item('big.json')).getByTestId('import-unreadable')).toHaveTextContent(
      'Die Datei ist größer als die Grenze von 32 MiB je Datei.',
    );
  });

  it('shows a message with the next step when a file cannot be read for the preview, and keeps the files read before', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'A', data: 'h1' });
    backend.previewAnswer = (name) =>
      name === 'b.csv' ? json(503, { detail: 'The data stock could not be read or changed.' }) : json(200, backend.hints[name] ?? hintJson(name));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv'), new File(['x'], 'b.csv'), new File(['x'], 'c.csv')]);

    expect(await screen.findByTestId('import-read-error')).toHaveTextContent('Die Dateien konnten nicht gelesen werden.');
    expect(screen.getByTestId('import-read-error')).toHaveTextContent('Nächster Schritt');
    expect(screen.getAllByTestId('import-item')).toHaveLength(1);
    expect(backend.callsTo('POST', '/api/v1/market-data/import-preview')).toHaveLength(2);
  });

  it('asks again when the backend is busy with other files', async () => {
    busy.pauseMs = 5;
    let first = true;
    backend.previewAnswer = (name) => {
      if (first) {
        first = false;
        return json(429, { detail: 'Too many files are being imported. Try again later.' });
      }
      return json(200, hintJson(name, { instrument: 'A', data: 'h1' }));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await chooseFiles(user, [new File(['x'], 'a.csv')]);

    expect(backend.callsTo('POST', '/api/v1/market-data/import-preview')).toHaveLength(2);
    expect(screen.queryByTestId('import-read-error')).not.toBeInTheDocument();
  });

  it('adds files to the list when it chooses again', async () => {
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'A', data: 'h1' });
    backend.hints['b.csv'] = hintJson('b.csv', { instrument: 'B', data: 'h1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);

    await chooseFiles(user, [new File(['x'], 'b.csv')]);

    expect(screen.getAllByTestId('import-item')).toHaveLength(2);
  });

  it('shows the progress of reading many files', async () => {
    const names = csvNames(3);
    knowCsv(names);
    const waiting = gate();
    backend.previewAnswer = (name) => (name === 'f02.csv' ? waiting.promise : json(200, backend.hints[name]));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);

    await user.upload(screen.getByTestId('import-files'), names.map((name) => new File(['x'], name)));

    await waitFor(() => {
      expect(screen.getByTestId('import-reading')).toHaveTextContent('Die Dateien werden gelesen … (1 von 3)');
    });
    expect(screen.getByTestId('import-run')).toBeDisabled();
    waiting.release(json(200, backend.hints['f02.csv']));
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(3);
    });
    expect(screen.queryByTestId('import-reading')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('import-empty')).toHaveTextContent(
      'Next step: upload files in JSON or CSV format or choose files in the import directory.',
    );

    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'a.csv'));
    await screen.findByTestId('import-item');

    expect(screen.getByTestId('import-missing')).toHaveTextContent('Instrument or data not recognised.');
    expect(screen.getByTestId('field-import-timezone')).toHaveTextContent('Time zone of the CSV files');
  });
});

describe('ImportDialog, one import process for any number of files', () => {
  it('imports many files in one process, one request per file in the order of the list, and ends it', async () => {
    const names = csvNames(30);
    knowCsv(names);
    backend.hints['z.json'] = hintJson('z.json', { broker: 'Ignored', instrument: 'XAUUSD', data: 'm1' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [...names.map((name) => new File(['x'.repeat(2000)], name)), new File(['{}'], 'z.json')]);
    await fillBasics(user, 'Neuer-Server', 'Europe/Athens');

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('31 von 31 Dateien sind importiert.');
    });
    expect(processCalls('/import-processes')).toHaveLength(1);
    expect(processCalls('/import-processes')[0]?.body).toEqual({});
    const calls = fileCalls();
    expect(calls).toHaveLength(31);
    expect(calls.map((call) => readForm(call.body).files[0])).toEqual([...names, 'z.json']);
    expect(new Set(calls.map((call) => call.path)).size).toBe(1);
    expect(calls[0]?.path).toBe(`${IMPORT_PROCESS_PATH}/process-1/files`);
    expect(readForm(calls[0]?.body)).toEqual({
      broker: 'Neuer-Server',
      timezone: 'Europe/Athens',
      keep: 'false',
      files: ['f01.csv'],
      instrument: ['F01'],
      data: ['h1'],
    });
    // The time zone is for CSV files only.
    expect(readForm(calls[30]?.body)).toMatchObject({ broker: 'Neuer-Server', timezone: null, instrument: ['XAUUSD'], data: ['m1'] });
    expect(processCalls('/finish')).toHaveLength(1);
    expect(processCalls('/abort')).toHaveLength(0);
    expect(screen.getAllByTestId('import-item').every((element) => element.getAttribute('data-state') === 'taken')).toBe(true);
    expect(screen.getByTestId('import-progress')).toHaveTextContent('31 von 31 Dateien erledigt.');
    expect(screen.getByTestId('import-run')).toBeDisabled();
  });

  it('shows no message about the number or the total size of the files, however large they are together', async () => {
    const names = csvNames(12);
    knowCsv(names);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    const big = names.map((name) => new File(['x'], name));
    for (const file of big) {
      Object.defineProperty(file, 'size', { value: 30 * 1024 * 1024 });
    }
    await chooseFiles(user, big);
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    await screen.findByTestId('import-summary');
    expect(fileCalls()).toHaveLength(12);
    const text = screen.getByTestId('dialog-import').textContent ?? '';
    expect(text).not.toMatch(TOTAL_LIMIT_TEXT);
    expect(text).toContain('12 von 12 Dateien sind importiert.');
    expect(screen.queryByTestId('import-error')).not.toBeInTheDocument();
  });

  it('shows the state of each file: waiting, being imported, taken over, and the number of files done', async () => {
    const names = csvNames(3);
    knowCsv(names);
    const gates = [gate(), gate(), gate()];
    backend.fileAnswer = (name, call) => (gates[call - 1] as ReturnType<typeof gate>).promise.then(() => json(200, takenJson(name)));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(stateOf('f01.csv')).toBe('importing');
    });
    expect(stateOf('f02.csv')).toBe('waiting');
    expect(stateOf('f03.csv')).toBe('waiting');
    expect(within(item('f01.csv')).getByTestId('import-status')).toHaveTextContent('wird importiert');
    expect(within(item('f02.csv')).getByTestId('import-status')).toHaveTextContent('wartet');
    expect(screen.getByTestId('import-progress')).toHaveTextContent('0 von 3 Dateien erledigt.');
    expect(screen.getByTestId('import-run')).toHaveTextContent('Import läuft …');
    expect(screen.getByTestId('import-run')).toBeDisabled();
    expect(screen.getByTestId('import-cancel')).toBeEnabled();
    expect(within(item('f01.csv')).getByTestId('import-instrument')).toBeDisabled();
    expect(within(item('f02.csv')).getByTestId('import-remove')).toBeDisabled();
    expect(fileCalls()).toHaveLength(1);

    gates[0]?.release(json(200, {}));
    await waitFor(() => {
      expect(stateOf('f01.csv')).toBe('taken');
    });
    await waitFor(() => {
      expect(stateOf('f02.csv')).toBe('importing');
    });
    expect(within(item('f01.csv')).getByTestId('import-status')).toHaveTextContent('übernommen');
    expect(screen.getByTestId('import-progress')).toHaveTextContent('1 von 3 Dateien erledigt.');
    expect(screen.queryByTestId('import-summary')).not.toBeInTheDocument();

    gates[1]?.release(json(200, {}));
    gates[2]?.release(json(200, {}));
    expect(await screen.findByTestId('import-summary')).toHaveTextContent('3 von 3 Dateien sind importiert.');
    expect(screen.queryByTestId('import-cancel')).not.toBeInTheDocument();
  });

  it('reads the table, the details and the brokers again when the import has ended', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    knowCsv(['a.csv']);
    backend.fileAnswer = (name) => {
      backend.rows = [...backend.rows, rowJson({ broker: 'New-Server', instrument: 'GBPUSD' })];
      backend.brokers = ['Demo-Server', 'New-Server'];
      return json(200, takenJson(name));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    await screen.findByTestId('import-summary');
    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(2);
    });
    await waitFor(() => {
      expect(Array.from(document.querySelectorAll('#import-brokers option')).map((option) => option.getAttribute('value'))).toEqual([
        'Demo-Server',
        'New-Server',
      ]);
    });
  });

  it('lists the result per file: rows taken over, period, rejected rows with the reason', async () => {
    knowCsv(['a.csv']);
    backend.fileAnswer = (name) =>
      json(
        200,
        takenJson(name, { rejected: [{ row: 3, reason: 'high_below_open' }], rejected_count: 4, accepted: 1200, replaced: 12 }),
      );
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    const result = await within(item('a.csv')).findByTestId('import-result');
    expect(result).toHaveTextContent('1.200 Zeilen übernommen, davon 12 als Ersatz. Zeitraum: 05.01.2026 08:00 – 05.01.2026 10:00 (UTC).');
    expect(within(item('a.csv')).getByTestId('import-rejected')).toHaveTextContent('4 Zeilen abgelehnt:');
    expect(within(item('a.csv')).getByTestId('import-rejected-row')).toHaveTextContent('Zeile 3: Hoch liegt unter der Eröffnung.');
    expect(within(item('a.csv')).getByText('und 3 weitere')).toBeInTheDocument();
  });
});

describe('ImportDialog, a refused file', () => {
  it('shows a file above the limit per file as refused with the limit and goes on with the others', async () => {
    const names = csvNames(3);
    knowCsv(names);
    backend.fileAnswer = (name) =>
      name === 'f02.csv'
        ? json(200, refusedJson(name, 'too_large', 'The file is larger than the limit of 32 MiB per file.'))
        : json(200, takenJson(name));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('2 von 3 Dateien sind importiert. Abgelehnt: 1.');
    expect(stateOf('f01.csv')).toBe('taken');
    expect(stateOf('f02.csv')).toBe('refused');
    expect(stateOf('f03.csv')).toBe('taken');
    expect(within(item('f02.csv')).getByTestId('import-status')).toHaveTextContent('abgelehnt');
    const result = within(item('f02.csv')).getByTestId('import-result');
    expect(result).toHaveTextContent('Abgelehnt: Die Datei ist größer als die Grenze von 32 MiB je Datei.');
    expect(result).toHaveTextContent('Nächster Schritt');
    expect(result.textContent ?? '').not.toMatch(TOTAL_LIMIT_TEXT);
    expect(fileCalls()).toHaveLength(3);
    expect(processCalls('/finish')).toHaveLength(1);
    expect(screen.queryByTestId('import-error')).not.toBeInTheDocument();
  });

  it('treats the answer 413 of a file above the limit like that, in English the limit is named, too', async () => {
    const names = csvNames(2);
    knowCsv(names);
    backend.fileAnswer = (name) =>
      name === 'f01.csv'
        ? json(413, { detail: 'The file is larger than the limit of 1.5 GiB per file.', code: 'too_large', max_bytes: 1610612736 })
        : json(200, takenJson(name));
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('1 of 2 files are imported. Refused: 1.');
    expect(within(item('f01.csv')).getByTestId('import-result')).toHaveTextContent(
      'Refused: The file is larger than the limit of 1.5 GiB per file.',
    );
    expect(stateOf('f02.csv')).toBe('taken');
  });

  it('imports only the files that were refused or not imported when the user clicks again, in a new process', async () => {
    const names = csvNames(3);
    knowCsv(names);
    let round = 0;
    backend.fileAnswer = (name) => {
      round += 1;
      return round === 2 ? json(200, refusedJson(name, 'timezone_unknown')) : json(200, takenJson(name));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user, 'B', 'Europe/Nowhere');
    await user.click(screen.getByTestId('import-run'));
    await screen.findByTestId('import-summary');
    expect(within(item('f02.csv')).getByTestId('import-result')).toHaveTextContent('Die Zeitzone ist unbekannt.');
    expect(screen.getByTestId('import-hint')).toHaveTextContent('Ergänzen Sie die abgelehnten Dateien');

    await user.clear(screen.getByTestId('import-timezone'));
    await user.type(screen.getByTestId('import-timezone'), 'Europe/Athens');
    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('1 von 1 Dateien sind importiert.');
    });
    expect(processCalls('/import-processes')).toHaveLength(2);
    const second = readForm(fileCalls()[3]?.body);
    expect(second.files).toEqual(['f02.csv']);
    expect(second.timezone).toBe('Europe/Athens');
    expect(fileCalls()).toHaveLength(4);
    expect(stateOf('f02.csv')).toBe('taken');
    expect(screen.getByTestId('import-run')).toBeDisabled();
  });

  it('drops the refusal of a file when the user changes it', async () => {
    knowCsv(['a.csv']);
    backend.fileAnswer = (name) => json(200, refusedJson(name, 'series_invalid'));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, [new File(['x'], 'a.csv')]);
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    expect(await screen.findByTestId('import-result')).toHaveTextContent('Abgelehnt');

    await user.type(within(item('a.csv')).getByTestId('import-instrument'), 'X');

    expect(screen.queryByTestId('import-result')).not.toBeInTheDocument();
    expect(stateOf('a.csv')).toBe('ready');
  });
});

describe('ImportDialog, cancelling', () => {
  it('ends after the file that is being taken over, aborts the process and leaves the others "nicht importiert"', async () => {
    const names = csvNames(4);
    knowCsv(names);
    const first = gate();
    backend.fileAnswer = (name) => first.promise.then(() => json(200, takenJson(name)));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(stateOf('f01.csv')).toBe('importing');
    });

    await user.click(screen.getByTestId('import-cancel'));

    expect(screen.getByTestId('import-cancel')).toHaveTextContent('Wird abgebrochen …');
    expect(screen.getByTestId('import-cancel')).toBeDisabled();
    expect(screen.getByTestId('import-progress')).toHaveTextContent('Der Import endet nach der Datei, die gerade übernommen wird.');
    expect(processCalls('/abort')).toHaveLength(0);
    first.release(json(200, {}));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('1 von 4 Dateien sind importiert. Nicht importiert: 3.');
    expect(stateOf('f01.csv')).toBe('taken');
    for (const name of ['f02.csv', 'f03.csv', 'f04.csv']) {
      expect(stateOf(name)).toBe('skipped');
      expect(within(item(name)).getByTestId('import-status')).toHaveTextContent('nicht importiert');
      expect(within(item(name)).getByTestId('import-skipped')).toHaveTextContent('Nächster Schritt');
    }
    expect(fileCalls()).toHaveLength(1);
    expect(processCalls('/abort')).toHaveLength(1);
    expect(processCalls('/finish')).toHaveLength(0);
    expect(screen.getByTestId('import-progress')).toHaveTextContent('4 von 4 Dateien erledigt.');
    // The files that were not imported can be caught up.
    expect(screen.getByTestId('import-run')).toBeEnabled();
    expect(screen.getByTestId('import-hint')).toHaveTextContent('auch die nicht importierten Dateien werden dann nachgeholt');
  });

  it('shows the cancelled import in English', async () => {
    knowCsv(csvNames(2));
    const first = gate();
    backend.fileAnswer = (name) => first.promise.then(() => json(200, takenJson(name)));
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await chooseFiles(user, csvNames(2).map((name) => new File(['x'], name)));
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(stateOf('f01.csv')).toBe('importing');
    });

    await user.click(screen.getByTestId('import-cancel'));
    first.release(json(200, {}));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('1 of 2 files are imported. Not imported: 1.');
    expect(within(item('f02.csv')).getByTestId('import-status')).toHaveTextContent('not imported');
  });
});

describe('ImportDialog, closing during an import', () => {
  async function startSlowImport(user: User, count = 3) {
    const names = csvNames(count);
    knowCsv(names);
    const first = gate();
    backend.fileAnswer = (name) => first.promise.then(() => json(200, takenJson(name)));
    const { unmount } = renderWithProviders(<DataView />);
    await openDialog(user);
    await chooseFiles(user, names.map((name) => new File(['x'], name)));
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(stateOf('f01.csv')).toBe('importing');
    });
    return { first, unmount };
  }

  it('asks whether to cancel, and the import goes on when the user keeps it', async () => {
    const user = userEvent.setup();
    const { first } = await startSlowImport(user);

    await user.click(screen.getByTestId('import-close'));

    expect(screen.getByTestId('import-close-ask')).toHaveTextContent('Der Import läuft noch. Soll er abgebrochen werden?');
    expect(screen.queryByTestId('import-close')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('import-keep'));
    expect(screen.queryByTestId('import-close-ask')).not.toBeInTheDocument();
    expect(screen.getByTestId('dialog-import')).toBeInTheDocument();
    first.release(json(200, {}));

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('3 von 3 Dateien sind importiert.');
    expect(processCalls('/abort')).toHaveLength(0);
    expect(processCalls('/finish')).toHaveLength(1);
  });

  it('cancels after the current file and closes the dialog when the user confirms', async () => {
    const user = userEvent.setup();
    const { first } = await startSlowImport(user);
    await user.click(screen.getByTestId('import-close'));

    await user.click(screen.getByTestId('import-abort-close'));

    expect(screen.getByTestId('dialog-import')).toBeInTheDocument();
    expect(screen.getByTestId('import-cancel')).toHaveTextContent('Wird abgebrochen …');
    first.release(json(200, {}));
    await waitFor(() => {
      expect(screen.queryByTestId('dialog-import')).not.toBeInTheDocument();
    });
    expect(fileCalls()).toHaveLength(1);
    expect(processCalls('/abort')).toHaveLength(1);
    expect(processCalls('/finish')).toHaveLength(0);
    expect(screen.getByTestId('import-open')).toHaveFocus();
  });

  it('asks, too, when the dialog is closed with Escape', async () => {
    const user = userEvent.setup();
    const { first } = await startSlowImport(user);

    const dialog = screen.getByTestId('dialog-import');
    const notCancelled = fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(notCancelled).toBe(false);
    expect(await screen.findByTestId('import-close-ask')).toBeInTheDocument();
    first.release(json(200, {}));
    await screen.findByTestId('import-summary');
  });

  it('shows the dialog again and asks when a browser closes it although it must stay', async () => {
    const user = userEvent.setup();
    const { first } = await startSlowImport(user);
    const dialog = screen.getByTestId('dialog-import') as HTMLDialogElement;

    dialog.close();

    expect(dialog).toHaveAttribute('open');
    expect(await screen.findByTestId('import-close-ask')).toBeInTheDocument();
    first.release(json(200, {}));
    await screen.findByTestId('import-summary');
  });

  it('ends the import after the current file and aborts the process when the view is left', async () => {
    const user = userEvent.setup();
    const { first, unmount } = await startSlowImport(user);

    unmount();
    first.release(json(200, {}));

    await waitFor(() => {
      expect(processCalls('/abort')).toHaveLength(1);
    });
    expect(fileCalls()).toHaveLength(1);
    expect(processCalls('/finish')).toHaveLength(0);
  });
});

describe('ImportDialog, requests that fail', () => {
  async function prepare(user: User, count = 3) {
    const names = csvNames(count);
    knowCsv(names);
    return { names, start: async () => {
      await openDialog(user);
      await chooseFiles(user, names.map((name) => new File(['x'], name)));
      await fillBasics(user);
      await user.click(screen.getByTestId('import-run'));
    } };
  }

  it('shows the file whose request fails as refused and the others as "nicht importiert", with a message and the next step', async () => {
    backend.fileAnswer = (name) => {
      if (name === 'f02.csv') {
        throw new TypeError('Failed to fetch');
      }
      return json(200, takenJson(name));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user);

    await start();

    const error = await screen.findByTestId('import-error');
    expect(error).toHaveTextContent('Der Import wurde unterbrochen. Das Backend ist nicht erreichbar. Nächster Schritt');
    expect(stateOf('f01.csv')).toBe('taken');
    expect(stateOf('f02.csv')).toBe('refused');
    expect(stateOf('f03.csv')).toBe('skipped');
    expect(within(item('f02.csv')).getByTestId('import-result')).toHaveTextContent('Abgelehnt: Das Backend ist nicht erreichbar.');
    expect(screen.getByTestId('import-summary')).toHaveTextContent('1 von 3 Dateien sind importiert. Abgelehnt: 1. Nicht importiert: 1.');
    expect(processCalls('/abort')).toHaveLength(1);
    expect(screen.getByTestId('import-run')).toBeEnabled();
  });

  it('says that the process has ended when the backend ended it after its time limit (HTTP 404)', async () => {
    backend.fileAnswer = (name) =>
      name === 'f02.csv'
        ? json(404, { detail: 'The import process does not exist. It has ended or its time has run out.' })
        : json(200, takenJson(name));
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user);

    await start();

    const error = await screen.findByTestId('import-error');
    expect(error).toHaveTextContent('Das Backend hat den Import-Vorgang beendet, weil zu lange keine Datei kam. Nächster Schritt: Klicken Sie erneut auf „Importieren“.');
    expect(stateOf('f02.csv')).toBe('refused');
    expect(stateOf('f03.csv')).toBe('skipped');
    expect(within(item('f02.csv')).getByTestId('import-result')).toHaveTextContent('Abgelehnt: Das Backend hat den Import-Vorgang beendet');
  });

  it('shows all files as "nicht importiert" when the process cannot begin', async () => {
    backend.beginAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user, 2);

    await start();

    expect(await screen.findByTestId('import-error')).toHaveTextContent('Der Datenbestand konnte nicht gelesen oder geändert werden. Nächster Schritt');
    expect(stateOf('f01.csv')).toBe('skipped');
    expect(stateOf('f02.csv')).toBe('skipped');
    expect(fileCalls()).toHaveLength(0);
    expect(screen.getByTestId('import-summary')).toHaveTextContent('0 von 2 Dateien sind importiert. Nicht importiert: 2.');
    expect(screen.getByTestId('import-run')).toBeEnabled();
  });

  it('sends a file again later when the backend is busy with other files, and the process stays', async () => {
    busy.pauseMs = 5;
    busy.tries = 5;
    let tries = 0;
    backend.fileAnswer = (name) => {
      tries += 1;
      return tries <= 2 ? json(429, { detail: 'Too many files are being imported. Try again later.' }) : json(200, takenJson(name));
    };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user, 1);

    await start();

    expect(await screen.findByTestId('import-summary')).toHaveTextContent('1 von 1 Dateien sind importiert.');
    expect(fileCalls()).toHaveLength(3);
    expect(processCalls('/import-processes')).toHaveLength(1);
    expect(screen.queryByTestId('import-error')).not.toBeInTheDocument();
  });

  it('gives up when the backend stays busy and says that it is busy', async () => {
    busy.pauseMs = 1;
    busy.tries = 3;
    backend.fileAnswer = () => json(429, { detail: 'Too many files are being imported. Try again later.' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user, 2);

    await start();

    expect(await screen.findByTestId('import-error')).toHaveTextContent('Das Backend ist gerade ausgelastet. Nächster Schritt');
    expect(fileCalls()).toHaveLength(3);
    expect(stateOf('f02.csv')).toBe('skipped');
  });

  it('translates the status of another error of the web API', async () => {
    backend.fileAnswer = () => json(403, { detail: 'The request comes from a web page of another origin.' });
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const { start } = await prepare(user, 1);

    await start();

    expect(await screen.findByTestId('import-error')).toHaveTextContent('weil sie von einer Webseite mit anderer Adresse kommt');
  });
});
