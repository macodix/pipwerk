import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HttpError,
  REQUEST_TIMEOUT_MS,
  RequestTimeoutError,
  requestJson,
  ResponseFormatError,
} from './http';

function respond(status: number, body: unknown): Response {
  return status === 204
    ? new Response(null, { status })
    : new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
}

describe('requestJson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends the body as JSON and returns the parsed answer', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(respond(200, { ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    const result = await requestJson('/api/v1/check', { method: 'POST', body: { a: 1 } });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/check');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', Accept: 'application/json' });
  });

  it('sends a read without a body and without content type', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(respond(200, [])));
    vi.stubGlobal('fetch', fetchMock);

    await requestJson('/api/v1/strategies');

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(204, null)));

    await expect(requestJson('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('fails with the status and the fixed text of the backend', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(409, { detail: 'It cannot be read.' })));

    const error = await requestJson('/x').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 409, detail: 'It cannot be read.' });
  });

  it('fails with the status when the error has no JSON body', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(502, '<html>bad gateway</html>')));

    const error = await requestJson('/x').catch((caught: unknown) => caught);

    expect(error).toMatchObject({ status: 502, detail: null });
  });

  it('fails when a successful answer is not JSON', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(respond(200, 'not json')));

    await expect(requestJson('/x')).rejects.toBeInstanceOf(ResponseFormatError);
  });

  it('gives up after the time limit and aborts the request', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    });

    const pending = requestJson('/x').catch((caught: unknown) => caught);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS + 1);

    expect(await pending).toBeInstanceOf(RequestTimeoutError);
    expect(signal?.aborted).toBe(true);
  });

  it('passes an abort of the caller on as it is, not as a time-out', async () => {
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const controller = new AbortController();

    const pending = requestJson('/x', { signal: controller.signal }).catch((caught: unknown) => caught);
    controller.abort();

    const error = await pending;
    expect(error).toBeInstanceOf(DOMException);
    expect(error).not.toBeInstanceOf(RequestTimeoutError);
  });

  it('does not start when the caller has already aborted', async () => {
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        init.signal?.aborted === true
          ? Promise.reject(new DOMException('aborted', 'AbortError'))
          : Promise.resolve(respond(200, {})),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(requestJson('/x', { signal: controller.signal })).rejects.toBeInstanceOf(DOMException);
  });
});
