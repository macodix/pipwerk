import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLanguage, LANGUAGE_REQUEST_TIMEOUT_MS, LanguageRequestTimeoutError, updateLanguage } from './settingsApi';
import { mockFetchRoutes } from './test-utils';

describe('Studio language API time limit', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['reading', () => fetchLanguage()],
    ['saving', () => updateLanguage('en')],
  ])('fails %s with a timeout error when no answer arrives in time', async (_name, call) => {
    vi.useFakeTimers();
    mockFetchRoutes({ getLanguage: 'pending', putLanguage: 'pending' });
    const outcome = call().then(
      () => 'answered',
      (error: unknown) => error,
    );

    await vi.advanceTimersByTimeAsync(LANGUAGE_REQUEST_TIMEOUT_MS - 1);
    let settled = false;
    void outcome.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await outcome).toBeInstanceOf(LanguageRequestTimeoutError);
  });

  it('passes a cancellation by the caller on unchanged and does not report a timeout', async () => {
    vi.useFakeTimers();
    mockFetchRoutes({ getLanguage: 'pending' });
    const controller = new AbortController();
    const outcome = fetchLanguage(controller.signal).then(
      () => 'answered',
      (error: unknown) => error,
    );

    controller.abort();
    const error = await outcome;

    expect(error).toBeInstanceOf(DOMException);
    expect(error).not.toBeInstanceOf(LanguageRequestTimeoutError);
    expect((error as DOMException).name).toBe('AbortError');
  });

  it('stops its timer once the answer has arrived', async () => {
    vi.useFakeTimers();
    mockFetchRoutes({ getLanguage: { status: 200, body: { language: 'en' } } });

    await expect(fetchLanguage()).resolves.toEqual({ language: 'en' });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops its timer once the request failed', async () => {
    vi.useFakeTimers();
    mockFetchRoutes({ getLanguage: { status: 500, body: {} } });

    await expect(fetchLanguage()).rejects.toThrow('HTTP status 500');

    expect(vi.getTimerCount()).toBe(0);
  });
});
