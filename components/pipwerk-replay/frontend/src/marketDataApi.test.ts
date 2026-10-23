import { beforeEach, describe, expect, it } from 'vitest';

import { ApiError, UnexpectedAnswerError } from './http';
import {
  fetchBrokers,
  fetchSeries,
  fetchSeriesDetails,
  fetchTestRunBroker,
  importFiles,
  isTimeUnit,
  isValidName,
  previewImport,
  updateTestRunBroker,
} from './marketDataApi';
import {
  FakeBackend,
  INSTRUMENT_JSON,
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

describe('preview', () => {
  it('sends a JSON file as it is and a CSV file without content, in the order of the files', async () => {
    backend.hints['b.json'] = hintJson('b.json', { broker: 'X', instrument: 'EURUSD', data: 'h1' });
    const csv = new File(['a,b,c\n1,2,3\n'], 'EURUSD_H1.csv');
    const jsonFile = new File(['{"a": 1}'], 'b.json');

    const hints = await previewImport([csv, jsonFile]);

    const form = backend.callsTo('POST', '/api/v1/market-data/imports/preview')[0]?.body as FormData;
    const parts = form.getAll('file') as File[];
    expect(parts.map((part) => part.name)).toEqual(['EURUSD_H1.csv', 'b.json']);
    expect(parts[0]?.size).toBe(0);
    expect(parts[1]?.size).toBe(8);
    expect(hints[1]).toMatchObject({ format: 'json', broker: 'X', instrument: 'EURUSD', data: 'h1', error: null });
    expect(hints[0]).toMatchObject({ format: 'csv', instrument: null, data: null });
  });

  it('refuses an answer with another number of hints', async () => {
    backend.previewAnswer = () => json(200, { files: [], broker: null });

    await expect(previewImport([new File(['x'], 'a.csv')])).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('import', () => {
  it('sends one form with the broker, the time zone, the files and instrument and data per file', async () => {
    const files = [
      { file: new File(['x'], 'a.json'), instrument: '', data: 'm1' },
      { file: new File(['y'], 'EURUSD_H1.csv'), instrument: 'EURUSD', data: 'h1' },
    ];

    const outcome = await importFiles('Demo & Server', 'Europe/Athens', files);

    const call = backend.callsTo('POST', '/api/v1/market-data/imports')[0];
    expect(call?.contentType).toBeNull();
    expect(readForm(call?.body)).toEqual({
      broker: 'Demo & Server',
      timezone: 'Europe/Athens',
      files: ['a.json', 'EURUSD_H1.csv'],
      instrument: ['', 'EURUSD'],
      data: ['m1', 'h1'],
    });
    expect(outcome).toMatchObject({ importedCount: 2, refusedCount: 0 });
    expect(outcome.files[1]?.result).toMatchObject({ kind: 'candles', accepted: 3, rejectedCount: 0 });
  });

  it('sends no time zone if none is given', async () => {
    await importFiles('B', '', [{ file: new File(['x'], 'a.json'), instrument: '', data: '' }]);

    expect(readForm(backend.calls.at(-1)?.body).timezone).toBeNull();
  });

  it('reads a result per file with a refused file beside a taken one', async () => {
    backend.importAnswer = () =>
      json(200, {
        files: [takenJson('a.json', { rejected: [{ row: 3, reason: 'high_below_open' }], rejected_count: 1 }), refusedJson('b.json', 'json_invalid')],
        imported_count: 1,
        refused_count: 1,
      });

    const outcome = await importFiles('B', '', [
      { file: new File(['x'], 'a.json'), instrument: '', data: '' },
      { file: new File(['x'], 'b.json'), instrument: '', data: '' },
    ]);

    expect(outcome.files[0]?.result?.rejected).toEqual([{ row: 3, reason: 'high_below_open' }]);
    expect(outcome.files[1]).toMatchObject({ refused: true, result: null, error: 'json_invalid' });
  });

  it('turns an import that is refused as a whole into an ApiError with the body', async () => {
    backend.importAnswer = () => json(413, { detail: 'The import is refused as a whole.', code: 'too_many_files', message: 'm' });

    const error = await importFiles('B', '', [{ file: new File(['x'], 'a.json'), instrument: '', data: '' }]).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(413);
    expect((error as ApiError).body).toMatchObject({ code: 'too_many_files' });
  });

  it('refuses an answer with another number of results and a result of another kind', async () => {
    backend.importAnswer = () => json(200, { files: [], imported_count: 0, refused_count: 0 });
    const one = [{ file: new File(['x'], 'a.json'), instrument: '', data: '' }];

    await expect(importFiles('B', '', one)).rejects.toBeInstanceOf(UnexpectedAnswerError);

    backend.importAnswer = () =>
      json(200, { files: [takenJson('a.json', { kind: 'other' })], imported_count: 1, refused_count: 0 });
    await expect(importFiles('B', '', one)).rejects.toBeInstanceOf(UnexpectedAnswerError);
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
