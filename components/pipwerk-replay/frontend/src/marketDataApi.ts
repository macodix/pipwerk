// Data stock of historical price data and acquisition: `/api/v1/market-data/`
// (specification 5.1 to 5.4) and the default source `/api/replay/settings/default-source`.
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
  type JsonRecord,
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

// --- overview -------------------------------------------------------------------------

export type Period = { start: string; end: string };
export type MissingPeriod = Period & { reason: 'not_covered' | 'gap' };

export type Series = {
  broker: string;
  instrument: string;
  /** A time unit (`h1`) or `ticks`. */
  unit: string;
  count: number;
  first: string | null;
  last: string | null;
  covered: Period[];
  coveredCount: number;
  missing: MissingPeriod[];
  missingCount: number;
  hasTradingHours: boolean;
};

export type InstrumentEntry = { broker: string; instrument: string; acquiredAt: string };

export type Overview = {
  series: Series[];
  seriesTotal: number;
  instruments: InstrumentEntry[];
  instrumentsTotal: number;
};

function parsePeriod(value: unknown): Period {
  const record = asRecord(value, 'period');
  return { start: str(record, 'start'), end: str(record, 'end') };
}

function parseMissing(value: unknown): MissingPeriod {
  const record = asRecord(value, 'missing period');
  const reason = str(record, 'reason');
  if (reason !== 'not_covered' && reason !== 'gap') {
    throw new UnexpectedAnswerError('reason of a missing period');
  }
  return { start: str(record, 'start'), end: str(record, 'end'), reason };
}

function parseSeries(value: unknown): Series {
  const record = asRecord(value, 'series');
  return {
    broker: str(record, 'broker'),
    instrument: str(record, 'instrument'),
    unit: str(record, 'unit'),
    count: num(record, 'count'),
    first: strOrNull(record, 'first'),
    last: strOrNull(record, 'last'),
    covered: list(record, 'covered', parsePeriod),
    coveredCount: num(record, 'covered_count'),
    missing: list(record, 'missing', parseMissing),
    missingCount: num(record, 'missing_count'),
    hasTradingHours: bool(record, 'has_trading_hours'),
  };
}

function parseEntry(value: unknown): InstrumentEntry {
  const record = asRecord(value, 'instrument entry');
  return {
    broker: str(record, 'broker'),
    instrument: str(record, 'instrument'),
    acquiredAt: str(record, 'acquired_at'),
  };
}

export async function fetchOverview(signal?: AbortSignal): Promise<Overview> {
  const record = asRecord(await request(`${BASE}/overview`, { signal }), 'overview');
  return {
    series: list(record, 'series', parseSeries),
    seriesTotal: num(record, 'series_total'),
    instruments: list(record, 'instruments', parseEntry),
    instrumentsTotal: num(record, 'instruments_total'),
  };
}

// --- instrument details ----------------------------------------------------------------

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

export async function fetchInstrument(
  broker: string,
  instrument: string,
  signal?: AbortSignal,
): Promise<InstrumentInfo> {
  const query = new URLSearchParams({ broker, instrument });
  const record = asRecord(
    await request(`${BASE}/instrument?${query.toString()}`, { signal }),
    'instrument details',
  );
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

// --- import ----------------------------------------------------------------------------

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

export function parseImportResult(value: unknown): ImportResult {
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

export async function importJson(file: Blob): Promise<ImportResult> {
  return parseImportResult(
    await request(`${BASE}/imports/json`, {
      method: 'POST',
      file: { body: file, contentType: 'application/json' },
    }),
  );
}

/** What the user says about a CSV file, because the file does not contain it. */
export type CsvSeries = {
  kind: 'candles' | 'ticks';
  broker: string;
  instrument: string;
  timeUnit: TimeUnit | null;
  timezone: string;
};

export async function importCsv(file: Blob, series: CsvSeries): Promise<ImportResult> {
  const query = new URLSearchParams({
    kind: series.kind,
    broker: series.broker,
    instrument: series.instrument,
    timezone: series.timezone,
  });
  if (series.kind === 'candles' && series.timeUnit !== null) {
    query.set('time_unit', series.timeUnit);
  }
  return parseImportResult(
    await request(`${BASE}/imports/csv?${query.toString()}`, {
      method: 'POST',
      file: { body: file, contentType: 'text/csv' },
    }),
  );
}

// --- acquisition ----------------------------------------------------------------------

export type AcquirePart =
  | { kind: 'candles'; instrument: string; time_unit: TimeUnit; start: string; end: string }
  | { kind: 'ticks'; instrument: string; start: string; end: string }
  | { kind: 'instrument'; instrument: string };

export type PartFailure = { code: string; reason: string; fileError: string | null };

export type AcquisitionPart = {
  request: AcquirePart;
  state: 'queued' | 'running' | 'succeeded' | 'failed';
  result: ImportResult | null;
  omittedCount: number | null;
  error: PartFailure | null;
};

export type Acquisition = {
  id: string;
  state: 'running' | 'finished';
  parts: AcquisitionPart[];
};

function parseAcquirePart(value: unknown): AcquirePart {
  const record = asRecord(value, 'part of an acquisition');
  const kind = str(record, 'kind');
  const instrument = str(record, 'instrument');
  if (kind === 'candles') {
    const timeUnit = str(record, 'time_unit');
    if (!isTimeUnit(timeUnit)) {
      throw new UnexpectedAnswerError('time unit');
    }
    return { kind, instrument, time_unit: timeUnit, start: str(record, 'start'), end: str(record, 'end') };
  }
  if (kind === 'ticks') {
    return { kind, instrument, start: str(record, 'start'), end: str(record, 'end') };
  }
  if (kind === 'instrument') {
    return { kind, instrument };
  }
  throw new UnexpectedAnswerError('kind of a part');
}

function parseAcquisitionPart(value: unknown): AcquisitionPart {
  const record = asRecord(value, 'part of an acquisition');
  const state = str(record, 'state');
  if (state !== 'queued' && state !== 'running' && state !== 'succeeded' && state !== 'failed') {
    throw new UnexpectedAnswerError('state of a part');
  }
  const result = record.result;
  const error = record.error;
  let failure: PartFailure | null = null;
  if (error !== null && error !== undefined) {
    const failureRecord: JsonRecord = asRecord(error, 'error of a part');
    failure = {
      code: str(failureRecord, 'code'),
      reason: str(failureRecord, 'reason'),
      fileError: strOrNull(failureRecord, 'file_error'),
    };
  }
  return {
    request: parseAcquirePart(record.request),
    state,
    result: result === null || result === undefined ? null : parseImportResult(result),
    omittedCount: numOrNull(record, 'omitted_count'),
    error: failure,
  };
}

function parseAcquisition(value: unknown): Acquisition {
  const record = asRecord(value, 'acquisition');
  const state = str(record, 'state');
  if (state !== 'running' && state !== 'finished') {
    throw new UnexpectedAnswerError('state of an acquisition');
  }
  return { id: str(record, 'id'), state, parts: list(record, 'parts', parseAcquisitionPart) };
}

export async function startAcquisition(parts: AcquirePart[]): Promise<Acquisition> {
  return parseAcquisition(await request(`${BASE}/acquisitions`, { method: 'POST', json: { parts } }));
}

export async function fetchAcquisition(id: string, signal?: AbortSignal): Promise<Acquisition> {
  return parseAcquisition(
    await request(`${BASE}/acquisitions/${encodeURIComponent(id)}`, { signal }),
  );
}

// --- default source -------------------------------------------------------------------

export async function fetchDefaultSource(signal?: AbortSignal): Promise<string | null> {
  const record = asRecord(
    await request('/api/replay/settings/default-source', { signal }),
    'default source',
  );
  return strOrNull(record, 'broker');
}

export async function updateDefaultSource(broker: string | null): Promise<string | null> {
  const record = asRecord(
    await request('/api/replay/settings/default-source', { method: 'PUT', json: { broker } }),
    'default source',
  );
  return strOrNull(record, 'broker');
}

/** The rule for the name of a broker or an instrument (`names.py` of the backend). */
export function isValidName(name: string): boolean {
  return name.length >= 1 && name.length <= 128 && name === name.trim() && !/[\x00-\x1f\x7f]/.test(name);
}
