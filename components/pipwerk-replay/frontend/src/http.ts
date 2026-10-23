// Requests to the backend and the reading of its answers.
//
// The backend is the component's own process; its answers are still read with
// small checks (`field`, `asRecord`), so a wrong answer ends in an error of the
// interface and not in a wrong display.

/** The backend answered with an error status. `body` is the parsed JSON body or `null`. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`The request failed with HTTP status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** The answer does not have the documented form. */
export class UnexpectedAnswerError extends Error {
  constructor(what: string) {
    super(`The backend answered with an unexpected ${what}`);
    this.name = 'UnexpectedAnswerError';
  }
}

export type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown, what: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new UnexpectedAnswerError(what);
  }
  return value as JsonRecord;
}

export function asArray(value: unknown, what: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new UnexpectedAnswerError(what);
  }
  return value;
}

export function str(record: JsonRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new UnexpectedAnswerError(`field ${key}`);
  }
  return value;
}

export function strOrNull(record: JsonRecord, key: string): string | null {
  const value = record[key];
  if (value === null) {
    return null;
  }
  return str(record, key);
}

export function num(record: JsonRecord, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnexpectedAnswerError(`field ${key}`);
  }
  return value;
}

export function numOrNull(record: JsonRecord, key: string): number | null {
  if (record[key] === null) {
    return null;
  }
  return num(record, key);
}

export function bool(record: JsonRecord, key: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') {
    throw new UnexpectedAnswerError(`field ${key}`);
  }
  return value;
}

export function list<T>(record: JsonRecord, key: string, parse: (item: unknown) => T): T[] {
  return asArray(record[key], `field ${key}`).map(parse);
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** A JSON value or a form (`multipart/form-data`). */
  json?: unknown;
  /** The browser sets the media type of a form with its boundary; none is set here. */
  form?: FormData;
  signal?: AbortSignal;
};

/**
 * Sends a request and returns the parsed JSON body (`null` for an answer without
 * body). Every status from 400 on ends in `ApiError`.
 */
export async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (options.form !== undefined) {
    body = options.form;
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
  });
  let parsed: unknown = null;
  if (response.status !== 204) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, parsed);
  }
  return parsed;
}
