// Data stock of historical price data: `/api/v1/market-data/` (specification 5.1, 5.3, 8.3) and the
// broker for test runs `/api/replay/settings/test-run-broker`.
import {
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

function parseTestRunBroker(value: unknown): TestRunBroker {
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
  };
}

/** The file part of a form. */
function appendFile(form: FormData, file: Blob, name: string): void {
  form.append('file', file, name);
}

/**
 * Asks the backend what the files say about themselves. The content of a CSV file is not read, so
 * it is not sent (an empty part with the name of the file); a JSON file is sent as it is.
 */
export async function previewImport(files: File[], signal?: AbortSignal): Promise<FileHint[]> {
  const form = new FormData();
  for (const file of files) {
    const isJson = file.name.toLowerCase().endsWith('.json');
    appendFile(form, isJson ? file : new Blob([]), file.name);
  }
  const record = asRecord(
    await request(`${BASE}/imports/preview`, { method: 'POST', form, signal }),
    'preview of an import',
  );
  const hints = list(record, 'files', parseHint);
  if (hints.length !== files.length) {
    throw new UnexpectedAnswerError('number of hints');
  }
  return hints;
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
};

export type ImportOutcome = { files: FileOutcome[]; importedCount: number; refusedCount: number };

function parseOutcome(value: unknown): FileOutcome {
  const record = asRecord(value, 'result for a file');
  const refused = bool(record, 'refused');
  const result = record.result;
  return {
    name: str(record, 'name'),
    refused,
    result: result === null || result === undefined ? null : parseImportResult(result),
    error: strOrNull(record, 'error'),
  };
}

/** A file of an import with what the user says about it (empty: nothing). */
export type ImportFile = { file: File; instrument: string; data: string };

/**
 * Imports all files in one process. `broker` counts for all files; `timezone` for all CSV files
 * and is sent only if it is given. `instrument` and `data` are sent for every file, in the order
 * of the files, an empty value for none.
 */
export async function importFiles(
  broker: string,
  timezone: string,
  files: ImportFile[],
  signal?: AbortSignal,
): Promise<ImportOutcome> {
  const form = new FormData();
  form.append('broker', broker);
  if (timezone !== '') {
    form.append('timezone', timezone);
  }
  for (const item of files) {
    appendFile(form, item.file, item.file.name);
  }
  for (const item of files) {
    form.append('instrument', item.instrument);
  }
  for (const item of files) {
    form.append('data', item.data);
  }
  const record = asRecord(
    await request(`${BASE}/imports`, { method: 'POST', form, signal }),
    'result of an import',
  );
  const outcome: ImportOutcome = {
    files: list(record, 'files', parseOutcome),
    importedCount: num(record, 'imported_count'),
    refusedCount: num(record, 'refused_count'),
  };
  if (outcome.files.length !== files.length) {
    throw new UnexpectedAnswerError('number of results');
  }
  return outcome;
}

/** The rule for the name of a broker or an instrument (`names.py` of the backend). */
export function isValidName(name: string): boolean {
  return name.length >= 1 && name.length <= 128 && name === name.trim() && !/[\x00-\x1f\x7f]/.test(name);
}
