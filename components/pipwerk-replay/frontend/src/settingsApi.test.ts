import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LANGUAGE_REQUEST_TIMEOUT_MS,
  LanguageRequestTimeoutError,
  fetchLanguage,
  updateLanguage,
} from './settingsApi';

function answer(status: number, body: unknown): void {
  vi.stubGlobal('fetch', () =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })),
  );
}

describe('language API', () => {
  it('reads the language from /api/replay/settings/language', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
      calls.push([input, init]);
      return Promise.resolve(new Response('{"language":"en"}', { status: 200 }));
    });

    await expect(fetchLanguage()).resolves.toEqual({ language: 'en' });

    expect(calls[0]?.[0]).toBe('/api/replay/settings/language');
  });

  it('writes the language with PUT and the body {"language": ...}', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
      calls.push([input, init]);
      return Promise.resolve(new Response('{"language":"en"}', { status: 200 }));
    });

    await expect(updateLanguage('en')).resolves.toEqual({ language: 'en' });

    expect(calls[0]?.[1]?.method).toBe('PUT');
    expect(calls[0]?.[1]?.body).toBe('{"language":"en"}');
  });

  it.each([
    ['an error status', 503, { detail: 'x' }],
    ['an unknown language', 200, { language: 'fr' }],
    ['an additional field', 200, { language: 'de', extra: 1 }],
    ['no language', 200, {}],
    ['a language that is no text', 200, { language: 1 }],
  ])('rejects %s', async (_name, status, body) => {
    answer(status, body);

    await expect(fetchLanguage()).rejects.toThrow();
  });
});

describe('time limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails with LanguageRequestTimeoutError when the backend does not answer in time', async () => {
    vi.stubGlobal('fetch', (_input: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    );

    const result = fetchLanguage().catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(LANGUAGE_REQUEST_TIMEOUT_MS + 1);

    expect(await result).toBeInstanceOf(LanguageRequestTimeoutError);
  });

  it('passes on an abort of the caller unchanged', async () => {
    vi.stubGlobal('fetch', (_input: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    );
    const controller = new AbortController();

    const result = fetchLanguage(controller.signal).catch((error: unknown) => error);
    controller.abort();

    const error = await result;
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('AbortError');
  });
});
