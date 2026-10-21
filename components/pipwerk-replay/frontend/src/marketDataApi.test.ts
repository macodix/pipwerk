import { beforeEach, describe, expect, it } from 'vitest';

import { ApiError, UnexpectedAnswerError } from './http';
import {
  fetchAcquisition,
  fetchOverview,
  importCsv,
  importJson,
  isTimeUnit,
  isValidName,
  startAcquisition,
} from './marketDataApi';
import {
  FakeBackend,
  acquisitionJson,
  importResultJson,
  json,
  overviewJson,
  seriesJson,
} from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

describe('overview', () => {
  it('reads series, periods, gaps and instruments', async () => {
    backend.overview = overviewJson(
      [seriesJson({ missing: [{ start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' }], missing_count: 1 })],
      [{ broker: 'B', instrument: 'EURUSD', acquired_at: '2026-01-05T08:00:00Z' }],
    );

    const overview = await fetchOverview();

    expect(overview.series[0]).toMatchObject({ broker: 'Demo-Server', unit: 'h1', count: 120, missingCount: 1 });
    expect(overview.series[0]?.missing[0]?.reason).toBe('gap');
    expect(overview.instruments).toEqual([{ broker: 'B', instrument: 'EURUSD', acquiredAt: '2026-01-05T08:00:00Z' }]);
  });

  it('refuses an answer of another form', async () => {
    backend.overview = { series: 'x' };

    await expect(fetchOverview()).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });

  it('refuses an unknown reason of a missing period', async () => {
    backend.overview = overviewJson([seriesJson({ missing: [{ start: 'a', end: 'b', reason: 'other' }], missing_count: 1 })]);

    await expect(fetchOverview()).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('import', () => {
  it('sends the JSON file unchanged with its media type', async () => {
    const file = new Blob(['{"a": 1}']);

    const result = await importJson(file);

    const call = backend.callsTo('POST', '/api/v1/market-data/imports/json')[0];
    expect(call?.contentType).toBe('application/json');
    expect(call?.body).toBe(file);
    expect(result).toMatchObject({ kind: 'candles', accepted: 3, rejectedCount: 0 });
  });

  it('names what the CSV file does not contain in the query and sends the file as text/csv', async () => {
    const file = new Blob(['x']);

    await importCsv(file, { kind: 'candles', broker: 'A B&C', instrument: 'EURUSD', timeUnit: 'h4', timezone: 'Europe/Athens' });

    const call = backend.callsTo('POST', '/api/v1/market-data/imports/csv')[0];
    expect(call?.contentType).toBe('text/csv');
    expect(call?.query.get('broker')).toBe('A B&C');
    expect(call?.query.get('time_unit')).toBe('h4');
    expect(call?.query.get('timezone')).toBe('Europe/Athens');
    expect(call?.query.get('kind')).toBe('candles');
    expect(call?.body).toBe(file);
  });

  it('turns an error status into an ApiError with the body', async () => {
    backend.importAnswer = () => json(422, { detail: 'The file is refused.', code: 'no_rows', message: 'm' });

    const error = await importJson(new Blob(['{}'])).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).body).toMatchObject({ code: 'no_rows' });
  });

  it('refuses an import result of another form', async () => {
    backend.importAnswer = () => json(200, importResultJson({ kind: 'other' }));

    await expect(importJson(new Blob(['{}']))).rejects.toBeInstanceOf(UnexpectedAnswerError);
  });
});

describe('acquisition', () => {
  it('starts with the parts and reads the state', async () => {
    backend.acquisitionStart = () => json(202, acquisitionJson('running', { state: 'running' }));
    backend.acquisitionStates = [acquisitionJson('finished', { state: 'failed', error: { code: 'no_data', reason: 'r', file_error: null } })];

    const started = await startAcquisition([{ kind: 'instrument', instrument: 'EURUSD' }]);
    const finished = await fetchAcquisition(started.id);

    expect(backend.callsTo('POST', '/api/v1/market-data/acquisitions')[0]?.body).toEqual({
      parts: [{ kind: 'instrument', instrument: 'EURUSD' }],
    });
    expect(started.state).toBe('running');
    expect(started.parts[0]?.request).toMatchObject({ kind: 'candles', time_unit: 'h1' });
    expect(finished.parts[0]?.error).toEqual({ code: 'no_data', reason: 'r', fileError: null });
  });

  it('asks for the state with the identifier in the path, quoted', async () => {
    backend.acquisitionStates = [acquisitionJson('finished', { state: 'queued' })];

    await fetchAcquisition('a b');

    expect(backend.calls.at(-1)?.path).toBe('/api/v1/market-data/acquisitions/a%20b');
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
