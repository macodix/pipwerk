import { beforeEach, describe, expect, it } from 'vitest';

import { directoryRefusals, fetchFileSettings, updateFileSettings } from './fileSettingsApi';
import { ApiError, UnexpectedAnswerError } from './http';
import {
  abortImportProcess,
  beginImportProcess,
  deleteData,
  fetchBrokers,
  fetchImportDirectory,
  fetchSeries,
  fetchSeriesDetails,
  fetchTestRunBroker,
  finishImportProcess,
  importProcessDirectoryFile,
  importProcessFile,
  isTimeUnit,
  isValidName,
  limitFromMessage,
  previewDirectoryFile,
  previewFile,
  updateTestRunBroker,
} from './marketDataApi';
import {
  DELETIONS_PATH,
  FakeBackend,
  IMPORT_PROCESS_PATH,
  INSTRUMENT_JSON,
  deletionJson,
  entryJson,
  fileSettingsJson,
  hintJson,
  json,
  readForm,
  refusedJson,
  rowJson,
  takenJson,
} from './test-utils';

let backend: FakeBackend;

const NO_FILTER = { broker: '', instrument: '', data: '' };

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

describe('list of series', () => {
  it('reads the rows with the identifier of the data, the first and last moment and the gaps', async () => {
    backend.rows = [rowJson({ gap_count: 2 }), rowJson({ data: 'contract', first: null, last: null })];

    const page = await fetchSeries(NO_FILTER, 0, 10);

    expect(page.total).toBe(2);
    expect(page.items[0]).toEqual({
      broker: 'Demo-Server',
      instrument: 'EURUSD',
      data: 'h1',
      first: '2026-01-05T00:00:00Z',
      last: '2026-01-09T23:00:00Z',
      gapCount: 2,
    });
    expect(page.items[1]).toMatchObject({ data: 'contract', first: null, last: null, gapCount: 0 });
  });

  it('sends offset and limit and only the filters that are set', async () => {
    await fetchSeries({ broker: 'Demo', instrument: '', data: 'h1' }, 20, 10);

    const query = backend.callsTo('GET', '/api/v1/market-data/series')[0]?.query;
    expect(query?.get('offset')).toBe('20');
    expect(query?.get('limit')).toBe('10');
    expect(query?.get('broker')).toBe('Demo');
    expect(query?.get('data')).toBe('h1');
    expect(query?.has('instrument')).toBe(false);
  });

  it('refuses an answer of another form', async () => {
    backend.seriesAnswer = () => json(200, { items: 'x', total: 1, offset: 0, limit: 10 });

    await expect(fetchSeries(NO_FILTER, 0, 10)).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('details of a row', () => {
  it('names the row in the query and reads gaps and contract data', async () => {
    backend.rows = [rowJson()];
    backend.gaps['Demo-Server|EURUSD|h1'] = [{ start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' }];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;

    const details = await fetchSeriesDetails({ broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1' });

    const query = backend.callsTo('GET', '/api/v1/market-data/series/details')[0]?.query;
    expect([query?.get('broker'), query?.get('instrument'), query?.get('data')]).toEqual(['Demo-Server', 'EURUSD', 'h1']);
    expect(details.gaps).toEqual([{ start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' }]);
    expect(details.contract).toMatchObject({ contractSize: 100000, tickValueCurrency: 'USD', marginPerLot: null });
  });

  it('reads missing contract data as null', async () => {
    backend.rows = [rowJson()];

    const details = await fetchSeriesDetails({ broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1' });

    expect(details.contract).toBeNull();
  });

  it('turns an unknown row into an ApiError 404', async () => {
    const error = await fetchSeriesDetails({ broker: 'x', instrument: 'y', data: 'h1' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
  });

  it('refuses an unknown reason of a gap', async () => {
    backend.rows = [rowJson()];
    backend.gaps['Demo-Server|EURUSD|h1'] = [{ start: 'a', end: 'b', reason: 'other' }];

    await expect(fetchSeriesDetails({ broker: 'Demo-Server', instrument: 'EURUSD', data: 'h1' })).rejects.toBeInstanceOf(
      UnexpectedAnswerError,
    );
  });
});

describe('brokers and the broker for test runs', () => {
  it('reads the brokers', async () => {
    backend.brokers = ['A', 'B'];

    expect(await fetchBrokers()).toEqual(['A', 'B']);
  });

  it('reads the broker that applies and whether it is the choice', async () => {
    backend.brokers = ['B', 'A'];

    expect(await fetchTestRunBroker()).toEqual({ broker: 'A', chosen: false });
  });

  it('writes the choice and reads what applies afterwards', async () => {
    backend.brokers = ['A', 'B'];

    const stored = await updateTestRunBroker('B');

    expect(backend.callsTo('PUT', '/api/replay/settings/test-run-broker')[0]?.body).toEqual({ broker: 'B' });
    expect(stored).toEqual({ broker: 'B', chosen: true });
  });

  it('turns the refusal of a broker that is not in the data stock into an ApiError 422', async () => {
    const error = await updateTestRunBroker('Z').catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(422);
  });
});

describe('preview of a file', () => {
  it('sends a JSON file as it is', async () => {
    backend.hints['b.json'] = hintJson('b.json', { broker: 'X', instrument: 'EURUSD', data: 'h1' });

    const hint = await previewFile(new File(['{"a": 1}'], 'b.json'));

    const call = backend.callsTo('POST', '/api/v1/market-data/import-preview')[0];
    const parts = (call?.body as FormData).getAll('file') as File[];
    expect(parts.map((part) => [part.name, part.size])).toEqual([['b.json', 8]]);
    expect(hint).toMatchObject({ format: 'json', broker: 'X', instrument: 'EURUSD', data: 'h1', error: null, limit: null });
  });

  it('sends a CSV file without its content', async () => {
    const hint = await previewFile(new File(['a,b,c\n1,2,3\n'], 'EURUSD_H1.csv'));

    const parts = (backend.calls.at(-1)?.body as FormData).getAll('file') as File[];
    expect(parts.map((part) => [part.name, part.size])).toEqual([['EURUSD_H1.csv', 0]]);
    expect(hint).toMatchObject({ format: 'csv', instrument: null, data: null });
  });

  it('makes a hint with the limit of a file that is above the limit per file (HTTP 413)', async () => {
    backend.previewAnswer = () =>
      json(413, { detail: 'The file is larger than the limit of 32 MiB per file.', code: 'too_large', max_bytes: 33554432 });

    const hint = await previewFile(new File(['{'], 'big.json'));

    expect(hint).toMatchObject({ name: 'big.json', format: 'json', error: 'too_large', limit: { kind: 'size', text: '32 MiB' } });
  });

  it('passes on any other error', async () => {
    backend.previewAnswer = () => json(413, { detail: 'The request body is larger than the limit.' });

    await expect(previewFile(new File(['x'], 'a.csv'))).rejects.toBeInstanceOf(ApiError);
  });

  it('refuses an answer of another form', async () => {
    backend.previewAnswer = () => json(200, { name: 'a.csv', format: 'xml' });

    await expect(previewFile(new File(['x'], 'a.csv'))).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('limit named by the backend', () => {
  it.each([
    ['The file is larger than the limit of 32 MiB per file.', { kind: 'size', text: '32 MiB' }],
    ['The file is larger than the limit of 1.5 GiB per file.', { kind: 'size', text: '1.5 GiB' }],
    ['The file is larger than the limit of 100 bytes per file.', { kind: 'size', text: '100 bytes' }],
    ['The file has more rows than the limit of 500000 rows per file.', { kind: 'rows', text: '500000' }],
    ['The file has more entries than the limit of 7 entries per file.', { kind: 'rows', text: '7' }],
    ['The file is not valid JSON.', null],
  ])('reads %j', (message, expected) => {
    expect(limitFromMessage(message)).toEqual(expected);
  });

  it('knows no limit without a text', () => {
    expect(limitFromMessage(null)).toBeNull();
  });
});

describe('import process', () => {
  const fileOf = (name: string, instrument = '', data = '') => ({ file: new File(['x'], name), instrument, data });

  it('begins a process with an empty JSON body and reads its identifier and time limit', async () => {
    const process = await beginImportProcess();

    const call = backend.callsTo('POST', IMPORT_PROCESS_PATH)[0];
    expect(call?.body).toEqual({});
    expect(call?.contentType).toBe('application/json');
    expect(process).toEqual({ id: 'process-1', idleTimeoutSeconds: 300 });
  });

  it('sends one file in one form with the broker, the time zone, instrument and data', async () => {
    const outcome = await importProcessFile('process-1', 'Demo & Server', 'Europe/Athens', fileOf('EURUSD_H1.csv', 'EURUSD', 'h1'), false);

    const call = backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/process-1/files`)[0];
    expect(call?.contentType).toBeNull();
    expect(readForm(call?.body)).toEqual({
      broker: 'Demo & Server',
      timezone: 'Europe/Athens',
      keep: 'false',
      files: ['EURUSD_H1.csv'],
      instrument: ['EURUSD'],
      data: ['h1'],
    });
    expect(outcome).toMatchObject({ name: 'EURUSD_H1.csv', refused: false, error: null, limit: null });
    expect(outcome.result).toMatchObject({ kind: 'candles', accepted: 3, rejectedCount: 0 });
  });

  it('sends no time zone if none is given and puts the identifier in the path as text', async () => {
    await importProcessFile('a b/c', 'B', '', fileOf('a.json'), false);

    const call = backend.calls.at(-1);
    expect(call?.path).toBe('/api/v1/market-data/import-processes/a%20b%2Fc/files');
    expect(readForm(call?.body).timezone).toBeNull();
  });

  it('reads the rejected rows of a taken file and the reason of a refused one', async () => {
    backend.fileAnswer = (name) =>
      name === 'a.json'
        ? json(200, takenJson('a.json', { rejected: [{ row: 3, reason: 'high_below_open' }], rejected_count: 1 }))
        : json(200, refusedJson(name, 'json_invalid', 'The file is not valid JSON.'));

    const taken = await importProcessFile('p', 'B', '', fileOf('a.json'), false);
    const refused = await importProcessFile('p', 'B', '', fileOf('b.json'), false);

    expect(taken.result?.rejected).toEqual([{ row: 3, reason: 'high_below_open' }]);
    expect(refused).toMatchObject({ refused: true, result: null, error: 'json_invalid', limit: null });
  });

  it('reads the limit per file from the text of a refused file', async () => {
    backend.fileAnswer = (name) =>
      json(200, refusedJson(name, 'too_large', 'The file is larger than the limit of 32 MiB per file.'));

    const refused = await importProcessFile('p', 'B', '', fileOf('big.csv'), false);

    expect(refused).toMatchObject({ refused: true, error: 'too_large', limit: { kind: 'size', text: '32 MiB' } });
  });

  it('treats the answer 413 of a file above the limit like a refused file with that limit', async () => {
    backend.fileAnswer = () =>
      json(413, { detail: 'The file is larger than the limit of 32 MiB per file.', code: 'too_large', max_bytes: 33554432 });

    const refused = await importProcessFile('p', 'B', '', fileOf('big.json'), false);

    expect(refused).toEqual({
      name: 'big.json',
      refused: true,
      result: null,
      error: 'too_large',
      limit: { kind: 'size', text: '32 MiB' },
      kept: false,
    });
  });

  it('passes on any other error, among them the end of the process', async () => {
    backend.fileAnswer = () => json(404, { detail: 'The import process does not exist. It has ended or its time has run out.' });

    const error = await importProcessFile('p', 'B', '', fileOf('a.json'), false).catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(404);
  });

  it('finishes and aborts a process', async () => {
    expect((await finishImportProcess('p')).state).toBe('finished');
    expect((await abortImportProcess('p')).state).toBe('aborted');

    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/p/finish`)[0]?.body).toEqual({});
    expect(backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/p/abort`)[0]?.body).toEqual({});
  });

  it('refuses an answer of another form and a result of another kind', async () => {
    backend.beginAnswer = () => json(201, { id: 5 });
    await expect(beginImportProcess()).rejects.toBeInstanceOf(UnexpectedAnswerError);

    backend.endAnswer = () => json(200, { id: 'p', state: 'running', imported_count: 0, refused_count: 0 });
    await expect(finishImportProcess('p')).rejects.toBeInstanceOf(UnexpectedAnswerError);

    backend.fileAnswer = () => json(200, takenJson('a.json', { kind: 'other' }));
    await expect(importProcessFile('p', 'B', '', fileOf('a.json'), false)).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });

  it('sends `keep` true with an uploaded file and reads `kept` of the result', async () => {
    backend.fileAnswer = (name) => json(200, takenJson(name, {}, true));

    const outcome = await importProcessFile('p', 'B', '', fileOf('a.json'), true);

    expect(readForm(backend.calls.at(-1)?.body).keep).toBe('true');
    expect(outcome.kept).toBe(true);
  });

  it('refuses a result without `kept`', async () => {
    backend.fileAnswer = (name) => json(200, { ...takenJson(name), kept: undefined });

    await expect(importProcessFile('p', 'B', '', fileOf('a.json'), false)).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('import directory', () => {
  it('lists a directory by its relative path, page by page', async () => {
    backend.directories = { '': [entryJson('2023', 'directory'), entryJson('a.csv', 'file', 12)], '2023': [] };

    const page = await fetchImportDirectory('', 0, 50);

    const call = backend.callsTo('GET', '/api/v1/market-data/import-directory')[0];
    expect(call?.query.get('path')).toBe('');
    expect(call?.query.get('offset')).toBe('0');
    expect(call?.query.get('limit')).toBe('50');
    expect(page.total).toBe(2);
    expect(page.items).toEqual([
      { name: '2023', kind: 'directory', size: null, modifiedAt: '2026-01-05T08:15:00Z' },
      { name: 'a.csv', kind: 'file', size: 12, modifiedAt: '2026-01-05T08:15:00Z' },
    ]);
  });

  it('puts a path with spaces and slashes into the query as text', async () => {
    backend.directories = { 'a b/c': [] };

    await fetchImportDirectory('a b/c', 50, 50);

    expect(backend.calls.at(-1)?.query.get('path')).toBe('a b/c');
    expect(backend.calls.at(-1)?.query.get('offset')).toBe('50');
  });

  it('refuses an entry of another kind', async () => {
    backend.directoryAnswer = () => json(200, { items: [{ ...entryJson('x'), kind: 'link' }], total: 1, offset: 0, limit: 50 });

    await expect(fetchImportDirectory('', 0, 50)).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });

  it('passes on the errors of the listing', async () => {
    backend.directories = null;
    backend.directoryAnswer = () => json(409, { detail: 'The import directory is not set or cannot be read.' });

    const error = await fetchImportDirectory('', 0, 50).catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(409);
  });

  it('asks for the hint of a file by its path', async () => {
    backend.directoryHints['a/b.csv'] = hintJson('b.csv', { instrument: 'EURUSD', data: 'h1' });

    const hint = await previewDirectoryFile('a/b.csv');

    const call = backend.callsTo('POST', '/api/v1/market-data/import-directory/preview')[0];
    expect(call?.body).toEqual({ path: 'a/b.csv' });
    expect(hint).toMatchObject({ format: 'csv', instrument: 'EURUSD', data: 'h1', error: null });
  });

  it('imports a file of the import directory by its path, with only what is given and no `keep`', async () => {
    const outcome = await importProcessDirectoryFile('p', 'B', 'Europe/Athens', { path: 'a/b.csv', instrument: 'EURUSD', data: 'h1' });

    const call = backend.callsTo('POST', `${IMPORT_PROCESS_PATH}/p/directory-files`)[0];
    expect(call?.contentType).toBe('application/json');
    expect(call?.body).toEqual({ path: 'a/b.csv', broker: 'B', timezone: 'Europe/Athens', instrument: 'EURUSD', data: 'h1' });
    expect(outcome).toMatchObject({ name: 'b.csv', refused: false, kept: false });
  });

  it('leaves out the time zone, the instrument and the data that are empty', async () => {
    await importProcessDirectoryFile('p', 'B', '', { path: 'a.json', instrument: '', data: '' });

    expect(backend.calls.at(-1)?.body).toEqual({ path: 'a.json', broker: 'B' });
  });
});

describe('settings for files', () => {
  it('reads the four values with the path that applies and whether it is the default', async () => {
    backend.fileSettings = fileSettingsJson({ keep_imported_files: true, import_directory: { path: '/x', is_default: false } });

    const settings = await fetchFileSettings();

    expect(settings).toEqual({
      keepImportedFiles: true,
      storageDirectory: { path: '/data/storage', isDefault: true },
      importDirectory: { path: '/x', isDefault: false },
      exportDirectory: { path: '/data/export', isDefault: true },
    });
  });

  it('reads a default that cannot be determined as no path', async () => {
    backend.fileSettings = fileSettingsJson({ export_directory: { path: null, is_default: true } });

    expect((await fetchFileSettings()).exportDirectory).toEqual({ path: null, isDefault: true });
  });

  it('sends all four fields, `null` for the default', async () => {
    await updateFileSettings({
      keepImportedFiles: true,
      storageDirectory: '/a',
      importDirectory: null,
      exportDirectory: null,
    });

    const call = backend.callsTo('PUT', '/api/replay/settings/files')[0];
    expect(call?.body).toEqual({
      keep_imported_files: true,
      storage_directory: '/a',
      import_directory: null,
      export_directory: null,
    });
  });

  it('refuses an answer of another form', async () => {
    backend.fileSettingsAnswer = () => json(200, { keep_imported_files: 'yes' });

    await expect(fetchFileSettings()).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });

  it('reads the reasons per directory from the refusal and ignores what it does not know', async () => {
    const refusal = new ApiError(422, {
      detail: 'A directory cannot be used. Nothing was saved.',
      errors: [
        { location: ['storage_directory'], type: 'not_writable' },
        { location: ['import_directory'], type: 'not_absolute' },
        { location: ['export_directory'], type: 'something_else' },
        { location: ['keep_imported_files'], type: 'not_absolute' },
      ],
    });

    expect(directoryRefusals(refusal)).toEqual({ storage_directory: 'not_writable', import_directory: 'not_absolute' });
  });

  it('knows no refusal of directories in any other error', () => {
    expect(directoryRefusals(new ApiError(422, { detail: 'x', errors: [{ location: ['broker'], type: 'missing' }] }))).toBeNull();
    expect(directoryRefusals(new ApiError(503, { detail: 'x' }))).toBeNull();
    expect(directoryRefusals(new ApiError(422, null))).toBeNull();
    expect(directoryRefusals(new TypeError('Failed to fetch'))).toBeNull();
  });
});

describe('deleting', () => {
  const series = { kind: 'series', broker: 'B', instrument: 'EURUSD', data: 'h1' } as const;

  it.each([
    [series, 'series', { broker: 'B', instrument: 'EURUSD', data: 'h1' }],
    [
      { kind: 'period', broker: 'B', instrument: 'EURUSD', data: 'm1', start: '2026-01-05T08:00:00Z', end: '2026-01-05T09:00:00Z' },
      'period',
      { broker: 'B', instrument: 'EURUSD', data: 'm1', start: '2026-01-05T08:00:00Z', end: '2026-01-05T09:00:00Z' },
    ],
    [{ kind: 'contract', broker: 'B', instrument: 'EURUSD' }, 'contract', { broker: 'B', instrument: 'EURUSD' }],
    [{ kind: 'broker', broker: 'B' }, 'broker', { broker: 'B' }],
  ] as const)('sends %j to the endpoint of its kind with the fields and `confirm`', async (what, kind, fields) => {
    await deleteData(what, false);
    await deleteData(what, true);

    const calls = backend.callsTo('POST', `${DELETIONS_PATH}/${kind}`);
    expect(calls.map((call) => call.body)).toEqual([
      { ...fields, confirm: false },
      { ...fields, confirm: true },
    ]);
  });

  it('reads what would be deleted and what the deletion did to the broker for test runs', async () => {
    backend.deletionAnswer = () =>
      json(
        200,
        deletionJson({
          kind: 'broker',
          instrument: null,
          data: null,
          candle_count: 12,
          tick_count: 3,
          series_count: 2,
          instrument_count: 1,
          broker_removed: true,
          test_run_broker_reset: true,
          test_run_broker: { broker: 'A', chosen: false },
        }),
      );

    const result = await deleteData({ kind: 'broker', broker: 'Demo-Server' }, false);

    expect(result).toEqual({
      kind: 'broker',
      deleted: false,
      broker: 'Demo-Server',
      instrument: null,
      data: null,
      start: null,
      end: null,
      candleCount: 12,
      tickCount: 3,
      seriesCount: 2,
      instrumentCount: 1,
      brokerRemoved: true,
      testRunBrokerReset: true,
      testRunBroker: { broker: 'A', chosen: false },
    });
  });

  it('passes on the reason of a refusal and refuses an answer of another form', async () => {
    backend.deletionAnswer = () => json(409, { detail: 'x', reason: 'import_running' });
    const error = await deleteData(series, true).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).body).toMatchObject({ reason: 'import_running' });

    backend.deletionAnswer = () => json(200, deletionJson({ kind: 'other' }));
    await expect(deleteData(series, false)).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('names and time units', () => {
  it.each(['EURUSD', 'Demo Server 1', 'a'])('accepts the name "%s"', (name) => {
    expect(isValidName(name)).toBe(true);
  });

  it.each(['', ' x', 'x ', 'a\tb', 'a\nb', 'x'.repeat(129)])('rejects the name %j', (name) => {
    expect(isValidName(name)).toBe(false);
  });

  it('knows the 21 time units', () => {
    expect(isTimeUnit('m15')).toBe(true);
    expect(isTimeUnit('mn1')).toBe(true);
    expect(isTimeUnit('m7')).toBe(false);
  });
});
