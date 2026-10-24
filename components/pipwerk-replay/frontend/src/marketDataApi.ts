// Data stock of historical price data: `/api/v1/market-data/` (specification 5.1, 5.3, 5.5, 8.3) and
// the broker for test runs `/api/replay/settings/test-run-broker`.
import {
  ApiError,
  asRecord,
  bool,
  list,
  num,
  numOrNull,
  request,
  str,
  strOrNull,
  UnexpectedAnswerError,
} from './http';

const BASE = '/api/v1/market-data';

/** The time units of candles, as in MetaTrader 5 (the backend accepts exactly these). */
export const TIME_UNITS = [
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm10', 'm12', 'm15', 'm20', 'm30',
  'h1', 'h2', 'h3', 'h4', 'h6', 'h8', 'h12', 'd1', 'w1', 'mn1',
] as const;
export type TimeUnit = (typeof TIME_UNITS)[number];

export function isTimeUnit(value: string): value is TimeUnit {
  return (TIME_UNITS as readonly string[]).includes(value);
}

// --- list of series -------------------------------------------------------------------

/** One row of the table: a broker, an instrument and one kind of data. */
export type SeriesRow = {
  broker: string;
  instrument: string;
  /** The identifier of the data: a time unit (`h1`), `ticks` or `contract`. */
  data: string;
  /** The first and last moment (UTC); `null` for contract data. */
  first: string | null;
  last: string | null;
  gapCount: number;
};

export type SeriesPage = { items: SeriesRow[]; total: number; offset: number; limit: number };

export type SeriesFilter = { broker: string; instrument: string; data: string };

function parseRow(value: unknown): SeriesRow {
  const record = asRecord(value, 'row of the series');
  return {
    broker: str(record, 'broker'),
    instrument: str(record, 'instrument'),
    data: str(record, 'data'),
    first: strOrNull(record, 'first'),
    last: strOrNull(record, 'last'),
    gapCount: num(record, 'gap_count'),
  };
}

export async function fetchSeries(
  filter: SeriesFilter,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<SeriesPage> {
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  for (const key of ['broker', 'instrument', 'data'] as const) {
    if (filter[key] !== '') {
      query.set(key, filter[key]);
    }
  }
  const record = asRecord(await request(`${BASE}/series?${query.toString()}`, { signal }), 'list of series');
  return {
    items: list(record, 'items', parseRow),
    total: num(record, 'total'),
    offset: num(record, 'offset'),
    limit: num(record, 'limit'),
  };
}

// --- details of a row -----------------------------------------------------------------

/**
 * A gap: a time between two covered periods of the series in which trade was possible. Weekends,
 * holidays and other times without trade are no gaps (specification 5.2); the backend does not
 * list them.
 */
export type Gap = { start: string; end: string; reason: 'not_covered' | 'gap' };

/** The contract data of an instrument at a broker. */
export type InstrumentInfo = {
  broker: string;
  instrument: string;
  acquiredAt: string;
  tickSize: number;
  tickValue: number;
  tickValueCurrency: string;
  point: number;
  pip: number;
  spread: number;
  minVolume: number;
  volumeStep: number;
  contractSize: number;
  swapLong: number;
  swapShort: number;
  swapTripleWeekday: string;
  marginPerLot: number | null;
};

export type SeriesDetails = { row: SeriesRow; gaps: Gap[]; contract: InstrumentInfo | null };

function parseGap(value: unknown): Gap {
  const record = asRecord(value, 'gap');
  const reason = str(record, 'reason');
  if (reason !== 'not_covered' && reason !== 'gap') {
    throw new UnexpectedAnswerError('reason of a gap');
  }
  return { start: str(record, 'start'), end: str(record, 'end'), reason };
}

function parseInstrument(value: unknown): InstrumentInfo {
  const record = asRecord(value, 'contract data');
  return {
    broker: str(record, 'broker'),
    instrument: str(record, 'instrument'),
    acquiredAt: str(record, 'acquired_at'),
    tickSize: num(record, 'tick_size'),
    tickValue: num(record, 'tick_value'),
    tickValueCurrency: str(record, 'tick_value_currency'),
    point: num(record, 'point'),
    pip: num(record, 'pip'),
    spread: num(record, 'spread'),
    minVolume: num(record, 'min_volume'),
    volumeStep: num(record, 'volume_step'),
    contractSize: num(record, 'contract_size'),
    swapLong: num(record, 'swap_long'),
    swapShort: num(record, 'swap_short'),
    swapTripleWeekday: str(record, 'swap_triple_weekday'),
    marginPerLot: numOrNull(record, 'margin_per_lot'),
  };
}

export async function fetchSeriesDetails(
  row: { broker: string; instrument: string; data: string },
  signal?: AbortSignal,
): Promise<SeriesDetails> {
  const query = new URLSearchParams({ broker: row.broker, instrument: row.instrument, data: row.data });
  const record = asRecord(
    await request(`${BASE}/series/details?${query.toString()}`, { signal }),
    'details of a row',
  );
  return {
    row: parseRow(record.row),
    gaps: list(record, 'gaps', parseGap),
    contract: record.contract === null ? null : parseInstrument(record.contract),
  };
}

// --- brokers and the broker for test runs ---------------------------------------------

export async function fetchBrokers(signal?: AbortSignal): Promise<string[]> {
  const record = asRecord(await request(`${BASE}/brokers`, { signal }), 'brokers');
  return list(record, 'items', (item) => {
    if (typeof item !== 'string') {
      throw new UnexpectedAnswerError('broker');
    }
    return item;
  });
}

/** The broker whose data a test run uses; `chosen` tells whether it is the user's choice. */
export type TestRunBroker = { broker: string | null; chosen: boolean };

export function parseTestRunBroker(value: unknown): TestRunBroker {
  const record = asRecord(value, 'broker for test runs');
  return { broker: strOrNull(record, 'broker'), chosen: bool(record, 'chosen') };
}

export async function fetchTestRunBroker(signal?: AbortSignal): Promise<TestRunBroker> {
  return parseTestRunBroker(await request('/api/replay/settings/test-run-broker', { signal }));
}

export async function updateTestRunBroker(broker: string | null): Promise<TestRunBroker> {
  return parseTestRunBroker(
    await request('/api/replay/settings/test-run-broker', { method: 'PUT', json: { broker } }),
  );
}

// --- import ---------------------------------------------------------------------------

/**
 * The limit per file as a text of the backend names it: the size (`32 MiB`) or the number of rows
 * (`500000`). The backend names it in the unit of the user (`The file is larger than the limit of
 * 32 MiB per file.`); the interface shows the same value in its own sentence.
 */
export type FileLimit = { kind: 'size' | 'rows'; text: string };

/** The limit per file that a text of the backend names, or `null` if the text names none. */
export function limitFromMessage(message: string | null): FileLimit | null {
  if (message === null) {
    return null;
  }
  const size = /limit of (\d+(?:\.\d+)?) (bytes|KiB|MiB|GiB) per file/.exec(message);
  if (size?.[1] !== undefined && size[2] !== undefined) {
    return { kind: 'size', text: `${size[1]} ${size[2]}` };
  }
  const rows = /limit of (\d+) (?:rows|entries) per file/.exec(message);
  if (rows?.[1] !== undefined) {
    return { kind: 'rows', text: rows[1] };
  }
  return null;
}

/** What the backend recognises about a file without importing it (`FileHint`). */
export type FileHint = {
  name: string;
  format: 'json' | 'csv';
  broker: string | null;
  instrument: string | null;
  /** The identifier of the data, or `null` if the file does not say. */
  data: string | null;
  /** The code of the problem if a JSON file cannot be read. */
  error: string | null;
  /** The limit per file if the file is above it and the backend said so (HTTP 413). */
  limit: FileLimit | null;
};

function parseHint(value: unknown): FileHint {
  const record = asRecord(value, 'hint on a file');
  const format = str(record, 'format');
  if (format !== 'json' && format !== 'csv') {
    throw new UnexpectedAnswerError('format of a file');
  }
  return {
    name: str(record, 'name'),
    format,
    broker: strOrNull(record, 'broker'),
    instrument: strOrNull(record, 'instrument'),
    data: strOrNull(record, 'data'),
    error: strOrNull(record, 'error'),
    limit: null,
  };
}

/** The form of the request of one file: the part `file`, named like the file. */
function fileForm(file: Blob, name: string): FormData {
  const form = new FormData();
  form.append('file', file, name);
  return form;
}

/**
 * The limit that the answer 413 of a file above the limit per file names (`FileTooLarge`): `null`
 * if the answer names none, `undefined` if the error is not that answer.
 */
function fileTooLarge(error: unknown): FileLimit | null | undefined {
  if (!(error instanceof ApiError) || error.status !== 413) {
    return undefined;
  }
  const body: unknown = error.body;
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  if (record.code !== 'too_large') {
    return undefined;
  }
  return limitFromMessage(typeof record.detail === 'string' ? record.detail : null);
}

/**
 * Asks the backend what a file says about itself (one request per file). The content of a CSV file
 * is not read, so it is not sent (an empty part with the name of the file); a JSON file is sent as
 * it is. A file above the limit per file (HTTP 413) gets a hint with the error `too_large`.
 */
export async function previewFile(file: File, signal?: AbortSignal): Promise<FileHint> {
  const isJson = file.name.toLowerCase().endsWith('.json');
  const form = fileForm(isJson ? file : new Blob([]), file.name);
  try {
    return parseHint(await request(`${BASE}/import-preview`, { method: 'POST', form, signal }));
  } catch (error) {
    const limit = fileTooLarge(error);
    if (limit === undefined) {
      throw error;
    }
    return {
      name: file.name,
      format: isJson ? 'json' : 'csv',
      broker: null,
      instrument: null,
      data: null,
      error: 'too_large',
      limit,
    };
  }
}

export type RejectedRow = { row: number; reason: string };

export type ImportResult = {
  kind: 'candles' | 'ticks' | 'instrument';
  broker: string;
  instrument: string;
  unit: string | null;
  accepted: number;
  replaced: number;
  periodStart: string | null;
  periodEnd: string | null;
  rejected: RejectedRow[];
  rejectedCount: number;
};

function parseImportResult(value: unknown): ImportResult {
  const record = asRecord(value, 'import result');
  const kind = str(record, 'kind');
  if (kind !== 'candles' && kind !== 'ticks' && kind !== 'instrument') {
    throw new UnexpectedAnswerError('kind of an import');
  }
  return {
    kind,
    broker: str(record, 'broker'),
    instrument: str(record, 'instrument'),
    unit: strOrNull(record, 'unit'),
    accepted: num(record, 'accepted'),
    replaced: num(record, 'replaced'),
    periodStart: strOrNull(record, 'period_start'),
    periodEnd: strOrNull(record, 'period_end'),
    rejected: list(record, 'rejected', (item) => {
      const row = asRecord(item, 'rejected row');
      return { row: num(row, 'row'), reason: str(row, 'reason') };
    }),
    rejectedCount: num(record, 'rejected_count'),
  };
}

/** The result for one file: either the file is taken over (`result`) or refused (`error`). */
export type FileOutcome = {
  name: string;
  refused: boolean;
  result: ImportResult | null;
  /** The code of the reason a whole file is refused (`FileErrorCode`). */
  error: string | null;
  /** The limit per file if that is the reason (named in the text of the backend). */
  limit: FileLimit | null;
};

function parseOutcome(value: unknown): FileOutcome {
  const record = asRecord(value, 'result for a file');
  const refused = bool(record, 'refused');
  const result = record.result;
  return {
    name: str(record, 'name'),
    refused,
    result: result === null || result === undefined ? null : parseImportResult(result),
    error: strOrNull(record, 'error'),
    limit: limitFromMessage(record.message === undefined ? null : strOrNull(record, 'message')),
  };
}

// --- import process -------------------------------------------------------------------

/** An import process that was begun: its identifier and the time after which it ends by itself. */
export type ImportProcess = { id: string; idleTimeoutSeconds: number };

export async function beginImportProcess(signal?: AbortSignal): Promise<ImportProcess> {
  const record = asRecord(
    await request(`${BASE}/import-processes`, { method: 'POST', json: {}, signal }),
    'import process',
  );
  return { id: str(record, 'id'), idleTimeoutSeconds: num(record, 'idle_timeout_seconds') };
}

/** A file of an import with what the user says about it (empty: nothing). */
export type ImportFile = { file: File; instrument: string; data: string };

/**
 * Imports one file in the process. `broker` counts for all files of the process; `timezone` is
 * sent only if it is given (CSV files). `instrument` and `data` are sent as typed, empty for none.
 * A file above the limit per file (HTTP 413) is the same as a file the import refuses for that
 * reason: the answer is a refused file with the limit.
 */
export async function importProcessFile(
  processId: string,
  broker: string,
  timezone: string,
  item: ImportFile,
  signal?: AbortSignal,
): Promise<FileOutcome> {
  const form = fileForm(item.file, item.file.name);
  form.append('broker', broker);
  if (timezone !== '') {
    form.append('timezone', timezone);
  }
  form.append('instrument', item.instrument);
  form.append('data', item.data);
  try {
    return parseOutcome(
      await request(`${BASE}/import-processes/${encodeURIComponent(processId)}/files`, {
        method: 'POST',
        form,
        signal,
      }),
    );
  } catch (error) {
    const limit = fileTooLarge(error);
    if (limit === undefined) {
      throw error;
    }
    return { name: item.file.name, refused: true, result: null, error: 'too_large', limit };
  }
}

export type ImportProcessEnd = {
  id: string;
  state: 'finished' | 'aborted';
  importedCount: number;
  refusedCount: number;
};

async function endImportProcess(
  processId: string,
  how: 'finish' | 'abort',
  signal?: AbortSignal,
): Promise<ImportProcessEnd> {
  const record = asRecord(
    await request(`${BASE}/import-processes/${encodeURIComponent(processId)}/${how}`, {
      method: 'POST',
      json: {},
      signal,
    }),
    'end of an import process',
  );
  const state = str(record, 'state');
  if (state !== 'finished' && state !== 'aborted') {
    throw new UnexpectedAnswerError('state of an import process');
  }
  return {
    id: str(record, 'id'),
    state,
    importedCount: num(record, 'imported_count'),
    refusedCount: num(record, 'refused_count'),
  };
}

export function finishImportProcess(processId: string, signal?: AbortSignal): Promise<ImportProcessEnd> {
  return endImportProcess(processId, 'finish', signal);
}

export function abortImportProcess(processId: string, signal?: AbortSignal): Promise<ImportProcessEnd> {
  return endImportProcess(processId, 'abort', signal);
}

// --- deleting -------------------------------------------------------------------------

/** What to delete (specification 5.5). The interface asks first (`confirm` false), then deletes. */
export type DeletionRequest =
  | { kind: 'series'; broker: string; instrument: string; data: string }
  | { kind: 'period'; broker: string; instrument: string; data: string; start: string; end: string }
  | { kind: 'contract'; broker: string; instrument: string }
  | { kind: 'broker'; broker: string };

/** What a deletion removes (`deleted` true) or would remove (`deleted` false). */
export type DeletionResult = {
  kind: DeletionRequest['kind'];
  deleted: boolean;
  broker: string;
  instrument: string | null;
  data: string | null;
  start: string | null;
  end: string | null;
  candleCount: number;
  tickCount: number;
  seriesCount: number;
  instrumentCount: number;
  brokerRemoved: boolean;
  testRunBrokerReset: boolean;
  testRunBroker: TestRunBroker;
};

function parseDeletion(value: unknown): DeletionResult {
  const record = asRecord(value, 'result of a deletion');
  const kind = str(record, 'kind');
  if (kind !== 'series' && kind !== 'period' && kind !== 'contract' && kind !== 'broker') {
    throw new UnexpectedAnswerError('kind of a deletion');
  }
  return {
    kind,
    deleted: bool(record, 'deleted'),
    broker: str(record, 'broker'),
    instrument: strOrNull(record, 'instrument'),
    data: strOrNull(record, 'data'),
    start: strOrNull(record, 'start'),
    end: strOrNull(record, 'end'),
    candleCount: num(record, 'candle_count'),
    tickCount: num(record, 'tick_count'),
    seriesCount: num(record, 'series_count'),
    instrumentCount: num(record, 'instrument_count'),
    brokerRemoved: bool(record, 'broker_removed'),
    testRunBrokerReset: bool(record, 'test_run_broker_reset'),
    testRunBroker: parseTestRunBroker(record.test_run_broker),
  };
}

/**
 * Asks what a deletion would remove (`confirm` false, nothing changes) or deletes (`confirm`
 * true). The interface deletes only after the user confirmed what the first answer named.
 */
export async function deleteData(
  what: DeletionRequest,
  confirm: boolean,
  signal?: AbortSignal,
): Promise<DeletionResult> {
  const { kind, ...fields } = what;
  return parseDeletion(
    await request(`${BASE}/deletions/${kind}`, { method: 'POST', json: { ...fields, confirm }, signal }),
  );
}

/** The rule for the name of a broker or an instrument (`names.py` of the backend). */
export function isValidName(name: string): boolean {
  return name.length >= 1 && name.length <= 128 && name === name.trim() && !/[\x00-\x1f\x7f]/.test(name);
}
