import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { createI18n } from './i18n';
import { useReplayLanguage } from './useReplayLanguage';

/** A wrapper with its own query client and its own i18n instance, created once per test. */
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const i18n = createI18n();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nextProvider>
    );
  };
}

function backend(options: { stored?: 'de' | 'en'; failRead?: boolean; failWrite?: boolean }) {
  let stored = options.stored ?? 'de';
  const writes: unknown[] = [];
  vi.stubGlobal('fetch', (_input: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      writes.push(JSON.parse(String(init.body)));
      if (options.failWrite === true) {
        return Promise.resolve(new Response('{}', { status: 500 }));
      }
      stored = (JSON.parse(String(init.body)) as { language: 'de' | 'en' }).language;
    } else if (options.failRead === true) {
      return Promise.resolve(new Response('{}', { status: 503 }));
    }
    return Promise.resolve(new Response(JSON.stringify({ language: stored }), { status: 200 }));
  });
  return { writes };
}

describe('useReplayLanguage', () => {
  it('is busy and shows German until the backend has answered', async () => {
    backend({ stored: 'en' });
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });

    expect(result.current.displayedLanguage).toBe('de');
    expect(result.current.isBusy).toBe(true);
    await waitFor(() => {
      expect(result.current.displayedLanguage).toBe('en');
    });
    expect(result.current.isBusy).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('stores a changed language in the backend', async () => {
    const { writes } = backend({});
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.isBusy).toBe(false);
    });

    await act(async () => {
      result.current.changeLanguage('en');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.displayedLanguage).toBe('en');
      expect(result.current.isBusy).toBe(false);
    });
    expect(writes).toEqual([{ language: 'en' }]);
  });

  it('sends nothing for the language that is already shown', async () => {
    const { writes } = backend({});
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.isBusy).toBe(false);
    });

    act(() => {
      result.current.changeLanguage('de');
    });

    expect(writes).toEqual([]);
  });

  it('keeps the confirmed language after a failed save and reports it', async () => {
    backend({ stored: 'de', failWrite: true });
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.isBusy).toBe(false);
    });

    act(() => {
      result.current.changeLanguage('en');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('save');
    });
    expect(result.current.displayedLanguage).toBe('de');
  });

  it('shows the default and reports a failed first read', async () => {
    backend({ failRead: true });
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.error).toBe('load');
    });
    expect(result.current.displayedLanguage).toBe('de');
  });

  it('reports a failed save without a confirmed language as unconfirmed', async () => {
    backend({ failRead: true, failWrite: true });
    const { result } = renderHook(() => useReplayLanguage(), { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(result.current.error).toBe('load');
    });

    act(() => {
      result.current.changeLanguage('en');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('saveUnconfirmed');
    });
  });
});
