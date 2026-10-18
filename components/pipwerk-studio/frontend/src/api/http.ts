/**
 * Time limit of every request of the Strategy Designer to the backend (same
 * value and same reason as `LANGUAGE_REQUEST_TIMEOUT_MS` in `settingsApi.ts`: the
 * backend is a local process, an answer that takes longer counts as failed). The
 * limit covers sending the request and reading the answer.
 */
export const REQUEST_TIMEOUT_MS = 10_000;

export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`The request did not answer within ${timeoutMs} ms`);
    this.name = 'RequestTimeoutError';
  }
}

/** The backend answered with a status other than success. `detail` is its fixed text, if it sent one. */
export class HttpError extends Error {
  readonly status: number;
  readonly detail: string | null;
  readonly body: unknown;

  constructor(status: number, detail: string | null, body: unknown) {
    super(`The request failed with HTTP status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

/** The answer of the backend does not have the expected form. */
export class ResponseFormatError extends Error {
  constructor(what: string) {
    super(`Unexpected response: ${what}`);
    this.name = 'ResponseFormatError';
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
  /** Abort from the caller. It is passed on as the abort error and is not a failure of the request. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

function detailOf(body: unknown): string | null {
  if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
    return body.detail;
  }
  return null;
}

/**
 * Sends a request and reads the JSON answer within the time limit. Returns
 * `undefined` for HTTP 204. A status outside 200 to 299 fails with `HttpError`;
 * running out of time fails with `RequestTimeoutError`.
 */
export async function requestJson(url: string, options: RequestOptions = {}): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  // One controller ends the request, either at the time limit or when the caller aborts.
  const controller = new AbortController();
  let timedOut = false;
  if (options.signal?.aborted === true) {
    controller.abort();
  } else {
    options.signal?.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const init: RequestInit = { method: options.method ?? 'GET', headers, signal: controller.signal };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    const response = await fetch(url, init);
    if (response.status === 204) {
      return undefined;
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      if (timedOut || controller.signal.aborted) {
        throw error;
      }
      if (!response.ok) {
        throw new HttpError(response.status, null, undefined);
      }
      throw new ResponseFormatError('the answer is not JSON');
    }
    if (!response.ok) {
      throw new HttpError(response.status, detailOf(body), body);
    }
    return body;
  } catch (error) {
    if (timedOut) {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// --- small checks for answers -------------------------------------------------

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

export function expectRecord(value: unknown, what: string): JsonRecord {
  if (!isRecord(value)) {
    throw new ResponseFormatError(what);
  }
  return value;
}

export function expectArray(value: unknown, what: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ResponseFormatError(what);
  }
  return value;
}

export function expectString(value: unknown, what: string): string {
  if (typeof value !== 'string') {
    throw new ResponseFormatError(what);
  }
  return value;
}

export function expectBoolean(value: unknown, what: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ResponseFormatError(what);
  }
  return value;
}

export function expectNumber(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ResponseFormatError(what);
  }
  return value;
}

export function expectNullableString(value: unknown, what: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return expectString(value, what);
}
