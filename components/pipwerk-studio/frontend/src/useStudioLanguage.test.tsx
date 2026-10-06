import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { createI18n } from './i18n';
import { createGate, mockFetchRoutes } from './test-utils';
import { useStudioLanguage } from './useStudioLanguage';

function renderLanguageHook() {
  const i18n = createI18n();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
  return renderHook(() => useStudioLanguage(), { wrapper });
}

describe('useStudioLanguage.changeLanguage', () => {
  it('sends no request for the language that is already displayed', async () => {
    let puts = 0;
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'de' } },
      putLanguage: () => {
        puts += 1;
        return { status: 200, body: { language: 'de' } };
      },
    });
    const { result } = renderLanguageHook();
    await waitFor(() => expect(result.current.isBusy).toBe(false));

    act(() => {
      result.current.changeLanguage('de');
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(puts).toBe(0);
  });

  it('sends only one request while a save is running, even if called again', async () => {
    const put = createGate();
    const requested: unknown[] = [];
    mockFetchRoutes({
      getLanguage: { status: 200, body: { language: 'de' } },
      putLanguage: (body) => {
        requested.push(body);
        return put.promise;
      },
    });
    const { result } = renderLanguageHook();
    await waitFor(() => expect(result.current.isBusy).toBe(false));

    act(() => {
      result.current.changeLanguage('en');
    });
    await waitFor(() => expect(result.current.isBusy).toBe(true));
    act(() => {
      result.current.changeLanguage('de');
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(requested).toEqual([{ language: 'en' }]);
    expect(result.current.displayedLanguage).toBe('en');
    put.release({ status: 200, body: { language: 'en' } });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
    expect(result.current.displayedLanguage).toBe('en');
  });
});
