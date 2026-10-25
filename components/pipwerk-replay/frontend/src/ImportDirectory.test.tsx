// The import directory in the dialog "Datei importieren" (specification 5.3) and "Dateien behalten"
// (5.6): the choice of files in the import directory, a process with uploaded files and files of the
// import directory together, the tick with its preset and its explanation, and the refusals of
// single files.
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataView } from './DataView';
import { DIRECTORY_PAGE_SIZE } from './marketDataApi';
import {
  FakeBackend,
  IMPORT_PROCESS_PATH,
  entryJson,
  fileSettingsJson,
  hintJson,
  json,
  readForm,
  refusedJson,
  renderWithProviders,
  takenJson,
} from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

type User = ReturnType<typeof userEvent.setup>;

async function openDialog(user: User, onOpenSettings?: () => void): Promise<void> {
  renderWithProviders(<DataView onOpenSettings={onOpenSettings} />);
  await user.click(await screen.findByTestId('import-open'));
  await screen.findByTestId('dialog-import');
}

async function openPicker(user: User): Promise<void> {
  await user.click(screen.getByTestId('import-choose-directory'));
  await screen.findByTestId('picker');
}

function pickerFile(name: string): HTMLElement {
  const found = screen.getAllByTestId('picker-file').find((element) => element.getAttribute('data-name') === name);
  if (found === undefined) {
    throw new Error(`no file ${name} in the choice`);
  }
  return found;
}

function pickerDir(name: string): HTMLElement {
  const found = screen.getAllByTestId('picker-dir').find((element) => element.getAttribute('data-name') === name);
  if (found === undefined) {
    throw new Error(`no directory ${name} in the choice`);
  }
  return found;
}

async function tick(user: User, name: string): Promise<void> {
  await user.click(within(pickerFile(name)).getByTestId('picker-check'));
}

function item(name: string): HTMLElement {
  const found = screen.getAllByTestId('import-item').find((candidate) => candidate.getAttribute('data-name') === name);
  if (found === undefined) {
    throw new Error(`no item ${name}`);
  }
  return found;
}

async function fillBasics(user: User, broker = 'B', timezone = 'UTC'): Promise<void> {
  await user.clear(screen.getByTestId('import-broker'));
  await user.type(screen.getByTestId('import-broker'), broker);
  if (screen.queryByTestId('import-timezone') !== null) {
    await user.clear(screen.getByTestId('import-timezone'));
    await user.type(screen.getByTestId('import-timezone'), timezone);
  }
}

function fileCalls() {
  return backend.calls.filter((call) => call.method === 'POST' && /\/import-processes\/[^/]+\/files$/.test(call.path));
}

function directoryCalls() {
  return backend.calls.filter((call) => call.method === 'POST' && call.path.endsWith('/directory-files'));
}

/** A small import directory: two directories (one with a file), two files. */
function fillDirectory(): void {
  backend.directories = {
    '': [entryJson('2023', 'directory'), entryJson('2024', 'directory'), entryJson('EURUSD_H1.csv', 'file', 2048), entryJson('notes.json', 'file', 300)],
    '2023': [entryJson('deep', 'directory'), entryJson('GBPUSD_H1.csv', 'file', 4096)],
    '2023/deep': [entryJson('USDJPY_H1.csv', 'file', 100)],
    '2024': [],
  };
  backend.hints['EURUSD_H1.csv'] = hintJson('EURUSD_H1.csv', { instrument: 'EURUSD', data: 'h1' });
  backend.hints['GBPUSD_H1.csv'] = hintJson('GBPUSD_H1.csv', { instrument: 'GBPUSD', data: 'h1' });
  backend.hints['USDJPY_H1.csv'] = hintJson('USDJPY_H1.csv', { instrument: 'USDJPY', data: 'h1' });
}

describe('choice in the import directory', () => {
  it('lists subdirectories first, then files, with name, size and time of the last change', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);

    expect(await screen.findByTestId('picker-list')).toBeInTheDocument();
    expect(screen.getByTestId('picker-directory')).toHaveTextContent('Importverzeichnis: /data/import');
    const rows = [...screen.getByTestId('picker-list').children].map((row) => row.getAttribute('data-name'));
    expect(rows).toEqual(['2023', '2024', 'EURUSD_H1.csv', 'notes.json']);
    expect(pickerFile('EURUSD_H1.csv')).toHaveTextContent('2 KB');
    expect(pickerFile('EURUSD_H1.csv')).toHaveTextContent('05.01.2026 08:15');
    expect(pickerDir('2023')).toHaveTextContent('Verzeichnis');
    expect(screen.getByTestId('picker-count')).toHaveTextContent('1–4 von 4 Einträgen');
    const call = backend.callsTo('GET', '/api/v1/market-data/import-directory')[0];
    expect(call?.query.get('path')).toBe('');
    expect(call?.query.get('limit')).toBe(String(DIRECTORY_PAGE_SIZE));
  });

  it('opens subdirectories, shows where it is and goes back, never above the import directory', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');

    expect(screen.getByTestId('picker-up')).toBeDisabled();

    await user.click(within(pickerDir('2023')).getByTestId('picker-open'));
    expect(await screen.findByText('GBPUSD_H1.csv')).toBeInTheDocument();
    await user.click(within(pickerDir('deep')).getByTestId('picker-open'));
    expect(await screen.findByText('USDJPY_H1.csv')).toBeInTheDocument();

    const crumbs = screen.getAllByTestId('picker-crumb').map((crumb) => crumb.textContent);
    expect(crumbs).toEqual(['Importverzeichnis', '2023', 'deep']);
    expect(backend.calls.at(-1)?.query.get('path')).toBe('2023/deep');
    expect(screen.getByTestId('picker-up')).toBeEnabled();

    await user.click(screen.getByTestId('picker-up'));
    expect(await screen.findByText('GBPUSD_H1.csv')).toBeInTheDocument();
    expect(backend.calls.at(-1)?.query.get('path')).toBe('2023');

    await user.click(screen.getAllByTestId('picker-crumb')[0] as HTMLElement);
    expect(await screen.findByText('EURUSD_H1.csv')).toBeInTheDocument();
    expect(backend.calls.at(-1)?.query.get('path')).toBe('');
    expect(screen.getByTestId('picker-up')).toBeDisabled();
    // Every request names a path inside the import directory: relative, no "..", no leading "/".
    for (const call of backend.callsTo('GET', '/api/v1/market-data/import-directory')) {
      const path = call.query.get('path') ?? '';
      expect(path.startsWith('/')).toBe(false);
      expect(path.split('/')).not.toContain('..');
    }
  });

  it('keeps the ticks when the directory changes and takes any number of files from several directories', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');

    await tick(user, 'EURUSD_H1.csv');
    await user.click(within(pickerDir('2023')).getByTestId('picker-open'));
    await screen.findByText('GBPUSD_H1.csv');
    await tick(user, 'GBPUSD_H1.csv');
    await user.click(within(pickerDir('deep')).getByTestId('picker-open'));
    await screen.findByText('USDJPY_H1.csv');
    await tick(user, 'USDJPY_H1.csv');
    expect(screen.getByTestId('picker-confirm')).toHaveTextContent('3 Dateien übernehmen');

    await user.click(screen.getAllByTestId('picker-crumb')[0] as HTMLElement);
    await screen.findByText('EURUSD_H1.csv');
    expect(within(pickerFile('EURUSD_H1.csv')).getByTestId('picker-check')).toBeChecked();
    expect(within(pickerFile('notes.json')).getByTestId('picker-check')).not.toBeChecked();

    await user.click(screen.getByTestId('picker-confirm'));

    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(3);
    });
    expect(screen.queryByTestId('picker')).not.toBeInTheDocument();
    // Name of an entry is its path in the import directory; instrument and data come from the preview.
    expect(screen.getAllByTestId('import-item').map((element) => element.getAttribute('data-name'))).toEqual([
      'EURUSD_H1.csv',
      '2023/GBPUSD_H1.csv',
      '2023/deep/USDJPY_H1.csv',
    ]);
    expect(within(item('2023/GBPUSD_H1.csv')).getByTestId('import-instrument')).toHaveValue('GBPUSD');
    expect(within(item('2023/GBPUSD_H1.csv')).getByTestId('import-data')).toHaveValue('h1');
    expect(item('2023/GBPUSD_H1.csv')).toHaveAttribute('data-source', 'directory');
    expect(item('2023/GBPUSD_H1.csv')).toHaveTextContent('Importverzeichnis');
    const previews = backend.callsTo('POST', '/api/v1/market-data/import-directory/preview');
    expect(previews.map((call) => (call.body as { path: string }).path)).toEqual([
      'EURUSD_H1.csv',
      '2023/GBPUSD_H1.csv',
      '2023/deep/USDJPY_H1.csv',
    ]);
  });

  it('goes back to the dialog without a choice and the ticks are dropped', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');

    await user.click(screen.getByTestId('picker-cancel'));

    expect(screen.queryByTestId('picker')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('import-item')).toHaveLength(0);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    expect(within(pickerFile('EURUSD_H1.csv')).getByTestId('picker-check')).not.toBeChecked();
    expect(screen.getByTestId('picker-confirm')).toBeDisabled();
  });

  it('ticks and unticks all files of a page', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');

    await user.click(screen.getByTestId('picker-select-page'));
    expect(screen.getByTestId('picker-confirm')).toHaveTextContent('2 Dateien übernehmen');
    expect(screen.getByTestId('picker-select-page')).toHaveTextContent('Wahl der Dateien dieser Seite aufheben');

    await user.click(screen.getByTestId('picker-select-page'));
    expect(screen.getByTestId('picker-confirm')).toBeDisabled();
  });

  it('shows the files page by page', async () => {
    backend.directories = {
      '': Array.from({ length: 120 }, (_, index) => entryJson(`f${String(index).padStart(3, '0')}.csv`)),
    };
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');

    expect(screen.getAllByTestId('picker-file')).toHaveLength(DIRECTORY_PAGE_SIZE);
    expect(screen.getByTestId('picker-count')).toHaveTextContent('1–50 von 120 Einträgen');
    expect(screen.getByTestId('picker-previous')).toBeDisabled();

    await user.click(screen.getByTestId('picker-next'));
    await screen.findByText('f050.csv');
    expect(backend.calls.at(-1)?.query.get('offset')).toBe('50');
    expect(screen.getByTestId('picker-count')).toHaveTextContent('51–100 von 120 Einträgen');

    await user.click(screen.getByTestId('picker-next'));
    await screen.findByText('f100.csv');
    expect(screen.getAllByTestId('picker-file')).toHaveLength(20);
    expect(screen.getByTestId('picker-next')).toBeDisabled();
  });

  it('marks a file that is in the list of the dialog already and does not add it twice', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    await user.click(screen.getByTestId('picker-confirm'));
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(1);
    });

    await openPicker(user);
    await screen.findByTestId('picker-list');

    expect(pickerFile('EURUSD_H1.csv')).toHaveTextContent('schon in der Liste');
    expect(within(pickerFile('EURUSD_H1.csv')).getByTestId('picker-check')).toBeDisabled();
  });

  it('names the directory and the way to the settings when the import directory is empty', async () => {
    const onOpenSettings = vi.fn();
    const user = userEvent.setup();
    await openDialog(user, onOpenSettings);
    await openPicker(user);

    const note = await screen.findByTestId('picker-empty');
    expect(note).toHaveTextContent('Das Importverzeichnis /data/import enthält keine Dateien und keine Unterverzeichnisse.');
    expect(note).toHaveTextContent('Nächster Schritt: Legen Sie dort Dateien ab oder wählen Sie unter „Einstellungen“ ein anderes Importverzeichnis.');

    await user.click(screen.getByTestId('picker-settings'));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('dialog-import')).not.toBeInTheDocument();
  });

  it('says that an empty subdirectory is empty and what to do', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');

    await user.click(within(pickerDir('2024')).getByTestId('picker-open'));

    expect(await screen.findByTestId('picker-empty')).toHaveTextContent(
      'Dieses Verzeichnis ist leer. Nächster Schritt: Gehen Sie eine Ebene höher oder öffnen Sie ein anderes Verzeichnis.',
    );
    expect(screen.queryByTestId('picker-settings')).not.toBeInTheDocument();
  });

  it('names the directory and the way to the settings when it is not set or cannot be read (HTTP 409)', async () => {
    backend.directoryAnswer = () => json(409, { detail: 'The import directory is not set or cannot be read.' });
    const onOpenSettings = vi.fn();
    const user = userEvent.setup();
    await openDialog(user, onOpenSettings);
    await openPicker(user);

    const error = await screen.findByTestId('picker-error');
    expect(error).toHaveTextContent(
      'Das Importverzeichnis /data/import ist nicht gesetzt oder lässt sich nicht lesen. Nächster Schritt: Prüfen Sie es unter „Einstellungen“.',
    );
    await user.click(within(error).getByTestId('picker-settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('says so if the import directory is not known at all', async () => {
    backend.fileSettings = fileSettingsJson({ import_directory: { path: null, is_default: true } });
    backend.directoryAnswer = () => json(409, { detail: 'The import directory is not set or cannot be read.' });
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);

    expect(await screen.findByTestId('picker-error')).toHaveTextContent('Das Importverzeichnis ist nicht gesetzt oder lässt sich nicht lesen.');
    expect(screen.getByTestId('picker-directory')).toHaveTextContent('Es ist kein Importverzeichnis bestimmt.');
  });

  it('offers the way back to the import directory when a directory is gone (HTTP 404)', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    delete backend.directories?.['2024'];

    await user.click(within(pickerDir('2024')).getByTestId('picker-open'));

    expect(await screen.findByTestId('picker-error')).toHaveTextContent('Dieses Verzeichnis gibt es nicht (mehr).');
    await user.click(screen.getByTestId('picker-to-root'));
    expect(await screen.findByTestId('picker-list')).toBeInTheDocument();
    expect(backend.calls.at(-1)?.query.get('path')).toBe('');
  });

  it('shows a listing that fails for another reason with the general text', async () => {
    backend.directoryAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);

    expect(await screen.findByTestId('picker-error')).toHaveTextContent('Das Verzeichnis konnte nicht gelesen werden.');
  });

  it('shows names as text, not as HTML', async () => {
    backend.directories = { '': [entryJson('<img src=x onerror=alert(1)>.csv')] };
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);

    expect(await screen.findByText('<img src=x onerror=alert(1)>.csv')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('is in English with English dates', async () => {
    fillDirectory();
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');
    await user.click(screen.getByTestId('import-choose-directory'));
    await screen.findByTestId('picker-list');

    expect(screen.getByRole('heading', { name: 'Choose from the import directory' })).toBeInTheDocument();
    expect(screen.getByTestId('picker-up')).toHaveTextContent('One level up');
    expect(pickerFile('EURUSD_H1.csv')).toHaveTextContent('2026-01-05 08:15');
    expect(screen.getByTestId('picker-count')).toHaveTextContent('1–4 of 4 entries');
    await user.click(screen.getByTestId('picker-select-page'));
    expect(screen.getByTestId('picker-confirm')).toHaveTextContent('Take over 2 files');
  });
});

describe('one process with uploaded files and files of the import directory', () => {
  it('imports both in one process, uploaded files with `keep` and files of the import directory by path', async () => {
    fillDirectory();
    backend.fileAnswer = (name) => json(200, takenJson(name));
    const user = userEvent.setup();
    backend.hints['up.csv'] = hintJson('up.csv', { instrument: 'XAUUSD', data: 'm1' });
    await openDialog(user);
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'up.csv')]);
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(1);
    });
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    await user.click(within(pickerDir('2023')).getByTestId('picker-open'));
    await screen.findByText('GBPUSD_H1.csv');
    await tick(user, 'GBPUSD_H1.csv');
    await user.click(screen.getByTestId('picker-confirm'));
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(3);
    });
    await fillBasics(user, 'Neuer-Server', 'Europe/Athens');

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('3 von 3 Dateien sind importiert.');
    });
    // One process for all files: one beginning, one end, the same identifier in every path.
    expect(backend.callsTo('POST', IMPORT_PROCESS_PATH)).toHaveLength(1);
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/finish`)).toHaveLength(1);
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/abort`)).toHaveLength(0);
    expect(fileCalls().map((call) => call.path)).toEqual([`${IMPORT_PROCESS_PATH}/process-1/files`]);
    // The time zone of the process is sent with the CSV file, as with each file of the process.
    expect(readForm(fileCalls()[0]?.body)).toEqual({
      broker: 'Neuer-Server',
      timezone: 'Europe/Athens',
      keep: 'false',
      files: ['up.csv'],
      instrument: ['XAUUSD'],
      data: ['m1'],
    });
    expect(directoryCalls().map((call) => call.path)).toEqual([
      `${IMPORT_PROCESS_PATH}/process-1/directory-files`,
      `${IMPORT_PROCESS_PATH}/process-1/directory-files`,
    ]);
    expect(directoryCalls().map((call) => call.body)).toEqual([
      { path: 'EURUSD_H1.csv', broker: 'Neuer-Server', timezone: 'Europe/Athens', instrument: 'EURUSD', data: 'h1' },
      { path: '2023/GBPUSD_H1.csv', broker: 'Neuer-Server', timezone: 'Europe/Athens', instrument: 'GBPUSD', data: 'h1' },
    ]);
    // A file of the import directory says that it stays there; none of them is "kept".
    expect(within(item('EURUSD_H1.csv')).getByTestId('import-stays')).toHaveTextContent('Die Datei liegt unverändert im Importverzeichnis.');
    expect(within(item('up.csv')).queryByTestId('import-stays')).not.toBeInTheDocument();
    expect(screen.queryByTestId('import-kept')).not.toBeInTheDocument();
  });

  it('takes the broker of the JSON files in the import directory as the broker of the process', async () => {
    backend.directories = { '': [entryJson('a.json'), entryJson('b.json')] };
    backend.directoryHints['a.json'] = hintJson('a.json', { broker: 'Demo', instrument: 'EURUSD', data: 'h1' });
    backend.directoryHints['b.json'] = hintJson('b.json', { broker: 'Demo', instrument: 'GBPUSD', data: 'h1' });
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await user.click(screen.getByTestId('picker-select-page'));
    await user.click(screen.getByTestId('picker-confirm'));
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(2);
    });

    expect(screen.getByTestId('import-broker')).toHaveValue('Demo');
    expect(screen.queryByTestId('import-timezone')).not.toBeInTheDocument();
    expect(screen.getByTestId('import-run')).toBeEnabled();
  });

  it('refuses a file of the import directory with its reason and goes on with the others', async () => {
    fillDirectory();
    backend.directoryFileAnswer = (path) => {
      if (path === 'EURUSD_H1.csv') {
        return json(200, refusedJson('EURUSD_H1.csv', 'not_readable', 'The file could not be read.'));
      }
      if (path === '2023/GBPUSD_H1.csv') {
        return json(404, { detail: 'There is no such file or directory in the import directory.' });
      }
      if (path === '2023/deep/USDJPY_H1.csv') {
        return json(422, {
          detail: 'The request body does not fit the schema.',
          errors: [{ location: ['path'], type: 'outside_import_directory' }],
        });
      }
      return json(200, takenJson(path));
    };
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    await user.click(within(pickerDir('2023')).getByTestId('picker-open'));
    await screen.findByText('GBPUSD_H1.csv');
    await user.click(screen.getByTestId('picker-select-page'));
    await user.click(within(pickerDir('deep')).getByTestId('picker-open'));
    await screen.findByText('USDJPY_H1.csv');
    await user.click(screen.getByTestId('picker-select-page'));
    await user.click(screen.getByTestId('picker-confirm'));
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(3);
    });
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('0 von 3 Dateien sind importiert. Abgelehnt: 3.');
    });
    expect(item('EURUSD_H1.csv')).toHaveAttribute('data-state', 'refused');
    expect(within(item('EURUSD_H1.csv')).getByTestId('import-result')).toHaveTextContent(
      'Abgelehnt: Die Datei lässt sich im Importverzeichnis nicht lesen.',
    );
    expect(within(item('2023/GBPUSD_H1.csv')).getByTestId('import-result')).toHaveTextContent(
      'Abgelehnt: Die Datei gibt es im Importverzeichnis nicht (mehr).',
    );
    expect(within(item('2023/deep/USDJPY_H1.csv')).getByTestId('import-result')).toHaveTextContent(
      'Abgelehnt: Der Pfad der Datei ist im Importverzeichnis nicht erlaubt',
    );
    // All three were tried (a refusal for one file does not stop the others), and the process ends, not aborted.
    expect(directoryCalls()).toHaveLength(3);
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/finish`)).toHaveLength(1);
    expect(screen.queryByTestId('import-error')).not.toBeInTheDocument();
  });

  it('refuses a file of an import directory that is not readable any more with the way to the settings', async () => {
    fillDirectory();
    backend.directoryFileAnswer = () => json(409, { detail: 'The import directory is not set or cannot be read.' });
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    await user.click(screen.getByTestId('picker-confirm'));
    await screen.findByTestId('import-item');
    await fillBasics(user);

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(within(item('EURUSD_H1.csv')).getByTestId('import-result')).toHaveTextContent('Prüfen Sie es unter „Einstellungen“');
    });
  });

  it('reads the preview of a file of the import directory that is gone and stops with a message', async () => {
    fillDirectory();
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    backend.directoryPreviewAnswer = () => json(404, { detail: 'There is no such file or directory in the import directory.' });

    await user.click(screen.getByTestId('picker-confirm'));

    expect(await screen.findByTestId('import-read-error')).toHaveTextContent('Das Gesuchte gibt es nicht (mehr).');
    expect(screen.queryAllByTestId('import-item')).toHaveLength(0);
  });
});

describe('Dateien behalten', () => {
  it('is not ticked without a stored setting and sends `keep` false', async () => {
    const user = userEvent.setup();
    await openDialog(user);

    expect(screen.getByTestId('import-keep-files')).not.toBeChecked();
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv')]);
    await screen.findByTestId('import-item');
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(fileCalls()).toHaveLength(1);
    });
    expect(readForm(fileCalls()[0]?.body).keep).toBe('false');
  });

  it('is preset with "Importierte Dateien behalten", read when the dialog opens, and sends `keep` true', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = (name) => json(200, takenJson(name, {}, true));
    const user = userEvent.setup();
    await openDialog(user);

    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv')]);
    await screen.findByTestId('import-item');
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toBeInTheDocument();
    });
    expect(readForm(fileCalls()[0]?.body).keep).toBe('true');
    expect(within(item('a.csv')).getByTestId('import-kept')).toHaveTextContent('Die Datei ist im Ablageverzeichnis behalten.');
    expect(within(item('a.csv')).getByTestId('import-result')).toHaveAttribute('data-kept', 'true');
  });

  it('reads the setting again each time the dialog is opened', async () => {
    const user = userEvent.setup();
    await openDialog(user);
    expect(screen.getByTestId('import-keep-files')).not.toBeChecked();
    await user.click(screen.getByTestId('import-close'));

    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    await user.click(screen.getByTestId('import-open'));

    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });
  });

  it('can be changed for one process against the setting, in both directions', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    const user = userEvent.setup();
    await openDialog(user);
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });

    await user.click(screen.getByTestId('import-keep-files'));
    expect(screen.getByTestId('import-keep-files')).not.toBeChecked();

    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv')]);
    await screen.findByTestId('import-item');
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(fileCalls()).toHaveLength(1);
    });
    expect(readForm(fileCalls()[0]?.body).keep).toBe('false');
  });

  it('keeps what the user ticked when the setting arrives late', async () => {
    let release: (response: Response) => void = () => undefined;
    const waiting = new Promise<Response>((resolve) => {
      release = resolve;
    });
    backend.fileSettingsAnswer = () => waiting;
    const user = userEvent.setup();
    await openDialog(user);

    // The user ticks the box before the setting (which says "not ticked") has arrived.
    await user.click(screen.getByTestId('import-keep-files'));
    expect(screen.getByTestId('import-keep-files')).toBeChecked();
    release(json(200, fileSettingsJson({ keep_imported_files: false })));

    await waitFor(() => {
      expect(screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip')).toContain(
        '/data/storage',
      );
    });
    expect(screen.getByTestId('import-keep-files')).toBeChecked();
  });

  it('explains at the field: the storage directory, that the import directory stays and is not copied', async () => {
    const user = userEvent.setup();
    await openDialog(user);
    await waitFor(() => {
      expect(screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip')).toContain(
        '/data/storage',
      );
    });

    const tip = screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip') ?? '';
    expect(tip).toContain('Ablageverzeichnis /data/storage');
    expect(tip).toContain('Dateien aus dem Importverzeichnis bleiben dort und werden nicht ins Ablageverzeichnis kopiert.');
    expect(tip).toContain('entfernt behaltene Dateien nie');
    expect(screen.getByTestId('field-import-keep-files')).toHaveTextContent('Dateien behalten');
  });

  it('explains without a directory if none can be determined', async () => {
    backend.fileSettings = fileSettingsJson({ storage_directory: { path: null, is_default: true } });
    const user = userEvent.setup();
    await openDialog(user);
    await waitFor(() => {
      expect(backend.callsTo('GET', '/api/replay/settings/files').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const tip = screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip') ?? '';
      expect(tip).toContain('Das Ablageverzeichnis stellen Sie unter „Einstellungen“ ein.');
    });
  });

  it('shows the explanation in English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');

    await waitFor(() => {
      const tip = screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip') ?? '';
      expect(tip).toContain('storage directory /data/storage');
      expect(tip).toContain('Files from the import directory stay there and are not copied into the storage directory.');
    });
    expect(screen.getByTestId('field-import-keep-files')).toHaveTextContent('Keep files');
  });

  it('refuses a file that cannot be kept (HTTP 409 without a storage directory) with the way to the settings, and goes on', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = (name) =>
      name === 'a.csv'
        ? json(409, { detail: 'There is no storage directory to keep the file in.' })
        : json(200, takenJson(name, {}, true));
    const user = userEvent.setup();
    await openDialog(user);
    for (const name of ['a.csv', 'b.csv']) {
      backend.hints[name] = hintJson(name, { instrument: 'EURUSD', data: 'h1' });
    }
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv'), new File(['x'], 'b.csv')]);
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(2);
    });
    await fillBasics(user);
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toHaveTextContent('1 von 2 Dateien sind importiert. Abgelehnt: 1.');
    });
    expect(item('a.csv')).toHaveAttribute('data-state', 'refused');
    expect(within(item('a.csv')).getByTestId('import-result')).toHaveTextContent(
      'Die Datei konnte nicht behalten werden, weil kein Ablageverzeichnis bestimmt ist. Sie wurde nicht importiert.',
    );
    expect(within(item('a.csv')).getByTestId('import-result')).toHaveTextContent('unter „Einstellungen“');
    expect(item('b.csv')).toHaveAttribute('data-state', 'taken');
    expect(screen.queryByTestId('import-error')).not.toBeInTheDocument();
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/finish`)).toHaveLength(1);
  });

  it('refuses a file that could not be written (HTTP 503) and imports it again without the tick', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = (name) =>
      readForm(backend.calls.at(-1)?.body).keep === 'true'
        ? json(503, { detail: 'The file could not be kept in the storage directory. It was not imported.' })
        : json(200, takenJson(name));
    const user = userEvent.setup();
    await openDialog(user);
    backend.hints['a.csv'] = hintJson('a.csv', { instrument: 'EURUSD', data: 'h1' });
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv')]);
    await screen.findByTestId('import-item');
    await fillBasics(user);
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });

    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(within(item('a.csv')).getByTestId('import-result')).toHaveTextContent('nicht im Ablageverzeichnis abgelegt werden');
    });
    expect(item('a.csv')).toHaveAttribute('data-state', 'refused');

    await user.click(screen.getByTestId('import-keep-files'));
    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(item('a.csv')).toHaveAttribute('data-state', 'taken');
    });
    expect(readForm(fileCalls()[1]?.body).keep).toBe('false');
  });

  it('treats another 503 as a failure of the request that ends the run', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    const user = userEvent.setup();
    await openDialog(user);
    for (const name of ['a.csv', 'b.csv']) {
      backend.hints[name] = hintJson(name, { instrument: 'EURUSD', data: 'h1' });
    }
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.csv'), new File(['x'], 'b.csv')]);
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(2);
    });
    await fillBasics(user);
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });

    await user.click(screen.getByTestId('import-run'));

    expect(await screen.findByTestId('import-error')).toHaveTextContent('Der Datenbestand konnte nicht gelesen oder geändert werden.');
    expect(item('b.csv')).toHaveAttribute('data-state', 'skipped');
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/abort`)).toHaveLength(1);
  });

  it('says in English what became of an uploaded file that is kept and of a refused one', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = (name) => json(200, refusedJson(name, 'json_invalid', 'The file is not valid JSON.', true));
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');
    backend.hints['a.json'] = hintJson('a.json', { broker: 'B', instrument: 'EURUSD', data: 'h1' });
    await user.upload(screen.getByTestId('import-files'), [new File(['x'], 'a.json')]);
    await screen.findByTestId('import-item');
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });

    await user.click(screen.getByTestId('import-run'));

    await waitFor(() => {
      expect(within(item('a.json')).getByTestId('import-kept')).toHaveTextContent('The file is kept in the storage directory.');
    });
  });
});

describe('Name der behaltenen Datei', () => {
  async function runWithAnswer(
    answer: (name: string) => Response,
    language: 'de' | 'en' = 'de',
    files: string[] = ['a.csv'],
  ): Promise<void> {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.fileAnswer = answer;
    const user = userEvent.setup();
    renderWithProviders(<DataView />, language);
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');
    for (const name of files) {
      backend.hints[name] = hintJson(name, { instrument: 'EURUSD', data: 'h1' });
    }
    await user.upload(
      screen.getByTestId('import-files'),
      files.map((name) => new File(['x'], name)),
    );
    await waitFor(() => {
      expect(screen.getAllByTestId('import-item')).toHaveLength(files.length);
    });
    await waitFor(() => {
      expect(screen.getByTestId('import-keep-files')).toBeChecked();
    });
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toBeInTheDocument();
    });
  }

  it('names the name under which a taken file was kept if it differs, in German', async () => {
    await runWithAnswer((name) => json(200, takenJson(name, {}, true, 'a (2).csv')));

    const kept = within(item('a.csv')).getByTestId('import-kept');
    expect(kept).toHaveTextContent('Die Datei ist im Ablageverzeichnis unter dem Namen a (2).csv behalten.');
    expect(kept).toHaveAttribute('data-kept-as', 'a (2).csv');
    expect(within(item('a.csv')).getByTestId('import-result')).toHaveAttribute('data-kept', 'true');
  });

  it('names it in English', async () => {
    await runWithAnswer((name) => json(200, takenJson(name, {}, true, 'a (2).csv')), 'en');

    expect(within(item('a.csv')).getByTestId('import-kept')).toHaveTextContent(
      'The file is kept in the storage directory under the name a (2).csv.',
    );
  });

  it('names it for a refused file that was kept', async () => {
    await runWithAnswer((name) => json(200, refusedJson(name, 'json_invalid', 'The file is not valid JSON.', true, 'a (3).csv')));

    expect(within(item('a.csv')).getByTestId('import-result')).toHaveAttribute('data-state', 'refused');
    expect(within(item('a.csv')).getByTestId('import-kept')).toHaveTextContent('unter dem Namen a (3).csv behalten.');
  });

  it('keeps the plain sentence if the name is the same', async () => {
    await runWithAnswer((name) => json(200, takenJson(name, {}, true, name)));

    const kept = within(item('a.csv')).getByTestId('import-kept');
    expect(kept).toHaveTextContent(/^Die Datei ist im Ablageverzeichnis behalten\.$/);
    expect(kept).not.toHaveAttribute('data-kept-as');
  });

  it('says nothing of a name for a file that is not kept', async () => {
    await runWithAnswer((name) => json(200, takenJson(name, {}, false)));

    expect(screen.queryByTestId('import-kept')).not.toBeInTheDocument();
    expect(within(item('a.csv')).getByTestId('import-result')).toHaveAttribute('data-kept', 'false');
  });

  it('says nothing of a name for a file of the import directory', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true });
    backend.directories = { '': [entryJson('EURUSD_H1.csv', 'file', 2048)] };
    backend.hints['EURUSD_H1.csv'] = hintJson('EURUSD_H1.csv', { instrument: 'EURUSD', data: 'h1' });
    const user = userEvent.setup();
    await openDialog(user);
    await openPicker(user);
    await screen.findByTestId('picker-list');
    await tick(user, 'EURUSD_H1.csv');
    await user.click(screen.getByTestId('picker-confirm'));
    await screen.findByTestId('import-item');
    await fillBasics(user);
    await user.click(screen.getByTestId('import-run'));
    await waitFor(() => {
      expect(screen.getByTestId('import-summary')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('import-kept')).not.toBeInTheDocument();
    expect(within(item('EURUSD_H1.csv')).getByTestId('import-stays')).toBeInTheDocument();
  });

  it('sets a name with special characters as text, never as HTML', async () => {
    const odd = '<img src=x onerror=alert(1)> & "q" {{name}} (2).csv';
    await runWithAnswer((name) => json(200, takenJson(name, {}, true, odd)));

    const kept = within(item('a.csv')).getByTestId('import-kept');
    expect(kept.textContent).toBe(`Die Datei ist im Ablageverzeichnis unter dem Namen ${odd} behalten.`);
    expect(kept.querySelector('img')).toBeNull();
    expect(kept).toHaveAttribute('data-kept-as', odd);
  });

  it('shows the name for each file of several', async () => {
    await runWithAnswer(
      (name) => json(200, takenJson(name, {}, true, name === 'b.csv' ? 'b (2).csv' : name)),
      'de',
      ['a.csv', 'b.csv'],
    );

    expect(within(item('a.csv')).getByTestId('import-kept')).toHaveTextContent(/^Die Datei ist im Ablageverzeichnis behalten\.$/);
    expect(within(item('b.csv')).getByTestId('import-kept')).toHaveTextContent('unter dem Namen b (2).csv behalten.');
  });
});

describe('Erklärung der Regel für behaltene Dateien', () => {
  function tipOf(): string {
    return screen.getByTestId('field-import-keep-files').querySelector('[data-tip]')?.getAttribute('data-tip') ?? '';
  }

  it('says in German that an existing file is never replaced and the kept file gets a number', async () => {
    const user = userEvent.setup();
    await openDialog(user);
    await waitFor(() => {
      expect(tipOf()).toContain('/data/storage');
    });

    expect(tipOf()).toContain('eine vorhandene Datei wird nie ersetzt');
    expect(tipOf()).toContain('erhält die behaltene Datei eine Nummer im Namen, zum Beispiel EURUSD_M1 (2).csv');
    expect(tipOf()).not.toContain('gleichen Namens wird ersetzt');
  });

  it('says it in German without a storage directory', async () => {
    backend.fileSettings = fileSettingsJson({ storage_directory: { path: null, is_default: true } });
    const user = userEvent.setup();
    await openDialog(user);
    await waitFor(() => {
      expect(tipOf()).toContain('Das Ablageverzeichnis stellen Sie unter „Einstellungen“ ein.');
    });

    expect(tipOf()).toContain('eine vorhandene Datei wird nie ersetzt');
    expect(tipOf()).toContain('Nummer im Namen, zum Beispiel EURUSD_M1 (2).csv');
    expect(tipOf()).not.toContain('gleichen Namens wird ersetzt');
  });

  it('says it in English, with a storage directory', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');
    await waitFor(() => {
      expect(tipOf()).toContain('/data/storage');
    });

    expect(tipOf()).toContain('an existing file is never replaced');
    expect(tipOf()).toContain('the kept file gets a number in its name, for example EURUSD_M1 (2).csv');
    expect(tipOf()).not.toContain('is replaced');
  });

  it('says it in English without a storage directory', async () => {
    backend.fileSettings = fileSettingsJson({ storage_directory: { path: null, is_default: true } });
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');
    await user.click(await screen.findByTestId('import-open'));
    await screen.findByTestId('dialog-import');
    await waitFor(() => {
      expect(tipOf()).toContain('You set the storage directory under "Settings".');
    });

    expect(tipOf()).toContain('an existing file is never replaced');
    expect(tipOf()).toContain('a number in its name');
  });
});
